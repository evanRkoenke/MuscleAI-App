import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/lib/app-context";
import { hasFullAccess } from "@/lib/subscription-features";

/**
 * AuthGate — Redirect users based on onboarding, subscription, and authentication state.
 *
 * Flow (no free plan):
 * 1. First launch → onboarding quiz
 * 2. After onboarding (first or returning) → login page
 * 3. On login page, user taps Google/Apple/Sign Up → redirected to paywall (handled by auth.tsx)
 * 4. After payment on paywall → redirected back to auth to complete login
 * 5. After login → tabs (full access)
 *
 * Returning users (already onboarded):
 * - If not paid → login page (they can retake quiz from there)
 * - If paid + authenticated → tabs directly
 * - If paid but not authenticated → auth page to login
 *
 * Gate logic:
 * - Dashboard is locked until user has a confirmed payment (monthly or annual) AND is authenticated.
 * - If subscription lapses, redirect back to auth page (which will redirect to paywall on login attempt).
 */
export function AuthGate() {
  const { hasCompletedOnboarding, isAuthenticated, subscription, loading } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return;

    const currentRoute = "/" + segments.join("/");

    // Don't redirect if on oauth callback
    if (currentRoute.includes("oauth")) return;

    const hasPaid = hasFullAccess(subscription);

    if (!hasCompletedOnboarding) {
      // Step 1: First-time user — send to onboarding quiz
      if (!currentRoute.includes("onboarding")) {
        router.replace("/onboarding");
      }
    } else if (!hasPaid) {
      // Step 2: Onboarded but hasn't paid — send to login page
      // (auth.tsx handles redirecting to paywall when they try to login/signup)
      if (
        !currentRoute.includes("auth") &&
        !currentRoute.includes("paywall") &&
        !currentRoute.includes("onboarding")
      ) {
        router.replace("/auth");
      }
    } else if (hasPaid && !isAuthenticated) {
      // Step 3: Has paid but not logged in yet — send to auth to complete login
      if (
        !currentRoute.includes("auth") &&
        !currentRoute.includes("paywall") &&
        !currentRoute.includes("onboarding")
      ) {
        router.replace("/auth?returnFromPaywall=true" as any);
      }
    } else if (hasPaid && isAuthenticated) {
      // Step 4: Fully set up — allow tabs
      // Redirect away from onboarding/auth/paywall if they somehow land there
      if (
        currentRoute.includes("onboarding") ||
        currentRoute === "/auth" ||
        currentRoute === "/paywall"
      ) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.replace("/(tabs)");
        }
      }
    }
  }, [hasCompletedOnboarding, isAuthenticated, subscription, loading, segments]);

  return null;
}
