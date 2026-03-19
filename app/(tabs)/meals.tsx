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
import { useApp } from "@/lib/app-context";

const ELECTRIC_BLUE = "#007AFF";
const GOLD = "#FFD700";

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

type TabType = "today" | "favorites";

export default function MealsScreen() {
  const router = useRouter();
  const {
    getTodayMeals,
    getTodayCalories,
    getTodayMacros,
    removeMeal,
    toggleFavoriteMeal,
    getFavoriteMeals,
    profile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>("today");

  const todayMeals = getTodayMeals();
  const todayCalories = getTodayCalories();
  const todayMacros = getTodayMacros();
  const favoriteMeals = getFavoriteMeals();

  const mealSections = useMemo(() => {
    return MEAL_TYPES.map((type) => ({
      type,
      label: MEAL_LABELS[type],
      icon: MEAL_ICONS[type],
      meals: todayMeals.filter((m) => m.mealType === type),
    }));
  }, [todayMeals]);

  const handleDeleteMeal = useCallback(
    (id: string, name: string) => {
      if (Platform.OS === "web") {
        removeMeal(id);
      } else {
        Alert.alert(
          "Delete Meal",
          `Are you sure you want to delete "${name}"? This cannot be undone.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => removeMeal(id),
            },
          ]
        );
      }
    },
    [removeMeal]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavoriteMeal(id);
    },
    [toggleFavoriteMeal]
  );

  const renderMealItem = (meal: any, showDelete: boolean) => (
    <View key={meal.id} style={styles.mealItem}>
      {/* Favorite toggle */}
      <TouchableOpacity
        onPress={() => handleToggleFavorite(meal.id)}
        style={styles.favoriteButton}
        activeOpacity={0.6}
      >
        <IconSymbol
          name={meal.isFavorite ? "star.fill" : "star"}
          size={20}
          color={meal.isFavorite ? GOLD : "#3A4A5A"}
        />
      </TouchableOpacity>

      {/* Meal info */}
      <View style={styles.mealInfo}>
        <Text style={styles.mealName} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={styles.mealMacros}>
          P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
        </Text>
      </View>

      {/* Calories */}
      <View style={styles.mealRight}>
        <Text style={styles.mealCalories}>{meal.calories}</Text>
        <Text style={styles.mealCalLabel}>cal</Text>
      </View>

      {/* Delete button */}
      {showDelete && (
        <TouchableOpacity
          onPress={() => handleDeleteMeal(meal.id, meal.name)}
          style={styles.deleteButton}
          activeOpacity={0.6}
        >
          <IconSymbol name="trash" size={18} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSection = ({ item }: { item: (typeof mealSections)[0] }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{item.icon}</Text>
        <Text style={styles.sectionTitle}>{item.label}</Text>
        <Text style={styles.sectionCalories}>
          {item.meals.reduce((sum, m) => sum + m.calories, 0)} cal
        </Text>
      </View>
      {item.meals.length > 0 ? (
        item.meals.map((meal) => renderMealItem(meal, true))
      ) : (
        <TouchableOpacity
          style={styles.addMealButton}
          onPress={() => (router as any).push("/scan-meal")}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus" size={18} color={ELECTRIC_BLUE} />
          <Text style={styles.addMealText}>Add {item.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFavoriteItem = ({ item }: { item: any }) => (
    <View style={styles.section}>
      {renderMealItem(item, true)}
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meals</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "today" && styles.tabActive]}
          onPress={() => setActiveTab("today")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "today" && styles.tabTextActive,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.tabActive]}
          onPress={() => setActiveTab("favorites")}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="star.fill"
            size={14}
            color={activeTab === "favorites" ? GOLD : "#5A6A7A"}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "favorites" && styles.tabTextActive,
            ]}
          >
            Favorites ({favoriteMeals.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Daily Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{todayCalories}</Text>
          <Text style={styles.summaryLabel}>Eaten</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: ELECTRIC_BLUE }]}>
            {Math.max(0, profile.calorieGoal - todayCalories)}
          </Text>
          <Text style={styles.summaryLabel}>Remaining</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{profile.calorieGoal}</Text>
          <Text style={styles.summaryLabel}>Goal</Text>
        </View>
      </View>

      {activeTab === "today" ? (
        <FlatList
          data={mealSections}
          renderItem={renderSection}
          keyExtractor={(item) => item.type}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={favoriteMeals}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="star" size={48} color="#2A3A4A" />
              <Text style={styles.emptyTitle}>No Favorites Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the star icon on any meal to save it to your favorites for
                quick access.
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
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#ECEDEE" },
  headerDate: { fontSize: 14, marginTop: 4, color: "#5A6A7A" },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#111820",
    borderWidth: 1,
    borderColor: "#1A2533",
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#1A2533",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5A6A7A",
  },
  tabTextActive: {
    color: "#ECEDEE",
  },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
    marginBottom: 16,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "900", color: "#ECEDEE" },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
    color: "#5A6A7A",
  },
  summaryDivider: { width: 1, height: "100%", backgroundColor: "#1A2533" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  section: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 8,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", flex: 1, color: "#ECEDEE" },
  sectionCalories: { fontSize: 14, fontWeight: "600", color: "#5A6A7A" },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1A2533",
    gap: 10,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  mealInfo: { flex: 1, gap: 2 },
  mealName: { fontSize: 15, fontWeight: "600", color: "#ECEDEE" },
  mealMacros: { fontSize: 12, color: "#7A8A99" },
  mealRight: { alignItems: "flex-end", marginRight: 4 },
  mealCalories: { fontSize: 18, fontWeight: "800", color: "#ECEDEE" },
  mealCalLabel: { fontSize: 11, color: "#5A6A7A" },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#1A2533",
  },
  addMealText: { fontSize: 14, fontWeight: "600", color: ELECTRIC_BLUE },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ECEDEE",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#5A6A7A",
    textAlign: "center",
    lineHeight: 20,
  },
});
