import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and return the Expo push token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Notifications] Permission not granted");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (e) {
    console.warn("[Notifications] Failed to register:", e);
    return null;
  }
}

/**
 * Schedule a daily protein shortfall notification at 8 PM local time.
 */
export async function scheduleProteinReminder(proteinConsumed: number, proteinGoal: number) {
  if (Platform.OS === "web") return;

  try {
    await cancelProteinReminder();

    const shortfall = proteinGoal - proteinConsumed;
    if (shortfall <= 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Anabolic Target Hit!",
          body: `You crushed your ${proteinGoal}g protein goal today. Keep building.`,
          data: { type: "protein_reminder", screen: "meals" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
        identifier: "protein_daily_reminder",
      });
    } else {
      const messages = [
        `You're ${Math.round(shortfall)}g short of your anabolic target today. One protein shake closes the gap.`,
        `${Math.round(shortfall)}g of protein left to hit your ${proteinGoal}g goal. Time for a high-protein meal.`,
        `Your muscles need ${Math.round(shortfall)}g more protein today. Don't leave gains on the table.`,
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Protein Gap Alert",
          body: message,
          data: { type: "protein_reminder", screen: "meals" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
        identifier: "protein_daily_reminder",
      });
    }
  } catch (e) {
    console.warn("[Notifications] Failed to schedule protein reminder:", e);
  }
}

/**
 * Cancel the daily protein reminder.
 */
export async function cancelProteinReminder() {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync("protein_daily_reminder");
  } catch {}
}

/**
 * Get the platform string for push token registration.
 */
export function getPlatformString(): string {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}
