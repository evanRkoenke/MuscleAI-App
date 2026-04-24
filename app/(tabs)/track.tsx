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
import Svg, { Polyline, Line, Defs, LinearGradient as SvgGradient, Stop, Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { Typography } from "@/constants/typography";


const PRIMARY_WHITE = "#FFFFFF";
const SILVER = "#C0C0C0";
const CHART_WIDTH = 320;
const CHART_HEIGHT = 180;
const CHART_PADDING = 40;

type TimeRange = "1M" | "3M" | "6M" | "1Y";

export default function TrackScreen() {
  const router = useRouter();
  const { weightLog, addWeight, removeWeight, profile, updateProfile } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");
  const [showLogModal, setShowLogModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const filteredData = useMemo(() => {
    const now = new Date();
    const rangeMap: Record<TimeRange, number> = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
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

  const handleDeleteWeight = useCallback(async (id: string) => {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Delete Entry",
        "Are you sure you want to delete this weight entry?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await removeWeight(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    } else {
      await removeWeight(id);
    }
  }, [removeWeight]);

  const handleLogWeight = useCallback(async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const today = new Date().toISOString().split("T")[0];
    await addWeight({ id: Date.now().toString(), date: today, weight });
    await updateProfile({ currentWeight: weight });
    setNewWeight("");
    setShowLogModal(false);
  }, [newWeight, addWeight, updateProfile]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Track</Text>
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => setShowLogModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#444444", "#333333"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logButtonGradient}
            >
              <IconSymbol name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.logButtonText}>Log Weight</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Current Weight */}
        <View style={styles.weightCard}>
          <Text style={styles.weightValue}>
            {latestWeight}
            <Text style={styles.weightUnit}> {profile.unit}</Text>
          </Text>
          <Text style={styles.weightLabel}>Current Weight</Text>
          <View style={styles.weightTargetRow}>
            <Text style={styles.weightTarget}>
              Target: {profile.targetWeight} {profile.unit}
            </Text>
            <Text
              style={[
                styles.weightDiff,
                { color: latestWeight > profile.targetWeight ? "#B0B0B0" : "#C0C0C0" },
              ]}
            >
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
                timeRange === range && styles.timeRangeActive,
              ]}
              onPress={() => setTimeRange(range)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight Chart */}
        <View style={styles.chartCard}>
          {filteredData.length >= 2 ? (
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <SvgGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={"#FFFFFF"} />
                  <Stop offset="1" stopColor={"#C0C0C0"} />
                </SvgGradient>
              </Defs>
              {[0.25, 0.5, 0.75].map((ratio) => (
                <Line
                  key={ratio}
                  x1={CHART_PADDING}
                  y1={CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2)}
                  x2={CHART_WIDTH - CHART_PADDING}
                  y2={CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2)}
                  stroke="#222222"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              ))}
              <Polyline
                points={chartPoints}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <View style={styles.chartEmpty}>
              <IconSymbol name="chart.bar.fill" size={40} color="#666666" />
              <Text style={styles.chartEmptyText}>
                Log at least 2 weights to see your chart
              </Text>
            </View>
          )}
        </View>

        {/* Recent Entries */}
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {weightLog.length > 0 ? (
          [...weightLog]
            .reverse()
            .slice(0, 10)
            .map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <Text style={styles.entryDate}>
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <View style={styles.entryRight}>
                  <Text style={styles.entryWeight}>
                    {entry.weight} {profile.unit}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteWeight(entry.id)}
                    style={styles.deleteButton}
                    activeOpacity={0.6}
                  >
                    <IconSymbol name="trash.fill" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
        ) : (
          <Text style={styles.emptyText}>
            No weight entries yet. Tap "Log Weight" to start tracking.
          </Text>
        )}

        {/* Share Progress */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => (router as any).push("/gains-card")}
          activeOpacity={0.7}
        >
          <IconSymbol name="square.and.arrow.up" size={20} color={"#FFFFFF"} />
          <Text style={styles.shareButtonText}>Share Progress</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal visible={showLogModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInputText}
                placeholder={`Weight (${profile.unit})`}
                placeholderTextColor="#666666"
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
                returnKeyType="done"
                autoFocus
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleLogWeight}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#F0F0F0" },
  logButton: { borderRadius: 20, overflow: "hidden" },
  logButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  weightCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    alignItems: "center",
    marginBottom: 16,
  },
  weightValue: { fontSize: 48, fontWeight: "700", color: "#F0F0F0" },
  weightUnit: { fontSize: 20, fontWeight: "600", color: "#666666" },
  weightLabel: { fontSize: 13, fontWeight: "400", color: "#666666", marginTop: 4 },
  weightTargetRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    alignItems: "center",
  },
  weightTarget: { fontSize: 14, fontWeight: "400", color: "#FFFFFF" },
  weightDiff: { fontSize: 14, fontWeight: "400" },
  timeRangeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
  },
  timeRangeActive: {
    backgroundColor: "rgba(0,122,255,0.12)",
    borderColor: "#FFFFFF",
  },
  timeRangeText: { fontSize: 13, fontWeight: "400", color: "#666666" },
  timeRangeTextActive: { color: "#FFFFFF" },
  chartCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    alignItems: "center",
    marginBottom: 24,
  },
  chartEmpty: { alignItems: "center", paddingVertical: 30, gap: 10 },
  chartEmptyText: { fontSize: 14, color: "#666666", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#F0F0F0", marginBottom: 12 },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
  },
  entryDate: { fontSize: 15, color: "#888888" },
  entryWeight: { fontSize: 15, fontWeight: "400", color: "#F0F0F0" },
  entryRight: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12 },
  deleteButton: { padding: 6 },
  emptyText: { fontSize: 14, color: "#666666", textAlign: "center", paddingVertical: 20 },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  shareButtonText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
  },
  modalTitle: { fontSize: 20, fontWeight: "600", textAlign: "center", color: "#F0F0F0" },
  modalInputContainer: {
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#000000",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalInputText: {
    paddingHorizontal: 16,
    height: 52,
    fontSize: 20,
    fontWeight: "600",
    color: "#F0F0F0",
    textAlign: "center",
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222222",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: { fontSize: 16, fontWeight: "600", color: "#888888" },
  modalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#444444",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
