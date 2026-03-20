import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import {
  registerForPushNotifications,
  scheduleProteinReminder,
  getPlatformString,
} from "@/lib/notifications";

/**
 * Hook that initializes push notifications, registers token with server,
 * schedules daily protein reminders, and handles notification taps.
 */
export function useNotifications() {
  const router = useRouter();
  const { profile, getTodayMacros } = useApp();
  const { isAuthenticated } = useAuth({ autoFetch: false });
  const registerTokenMut = trpc.sync.registerPushToken.useMutation();
  const hasRegistered = useRef(false);

  // Register push token on mount
  useEffect(() => {
    if (Platform.OS === "web" || hasRegistered.current) return;
    hasRegistered.current = true;

    (async () => {
      const token = await registerForPushNotifications();
      if (token && isAuthenticated) {
        try {
          registerTokenMut.mutate({ token, platform: getPlatformString() });
        } catch {}
      }
    })();
  }, [isAuthenticated]);

  // Schedule daily protein reminder based on current intake
  useEffect(() => {
    if (Platform.OS === "web") return;
    const macros = getTodayMacros();
    scheduleProteinReminder(macros.protein, profile.proteinGoal);
  }, [profile.proteinGoal, getTodayMacros]);

  // Handle notification tap — navigate to meals screen
  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen === "meals") {
        (router as any).push("/(tabs)/meals");
      }
    });

    return () => subscription.remove();
  }, [router]);
}
