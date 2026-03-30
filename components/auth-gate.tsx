import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/lib/app-context";

/**
 * AuthGate — Redirect users based on onboarding, authentication, and paywall state.
 *
 * New Flow:
 * 1. First launch → onboarding quiz (5 steps)
 * 2. After onboarding → auth screen (login/signup)
 *    - Free user taps Google/Apple/SignUp → auth screen redirects to /paywall (handled in auth.tsx)
 *    - Free user taps "Continue with Free" → markPaywallSeen + go to tabs (handled in auth.tsx)
 * 3. After subscribing on paywall → redirect back to /auth?returnFromPaywall=true to complete login
 * 4. After successful login → tabs
 *
 * AuthGate's job is simpler now:
 * - Not onboarded → /onboarding
 * - Onboarded but not authenticated AND not hasSeenPaywall → /auth (they need to either login or skip)
 * - hasSeenPaywall + not authenticated → allow tabs (free user who skipped login)
 * - Authenticated + hasSeenPaywall → allow tabs
 *
 * The paywall routing is handled by the auth screen itself (not AuthGate).
 */
export function AuthGate() {
  const { hasCompletedOnboarding, isAuthenticated, hasSeenPaywall, loading } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return;

    const currentRoute = "/" + segments.join("/");
    // Don't redirect if on oauth callback
    if (currentRoute.includes("oauth")) return;

    if (!hasCompletedOnboarding) {
      // User hasn't completed onboarding — send to quiz
      if (!currentRoute.includes("onboarding")) {
        router.replace("/onboarding");
      }
    } else if (!hasSeenPaywall && !isAuthenticated) {
      // Onboarded but hasn't gone through the auth/paywall flow yet
      // Send to auth screen (which has "Continue with Free" and login buttons)
      // Allow /auth and /paywall routes (user navigates between them)
      if (
        !currentRoute.includes("auth") &&
        !currentRoute.includes("paywall") &&
        !currentRoute.includes("onboarding")
      ) {
        router.replace("/auth");
      }
    } else if (hasSeenPaywall || isAuthenticated) {
      // User has either:
      // - Tapped "Continue with Free" (hasSeenPaywall=true, isAuthenticated=false)
      // - Subscribed and logged in (hasSeenPaywall=true, isAuthenticated=true)
      // Either way, they can access the main app
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
  }, [hasCompletedOnboarding, isAuthenticated, hasSeenPaywall, loading, segments]);

  return null;
}
