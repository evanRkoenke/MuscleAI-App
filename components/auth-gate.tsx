import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/lib/app-context";

/**
 * AuthGate — Redirect users based on onboarding and authentication state.
 *
 * Flow:
 * 1. First launch → onboarding quiz (5 steps)
 * 2. After onboarding → auth screen (login/signup)
 * 3. After auth → main app (tabs)
 *
 * This component must be rendered inside AppProvider and the router.
 */
export function AuthGate() {
  const { hasCompletedOnboarding, isAuthenticated, loading } = useApp();
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
    } else {
      // Fully authenticated — ensure they're in the main app
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
  }, [hasCompletedOnboarding, isAuthenticated, loading, segments]);

  return null;
}
