import { useState, useCallback, useMemo } from "react";
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
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";

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

export default function MealsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { getTodayMeals, getTodayCalories, getTodayMacros, removeMeal, profile } = useApp();

  const todayMeals = getTodayMeals();
  const todayCalories = getTodayCalories();
  const todayMacros = getTodayMacros();

  const mealSections = useMemo(() => {
    return MEAL_TYPES.map((type) => ({
      type,
      label: MEAL_LABELS[type],
      icon: MEAL_ICONS[type],
      meals: todayMeals.filter((m) => m.mealType === type),
    }));
  }, [todayMeals]);

  const handleDeleteMeal = useCallback(
    (id: string) => {
      if (Platform.OS === "web") {
        removeMeal(id);
      } else {
        Alert.alert("Remove Meal", "Are you sure you want to remove this meal?", [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: () => removeMeal(id) },
        ]);
      }
    },
    [removeMeal]
  );

  const renderSection = ({ item }: { item: typeof mealSections[0] }) => (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{item.icon}</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{item.label}</Text>
        <Text style={[styles.sectionCalories, { color: colors.muted }]}>
          {item.meals.reduce((sum, m) => sum + m.calories, 0)} cal
        </Text>
      </View>
      {item.meals.length > 0 ? (
        item.meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={[styles.mealItem, { borderTopColor: colors.border }]}
            onLongPress={() => handleDeleteMeal(meal.id)}
            activeOpacity={0.7}
          >
            <View style={styles.mealInfo}>
              <Text style={[styles.mealName, { color: colors.foreground }]}>{meal.name}</Text>
              <Text style={[styles.mealMacros, { color: colors.muted }]}>
                P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
              </Text>
            </View>
            <View style={styles.mealRight}>
              <Text style={[styles.mealCalories, { color: colors.foreground }]}>
                {meal.calories}
              </Text>
              <Text style={[styles.mealCalLabel, { color: colors.muted }]}>cal</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <TouchableOpacity
          style={[styles.addMealButton, { borderTopColor: colors.border }]}
          onPress={() => (router as any).push("/scan-meal")}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus" size={18} color={colors.primary} />
          <Text style={[styles.addMealText, { color: colors.primary }]}>Add {item.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Today's Meals</Text>
        <Text style={[styles.headerDate, { color: colors.muted }]}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Daily Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{todayCalories}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Eaten</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            {Math.max(0, profile.calorieGoal - todayCalories)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Remaining</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{profile.calorieGoal}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Goal</Text>
        </View>
      </View>

      <FlatList
        data={mealSections}
        renderItem={renderSection}
        keyExtractor={(item) => item.type}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
  },
  headerDate: {
    fontSize: 14,
    marginTop: 4,
  },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    height: "100%",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  section: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  sectionCalories: {
    fontSize: 14,
    fontWeight: "500",
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  mealInfo: {
    flex: 1,
    gap: 2,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "600",
  },
  mealMacros: {
    fontSize: 12,
  },
  mealRight: {
    alignItems: "flex-end",
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: "700",
  },
  mealCalLabel: {
    fontSize: 11,
  },
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  addMealText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
