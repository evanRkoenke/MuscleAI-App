import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

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
  syncFromCloud: () => Promise<void>;
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
  const stateRef = useRef(state);
  stateRef.current = state;

  // Auth state for cloud sync
  const { isAuthenticated: isLoggedIn } = useAuth({ autoFetch: true });

  // tRPC mutations for cloud sync (fire-and-forget)
  const upsertMealMut = trpc.sync.upsertMeal.useMutation();
  const deleteMealMut = trpc.sync.deleteMeal.useMutation();
  const toggleFavMut = trpc.sync.toggleFavorite.useMutation();
  const upsertProfileMut = trpc.sync.upsertProfile.useMutation();
  const addWeightMut = trpc.sync.addWeight.useMutation();

  // tRPC queries for initial cloud pull
  const cloudMeals = trpc.sync.getMeals.useQuery(undefined, { enabled: false });
  const cloudProfile = trpc.sync.getProfile.useQuery(undefined, { enabled: false });
  const cloudWeight = trpc.sync.getWeightLog.useQuery(undefined, { enabled: false });

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

  // Cloud sync: pull data from server and merge with local
  const syncFromCloud = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const [mealsResult, profileResult, weightResult] = await Promise.all([
        cloudMeals.refetch(),
        cloudProfile.refetch(),
        cloudWeight.refetch(),
      ]);

      setState((prev) => {
        const updates: Partial<AppState> = {};

        // Merge meals: cloud meals override local by clientId
        if (mealsResult.data && mealsResult.data.length > 0) {
          const cloudMealMap = new Map<string, MealEntry>();
          mealsResult.data.forEach((cm: any) => {
            cloudMealMap.set(cm.clientId, {
              id: cm.clientId,
              date: cm.date,
              mealType: cm.mealType,
              name: cm.name,
              calories: cm.calories,
              protein: cm.protein,
              carbs: cm.carbs,
              fat: cm.fat,
              anabolicScore: cm.anabolicScore,
              imageUri: cm.imageUri ?? undefined,
              isFavorite: cm.isFavorite ?? false,
            });
          });
          // Add local meals that aren't in cloud
          prev.meals.forEach((lm) => {
            if (!cloudMealMap.has(lm.id)) {
              cloudMealMap.set(lm.id, lm);
            }
          });
          updates.meals = Array.from(cloudMealMap.values());
        }

        // Merge profile: cloud overrides local if present
        if (profileResult.data) {
          const cp = profileResult.data;
          updates.profile = {
            name: cp.name ?? prev.profile.name,
            email: cp.email ?? prev.profile.email,
            profilePhotoUri: cp.profilePhotoUri ?? prev.profile.profilePhotoUri,
            targetWeight: cp.targetWeight ?? prev.profile.targetWeight,
            currentWeight: cp.currentWeight ?? prev.profile.currentWeight,
            calorieGoal: cp.calorieGoal ?? prev.profile.calorieGoal,
            proteinGoal: cp.proteinGoal ?? prev.profile.proteinGoal,
            carbsGoal: cp.carbsGoal ?? prev.profile.carbsGoal,
            fatGoal: cp.fatGoal ?? prev.profile.fatGoal,
            unit: (cp.unit as "lbs" | "kg") ?? prev.profile.unit,
          };
          if (cp.subscription) {
            updates.subscription = cp.subscription as SubscriptionTier;
          }
        }

        // Merge weight log: cloud overrides local by date
        if (weightResult.data && weightResult.data.length > 0) {
          const cloudWeightMap = new Map<string, WeightEntry>();
          weightResult.data.forEach((cw: any) => {
            cloudWeightMap.set(cw.date, {
              id: `w_${cw.date}`,
              date: cw.date,
              weight: cw.weight,
            });
          });
          prev.weightLog.forEach((lw) => {
            if (!cloudWeightMap.has(lw.date)) {
              cloudWeightMap.set(lw.date, lw);
            }
          });
          updates.weightLog = Array.from(cloudWeightMap.values());
        }

        const next = { ...prev, ...updates };
        saveState(next);
        return next;
      });
    } catch (e) {
      console.warn("Cloud sync failed (will retry later):", e);
    }
  }, [isLoggedIn]);

  // Auto-sync from cloud when user logs in
  useEffect(() => {
    if (isLoggedIn && !loading) {
      syncFromCloud();
    }
  }, [isLoggedIn, loading]);

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
    // Sync to cloud
    if (isLoggedIn) {
      try { upsertProfileMut.mutate({ subscription: tier }); } catch {}
    }
  }, [updateState, isLoggedIn]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setState((prev) => {
      const next = { ...prev, profile: { ...prev.profile, ...updates } };
      saveState(next);
      return next;
    });
    // Sync to cloud
    if (isLoggedIn) {
      try {
        const cloudUpdates: Record<string, any> = {};
        if (updates.name !== undefined) cloudUpdates.name = updates.name;
        if (updates.email !== undefined) cloudUpdates.email = updates.email;
        if (updates.targetWeight !== undefined) cloudUpdates.targetWeight = updates.targetWeight;
        if (updates.currentWeight !== undefined) cloudUpdates.currentWeight = updates.currentWeight;
        if (updates.calorieGoal !== undefined) cloudUpdates.calorieGoal = updates.calorieGoal;
        if (updates.proteinGoal !== undefined) cloudUpdates.proteinGoal = updates.proteinGoal;
        if (updates.carbsGoal !== undefined) cloudUpdates.carbsGoal = updates.carbsGoal;
        if (updates.fatGoal !== undefined) cloudUpdates.fatGoal = updates.fatGoal;
        if (updates.unit !== undefined) cloudUpdates.unit = updates.unit;
        if (updates.profilePhotoUri !== undefined) cloudUpdates.profilePhotoUri = updates.profilePhotoUri;
        if (Object.keys(cloudUpdates).length > 0) {
          upsertProfileMut.mutate(cloudUpdates);
        }
      } catch {}
    }
  }, [isLoggedIn]);

  const addMeal = useCallback(async (meal: MealEntry) => {
    setState((prev) => {
      const next = { ...prev, meals: [...prev.meals, meal] };
      saveState(next);
      return next;
    });
    // Sync to cloud
    if (isLoggedIn) {
      try {
        upsertMealMut.mutate({
          clientId: meal.id,
          date: meal.date,
          mealType: meal.mealType,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          anabolicScore: meal.anabolicScore,
          imageUri: meal.imageUri,
          isFavorite: meal.isFavorite ?? false,
        });
      } catch {}
    }
  }, [isLoggedIn]);

  const removeMeal = useCallback(async (id: string) => {
    setState((prev) => {
      const next = { ...prev, meals: prev.meals.filter((m) => m.id !== id) };
      saveState(next);
      return next;
    });
    // Sync to cloud
    if (isLoggedIn) {
      try { deleteMealMut.mutate({ clientId: id }); } catch {}
    }
  }, [isLoggedIn]);

  const toggleFavoriteMeal = useCallback(async (id: string) => {
    let newFavoriteState = false;
    setState((prev) => {
      const next = {
        ...prev,
        meals: prev.meals.map((m) => {
          if (m.id === id) {
            newFavoriteState = !m.isFavorite;
            return { ...m, isFavorite: !m.isFavorite };
          }
          return m;
        }),
      };
      saveState(next);
      return next;
    });
    // Sync to cloud
    if (isLoggedIn) {
      try { toggleFavMut.mutate({ clientId: id, isFavorite: newFavoriteState }); } catch {}
    }
  }, [isLoggedIn]);

  const getFavoriteMeals = useCallback(() => {
    return stateRef.current.meals.filter((m) => m.isFavorite);
  }, [state.meals]);

  const addWeight = useCallback(async (entry: WeightEntry) => {
    setState((prev) => {
      const next = { ...prev, weightLog: [...prev.weightLog, entry] };
      saveState(next);
      return next;
    });
    // Sync to cloud
    if (isLoggedIn) {
      try { addWeightMut.mutate({ date: entry.date, weight: entry.weight }); } catch {}
    }
  }, [isLoggedIn]);

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

      // Tracking streak
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
    return stateRef.current.meals.filter((m) => m.date === today);
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
        syncFromCloud,
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
