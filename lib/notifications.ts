import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// ─── Foreground handler (show alerts even when app is open) ──────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Android notification channel ───────────────────────────────────
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("protein-alerts", {
      name: "Protein Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#007AFF",
      description: "Daily protein shortfall reminders",
    });
  }
}

// ─── Permission request ─────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

// ─── Push token retrieval ───────────────────────────────────────────
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    // For Expo Go / dev builds, use the device push token approach
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data as string;
  } catch (e) {
    console.warn("[Notifications] Failed to get push token:", e);
    return null;
  }
}

// ─── Protein shortfall local notification scheduling ────────────────

const PROTEIN_ALERT_ID = "protein-shortfall-daily";

/**
 * Schedule a daily local notification at 8 PM to check protein intake.
 * This is a local notification — no server push required.
 * The content is computed at schedule time based on current intake.
 */
export async function scheduleProteinShortfallAlert(params: {
  proteinConsumed: number;
  proteinGoal: number;
}): Promise<void> {
  if (Platform.OS === "web") return;

  const { proteinConsumed, proteinGoal } = params;
  const shortfall = proteinGoal - proteinConsumed;

  // Cancel any existing protein alert
  await cancelProteinShortfallAlert();

  // Only schedule if there's a meaningful shortfall (> 20g remaining)
  if (shortfall <= 20) return;

  const percentage = Math.round((proteinConsumed / proteinGoal) * 100);

  let title: string;
  let body: string;

  if (percentage < 30) {
    title = "Protein Check-In";
    body = `You've only hit ${proteinConsumed}g of your ${proteinGoal}g protein goal today. Time to fuel those gains — you need ${shortfall}g more.`;
  } else if (percentage < 60) {
    title = "Halfway There";
    body = `${proteinConsumed}g down, ${shortfall}g to go. You're at ${percentage}% of your protein target. Keep pushing.`;
  } else {
    title = "Almost There";
    body = `Just ${shortfall}g of protein left to hit your ${proteinGoal}g goal. One more meal and you're golden.`;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: PROTEIN_ALERT_ID,
    content: {
      title,
      body,
      data: { url: "/(tabs)/meals", type: "protein-shortfall" },
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: "protein-alerts" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });

  console.log("[Notifications] Protein shortfall alert scheduled for 8 PM");
}

/**
 * Cancel the daily protein shortfall notification.
 */
export async function cancelProteinShortfallAlert(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(PROTEIN_ALERT_ID);
  } catch {
    // Ignore if not found
  }
}

/**
 * Re-schedule the protein alert with fresh data.
 * Call this after each meal is logged or at app foreground.
 */
export async function refreshProteinAlert(params: {
  proteinConsumed: number;
  proteinGoal: number;
}): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;
  await scheduleProteinShortfallAlert(params);
}
