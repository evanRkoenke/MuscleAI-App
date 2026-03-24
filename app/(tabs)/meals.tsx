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
    <View key={meal.id} style={styles.mealItem}>
      <View style={styles.mealInfo}>
        <View style={styles.mealNameRow}>
          <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
          {meal.isFavorite && (
            <IconSymbol name="star.fill" size={14} color="#B0B0B0" />
          )}
        </View>
        <Text style={styles.mealMacros}>
          P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g{meal.sugar > 0 ? ` · S: ${meal.sugar}g` : ""}
        </Text>
      </View>
      <View style={styles.mealActions}>
        <TouchableOpacity
          onPress={() => handleToggleFavorite(meal.id)}
          style={styles.actionButton}
          activeOpacity={0.6}
        >
          <IconSymbol
            name="star.fill"
            size={18}
            color={meal.isFavorite ? "#B0B0B0" : "#444444"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteMeal(meal.id, meal.name)}
          style={styles.actionButton}
          activeOpacity={0.6}
        >
          <IconSymbol name="trash.fill" size={18} color="#FF3D3D" />
        </TouchableOpacity>
        <View style={styles.mealCalContainer}>
          <Text style={styles.mealCalories}>{meal.calories}</Text>
          <Text style={styles.mealCalLabel}>cal</Text>
        </View>
      </View>
    </View>
  );

  const renderSection = ({ item }: { item: typeof mealSections[0] }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{item.icon}</Text>
        <Text style={styles.sectionTitle}>{item.label}</Text>
        <Text style={styles.sectionCalories}>
          {item.meals.reduce((sum, m) => sum + m.calories, 0)} cal
        </Text>
      </View>
      {item.meals.length > 0 ? (
        item.meals.map(renderMealItem)
      ) : (
        <TouchableOpacity
          style={styles.addMealButton}
          onPress={() => (router as any).push("/scan-meal")}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus" size={18} color={"#FFFFFF"} />
          <Text style={styles.addMealText}>Add {item.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFavoriteItem = ({ item: meal }: { item: any }) => (
    <View style={styles.section}>
      {renderMealItem(meal)}
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === "meals" ? `${dateLabel}'s Meals` : "Favorite Meals"}
        </Text>
        <Text style={styles.headerDate}>
          {activeTab === "meals"
            ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })
            : `${favoriteMeals.length} saved`}
        </Text>
      </View>

      {/* Week Strip for date selection */}
      {activeTab === "meals" && (
        <View style={styles.weekStripWrap}>
          <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </View>
      )}

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "meals" && styles.tabActive]}
          onPress={() => setActiveTab("meals")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "meals" && styles.tabTextActive]}>
            {dateLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.tabActive]}
          onPress={() => setActiveTab("favorites")}
          activeOpacity={0.7}
        >
          <IconSymbol name="star.fill" size={14} color={activeTab === "favorites" ? "#FFFFFF" : "#666666"} />
          <Text style={[styles.tabText, activeTab === "favorites" && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "meals" ? (
        <>
          {/* Daily Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{dateCalories}</Text>
              <Text style={styles.summaryLabel}>Eaten</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: "#FFFFFF" }]}>
                {Math.max(0, profile.calorieGoal - dateCalories)}
              </Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{profile.calorieGoal}</Text>
              <Text style={styles.summaryLabel}>Goal</Text>
            </View>
          </View>

          {/* Sugar Tracker */}
          {dateMacros.sugar > 0 && (
            <View style={styles.sugarBanner}>
              <Text style={styles.sugarLabel}>Sugar {dateLabel}</Text>
              <Text style={styles.sugarValue}>{dateMacros.sugar}g</Text>
            </View>
          )}

          <FlatList
            data={mealSections}
            renderItem={renderSection}
            keyExtractor={(item) => item.type}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <FlatList
          data={favoriteMeals}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="star.fill" size={48} color="#222222" />
              <Text style={styles.emptyTitle}>No Favorites Yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the star icon on any meal to save it as a favorite
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#F0F0F0" },
  headerDate: { fontSize: 14, marginTop: 4, color: "#666666" },

  weekStripWrap: { paddingHorizontal: 20, marginBottom: 4 },

  // Tab switcher
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: "rgba(0,122,255,0.12)" },
  tabText: { fontSize: 14, fontWeight: "700", color: "#666666" },
  tabTextActive: { color: "#FFFFFF" },

  // Summary
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    marginBottom: 12,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "900", color: "#F0F0F0" },
  summaryLabel: { fontSize: 12, marginTop: 4, fontWeight: "600", color: "#666666" },
  summaryDivider: { width: 1, height: "100%", backgroundColor: "#222222" },

  // Sugar banner
  sugarBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(192,132,252,0.08)",
    borderWidth: 1,
    borderColor: "rgba(192,132,252,0.2)",
  },
  sugarLabel: { fontSize: 13, fontWeight: "700", color: "#A0A0A0" },
  sugarValue: { fontSize: 16, fontWeight: "900", color: "#A0A0A0" },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  section: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", flex: 1, color: "#F0F0F0" },
  sectionCalories: { fontSize: 14, fontWeight: "600", color: "#666666" },

  // Meal item
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#222222",
  },
  mealInfo: { flex: 1, gap: 2, marginRight: 8 },
  mealNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mealName: { fontSize: 15, fontWeight: "600", color: "#F0F0F0", flexShrink: 1 },
  mealMacros: { fontSize: 12, color: "#888888" },
  mealActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  mealCalContainer: { alignItems: "flex-end", marginLeft: 4 },
  mealCalories: { fontSize: 18, fontWeight: "800", color: "#F0F0F0" },
  mealCalLabel: { fontSize: 11, color: "#666666" },

  // Add meal
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#222222",
  },
  addMealText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#F0F0F0" },
  emptySubtext: { fontSize: 14, color: "#666666", textAlign: "center", maxWidth: 260 },
});
