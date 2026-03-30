import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/lib/app-context";

/**
 * AuthGate — Redirect users based on onboarding, authentication, and paywall state.
 *
 * Flow:
 * 1. First launch → onboarding quiz (5 steps)
 * 2. After onboarding → auth screen (login/signup)
 * 3. After auth → paywall (must see plans at least once)
 * 4. After paywall (subscribe or "Continue with Free") → main app (tabs)
 *
 * Free users CAN continue for free (5 scans/day, local storage only).
 * Cloud sync is strictly gated to paid subscribers.
 *
 * This component must be rendered inside AppProvider and the router.
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
    } else if (!isAuthenticated) {
      // Onboarding done but not logged in — send to auth
      if (!currentRoute.includes("auth") && !currentRoute.includes("onboarding")) {
        router.replace("/auth");
      }
    } else if (!hasSeenPaywall) {
      // Authenticated but hasn't seen the paywall yet — show subscription options
      if (!currentRoute.includes("paywall")) {
        router.replace("/paywall");
      }
    } else {
      // Fully authenticated and has seen paywall — ensure they're in the main app
      if (
        currentRoute.includes("onboarding") ||
        currentRoute.includes("auth")
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
