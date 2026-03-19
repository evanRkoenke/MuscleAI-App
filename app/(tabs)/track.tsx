import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Polyline, Circle as SvgCircle, Line, Text as SvgText } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const CHART_WIDTH = 320;
const CHART_HEIGHT = 180;
const CHART_PADDING = 40;

type TimeRange = "1M" | "3M" | "6M" | "1Y";

export default function TrackScreen() {
  const colors = useColors();
  const router = useRouter();
  const { weightLog, addWeight, profile, updateProfile } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");
  const [showLogModal, setShowLogModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const filteredData = useMemo(() => {
    const now = new Date();
    const rangeMap: Record<TimeRange, number> = {
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
    };
    const days = rangeMap[timeRange];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return weightLog
      .filter((e) => new Date(e.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weightLog, timeRange]);

  const chartPoints = useMemo(() => {
    if (filteredData.length < 2) return "";
    const weights = filteredData.map((d) => d.weight);
    const minW = Math.min(...weights) - 2;
    const maxW = Math.max(...weights) + 2;
    const range = maxW - minW || 1;

    return filteredData
      .map((d, i) => {
        const x = CHART_PADDING + (i / (filteredData.length - 1)) * (CHART_WIDTH - CHART_PADDING * 2);
        const y = CHART_HEIGHT - CHART_PADDING - ((d.weight - minW) / range) * (CHART_HEIGHT - CHART_PADDING * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [filteredData]);

  const latestWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : profile.currentWeight;

  const handleLogWeight = useCallback(async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const today = new Date().toISOString().split("T")[0];
    await addWeight({
      id: Date.now().toString(),
      date: today,
      weight,
    });
    await updateProfile({ currentWeight: weight });
    setNewWeight("");
    setShowLogModal(false);
  }, [newWeight, addWeight, updateProfile]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Track</Text>
          <TouchableOpacity
            style={[styles.logButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowLogModal(true)}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.logButtonText}>Log Weight</Text>
          </TouchableOpacity>
        </View>

        {/* Current Weight */}
        <View style={[styles.weightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.weightValue, { color: colors.foreground }]}>
            {latestWeight}
            <Text style={[styles.weightUnit, { color: colors.muted }]}> {profile.unit}</Text>
          </Text>
          <Text style={[styles.weightLabel, { color: colors.muted }]}>Current Weight</Text>
          <View style={styles.weightTargetRow}>
            <Text style={[styles.weightTarget, { color: colors.primary }]}>
              Target: {profile.targetWeight} {profile.unit}
            </Text>
            <Text style={[styles.weightDiff, { color: latestWeight > profile.targetWeight ? colors.warning : colors.success }]}>
              {latestWeight > profile.targetWeight ? "+" : ""}
              {(latestWeight - profile.targetWeight).toFixed(1)} {profile.unit}
            </Text>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeRow}>
          {(["1M", "3M", "6M", "1Y"] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                {
                  backgroundColor: timeRange === range ? colors.primary + "20" : "transparent",
                  borderColor: timeRange === range ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setTimeRange(range)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  { color: timeRange === range ? colors.primary : colors.muted },
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {filteredData.length >= 2 ? (
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <Line
                  key={ratio}
                  x1={CHART_PADDING}
                  y1={CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2)}
                  x2={CHART_WIDTH - CHART_PADDING}
                  y2={CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2)}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              ))}
              <Polyline
                points={chartPoints}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <View style={styles.chartEmpty}>
              <IconSymbol name="chart.bar.fill" size={40} color={colors.muted} />
              <Text style={[styles.chartEmptyText, { color: colors.muted }]}>
                Log at least 2 weights to see your chart
              </Text>
            </View>
          )}
        </View>

        {/* Recent Entries */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Entries</Text>
        {weightLog.length > 0 ? (
          [...weightLog]
            .reverse()
            .slice(0, 10)
            .map((entry) => (
              <View
                key={entry.id}
                style={[styles.entryRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.entryDate, { color: colors.muted }]}>
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={[styles.entryWeight, { color: colors.foreground }]}>
                  {entry.weight} {profile.unit}
                </Text>
              </View>
            ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No weight entries yet. Tap "Log Weight" to start tracking.
          </Text>
        )}

        {/* Share Progress */}
        <TouchableOpacity
          style={[styles.shareButton, { borderColor: colors.primary }]}
          onPress={() => (router as any).push("/gains-card")}
          activeOpacity={0.7}
        >
          <IconSymbol name="square.and.arrow.up" size={20} color={colors.primary} />
          <Text style={[styles.shareButtonText, { color: colors.primary }]}>Share Progress</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal visible={showLogModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Weight</Text>
            <View style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.modalInputText, { color: colors.foreground }]}
                placeholder={`Weight (${profile.unit})`}
                placeholderTextColor={colors.muted}
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
                returnKeyType="done"
                autoFocus
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowLogModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleLogWeight}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
  },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  weightCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  weightValue: {
    fontSize: 48,
    fontWeight: "900",
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: "500",
  },
  weightLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  weightTargetRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  weightTarget: {
    fontSize: 14,
    fontWeight: "600",
  },
  weightDiff: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeRangeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chartCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: "center",
  },
  chartEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  chartEmptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  entryDate: {
    fontSize: 15,
  },
  entryWeight: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "center",
  },
  modalInputText: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
