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

interface AppState {
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  subscription: SubscriptionTier;
  profile: UserProfile;
  meals: MealEntry[];
  weightLog: WeightEntry[];
  gainsCards: GainsCardEntry[];
  personalRecords: PersonalRecord[];
}

interface AppContextType extends AppState {
  completeOnboarding: () => Promise<void>;
  setAuthenticated: (value: boolean) => Promise<void>;
  setSubscription: (tier: SubscriptionTier) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addMeal: (meal: MealEntry) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  toggleFavoriteMeal: (id: string) => Promise<void>;
  getFavoriteMeals: () => MealEntry[];
  addWeight: (entry: WeightEntry) => Promise<void>;
  saveGainsCard: (card: GainsCardEntry) => Promise<void>;
  removeGainsCard: (id: string) => Promise<void>;
  updatePersonalRecords: () => Promise<void>;
  getTodayMeals: () => MealEntry[];
  getTodayCalories: () => number;
  getTodayMacros: () => { protein: number; carbs: number; fat: number };
  loading: boolean;
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
  subscription: "free",
  profile: defaultProfile,
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

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
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

  const completeOnboarding = useCallback(async () => {
    await updateState({ hasCompletedOnboarding: true });
  }, [updateState]);

  const setAuthenticated = useCallback(async (value: boolean) => {
    await updateState({ isAuthenticated: value });
  }, [updateState]);

  const setSubscription = useCallback(async (tier: SubscriptionTier) => {
    await updateState({ subscription: tier });
  }, [updateState]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setState((prev) => {
      const next = { ...prev, profile: { ...prev.profile, ...updates } };
      saveState(next);
      return next;
    });
  }, []);

  const addMeal = useCallback(async (meal: MealEntry) => {
    setState((prev) => {
      const next = { ...prev, meals: [...prev.meals, meal] };
      saveState(next);
      return next;
    });
  }, []);

  const removeMeal = useCallback(async (id: string) => {
    setState((prev) => {
      const next = { ...prev, meals: prev.meals.filter((m) => m.id !== id) };
      saveState(next);
      return next;
    });
  }, []);

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

  const getFavoriteMeals = useCallback(() => {
    return state.meals.filter((m) => m.isFavorite);
  }, [state.meals]);

  const addWeight = useCallback(async (entry: WeightEntry) => {
    setState((prev) => {
      const next = { ...prev, weightLog: [...prev.weightLog, entry] };
      saveState(next);
      return next;
    });
  }, []);

  const saveGainsCard = useCallback(async (card: GainsCardEntry) => {
    setState((prev) => {
      const next = { ...prev, gainsCards: [card, ...prev.gainsCards].slice(0, 50) };
      saveState(next);
      return next;
    });
  }, []);

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

      // Highest protein in a single day
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

      // Highest calories in a single day
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

      // Highest anabolic score
      const bestAnabolic = prev.meals.reduce((best, m) => m.anabolicScore > best.score ? { score: m.anabolicScore, date: m.date } : best, { score: 0, date: today });
      if (bestAnabolic.score > 0) {
        records.push({ id: "pr_anabolic", category: "anabolic", label: "Best Anabolic Score", value: bestAnabolic.score, unit: "/100", date: bestAnabolic.date });
      }

      // Tracking streak (consecutive days with meals)
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

      // Weight change records
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

      // Total meals tracked
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
    };
  }, [getTodayMeals]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        completeOnboarding,
        setAuthenticated,
        setSubscription,
        updateProfile,
        addMeal,
        removeMeal,
        toggleFavoriteMeal,
        getFavoriteMeals,
        addWeight,
        saveGainsCard,
        removeGainsCard,
        updatePersonalRecords,
        getTodayMeals,
        getTodayCalories,
        getTodayMacros,
        loading,
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
