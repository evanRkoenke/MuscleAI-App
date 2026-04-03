/**
 * Native Authentication Service
 *
 * Provides native Apple Sign-In (iOS) and Google Sign-In (all platforms)
 * instead of the Manus OAuth portal. Users see the standard OS-level
 * sign-in sheets directly.
 *
 * IMPORTANT: Google Sign-In requires a development/production build (EAS Build).
 * It does NOT work in Expo Go because the native module isn't linked.
 * When running in Expo Go, Google Sign-In gracefully falls back to Manus OAuth.
 *
 * Flow:
 * 1. User taps "Continue with Apple/Google" on auth screen
 * 2. Native sign-in sheet appears (Apple sheet on iOS, Google popup)
 * 3. User authenticates → we get an identity token (JWT)
 * 4. Identity token is sent to our server for verification
 * 5. Server verifies token with Apple/Google, creates session, returns session token
 * 6. Client stores session token and user info, navigates to tabs
 */

import { Platform, TurboModuleRegistry } from "react-native";
import * as Auth from "@/lib/_core/auth";

// ─── Types ───

export interface NativeAuthResult {
  success: boolean;
  sessionToken?: string;
  user?: {
    id: number | null;
    openId: string;
    name: string | null;
    email: string | null;
    loginMethod: string;
  };
  error?: string;
}

// ─── Safe Module Availability Detection ───
// Use TurboModuleRegistry.get() (non-enforcing) to check if native modules exist
// before trying to require() them. This prevents the Invariant Violation crash.

function isNativeModuleAvailable(moduleName: string): boolean {
  try {
    // TurboModuleRegistry.get() returns null if not found (instead of throwing)
    const mod = TurboModuleRegistry.get(moduleName);
    return mod !== null && mod !== undefined;
  } catch {
    return false;
  }
}

// Check once at module load time
const _googleSignInModuleAvailable =
  Platform.OS !== "web" && isNativeModuleAvailable("RNGoogleSignin");
const _appleAuthModuleAvailable =
  Platform.OS === "ios"; // Apple auth is always available on iOS via Expo

let _GoogleSignin: any = null;

function getGoogleSignIn(): any {
  if (!_googleSignInModuleAvailable) return null;
  if (_GoogleSignin) return _GoogleSignin;

  try {
    const mod = require("@react-native-google-signin/google-signin");
    _GoogleSignin = mod.GoogleSignin;
    return _GoogleSignin;
  } catch {
    return null;
  }
}

// ─── API Base URL ───

function getApiBaseUrl(): string {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (apiBase) return apiBase.replace(/\/$/, "");

  if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  return "";
}

// ─── Apple Sign-In ───

export async function signInWithApple(): Promise<NativeAuthResult> {
  if (!_appleAuthModuleAvailable) {
    return { success: false, error: "NATIVE_MODULE_UNAVAILABLE" };
  }

  try {
    const AppleAuthentication = require("expo-apple-authentication");

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { success: false, error: "No identity token received from Apple" };
    }

    // Send the identity token to our server for verification
    const result = await verifyTokenWithServer({
      provider: "apple",
      identityToken: credential.identityToken,
      fullName: credential.fullName
        ? `${credential.fullName.givenName || ""} ${credential.fullName.familyName || ""}`.trim()
        : null,
      email: credential.email,
      appleUserId: credential.user,
    });

    return result;
  } catch (e: any) {
    if (e.code === "ERR_REQUEST_CANCELED") {
      return { success: false, error: "Sign-in was cancelled" };
    }
    console.error("[NativeAuth] Apple sign-in failed:", e);
    return { success: false, error: e.message || "Apple sign-in failed" };
  }
}

// ─── Google Sign-In ───

export async function signInWithGoogle(): Promise<NativeAuthResult> {
  const GoogleSignin = getGoogleSignIn();
  if (!GoogleSignin) {
    return { success: false, error: "NATIVE_MODULE_UNAVAILABLE" };
  }

  try {
    // Check if Google Play Services are available (Android)
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Trigger the native Google sign-in flow
    const response = await GoogleSignin.signIn();

    if (response.type === "cancelled") {
      return { success: false, error: "Sign-in was cancelled" };
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      return { success: false, error: "No ID token received from Google" };
    }

    // Send the ID token to our server for verification
    const result = await verifyTokenWithServer({
      provider: "google",
      identityToken: idToken,
      fullName: response.data?.user?.name || null,
      email: response.data?.user?.email || null,
    });

    return result;
  } catch (e: any) {
    // Handle specific Google Sign-In errors
    if (e.code === "SIGN_IN_CANCELLED" || e.code === "12501") {
      return { success: false, error: "Sign-in was cancelled" };
    }
    console.error("[NativeAuth] Google sign-in failed:", e);
    return { success: false, error: e.message || "Google sign-in failed" };
  }
}

// ─── Server Verification ───

interface VerifyTokenPayload {
  provider: "apple" | "google";
  identityToken: string;
  fullName?: string | null;
  email?: string | null;
  appleUserId?: string;
}

async function verifyTokenWithServer(payload: VerifyTokenPayload): Promise<NativeAuthResult> {
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}/api/auth/native`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Server returned ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.sessionToken) {
      // Store the session token and user info locally
      await Auth.setSessionToken(data.sessionToken);
      if (data.user) {
        await Auth.setUserInfo({
          id: data.user.id,
          openId: data.user.openId,
          name: data.user.name,
          email: data.user.email,
          loginMethod: data.user.loginMethod,
          lastSignedIn: new Date(data.user.lastSignedIn || Date.now()),
        });
      }

      return {
        success: true,
        sessionToken: data.sessionToken,
        user: data.user,
      };
    }

    return { success: false, error: "No session token in server response" };
  } catch (e: any) {
    console.error("[NativeAuth] Server verification failed:", e);
    return { success: false, error: e.message || "Failed to verify with server" };
  }
}

// ─── Availability Checks ───

export function isAppleSignInAvailable(): boolean {
  return _appleAuthModuleAvailable;
}

export function isGoogleSignInAvailable(): boolean {
  return _googleSignInModuleAvailable;
}

// ─── Configure Google Sign-In ───

export function configureGoogleSignIn(webClientId: string): void {
  if (!_googleSignInModuleAvailable) {
    // Native module not available (Expo Go) — silently skip
    console.log("[NativeAuth] Google Sign-In native module not available — skipping configuration (expected in Expo Go)");
    return;
  }

  const GoogleSignin = getGoogleSignIn();
  if (!GoogleSignin) return;

  try {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
      scopes: ["profile", "email"],
    });
    console.log("[NativeAuth] Google Sign-In configured successfully");
  } catch (e) {
    console.warn("[NativeAuth] Failed to configure Google Sign-In:", e);
  }
}
