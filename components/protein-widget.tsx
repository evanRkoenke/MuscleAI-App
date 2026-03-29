/**
 * Muscle AI — Protein Progress Widget Preview
 *
 * A sleek iOS-style widget preview component that shows daily protein progress.
 * This renders as an in-app preview of what the Home Screen widget looks like.
 *
 * The actual iOS widget would use WidgetKit + SwiftUI and read from
 * App Group shared storage (see lib/widget-data.ts).
 */

import { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Typography } from "@/constants/typography";

interface ProteinWidgetProps {
  proteinCurrent: number;
  proteinGoal: number;
  caloriesCurrent: number;
  caloriesGoal: number;
  lastMealName?: string;
  lastMealProtein?: number;
}

const RING_SIZE = 72;
const RING_STROKE = 6;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

export function ProteinWidgetSmall({ proteinCurrent, proteinGoal }: ProteinWidgetProps) {
  const progress = Math.min(1, proteinGoal > 0 ? proteinCurrent / proteinGoal : 0);
  const dashOffset = RING_C * (1 - progress);
  const remaining = Math.max(0, proteinGoal - proteinCurrent);

  return (
    <View style={st.smallWidget}>
      <View style={st.smallRingContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            stroke="#1A1A1A"
            strokeWidth={RING_STROKE}
            fill="transparent"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            stroke="#FFFFFF"
            strokeWidth={RING_STROKE}
            fill="transparent"
            strokeDasharray={RING_C}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={st.smallRingCenter}>
          <Text style={st.smallRingValue}>{proteinCurrent}</Text>
          <Text style={st.smallRingUnit}>g</Text>
        </View>
      </View>
      <Text style={st.smallLabel}>PROTEIN</Text>
      <Text style={st.smallRemaining}>{remaining}g left</Text>
    </View>
  );
}

export function ProteinWidgetMedium({
  proteinCurrent,
  proteinGoal,
  caloriesCurrent,
  caloriesGoal,
  lastMealName,
  lastMealProtein,
}: ProteinWidgetProps) {
  const proteinProgress = Math.min(1, proteinGoal > 0 ? proteinCurrent / proteinGoal : 0);
  const calorieProgress = Math.min(1, caloriesGoal > 0 ? caloriesCurrent / caloriesGoal : 0);
  const proteinDash = RING_C * (1 - proteinProgress);
  const proteinRemaining = Math.max(0, proteinGoal - proteinCurrent);

  return (
    <View style={st.medWidget}>
      <View style={st.medLeft}>
        {/* Protein Ring */}
        <View style={st.medRingContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#1A1A1A"
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#FFFFFF"
              strokeWidth={RING_STROKE}
              fill="transparent"
              strokeDasharray={RING_C}
              strokeDashoffset={proteinDash}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={st.smallRingCenter}>
            <Text style={st.smallRingValue}>{proteinCurrent}</Text>
            <Text style={st.smallRingUnit}>g</Text>
          </View>
        </View>
        <Text style={st.medProteinLabel}>PROTEIN</Text>
        <Text style={st.medProteinRemaining}>{proteinRemaining}g remaining</Text>
      </View>

      <View style={st.medRight}>
        {/* Calories bar */}
        <View style={st.medStatRow}>
          <Text style={st.medStatLabel}>Calories</Text>
          <Text style={st.medStatValue}>{caloriesCurrent}/{caloriesGoal}</Text>
        </View>
        <View style={st.medBarTrack}>
          <View style={[st.medBarFill, { width: `${calorieProgress * 100}%` as any }]} />
        </View>

        {/* Last meal */}
        {lastMealName ? (
          <View style={st.medLastMeal}>
            <Text style={st.medLastMealLabel}>LAST MEAL</Text>
            <Text style={st.medLastMealName} numberOfLines={1}>{lastMealName}</Text>
            <Text style={st.medLastMealProtein}>{lastMealProtein}g protein</Text>
          </View>
        ) : (
          <View style={st.medLastMeal}>
            <Text style={st.medLastMealLabel}>NO MEALS TODAY</Text>
            <Text style={st.medLastMealProtein}>Scan your first meal</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  // Small Widget (2x2)
  smallWidget: {
    width: 155,
    height: 155,
    borderRadius: 22,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 4,
  },
  smallRingContainer: { position: "relative", alignItems: "center", justifyContent: "center" },
  smallRingCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  smallRingValue: { fontFamily: Typography.fontFamilyBold, fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  smallRingUnit: { fontFamily: Typography.fontFamily, fontSize: 12, color: "#666666", marginTop: 4 },
  smallLabel: { fontFamily: Typography.fontFamily, fontSize: 10, fontWeight: "600", color: "#888888", letterSpacing: 2 },
  smallRemaining: { fontFamily: Typography.fontFamily, fontSize: 11, color: "#444444" },

  // Medium Widget (4x2)
  medWidget: {
    width: 320,
    height: 155,
    borderRadius: 22,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#1A1A1A",
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  medLeft: { alignItems: "center", justifyContent: "center", gap: 4 },
  medRingContainer: { position: "relative", alignItems: "center", justifyContent: "center" },
  medProteinLabel: { fontFamily: Typography.fontFamily, fontSize: 9, fontWeight: "600", color: "#888888", letterSpacing: 2 },
  medProteinRemaining: { fontFamily: Typography.fontFamily, fontSize: 11, color: "#444444" },
  medRight: { flex: 1, justifyContent: "center", gap: 10 },
  medStatRow: { flexDirection: "row", justifyContent: "space-between" },
  medStatLabel: { fontFamily: Typography.fontFamily, fontSize: 12, color: "#888888" },
  medStatValue: { fontFamily: Typography.fontFamily, fontSize: 12, color: "#F0F0F0" },
  medBarTrack: { height: 4, borderRadius: 2, backgroundColor: "#1A1A1A", overflow: "hidden" },
  medBarFill: { height: "100%", borderRadius: 2, backgroundColor: "#FFFFFF" },
  medLastMeal: { gap: 2 },
  medLastMealLabel: { fontFamily: Typography.fontFamily, fontSize: 9, color: "#444444", letterSpacing: 1.5 },
  medLastMealName: { fontFamily: Typography.fontFamily, fontSize: 13, fontWeight: "600", color: "#F0F0F0" },
  medLastMealProtein: { fontFamily: Typography.fontFamily, fontSize: 12, color: "#888888" },
});
