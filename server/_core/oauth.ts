import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { createRemoteJWKSet, jwtVerify } from "jose";

// ─── Apple Identity Token Verification ───
// Apple publishes their public keys at this URL
const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");
const appleJWKS = createRemoteJWKSet(APPLE_JWKS_URL);

async function verifyAppleIdentityToken(
  identityToken: string,
): Promise<{ sub: string; email?: string; name?: string }> {
  const { payload } = await jwtVerify(identityToken, appleJWKS, {
    issuer: "https://appleid.apple.com",
    // audience is your bundle ID
    audience: "com.evan.muscleai",
  });

  if (!payload.sub) {
    throw new Error("Apple identity token missing subject");
  }

  return {
    sub: payload.sub,
    email: payload.email as string | undefined,
  };
}

// ─── Google Identity Token Verification ───
// Google publishes their public keys at this URL
const GOOGLE_JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");
const googleJWKS = createRemoteJWKSet(GOOGLE_JWKS_URL);

async function verifyGoogleIdentityToken(
  identityToken: string,
): Promise<{ sub: string; email?: string; name?: string }> {
  const { payload } = await jwtVerify(identityToken, googleJWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    // We don't enforce audience here because the client ID may vary
    // between iOS and web. The token signature verification is sufficient.
  });

  if (!payload.sub) {
    throw new Error("Google identity token missing subject");
  }

  return {
    sub: payload.sub,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
  };
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return (
    saved ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the frontend URL (Expo web on port 8081)
      // Cookie is set with parent domain so it works across both 3000 and 8081 subdomains
      // In production, EXPO_PACKAGER_PROXY_URL is set by the platform.
      // Fallback to root path redirect (same origin) if no env var is set.
      const frontendUrl =
        process.env.EXPO_WEB_PREVIEW_URL ||
        process.env.EXPO_PACKAGER_PROXY_URL ||
        "/";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  /**
   * Mobile OAuth callback — used by native apps (Expo Go + standalone builds).
   *
   * Flow:
   * 1. Native app opens OAuth portal with redirect_uri pointing to this HTTPS endpoint
   * 2. OAuth portal redirects here with code+state after user authenticates
   * 3. This endpoint exchanges code for token, creates session, syncs user
   * 4. Redirects to the app via deep link: muscleai://oauth/callback?sessionToken=xxx&user=xxx
   *
   * The deep link scheme is read from the state parameter (which encodes the original
   * redirect_uri that includes the scheme info) or falls back to "muscleai".
   */
  app.get("/api/oauth/mobile-callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    // The deep link scheme to redirect back to the app
    const scheme = getQueryParam(req, "scheme") || "muscleai";

    if (!code || !state) {
      // Redirect to app with error
      const errorUrl = `${scheme}://oauth/callback?error=${encodeURIComponent("Missing code or state parameter")}`;
      res.redirect(302, errorUrl);
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Build user data as base64-encoded JSON for the deep link
      const userResponse = buildUserResponse(user);
      const userBase64 = Buffer.from(JSON.stringify(userResponse)).toString("base64");

      // Redirect to the app via deep link with session token and user data
      const deepLinkUrl = `${scheme}://oauth/callback?sessionToken=${encodeURIComponent(sessionToken)}&user=${encodeURIComponent(userBase64)}`;
      console.log("[OAuth] Mobile callback: redirecting to deep link:", deepLinkUrl.substring(0, 100) + "...");
      res.redirect(302, deepLinkUrl);
    } catch (error) {
      console.error("[OAuth] Mobile callback failed", error);
      const errorMessage = error instanceof Error ? error.message : "OAuth mobile callback failed";
      const errorUrl = `${scheme}://oauth/callback?error=${encodeURIComponent(errorMessage)}`;
      res.redirect(302, errorUrl);
    }
  });

  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });

  /**
   * Native Authentication endpoint.
   *
   * Accepts identity tokens from native Apple Sign-In or Google Sign-In,
   * verifies them with the provider's public keys, creates a local session,
   * and returns a session token + user info.
   *
   * Body: { provider: "apple" | "google", identityToken: string, fullName?: string, email?: string, appleUserId?: string }
   */
  app.post("/api/auth/native", async (req: Request, res: Response) => {
    const { provider, identityToken, fullName, email, appleUserId } = req.body || {};

    if (!provider || !identityToken) {
      res.status(400).json({ error: "provider and identityToken are required" });
      return;
    }

    try {
      let verifiedClaims: { sub: string; email?: string; name?: string };

      if (provider === "apple") {
        verifiedClaims = await verifyAppleIdentityToken(identityToken);
      } else if (provider === "google") {
        verifiedClaims = await verifyGoogleIdentityToken(identityToken);
      } else {
        res.status(400).json({ error: `Unsupported provider: ${provider}` });
        return;
      }

      // Use the verified subject as the unique openId, prefixed with provider
      const openId = `${provider}_${verifiedClaims.sub}`;
      const userName = fullName || verifiedClaims.name || null;
      const userEmail = email || verifiedClaims.email || null;

      // Sync user to database
      const user = await syncUser({
        openId,
        name: userName,
        email: userEmail,
        loginMethod: provider,
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userName || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie for web compatibility
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error(`[Auth] Native ${provider} auth failed:`, error);
      const message = error instanceof Error ? error.message : "Authentication failed";
      res.status(401).json({ error: message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  // Establish session cookie from Bearer token
  // Used by iframe preview: frontend receives token via postMessage, then calls this endpoint
  // to get a proper Set-Cookie response from the backend (3000-xxx domain)
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      // Authenticate using Bearer token from Authorization header
      const user = await sdk.authenticateRequest(req);

      // Get the token from the Authorization header to set as cookie
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      // Set cookie for this domain (3000-xxx)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
