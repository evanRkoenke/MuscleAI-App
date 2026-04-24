import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WeekStrip } from "@/components/week-strip";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};
const MEAL_ICONS: Record<string, string> = {
  breakfast: "☀️",
  lunch: "🌤️",
  dinner: "🌙",
  snack: "⚡",
};

// ─── Premium Dark + Anabolic Green ───
const GREEN = "#39FF14";
const GREEN_SUBTLE = "rgba(57, 255, 20, 0.08)";
const GREEN_BORDER = "rgba(57, 255, 20, 0.15)";
const BG = "#0A0A0A";
const SURF = "#141414";
const BDR = "#1E1E1E";
const T1 = "#F0F0F0";
const T2 = "#7A7A7A";
const T3 = "#444444";

type TabMode = "meals" | "favorites";

export default function MealsScreen() {
  const router = useRouter();
  const {
    getMealsByDate,
    getCaloriesByDate,
    getMacrosByDate,
    removeMeal,
    toggleFavoriteMeal,
    getFavoriteMeals,
    profile,
    selectedDate,
    setSelectedDate,
  } = useApp();
  const [activeTab, setActiveTab] = useState<TabMode>("meals");

  const dateMeals = useMemo(() => getMealsByDate(selectedDate), [getMealsByDate, selectedDate]);
  const dateCalories = useMemo(() => getCaloriesByDate(selectedDate), [getCaloriesByDate, selectedDate]);
  const dateMacros = useMemo(() => getMacrosByDate(selectedDate), [getMacrosByDate, selectedDate]);
  const favoriteMeals = getFavoriteMeals();

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const dateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    if (isToday) return "Today";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }, [selectedDate, isToday]);

  const mealSections = useMemo(() => {
    return MEAL_TYPES.map((type) => ({
      type,
      label: MEAL_LABELS[type],
      icon: MEAL_ICONS[type],
      meals: dateMeals.filter((m) => m.mealType === type),
    }));
  }, [dateMeals]);

  const handleDeleteMeal = useCallback(
    (id: string, name: string) => {
      if (Platform.OS === "web") {
        removeMeal(id);
      } else {
        Alert.alert("Remove Meal", `Are you sure you want to remove "${name}"?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              removeMeal(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]);
      }
    },
    [removeMeal]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavoriteMeal(id);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [toggleFavoriteMeal]
  );

  const renderMealItem = (meal: any) => (
    <View key={meal.id} style={st.mealItem}>
      <View style={st.mealInfo}>
        <View style={st.mealNameRow}>
          <Text style={st.mealName} numberOfLines={1}>{meal.name}</Text>
          {meal.isFavorite && (
            <IconSymbol name="star.fill" size={14} color={GREEN} />
          )}
        </View>
        <Text style={st.mealMacros}>
          P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g{meal.sugar > 0 ? ` · S: ${meal.sugar}g` : ""}
        </Text>
      </View>
      <View style={st.mealActions}>
        <TouchableOpacity
          onPress={() => handleToggleFavorite(meal.id)}
          style={st.actionButton}
          activeOpacity={0.6}
        >
          <IconSymbol
            name="star.fill"
            size={18}
            color={meal.isFavorite ? GREEN : T3}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteMeal(meal.id, meal.name)}
          style={st.actionButton}
          activeOpacity={0.6}
        >
          <IconSymbol name="trash.fill" size={18} color="#FF3B3B" />
        </TouchableOpacity>
        <View style={st.mealCalContainer}>
          <Text style={st.mealCalories}>{meal.calories}</Text>
          <Text style={st.mealCalLabel}>cal</Text>
        </View>
      </View>
    </View>
  );

  const renderSection = ({ item }: { item: typeof mealSections[0] }) => (
    <View style={st.section}>
      <View style={st.sectionHeader}>
        <Text style={st.sectionIcon}>{item.icon}</Text>
        <Text style={st.sectionTitle}>{item.label}</Text>
        <Text style={st.sectionCalories}>
          {item.meals.reduce((sum, m) => sum + m.calories, 0)} cal
        </Text>
      </View>
      {item.meals.length > 0 ? (
        item.meals.map(renderMealItem)
      ) : (
        <TouchableOpacity
          style={st.addMealButton}
          onPress={() => (router as any).push({ pathname: "/scan-meal", params: { category: item.type } })}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus" size={18} color={GREEN} />
          <Text style={st.addMealText}>Add {item.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFavoriteItem = ({ item: meal }: { item: any }) => (
    <View style={st.section}>
      {renderMealItem(meal)}
    </View>
  );

  const remaining = Math.max(0, profile.calorieGoal - dateCalories);

  return (
    <ScreenContainer>
      <View style={st.header}>
        <Text style={st.headerTitle}>
          {activeTab === "meals" ? `${dateLabel}\u2019s Meals` : "Favorite Meals"}
        </Text>
        <Text style={st.headerDate}>
          {activeTab === "meals"
            ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })
            : `${favoriteMeals.length} saved`}
        </Text>
      </View>

      {activeTab === "meals" && (
        <View style={st.weekStripWrap}>
          <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </View>
      )}

      {/* Tab Switcher */}
      <View style={st.tabRow}>
        <TouchableOpacity
          style={[st.tab, activeTab === "meals" && st.tabActive]}
          onPress={() => setActiveTab("meals")}
          activeOpacity={0.7}
        >
          <Text style={[st.tabText, activeTab === "meals" && st.tabTextActive]}>
            {dateLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.tab, activeTab === "favorites" && st.tabActive]}
          onPress={() => setActiveTab("favorites")}
          activeOpacity={0.7}
        >
          <IconSymbol name="star.fill" size={14} color={activeTab === "favorites" ? GREEN : T3} />
          <Text style={[st.tabText, activeTab === "favorites" && st.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "meals" ? (
        <>
          {/* Daily Summary */}
          <View style={st.summaryCard}>
            <View style={st.summaryItem}>
              <Text style={st.summaryValue}>{dateCalories}</Text>
              <Text style={st.summaryLabel}>Eaten</Text>
            </View>
            <View style={st.summaryDivider} />
            <View style={st.summaryItem}>
              <Text style={[st.summaryValue, { color: GREEN }]}>{remaining}</Text>
              <Text style={st.summaryLabel}>Remaining</Text>
            </View>
            <View style={st.summaryDivider} />
            <View style={st.summaryItem}>
              <Text style={st.summaryValue}>{profile.calorieGoal}</Text>
              <Text style={st.summaryLabel}>Goal</Text>
            </View>
          </View>

          {/* Sugar Tracker */}
          {dateMacros.sugar > 0 && (
            <View style={st.sugarBanner}>
              <Text style={st.sugarLabel}>Sugar {dateLabel}</Text>
              <Text style={st.sugarValue}>{dateMacros.sugar}g</Text>
            </View>
          )}

          <FlatList
            data={mealSections}
            renderItem={renderSection}
            keyExtractor={(item) => item.type}
            contentContainerStyle={st.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <FlatList
          data={favoriteMeals}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={st.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={st.emptyState}>
              <IconSymbol name="star.fill" size={48} color={T3} />
              <Text style={st.emptyTitle}>No Favorites Yet</Text>
              <Text style={st.emptySubtext}>
                Tap the star icon on any meal to save it as a favorite
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const st = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: T1 },
  headerDate: { fontSize: 14, marginTop: 4, color: T2 },

  weekStripWrap: { paddingHorizontal: 20, marginBottom: 4 },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: SURF,
    borderWidth: 1,
    borderColor: BDR,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabActive: { backgroundColor: GREEN_SUBTLE, borderWidth: 1, borderColor: GREEN_BORDER },
  tabText: { fontSize: 14, fontWeight: "500", color: T3 },
  tabTextActive: { color: T1 },

  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "700", color: T1 },
  summaryLabel: { fontSize: 12, marginTop: 4, fontWeight: "500", color: T2 },
  summaryDivider: { width: 1, height: "100%", backgroundColor: BDR },

  sugarBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255, 184, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 184, 0, 0.2)",
  },
  sugarLabel: { fontSize: 13, fontWeight: "500", color: "#FFB800" },
  sugarValue: { fontSize: 16, fontWeight: "700", color: "#FFB800" },

  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  section: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "600", flex: 1, color: T1 },
  sectionCalories: { fontSize: 14, fontWeight: "500", color: T2 },

  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BDR,
  },
  mealInfo: { flex: 1, gap: 2, marginRight: 8 },
  mealNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mealName: { fontSize: 15, fontWeight: "500", color: T1, flexShrink: 1 },
  mealMacros: { fontSize: 12, color: T2 },
  mealActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  mealCalContainer: { alignItems: "flex-end", marginLeft: 4 },
  mealCalories: { fontSize: 18, fontWeight: "700", color: T1 },
  mealCalLabel: { fontSize: 11, color: T2 },

  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BDR,
  },
  addMealText: { fontSize: 14, fontWeight: "600", color: GREEN },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: T1 },
  emptySubtext: { fontSize: 14, color: T2, textAlign: "center", maxWidth: 260 },
});
