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

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_WIDTH = 48;
const DAY_GAP = 6;

interface WeekStripProps {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
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

export function WeekStrip({ selectedDate, onSelectDate }: WeekStripProps) {
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
          return (
            <TouchableOpacity
              key={day.date}
              onPress={() => handleSelect(day.date)}
              activeOpacity={0.7}
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
              {day.isToday && (
                <View
                  style={[
                    styles.todayDot,
                    isSelected && styles.todayDotSelected,
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555555",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  scrollContent: {
    flexDirection: "row",
    gap: DAY_GAP,
  },
  dayCell: {
    width: DAY_WIDTH,
    height: 68,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    gap: 4,
  },
  dayCellSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  dayName: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#666666",
  },
  dayNameSelected: {
    color: "#000000",
  },
  dayNum: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F0F0F0",
  },
  dayNumSelected: {
    color: "#000000",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555555",
  },
  todayDotSelected: {
    backgroundColor: "#000000",
  },
});
