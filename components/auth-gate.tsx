import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/lib/app-context";

/**
 * AuthGate — Redirect users based on onboarding and authentication state.
 *
 * Flow:
 * 1. First launch → onboarding quiz
 * 2. After onboarding → auth/login page
 * 3. On auth page, user taps Google/Apple → redirected to paywall first (handled by auth.tsx)
 * 4. After viewing paywall → redirected back to auth to complete OAuth login
 * 5. After successful OAuth → tabs (main app)
 *
 * Key principle:
 * - Once a user is **authenticated** (completed OAuth), they ALWAYS get into the app.
 * - Subscription status gates specific premium features inside the app,
 *   NOT the app entry itself.
 * - This prevents the redirect loop where OAuth succeeds but the user
 *   gets kicked back to auth because subscription is still "none".
 */
export function AuthGate() {
  const { hasCompletedOnboarding, isAuthenticated, loading } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return;

    const currentRoute = "/" + segments.join("/");

    // Don't redirect if on oauth callback — let it finish
    if (currentRoute.includes("oauth")) return;

    if (!hasCompletedOnboarding) {
      // Step 1: First-time user — send to onboarding quiz
      if (!currentRoute.includes("onboarding")) {
        router.replace("/onboarding");
      }
    } else if (!isAuthenticated) {
      // Step 2: Onboarded but not logged in — send to auth page
      // Allow staying on paywall or onboarding (retake quiz)
      if (
        !currentRoute.includes("auth") &&
        !currentRoute.includes("paywall") &&
        !currentRoute.includes("onboarding")
      ) {
        router.replace("/auth");
      }
    } else {
      // Step 3: Authenticated — allow into tabs
      // If they're still on auth/paywall/onboarding, redirect to tabs
      if (
        currentRoute.includes("onboarding") ||
        currentRoute === "/auth" ||
        currentRoute.includes("/auth?") ||
        currentRoute === "/paywall" ||
        currentRoute.includes("/paywall?")
      ) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.replace("/(tabs)");
        }
      }
    }
  }, [hasCompletedOnboarding, isAuthenticated, loading, segments]);

  return null;
}
