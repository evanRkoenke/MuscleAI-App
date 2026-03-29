/**
 * Muscle AI — AI Coach Insight Box
 *
 * Appears below every scan result to explain why a meal got its Anabolic Score.
 * Uses local logic to generate the insight (no server call needed).
 */

import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Typography } from "@/constants/typography";

interface FoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  confidence: number;
}

interface AICoachInsightProps {
  anabolicScore: number;
  totalProtein: number;
  totalCalories: number;
  totalCarbs: number;
  totalFat: number;
  totalSugar: number;
  foods: FoodItem[];
  mealName: string;
}

function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 85) return { grade: "ELITE", color: "#FFFFFF" };
  if (score >= 70) return { grade: "STRONG", color: "#C0C0C0" };
  if (score >= 50) return { grade: "MODERATE", color: "#B0B0B0" };
  return { grade: "LOW", color: "#FF4444" };
}

function generateInsight(props: AICoachInsightProps): string {
  const { anabolicScore, totalProtein, totalCalories, totalCarbs, totalFat, totalSugar, foods } = props;

  const proteinRatio = totalCalories > 0 ? (totalProtein * 4) / totalCalories : 0;
  const proteinPercentage = Math.round(proteinRatio * 100);

  const parts: string[] = [];

  // Lead with the score context
  if (anabolicScore >= 85) {
    parts.push("Outstanding meal for muscle growth.");
  } else if (anabolicScore >= 70) {
    parts.push("Solid anabolic meal with good protein density.");
  } else if (anabolicScore >= 50) {
    parts.push("Decent meal, but there's room to optimize for hypertrophy.");
  } else {
    parts.push("This meal is low on the anabolic scale.");
  }

  // Protein analysis
  if (totalProtein >= 40) {
    parts.push(`${totalProtein}g protein (${proteinPercentage}% of calories) provides strong leucine stimulus for muscle protein synthesis.`);
  } else if (totalProtein >= 25) {
    parts.push(`${totalProtein}g protein (${proteinPercentage}% of calories) meets the minimum threshold for MPS activation.`);
  } else {
    parts.push(`Only ${totalProtein}g protein (${proteinPercentage}% of calories) — below the 25g threshold for optimal muscle protein synthesis. Consider adding a protein source.`);
  }

  // Protein source quality
  const highQualitySources = foods.filter(f => {
    const n = f.name.toLowerCase();
    return n.includes("chicken") || n.includes("beef") || n.includes("fish") || n.includes("salmon") ||
      n.includes("egg") || n.includes("turkey") || n.includes("whey") || n.includes("steak") ||
      n.includes("tuna") || n.includes("shrimp") || n.includes("greek yogurt");
  });

  if (highQualitySources.length > 0) {
    const names = highQualitySources.map(f => f.name).join(", ");
    parts.push(`${names} ${highQualitySources.length > 1 ? "are" : "is a"} high-quality complete protein source${highQualitySources.length > 1 ? "s" : ""} rich in leucine.`);
  }

  // Sugar warning
  if (totalSugar > 20) {
    parts.push(`Watch the sugar (${totalSugar}g) — excess sugar can spike insulin and promote fat storage over muscle gain.`);
  }

  // Fat balance
  if (totalFat > 30 && proteinRatio < 0.3) {
    parts.push("High fat content relative to protein may slow digestion. For post-workout, lean protein sources are preferred.");
  }

  // Actionable tip
  if (anabolicScore < 70) {
    if (totalProtein < 30) {
      parts.push("Tip: Add grilled chicken, eggs, or a protein shake to push this meal into the anabolic zone.");
    } else if (totalSugar > 15) {
      parts.push("Tip: Swap sugary sides for vegetables or complex carbs to improve the score.");
    } else {
      parts.push("Tip: Increase portion size of protein sources or add a side of Greek yogurt.");
    }
  }

  return parts.join(" ");
}

export function AICoachInsight(props: AICoachInsightProps) {
  const insight = useMemo(() => generateInsight(props), [
    props.anabolicScore, props.totalProtein, props.totalCalories,
    props.totalCarbs, props.totalFat, props.totalSugar, props.foods,
  ]);

  const { grade, color } = useMemo(() => getScoreGrade(props.anabolicScore), [props.anabolicScore]);

  return (
    <View style={st.container}>
      <LinearGradient
        colors={[color + "08", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={[st.iconCircle, { backgroundColor: color + "18" }]}>
            <IconSymbol name="bolt.fill" size={14} color={color} />
          </View>
          <Text style={st.headerTitle}>AI COACH</Text>
        </View>
        <View style={[st.gradeBadge, { backgroundColor: color + "15", borderColor: color + "30" }]}>
          <Text style={[st.gradeText, { color }]}>{grade}</Text>
        </View>
      </View>

      {/* Insight text */}
      <Text style={st.insightText}>{insight}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A1A1A",
    backgroundColor: "#1A1A1A",
    padding: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 11,
    fontWeight: "700",
    color: "#888888",
    letterSpacing: 2,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  insightText: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    fontWeight: "400",
    color: "#B0B0B0",
    lineHeight: 21,
  },
});
