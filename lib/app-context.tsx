import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SubscriptionTier = "free" | "essential" | "pro" | "elite";

interface UserProfile {
  name: string;
  email: string;
  profilePhotoUri: string;
  targetWeight: number;
  currentWeight: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  unit: "lbs" | "kg";
}

interface MealEntry {
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
}

interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface GainsCardEntry {
  id: string;
  date: string;
  weight: number;
  protein: number;
  calories: number;
  daysTracked: number;
  anabolicScore: number;
  subscription: SubscriptionTier;
}

export interface PersonalRecord {
  id: string;
  category: "protein" | "calories" | "anabolic" | "streak" | "weight_gain" | "weight_loss";
  label: string;
  value: number;
  unit: string;
  date: string;
}

export type FitnessGoal = "build_muscle" | "lean_bulk" | "maintenance";
export type DietaryRestriction = "none" | "vegetarian" | "vegan" | "gluten_free" | "dairy_free" | "keto" | "halal";

export interface OnboardingData {
  heightFt: number;
  heightIn: number;
  weight: number;
  goal: FitnessGoal;
  trainingDays: number;
  dietaryRestrictions: DietaryRestriction[];
  targetWeight: number;
  unit: "lbs" | "kg";
}

const defaultOnboarding: OnboardingData = {
  heightFt: 5,
  heightIn: 10,
  weight: 175,
  goal: "build_muscle",
  trainingDays: 4,
  dietaryRestrictions: ["none"],
  targetWeight: 180,
  unit: "lbs",
};

interface AppState {
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  hasSeenPaywall: boolean;
  subscription: SubscriptionTier;
  profile: UserProfile;
  onboardingData: OnboardingData;
  meals: MealEntry[];
  weightLog: WeightEntry[];
  gainsCards: GainsCardEntry[];
  personalRecords: PersonalRecord[];
}

interface AppContextType extends AppState {
  completeOnboarding: (data?: OnboardingData) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setAuthenticated: (value: boolean) => Promise<void>;
  markPaywallSeen: () => Promise<void>;
  setSubscription: (tier: SubscriptionTier) => Promise<void>;
  /** The tier the user just upgraded to (triggers welcome modal). Null when no modal needed. */
  justSubscribedTier: SubscriptionTier | null;
  /** Dismiss the welcome modal */
  dismissWelcomeModal: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addMeal: (meal: MealEntry) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  toggleFavoriteMeal: (id: string) => Promise<void>;
  addWeight: (entry: WeightEntry) => Promise<void>;
  removeWeight: (id: string) => Promise<void>;
  saveGainsCard: (card: GainsCardEntry) => Promise<void>;
  removeGainsCard: (id: string) => Promise<void>;
  updatePersonalRecords: () => Promise<void>;
  getTodayMeals: () => MealEntry[];
  getTodayCalories: () => number;
  getTodayMacros: () => { protein: number; carbs: number; fat: number; sugar: number };
  getMealsByDate: (date: string) => MealEntry[];
  getCaloriesByDate: (date: string) => number;
  getMacrosByDate: (date: string) => { protein: number; carbs: number; fat: number; sugar: number };
  getFavoriteMeals: () => MealEntry[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  loading: boolean;
  /** Cloud sync: push local data to server (paid only) */
  syncToCloud: () => Promise<{ success: boolean; message: string }>;
  /** Cloud sync: pull cloud data to local (paid only) */
  syncFromCloud: () => Promise<{ success: boolean; message: string }>;
  /** Cloud sync: restore subscription from server on login */
  restoreSubscriptionFromCloud: () => Promise<void>;
  /** Merge cloud data into local state */
  mergeCloudDataIntoLocal: (cloudData: any) => Promise<void>;
  /** Cloud sync status */
  syncStatus: "idle" | "syncing" | "success" | "error" | "upgrade_required";
  lastSyncTime: string | null;
}

const defaultProfile: UserProfile = {
  name: "",
  email: "",
  profilePhotoUri: "",
  targetWeight: 180,
  currentWeight: 175,
  calorieGoal: 2500,
  proteinGoal: 200,
  carbsGoal: 250,
  fatGoal: 80,
  unit: "lbs",
};

const defaultState: AppState = {
  hasCompletedOnboarding: false,
  isAuthenticated: false,
  hasSeenPaywall: false,
  subscription: "free",
  profile: defaultProfile,
  onboardingData: defaultOnboarding,
  meals: [],
  weightLog: [],
  gainsCards: [],
  personalRecords: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "muscle_ai_state";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [justSubscribedTier, setJustSubscribedTier] = useState<SubscriptionTier | null>(null);
  const [syncStatus, setSyncStatusState] = useState<"idle" | "syncing" | "success" | "error" | "upgrade_required">("idle");
  const [lastSyncTime, setLastSyncTimeState] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old meals without sugar field
        if (parsed.meals) {
          parsed.meals = parsed.meals.map((m: any) => ({
            ...m,
            sugar: m.sugar ?? 0,
            isFavorite: m.isFavorite ?? false,
          }));
        }
        setState({ ...defaultState, ...parsed });
      }
    } catch (e) {
      console.warn("Failed to load app state:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveState = async (newState: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn("Failed to save app state:", e);
    }
  };

  const updateState = useCallback(async (updates: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      saveState(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(async (data?: OnboardingData) => {
    if (data) {
      // Compute calorie/macro goals from onboarding data
      const weightLbs = data.unit === "kg" ? data.weight * 2.205 : data.weight;
      const bmr = 10 * (weightLbs / 2.205) + 6.25 * ((data.heightFt * 12 + data.heightIn) * 2.54) - 5 * 25 + 5; // Mifflin-St Jeor (age est 25)
      const activityMultiplier = 1.2 + (data.trainingDays * 0.075); // 1.2 sedentary + 0.075 per training day
      const tdee = Math.round(bmr * activityMultiplier);
      let calorieGoal: number;
      let proteinMultiplier: number;
      if (data.goal === "build_muscle") {
        calorieGoal = tdee + 500;
        proteinMultiplier = 1.0; // 1g per lb
      } else if (data.goal === "lean_bulk") {
        calorieGoal = tdee + 250;
        proteinMultiplier = 1.0;
      } else {
        calorieGoal = tdee;
        proteinMultiplier = 0.8;
      }
      const proteinGoal = Math.round(weightLbs * proteinMultiplier);
      const fatGoal = Math.round((calorieGoal * 0.25) / 9);
      const carbsGoal = Math.round((calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4);

      await updateState({
        hasCompletedOnboarding: true,
        onboardingData: data,
        profile: {
          ...defaultProfile,
          currentWeight: data.weight,
          targetWeight: data.targetWeight,
          unit: data.unit,
          calorieGoal,
          proteinGoal,
          carbsGoal,
          fatGoal,
        },
      });
    } else {
      await updateState({ hasCompletedOnboarding: true });
    }
  }, [updateState]);

  const resetOnboarding = useCallback(async () => {
    await updateState({ hasCompletedOnboarding: false });
  }, [updateState]);

  const setAuthenticated = useCallback(async (value: boolean) => {
    await updateState({ isAuthenticated: value });
  }, [updateState]);

  const markPaywallSeen = useCallback(async () => {
    await updateState({ hasSeenPaywall: true });
  }, [updateState]);

  const setSubscription = useCallback(async (tier: SubscriptionTier) => {
    // Track the upgrade for the welcome modal (only for paid tiers)
    if (tier !== "free") {
      setJustSubscribedTier(tier);
    }
    // Subscribing implicitly means they've seen the paywall
    await updateState({ subscription: tier, hasSeenPaywall: true });
  }, [updateState]);

  const dismissWelcomeModal = useCallback(() => {
    setJustSubscribedTier(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setState((prev) => {
      const next = { ...prev, profile: { ...prev.profile, ...updates } };
      saveState(next);
      return next;
    });
    if (state.subscription !== "free") {
      import("./offline-queue").then(({ enqueue }) => enqueue("profile_update", updates)).catch(() => {});
    }
  }, [state.subscription]);

  const addMeal = useCallback(async (meal: MealEntry) => {
    const mealWithDefaults = { ...meal, sugar: meal.sugar ?? 0, isFavorite: meal.isFavorite ?? false };
    setState((prev) => {
      const next = { ...prev, meals: [...prev.meals, mealWithDefaults] };
      saveState(next);
      return next;
    });
    // Queue for offline sync if paid user
    if (state.subscription !== "free") {
      import("./offline-queue").then(({ enqueue }) => enqueue("meal_add", mealWithDefaults)).catch(() => {});
    }
  }, [state.subscription]);

  const removeMeal = useCallback(async (id: string) => {
    setState((prev) => {
      const next = { ...prev, meals: prev.meals.filter((m) => m.id !== id) };
      saveState(next);
      return next;
    });
    if (state.subscription !== "free") {
      import("./offline-queue").then(({ enqueue }) => enqueue("meal_remove", { id })).catch(() => {});
    }
  }, [state.subscription]);

  const toggleFavoriteMeal = useCallback(async (id: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        meals: prev.meals.map((m) =>
          m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
        ),
      };
      saveState(next);
      return next;
    });
  }, []);

  const addWeight = useCallback(async (entry: WeightEntry) => {
    setState((prev) => {
      const next = { ...prev, weightLog: [...prev.weightLog, entry] };
      saveState(next);
      return next;
    });
    if (state.subscription !== "free") {
      import("./offline-queue").then(({ enqueue }) => enqueue("weight_add", entry)).catch(() => {});
    }
  }, [state.subscription]);

  const removeWeight = useCallback(async (id: string) => {
    setState((prev) => {
      const next = { ...prev, weightLog: prev.weightLog.filter((w) => w.id !== id) };
      saveState(next);
      return next;
    });
    if (state.subscription !== "free") {
      import("./offline-queue").then(({ enqueue }) => enqueue("weight_remove", { id })).catch(() => {});
    }
  }, [state.subscription]);

  const saveGainsCard = useCallback(async (card: GainsCardEntry) => {
    setState((prev) => {
      const next = { ...prev, gainsCards: [card, ...prev.gainsCards].slice(0, 50) };
      saveState(next);
      return next;
    });
    if (state.subscription !== "free") {
      import("./offline-queue").then(({ enqueue }) => enqueue("gains_card_save", card)).catch(() => {});
    }
  }, [state.subscription]);

  const removeGainsCard = useCallback(async (id: string) => {
    setState((prev) => {
      const next = { ...prev, gainsCards: prev.gainsCards.filter((c) => c.id !== id) };
      saveState(next);
      return next;
    });
  }, []);

  const updatePersonalRecords = useCallback(async () => {
    setState((prev) => {
      const records: PersonalRecord[] = [];
      const today = new Date().toISOString().split("T")[0];

      const mealsByDate = new Map<string, number>();
      prev.meals.forEach((m) => {
        mealsByDate.set(m.date, (mealsByDate.get(m.date) || 0) + m.protein);
      });
      let bestProteinDay = 0;
      let bestProteinDate = today;
      mealsByDate.forEach((v, d) => {
        if (v > bestProteinDay) { bestProteinDay = v; bestProteinDate = d; }
      });
      if (bestProteinDay > 0) {
        records.push({ id: "pr_protein", category: "protein", label: "Highest Protein Day", value: bestProteinDay, unit: "g", date: bestProteinDate });
      }

      const calsByDate = new Map<string, number>();
      prev.meals.forEach((m) => {
        calsByDate.set(m.date, (calsByDate.get(m.date) || 0) + m.calories);
      });
      let bestCalDay = 0;
      let bestCalDate = today;
      calsByDate.forEach((v, d) => {
        if (v > bestCalDay) { bestCalDay = v; bestCalDate = d; }
      });
      if (bestCalDay > 0) {
        records.push({ id: "pr_calories", category: "calories", label: "Highest Calorie Day", value: bestCalDay, unit: "cal", date: bestCalDate });
      }

      const bestAnabolic = prev.meals.reduce((best, m) => m.anabolicScore > best.score ? { score: m.anabolicScore, date: m.date } : best, { score: 0, date: today });
      if (bestAnabolic.score > 0) {
        records.push({ id: "pr_anabolic", category: "anabolic", label: "Best Anabolic Score", value: bestAnabolic.score, unit: "/100", date: bestAnabolic.date });
      }

      const uniqueDates = [...new Set(prev.meals.map((m) => m.date))].sort();
      let maxStreak = 0;
      let currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev_d = new Date(uniqueDates[i - 1]);
        const curr_d = new Date(uniqueDates[i]);
        const diff = (curr_d.getTime() - prev_d.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) { currentStreak++; } else { currentStreak = 1; }
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      }
      if (uniqueDates.length === 1) maxStreak = 1;
      if (maxStreak > 0) {
        records.push({ id: "pr_streak", category: "streak", label: "Longest Tracking Streak", value: maxStreak, unit: "days", date: today });
      }

      if (prev.weightLog.length >= 2) {
        const sorted = [...prev.weightLog].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const first = sorted[0].weight;
        const last = sorted[sorted.length - 1].weight;
        const change = last - first;
        if (change > 0) {
          records.push({ id: "pr_weight_gain", category: "weight_gain", label: "Total Weight Gained", value: Math.round(change * 10) / 10, unit: prev.profile.unit, date: sorted[sorted.length - 1].date });
        } else if (change < 0) {
          records.push({ id: "pr_weight_loss", category: "weight_loss", label: "Total Weight Lost", value: Math.round(Math.abs(change) * 10) / 10, unit: prev.profile.unit, date: sorted[sorted.length - 1].date });
        }
      }

      if (prev.meals.length > 0) {
        records.push({ id: "pr_meals", category: "calories", label: "Total Meals Tracked", value: prev.meals.length, unit: "meals", date: today });
      }

      const next = { ...prev, personalRecords: records };
      saveState(next);
      return next;
    });
  }, []);

  const getTodayMeals = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return state.meals.filter((m) => m.date === today);
  }, [state.meals]);

  const getTodayCalories = useCallback(() => {
    return getTodayMeals().reduce((sum, m) => sum + m.calories, 0);
  }, [getTodayMeals]);

  const getTodayMacros = useCallback(() => {
    const todayMeals = getTodayMeals();
    return {
      protein: todayMeals.reduce((sum, m) => sum + m.protein, 0),
      carbs: todayMeals.reduce((sum, m) => sum + m.carbs, 0),
      fat: todayMeals.reduce((sum, m) => sum + m.fat, 0),
      sugar: todayMeals.reduce((sum, m) => sum + (m.sugar ?? 0), 0),
    };
  }, [getTodayMeals]);

  const getMealsByDate = useCallback((date: string) => {
    return state.meals.filter((m) => m.date === date);
  }, [state.meals]);

  const getCaloriesByDate = useCallback((date: string) => {
    return getMealsByDate(date).reduce((sum, m) => sum + m.calories, 0);
  }, [getMealsByDate]);

  const getMacrosByDate = useCallback((date: string) => {
    const dateMeals = getMealsByDate(date);
    return {
      protein: dateMeals.reduce((sum, m) => sum + m.protein, 0),
      carbs: dateMeals.reduce((sum, m) => sum + m.carbs, 0),
      fat: dateMeals.reduce((sum, m) => sum + m.fat, 0),
      sugar: dateMeals.reduce((sum, m) => sum + (m.sugar ?? 0), 0),
    };
  }, [getMealsByDate]);

  const getFavoriteMeals = useCallback(() => {
    return state.meals.filter((m) => m.isFavorite);
  }, [state.meals]);

  // ─── Cloud Sync Methods ───
  const syncToCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (state.subscription === "free") {
      setSyncStatusState("upgrade_required");
      return { success: false, message: "Cloud sync requires a paid subscription." };
    }
    setSyncStatusState("syncing");
    try {
      // Dynamic import to avoid circular deps
      const { prepareDataForPush, setLastSyncTime, setSyncStatus } = await import("./cloud-sync");
      const { trpc } = await import("./trpc");
      const pushData = prepareDataForPush(state);
      await (trpc as any).sync.pushData.mutate(pushData);
      await setLastSyncTime();
      await setSyncStatus("success");
      const now = new Date().toISOString();
      setLastSyncTimeState(now);
      setSyncStatusState("success");
      return { success: true, message: "Data synced to cloud successfully." };
    } catch (error: any) {
      const msg = error?.message || "Sync failed";
      if (msg.includes("SYNC_REQUIRES_SUBSCRIPTION")) {
        setSyncStatusState("upgrade_required");
        return { success: false, message: "Cloud sync requires a paid subscription." };
      }
      setSyncStatusState("error");
      return { success: false, message: msg };
    }
  }, [state]);

  const syncFromCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (state.subscription === "free") {
      setSyncStatusState("upgrade_required");
      return { success: false, message: "Cloud sync requires a paid subscription." };
    }
    setSyncStatusState("syncing");
    try {
      const { mergeCloudData, setLastSyncTime, setSyncStatus } = await import("./cloud-sync");
      const { trpc } = await import("./trpc");
      const cloudData = await (trpc as any).sync.pullData.query();

      // Merge cloud data into local state
      const mergedMeals = mergeCloudData(state.meals, cloudData.meals || []);
      const mergedWeightLog = mergeCloudData(state.weightLog, cloudData.weightLog || []);
      const mergedGainsCards = mergeCloudData(state.gainsCards, cloudData.gainsCards || []);

      const profileUpdates: Partial<typeof state.profile> = {};
      if (cloudData.profile) {
        if (cloudData.profile.targetWeight) profileUpdates.targetWeight = cloudData.profile.targetWeight;
        if (cloudData.profile.currentWeight) profileUpdates.currentWeight = cloudData.profile.currentWeight;
        if (cloudData.profile.calorieGoal) profileUpdates.calorieGoal = cloudData.profile.calorieGoal;
        if (cloudData.profile.proteinGoal) profileUpdates.proteinGoal = cloudData.profile.proteinGoal;
        if (cloudData.profile.carbsGoal) profileUpdates.carbsGoal = cloudData.profile.carbsGoal;
        if (cloudData.profile.fatGoal) profileUpdates.fatGoal = cloudData.profile.fatGoal;
        if (cloudData.profile.unit) profileUpdates.unit = cloudData.profile.unit;
      }

      await updateState({
        meals: mergedMeals as MealEntry[],
        weightLog: mergedWeightLog as WeightEntry[],
        gainsCards: mergedGainsCards as GainsCardEntry[],
        profile: { ...state.profile, ...profileUpdates },
      });

      await setLastSyncTime();
      await setSyncStatus("success");
      const now = new Date().toISOString();
      setLastSyncTimeState(now);
      setSyncStatusState("success");
      return { success: true, message: "Cloud data restored successfully." };
    } catch (error: any) {
      const msg = error?.message || "Sync failed";
      if (msg.includes("SYNC_REQUIRES_SUBSCRIPTION")) {
        setSyncStatusState("upgrade_required");
        return { success: false, message: "Cloud sync requires a paid subscription." };
      }
      setSyncStatusState("error");
      return { success: false, message: msg };
    }
  }, [state, updateState]);

  const restoreSubscriptionFromCloud = useCallback(async () => {
    try {
      const { trpc } = await import("./trpc");
      const result = await (trpc as any).sync.getSubscription.query();
      if (result.tier && result.tier !== "free" && result.tier !== state.subscription) {
        await updateState({ subscription: result.tier });
      }
    } catch (error) {
      console.warn("[CloudSync] Failed to restore subscription:", error);
    }
  }, [state.subscription, updateState]);

  const mergeCloudDataIntoLocal = useCallback(async (cloudData: any) => {
    try {
      const { mergeCloudData } = await import("./cloud-sync");
      const mergedMeals = mergeCloudData(state.meals, cloudData.meals || []);
      const mergedWeightLog = mergeCloudData(state.weightLog, cloudData.weightLog || []);
      const mergedGainsCards = mergeCloudData(state.gainsCards, cloudData.gainsCards || []);
      await updateState({
        meals: mergedMeals as MealEntry[],
        weightLog: mergedWeightLog as WeightEntry[],
        gainsCards: mergedGainsCards as GainsCardEntry[],
      });
    } catch (error) {
      console.warn("[CloudSync] Failed to merge cloud data:", error);
    }
  }, [state.meals, state.weightLog, state.gainsCards, updateState]);

  // Load last sync time on mount
  useEffect(() => {
    (async () => {
      try {
        const { getLastSyncTime } = await import("./cloud-sync");
        const time = await getLastSyncTime();
        setLastSyncTimeState(time);
      } catch {}
    })();
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        completeOnboarding,
        resetOnboarding,
        setAuthenticated,
        markPaywallSeen,
        setSubscription,
        justSubscribedTier,
        dismissWelcomeModal,
        updateProfile,
        addMeal,
        removeMeal,
        toggleFavoriteMeal,
        addWeight,
        removeWeight,
        saveGainsCard,
        removeGainsCard,
        updatePersonalRecords,
        getTodayMeals,
        getTodayCalories,
        getTodayMacros,
        getMealsByDate,
        getCaloriesByDate,
        getMacrosByDate,
        getFavoriteMeals,
        selectedDate,
        setSelectedDate,
        loading,
        syncToCloud,
        syncFromCloud,
        restoreSubscriptionFromCloud,
        mergeCloudDataIntoLocal,
        syncStatus,
        lastSyncTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
