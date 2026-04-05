import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/lib/app-context";

/**
 * AuthGate — Redirect users based on onboarding, authentication, and paywall state.
 *
 * NEW Flow (sign in first, then paywall):
 * 1. First launch → onboarding quiz
 * 2. After onboarding → auth/login page (sign in with Google/Apple)
 * 3. After successful sign-in → paywall (if no subscription yet)
 * 4. After subscribing (or if already subscribed) → tabs (main app)
 *
 * Key principles:
 * - Users sign in FIRST, then see the paywall.
 * - Authenticated users with a subscription go straight to tabs.
 * - Authenticated users WITHOUT a subscription see the paywall.
 * - Navigation is debounced to prevent rapid redirect loops.
 */
export function AuthGate() {
  const { hasCompletedOnboarding, isAuthenticated, hasSeenPaywall, subscription, loading } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirectedToTabs = useRef(false);
  const hasRedirectedToPaywall = useRef(false);
  const isNavigating = useRef(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset redirect guards when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirectedToTabs.current = false;
      hasRedirectedToPaywall.current = false;
    }
  }, [isAuthenticated]);

  // Cleanup navigation timer on unmount
  useEffect(() => {
    return () => {
      if (navigationTimer.current) {
        clearTimeout(navigationTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    // Prevent concurrent navigation attempts
    if (isNavigating.current) return;

    const currentRoute = "/" + segments.join("/");

    // Don't redirect if on oauth callback — let it finish
    if (currentRoute.includes("oauth")) return;

    // Also don't redirect if on support, settings, profile, scan-meal, gains-card screens
    // (these are in-app screens that authenticated users should access freely)
    if (
      currentRoute.includes("support") ||
      currentRoute.includes("settings") ||
      currentRoute.includes("profile") ||
      currentRoute.includes("scan-meal") ||
      currentRoute.includes("gains-card")
    ) {
      return;
    }

    if (!hasCompletedOnboarding) {
      // Step 1: First-time user — send to onboarding quiz
      if (!currentRoute.includes("onboarding")) {
        isNavigating.current = true;
        router.replace("/onboarding");
        navigationTimer.current = setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }
    } else if (!isAuthenticated) {
      // Step 2: Onboarded but not logged in — send to auth page
      // Allow staying on onboarding (retake quiz)
      if (
        !currentRoute.includes("auth") &&
        !currentRoute.includes("onboarding")
      ) {
        isNavigating.current = true;
        router.replace("/auth");
        navigationTimer.current = setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }
    } else if (subscription === "none" && !hasSeenPaywall) {
      // Step 3: Authenticated but no subscription and hasn't seen paywall — show paywall
      // Allow staying on paywall
      if (!currentRoute.includes("paywall")) {
        if (!hasRedirectedToPaywall.current) {
          hasRedirectedToPaywall.current = true;
          isNavigating.current = true;
          navigationTimer.current = setTimeout(() => {
            router.replace("/paywall");
            setTimeout(() => {
              isNavigating.current = false;
            }, 300);
          }, 50);
        }
      }
    } else {
      // Step 4: Authenticated AND (has subscription OR has seen paywall) — allow into tabs
      // If they're still on auth/onboarding, redirect to tabs
      const isOnAuthScreen =
        currentRoute === "/auth" ||
        currentRoute.startsWith("/auth?") ||
        currentRoute.includes("/(auth)");
      const isOnOnboarding = currentRoute.includes("onboarding");

      if (isOnAuthScreen || isOnOnboarding) {
        if (!hasRedirectedToTabs.current) {
          hasRedirectedToTabs.current = true;
          isNavigating.current = true;
          navigationTimer.current = setTimeout(() => {
            router.replace("/(tabs)");
            setTimeout(() => {
              isNavigating.current = false;
            }, 300);
          }, 50);
        }
      }
    }
  }, [hasCompletedOnboarding, isAuthenticated, hasSeenPaywall, subscription, loading, segments]);

  return null;
}
