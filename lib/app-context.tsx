import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SubscriptionTier = "free" | "essential" | "pro" | "elite";

interface UserProfile {
  name: string;
  email: string;
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
}

interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

interface AppState {
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  subscription: SubscriptionTier;
  profile: UserProfile;
  meals: MealEntry[];
  weightLog: WeightEntry[];
}

interface AppContextType extends AppState {
  completeOnboarding: () => Promise<void>;
  setAuthenticated: (value: boolean) => Promise<void>;
  setSubscription: (tier: SubscriptionTier) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addMeal: (meal: MealEntry) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  addWeight: (entry: WeightEntry) => Promise<void>;
  getTodayMeals: () => MealEntry[];
  getTodayCalories: () => number;
  getTodayMacros: () => { protein: number; carbs: number; fat: number };
  loading: boolean;
}

const defaultProfile: UserProfile = {
  name: "",
  email: "",
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

  const addWeight = useCallback(async (entry: WeightEntry) => {
    setState((prev) => {
      const next = { ...prev, weightLog: [...prev.weightLog, entry] };
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
        addWeight,
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
