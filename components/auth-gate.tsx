import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/lib/app-context";
import { hasFullAccess } from "@/lib/subscription-features";

/**
 * AuthGate — Redirect users based on onboarding, subscription, and authentication state.
 *
 * Two-Plan Flow (no trial, immediate charge):
 * 1. First launch → onboarding quiz
 * 2. After onboarding → paywall (must pay to access the app)
 * 3. After payment → auth screen (login with Google/Apple to save progress)
 * 4. After login → tabs (full access)
 *
 * Gate logic:
 * - The dashboard is locked until the user has a confirmed payment (monthly or annual).
 * - If subscription lapses, redirect back to paywall and lock data until a plan is chosen.
 *
 * Routes:
 * - Not onboarded → /onboarding
 * - Onboarded but no subscription (none) → /paywall
 * - Has subscription but not authenticated → /auth (to save progress)
 * - Authenticated + active subscription → tabs
 */
export function AuthGate() {
  const { hasCompletedOnboarding, isAuthenticated, subscription, hasSeenPaywall, loading } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return;

    const currentRoute = "/" + segments.join("/");

    // Don't redirect if on oauth callback
    if (currentRoute.includes("oauth")) return;

    const hasAccess = hasFullAccess(subscription);

    if (!hasCompletedOnboarding) {
      // Step 1: User hasn't completed onboarding — send to quiz
      if (!currentRoute.includes("onboarding")) {
        router.replace("/onboarding");
      }
    } else if (!hasAccess) {
      // Step 2: No active subscription — must go to paywall
      // Dashboard is locked until payment is confirmed
      if (
        !currentRoute.includes("paywall") &&
        !currentRoute.includes("onboarding")
      ) {
        router.replace("/paywall");
      }
    } else if (!isAuthenticated && !hasSeenPaywall) {
      // Step 3: Has subscription but hasn't completed auth flow yet
      // Send to auth to create account / login for cloud sync
      if (
        !currentRoute.includes("auth") &&
        !currentRoute.includes("paywall") &&
        !currentRoute.includes("onboarding")
      ) {
        router.replace("/auth?returnFromPaywall=true" as any);
      }
    } else if (hasAccess && (isAuthenticated || hasSeenPaywall)) {
      // Step 4: Fully set up — allow tabs
      // Redirect away from onboarding/auth if they somehow land there
      if (
        currentRoute.includes("onboarding") ||
        (currentRoute === "/auth" && !currentRoute.includes("returnFromPaywall"))
      ) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.replace("/(tabs)");
        }
      }
    }
  }, [hasCompletedOnboarding, isAuthenticated, subscription, hasSeenPaywall, loading, segments]);

  return null;
}
