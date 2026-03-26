/**
 * Muscle AI — Widget Data Provider
 *
 * Provides shared data for the iOS Home Screen Widget.
 * Uses AsyncStorage as the bridge between the app and widget.
 *
 * Note: True iOS widgets require native Swift code and App Groups.
 * This module provides the data layer that a native widget would read from.
 * For the Expo/React Native layer, we expose a "widget preview" component
 * that shows what the widget would look like on the home screen.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const WIDGET_DATA_KEY = "@muscle_ai_widget_data";

export interface WidgetData {
  proteinCurrent: number;
  proteinGoal: number;
  caloriesCurrent: number;
  caloriesGoal: number;
  lastMealName: string;
  lastMealProtein: number;
  streak: number;
  updatedAt: string;
}

const DEFAULT_WIDGET_DATA: WidgetData = {
  proteinCurrent: 0,
  proteinGoal: 200,
  caloriesCurrent: 0,
  caloriesGoal: 2500,
  lastMealName: "",
  lastMealProtein: 0,
  streak: 0,
  updatedAt: new Date().toISOString(),
};

/**
 * Save widget data to shared storage.
 * In production, this would write to App Group UserDefaults
 * so the native widget can read it.
 */
export async function saveWidgetData(data: Partial<WidgetData>): Promise<void> {
  try {
    const existing = await getWidgetData();
    const updated: WidgetData = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("[WidgetData] Failed to save:", e);
  }
}

/**
 * Read current widget data from shared storage.
 */
export async function getWidgetData(): Promise<WidgetData> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("[WidgetData] Failed to read:", e);
  }
  return DEFAULT_WIDGET_DATA;
}
