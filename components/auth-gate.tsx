import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/lib/app-context";

/**
 * AuthGate — Redirect users based on onboarding and authentication state.
 *
 * Flow:
 * 1. First launch → onboarding quiz
 * 2. After onboarding → auth/login page
 * 3. After successful OAuth → tabs (main app)
 *
 * Key principles:
 * - Once a user is **authenticated** (completed OAuth), they ALWAYS get into the app.
 * - Subscription status gates specific premium features inside the app,
 *   NOT the app entry itself.
 * - Navigation is debounced to prevent rapid redirect loops.
 * - The `isNavigating` ref prevents concurrent redirects from racing.
 */
export function AuthGate() {
  const { hasCompletedOnboarding, isAuthenticated, loading } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirectedToTabs = useRef(false);
  const isNavigating = useRef(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the redirect guard when user logs out so re-login can redirect to tabs
  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirectedToTabs.current = false;
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

    if (!hasCompletedOnboarding) {
      // Step 1: First-time user — send to onboarding quiz
      if (!currentRoute.includes("onboarding")) {
        isNavigating.current = true;
        router.replace("/onboarding");
        // Reset navigation lock after a short delay
        navigationTimer.current = setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }
    } else if (!isAuthenticated) {
      // Step 2: Onboarded but not logged in — send to auth page
      // Allow staying on paywall or onboarding (retake quiz)
      if (
        !currentRoute.includes("auth") &&
        !currentRoute.includes("paywall") &&
        !currentRoute.includes("onboarding")
      ) {
        isNavigating.current = true;
        router.replace("/auth");
        navigationTimer.current = setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }
    } else {
      // Step 3: Authenticated — allow into tabs
      // If they're still on auth/paywall/onboarding, redirect to tabs ONCE
      const isOnAuthScreen =
        currentRoute === "/auth" ||
        currentRoute.startsWith("/auth?") ||
        currentRoute.includes("/(auth)");
      const isOnPaywall =
        currentRoute === "/paywall" ||
        currentRoute.startsWith("/paywall?");
      const isOnOnboarding = currentRoute.includes("onboarding");

      if (isOnAuthScreen || isOnPaywall || isOnOnboarding) {
        if (!hasRedirectedToTabs.current) {
          hasRedirectedToTabs.current = true;
          isNavigating.current = true;
          // Use a small delay to ensure state has fully committed
          navigationTimer.current = setTimeout(() => {
            router.replace("/(tabs)");
            // Reset navigation lock after navigation completes
            setTimeout(() => {
              isNavigating.current = false;
            }, 300);
          }, 50);
        }
      }
    }
  }, [hasCompletedOnboarding, isAuthenticated, loading, segments]);

  return null;
}
