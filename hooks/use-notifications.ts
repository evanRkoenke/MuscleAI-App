import { useEffect, useRef } from "react";
import { Platform, AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import {
  setupNotificationChannel,
  requestNotificationPermissions,
  getExpoPushToken,
  refreshProteinAlert,
} from "@/lib/notifications";

/**
 * Hook that manages the full notification lifecycle:
 * 1. Requests permissions on mount
 * 2. Registers push token with server (if authenticated)
 * 3. Schedules daily protein shortfall local notifications
 * 4. Handles notification taps for deep linking
 * 5. Refreshes protein alert when app returns to foreground
 */
export function useNotifications() {
  const router = useRouter();
  const { profile, getTodayMacros } = useApp();
  const { isAuthenticated } = useAuth({ autoFetch: false });
  const registerTokenMutation = trpc.push.registerToken.useMutation();
  const hasRegisteredToken = useRef(false);

  // 1. Setup channel + permissions + push token on mount
  useEffect(() => {
    if (Platform.OS === "web") return;

    let mounted = true;

    async function init() {
      try {
        await setupNotificationChannel();
        const granted = await requestNotificationPermissions();
        if (!granted || !mounted) return;

        // Register push token with server if authenticated
        if (isAuthenticated && !hasRegisteredToken.current) {
          const token = await getExpoPushToken();
          if (token && mounted) {
            try {
              await registerTokenMutation.mutateAsync({
                token,
                platform: Platform.OS as "ios" | "android",
              });
              hasRegisteredToken.current = true;
              console.log("[Notifications] Push token registered with server");
            } catch (e) {
              console.warn("[Notifications] Failed to register push token:", e);
            }
          }
        }
      } catch (e) {
        console.warn("[Notifications] Init failed:", e);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // 2. Schedule/refresh protein shortfall alert when macros change
  useEffect(() => {
    if (Platform.OS === "web") return;

    const macros = getTodayMacros();
    refreshProteinAlert({
      proteinConsumed: macros.protein,
      proteinGoal: profile.proteinGoal,
    });
  }, [getTodayMacros, profile.proteinGoal]);

  // 3. Refresh protein alert when app returns to foreground
  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        const macros = getTodayMacros();
        refreshProteinAlert({
          proteinConsumed: macros.protein,
          proteinGoal: profile.proteinGoal,
        });
      }
    });

    return () => subscription.remove();
  }, [getTodayMacros, profile.proteinGoal]);

  // 4. Handle notification taps → deep link to meals screen
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Handle notification that opened the app
    const lastResponse = Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") {
          router.push(url as any);
        }
      }
    });

    // Handle notifications tapped while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string") {
        router.push(url as any);
      }
    });

    return () => subscription.remove();
  }, [router]);
}
