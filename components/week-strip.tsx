import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_WIDTH = 44;
const DAY_GAP = 8;

interface WeekStripProps {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
  /** Set of "YYYY-MM-DD" strings for dates that have at least one logged meal */
  datesWithMeals?: Set<string>;
}

function getWeekDates(): { date: string; dayName: string; dayNum: number; isToday: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // go back to Monday

  const days: { date: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
  const todayStr = today.toISOString().split("T")[0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      dayName: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

export { getWeekDates };

export function WeekStrip({ selectedDate, onSelectDate, datesWithMeals }: WeekStripProps) {
  const scrollRef = useRef<ScrollView>(null);
  const days = useMemo(() => getWeekDates(), []);

  // Scroll to selected day on mount
  useEffect(() => {
    const idx = days.findIndex((d) => d.date === selectedDate);
    if (idx >= 0 && scrollRef.current) {
      const offset = Math.max(0, idx * (DAY_WIDTH + DAY_GAP) - 60);
      scrollRef.current.scrollTo({ x: offset, animated: false });
    }
  }, []);

  const handleSelect = (date: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectDate(date);
  };

  // Determine the month/year label from the selected date
  const selDate = new Date(selectedDate + "T12:00:00");
  const monthLabel = selDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          const hasMeals = datesWithMeals?.has(day.date) ?? false;

          return (
            <TouchableOpacity
              key={day.date}
              onPress={() => handleSelect(day.date)}
              activeOpacity={0.6}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayNameSelected,
                ]}
              >
                {day.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  isSelected && styles.dayNumSelected,
                ]}
              >
                {day.dayNum}
              </Text>
              {/* Anabolic Dot — only shows if meals logged for this date */}
              <View style={styles.dotContainer}>
                {hasMeals ? (
                  <View
                    style={[
                      styles.anabolicDot,
                      isSelected && styles.anabolicDotSelected,
                    ]}
                  />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  monthLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  scrollContent: {
    flexDirection: "row",
    gap: DAY_GAP,
    paddingRight: 16,
  },
  // ─── No background box — transparent cell ───
  dayCell: {
    width: DAY_WIDTH,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    gap: 2,
  },
  // ─── Selected day: white pill with black text ───
  dayCellSelected: {
    backgroundColor: "#FFFFFF",
  },
  dayName: {
    fontFamily: Typography.fontFamily,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "rgba(255, 255, 255, 0.45)",
  },
  dayNameSelected: {
    color: "#000000",
    fontWeight: "700",
  },
  dayNum: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
  },
  dayNumSelected: {
    color: "#000000",
    fontWeight: "800",
  },
  // ─── Anabolic Dot: 4px indicator for days with meals ───
  dotContainer: {
    height: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  anabolicDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  anabolicDotSelected: {
    backgroundColor: "#000000",
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
  },
});
