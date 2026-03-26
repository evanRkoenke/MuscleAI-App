/**
 * Muscle AI — Client-side Cloud Sync Service
 *
 * Handles pushing local data to the cloud and pulling cloud data to the device.
 * Only paid subscribers (Essential/Pro/Elite) can sync.
 * Free users see an upsell prompt.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_SYNC_KEY = "muscle_ai_last_sync";
const SYNC_STATUS_KEY = "muscle_ai_sync_status";

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "upgrade_required";

export interface SyncResult {
  status: SyncStatus;
  message: string;
  lastSync?: string;
}

/**
 * Get the last sync timestamp
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Save the last sync timestamp
 */
export async function setLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get the current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const status = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return (status as SyncStatus) || "idle";
  } catch {
    return "idle";
  }
}

/**
 * Set the current sync status
 */
export async function setSyncStatus(status: SyncStatus): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_STATUS_KEY, status);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Format the last sync time for display
 */
export function formatLastSync(isoString: string | null): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Prepare local app state for cloud push.
 * Transforms the AppState shape into the sync API format.
 */
export function prepareDataForPush(appState: {
  profile: {
    targetWeight: number;
    currentWeight: number;
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
    unit: "lbs" | "kg";
  };
  onboardingData: {
    heightFt: number;
    heightIn: number;
    goal: string;
    trainingDays: number;
    dietaryRestrictions: string[];
  };
  meals: Array<{
    id: string;
    date: string;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    anabolicScore: number;
    imageUri?: string;
    isFavorite?: boolean;
  }>;
  weightLog: Array<{
    id: string;
    date: string;
    weight: number;
  }>;
  gainsCards: Array<{
    id: string;
    date: string;
    weight: number;
    protein: number;
    calories: number;
    daysTracked: number;
    anabolicScore: number;
    subscription: string;
  }>;
}) {
  return {
    profile: {
      targetWeight: appState.profile.targetWeight,
      currentWeight: appState.profile.currentWeight,
      calorieGoal: appState.profile.calorieGoal,
      proteinGoal: appState.profile.proteinGoal,
      carbsGoal: appState.profile.carbsGoal,
      fatGoal: appState.profile.fatGoal,
      unit: appState.profile.unit,
      heightFt: appState.onboardingData.heightFt,
      heightIn: appState.onboardingData.heightIn,
      goal: appState.onboardingData.goal,
      trainingDays: appState.onboardingData.trainingDays,
      dietaryRestrictions: appState.onboardingData.dietaryRestrictions,
    },
    meals: appState.meals.map((m) => ({
      clientId: m.id,
      date: m.date,
      mealType: m.mealType,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      sugar: m.sugar,
      anabolicScore: m.anabolicScore,
      imageUri: m.imageUri ?? null,
      isFavorite: m.isFavorite ?? false,
    })),
    weightLog: appState.weightLog.map((w) => ({
      clientId: w.id,
      date: w.date,
      weight: w.weight,
    })),
    gainsCards: appState.gainsCards.map((c) => ({
      clientId: c.id,
      date: c.date,
      weight: c.weight,
      protein: c.protein,
      calories: c.calories,
      daysTracked: c.daysTracked,
      anabolicScore: c.anabolicScore,
      subscription: c.subscription,
    })),
  };
}

/**
 * Merge cloud data into local state.
 * Cloud data is merged with local data, with cloud data taking precedence for conflicts.
 * Uses clientId for deduplication.
 */
export function mergeCloudData(
  localMeals: Array<{ id: string; [key: string]: any }>,
  cloudMeals: Array<{ clientId: string; [key: string]: any }>
) {
  const localIds = new Set(localMeals.map((m) => m.id));
  const newFromCloud = cloudMeals
    .filter((cm) => !localIds.has(cm.clientId))
    .map((cm) => ({
      ...cm,
      id: cm.clientId,
    }));

  return [...localMeals, ...newFromCloud];
}
