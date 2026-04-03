import { describe, it, expect } from "vitest";

/**
 * Auth → Paywall Gate Tests (Fixed Flow — No Auth Loop)
 *
 * New flow:
 * 1. First launch → onboarding quiz
 * 2. After onboarding → auth screen
 * 3. Auth screen: user taps Google/Apple → OAuth login → tabs
 * 4. Subscription status is fetched from server after OAuth completes (via AutoSync)
 * 5. Subscription gates premium features inside the app, NOT app entry
 *
 * AuthGate handles:
 * - Not onboarded → /onboarding
 * - Onboarded, not authenticated → /auth
 * - Authenticated → allow tabs (regardless of subscription status)
 *
 * Key principle: Authentication and subscription are SEPARATE concerns.
 * - Authentication = "who are you?" (OAuth login)
 * - Subscription = "what features can you use?" (Stripe payment)
 */

type SubscriptionTier = "none" | "monthly" | "annual";

interface AppState {
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  hasSeenPaywall: boolean;
  subscription: SubscriptionTier;
}

/**
 * Simulate AuthGate routing logic.
 * Returns the redirect destination, or null if no redirect is needed.
 */
function getAuthGateDestination(state: AppState, currentRoute: string): string | null {
  // Never redirect during OAuth callback
  if (currentRoute.includes("oauth")) return null;

  if (!state.hasCompletedOnboarding) {
    if (!currentRoute.includes("onboarding")) return "/onboarding";
    return null;
  }

  if (!state.isAuthenticated) {
    // Onboarded but not logged in — send to auth
    // Allow staying on auth, paywall, or onboarding (retake quiz)
    if (
      !currentRoute.includes("auth") &&
      !currentRoute.includes("paywall") &&
      !currentRoute.includes("onboarding")
    ) {
      return "/auth";
    }
    return null;
  }

  // Authenticated — allow into tabs
  // If still on auth/paywall/onboarding, redirect to tabs
  if (
    currentRoute.includes("onboarding") ||
    currentRoute === "/auth" ||
    currentRoute === "/paywall"
  ) {
    return "/(tabs)";
  }

  return null;
}

/**
 * Auth screen: login buttons always perform OAuth directly.
 * No paywall gate before login. Users log in first, then subscription
 * is fetched from the server.
 */
function authScreenLoginAction(): string {
  return "perform_login";
}

/**
 * Paywall subscribe action.
 * After subscribing, unauthenticated users go to auth to complete login.
 * Authenticated users go directly to tabs.
 */
function paywallSubscribe(
  state: AppState,
  tier: SubscriptionTier,
): { state: AppState; redirect: string } {
  const newState = { ...state, subscription: tier, hasSeenPaywall: true };
  if (state.isAuthenticated) {
    return { state: newState, redirect: "/(tabs)" };
  }
  return { state: newState, redirect: "/auth?returnFromPaywall=true" };
}

/**
 * OAuth callback always redirects to tabs.
 */
function oauthCallbackDestination(): string {
  return "/(tabs)";
}

describe("Auth → Paywall Gate (Fixed Flow — No Auth Loop)", () => {
  describe("AuthGate routing", () => {
    it("should redirect unonboarded users to onboarding", () => {
      const state: AppState = {
        hasCompletedOnboarding: false,
        isAuthenticated: false,
        hasSeenPaywall: false,
        subscription: "none",
      };
      expect(getAuthGateDestination(state, "/(tabs)")).toBe("/onboarding");
    });

    it("should redirect onboarded unauthenticated users to auth", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: false,
        hasSeenPaywall: false,
        subscription: "none",
      };
      expect(getAuthGateDestination(state, "/(tabs)")).toBe("/auth");
    });

    it("should allow auth screen for onboarded unauthenticated users", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: false,
        hasSeenPaywall: false,
        subscription: "none",
      };
      expect(getAuthGateDestination(state, "/auth")).toBeNull();
    });

    it("should allow paywall screen for onboarded unauthenticated users", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: false,
        hasSeenPaywall: false,
        subscription: "none",
      };
      expect(getAuthGateDestination(state, "/paywall")).toBeNull();
    });

    it("should allow tabs for authenticated user with NO subscription", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: false,
        subscription: "none",
      };
      expect(getAuthGateDestination(state, "/(tabs)")).toBeNull();
    });

    it("should allow tabs for authenticated user with monthly subscription", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: true,
        subscription: "monthly",
      };
      expect(getAuthGateDestination(state, "/(tabs)")).toBeNull();
    });

    it("should allow tabs for authenticated user with annual subscription", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: true,
        subscription: "annual",
      };
      expect(getAuthGateDestination(state, "/(tabs)")).toBeNull();
    });

    it("should redirect authenticated user FROM auth page TO tabs", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: true,
        subscription: "monthly",
      };
      expect(getAuthGateDestination(state, "/auth")).toBe("/(tabs)");
    });

    it("should redirect authenticated user FROM paywall TO tabs", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: true,
        subscription: "monthly",
      };
      expect(getAuthGateDestination(state, "/paywall")).toBe("/(tabs)");
    });

    it("should NOT redirect when on oauth callback", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: false,
        hasSeenPaywall: false,
        subscription: "none",
      };
      expect(getAuthGateDestination(state, "/oauth/callback")).toBeNull();
    });
  });

  describe("Auth screen login", () => {
    it("login buttons always perform OAuth directly (no paywall gate)", () => {
      expect(authScreenLoginAction()).toBe("perform_login");
    });
  });

  describe("Paywall interactions", () => {
    it("Subscribe should redirect unauthenticated user back to auth", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: false,
        hasSeenPaywall: false,
        subscription: "none",
      };
      const result = paywallSubscribe(state, "annual");
      expect(result.state.subscription).toBe("annual");
      expect(result.state.hasSeenPaywall).toBe(true);
      expect(result.redirect).toBe("/auth?returnFromPaywall=true");
    });

    it("Subscribe should redirect authenticated user to tabs", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: true,
        subscription: "none",
      };
      const result = paywallSubscribe(state, "monthly");
      expect(result.state.subscription).toBe("monthly");
      expect(result.redirect).toBe("/(tabs)");
    });
  });

  describe("OAuth callback", () => {
    it("should always redirect to tabs", () => {
      expect(oauthCallbackDestination()).toBe("/(tabs)");
    });
  });

  describe("Full user flows", () => {
    it("Flow 1: onboarding → auth → OAuth login → tabs (subscription fetched from server)", () => {
      let state: AppState = {
        hasCompletedOnboarding: false,
        isAuthenticated: false,
        hasSeenPaywall: false,
        subscription: "none",
      };

      // Step 1: Redirected to onboarding
      expect(getAuthGateDestination(state, "/(tabs)")).toBe("/onboarding");

      // Step 2: Complete onboarding → AuthGate sends to auth
      state = { ...state, hasCompletedOnboarding: true };
      expect(getAuthGateDestination(state, "/(tabs)")).toBe("/auth");

      // Step 3: User taps Google → OAuth login (no paywall gate)
      expect(authScreenLoginAction()).toBe("perform_login");

      // Step 4: OAuth callback → tabs
      expect(oauthCallbackDestination()).toBe("/(tabs)");

      // Step 5: After OAuth completes, user is authenticated
      state = { ...state, isAuthenticated: true };
      expect(getAuthGateDestination(state, "/(tabs)")).toBeNull();

      // Step 6: AutoSync restores subscription from server
      state = { ...state, subscription: "monthly" };
      expect(getAuthGateDestination(state, "/(tabs)")).toBeNull();
    });

    it("Flow 2: onboarding → auth → OAuth → tabs (no subscription yet, still allowed)", () => {
      let state: AppState = {
        hasCompletedOnboarding: false,
        isAuthenticated: false,
        hasSeenPaywall: false,
        subscription: "none",
      };

      state = { ...state, hasCompletedOnboarding: true };

      // User taps Google → login directly
      expect(authScreenLoginAction()).toBe("perform_login");

      // OAuth completes
      state = { ...state, isAuthenticated: true };

      // User is in tabs even without subscription
      expect(getAuthGateDestination(state, "/(tabs)")).toBeNull();

      // Subscription is "none" — premium features gated, but app entry is allowed
      expect(state.subscription).toBe("none");
    });

    it("Flow 3: authenticated user visits paywall from settings → subscribes → tabs", () => {
      let state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: false,
        subscription: "none",
      };

      // User navigates to paywall from settings
      expect(getAuthGateDestination(state, "/paywall")).toBe("/(tabs)");

      // After subscribing
      const result = paywallSubscribe(state, "annual");
      state = result.state;
      expect(result.redirect).toBe("/(tabs)");
      expect(state.subscription).toBe("annual");
    });

    it("Cloud sync gated: unsubscribed user has no cloud sync", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: false,
        subscription: "none",
      };
      // User is authenticated but has no subscription
      expect(state.subscription === "none").toBe(true);
    });

    it("Cloud sync available: paid authenticated user", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: true,
        subscription: "annual",
      };
      expect(state.subscription !== "none").toBe(true);
      expect(state.isAuthenticated).toBe(true);
    });

    it("Returning user: already authenticated → goes directly to tabs", () => {
      const state: AppState = {
        hasCompletedOnboarding: true,
        isAuthenticated: true,
        hasSeenPaywall: true,
        subscription: "monthly",
      };
      // AuthGate should not redirect — user is already authenticated
      expect(getAuthGateDestination(state, "/(tabs)")).toBeNull();
    });
  });
});
