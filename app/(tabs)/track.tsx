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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Polyline, Line, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

// ─── Premium Dark + Anabolic Green ───
const GREEN = "#39FF14";
const GREEN_DIM = "#2BCC10";
const GREEN_SUBTLE = "rgba(57, 255, 20, 0.08)";
const GREEN_BORDER = "rgba(57, 255, 20, 0.15)";
const BG = "#0A0A0A";
const SURF = "#141414";
const BDR = "#1E1E1E";
const T1 = "#F0F0F0";
const T2 = "#7A7A7A";
const T3 = "#444444";

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

  const weightDiff = latestWeight - profile.targetWeight;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={st.header}>
          <Text style={st.headerTitle}>Track</Text>
          <TouchableOpacity
            style={st.logButton}
            onPress={() => setShowLogModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[GREEN, GREEN_DIM]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.logButtonGradient}
            >
              <IconSymbol name="plus" size={18} color={BG} />
              <Text style={st.logButtonText}>Log Weight</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Current Weight Card */}
        <View style={st.weightCard}>
          <Text style={st.weightValue}>
            {latestWeight}
            <Text style={st.weightUnit}> {profile.unit}</Text>
          </Text>
          <Text style={st.weightLabel}>Current Weight</Text>
          <View style={st.weightTargetRow}>
            <Text style={st.weightTarget}>
              Target: {profile.targetWeight} {profile.unit}
            </Text>
            <View style={[st.weightDiffPill, { backgroundColor: weightDiff > 0 ? "rgba(255, 59, 59, 0.12)" : "rgba(57, 255, 20, 0.12)" }]}>
              <Text
                style={[
                  st.weightDiff,
                  { color: weightDiff > 0 ? "#FF3B3B" : GREEN },
                ]}
              >
                {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)} {profile.unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={st.timeRangeRow}>
          {(["1M", "3M", "6M", "1Y"] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                st.timeRangeButton,
                timeRange === range && st.timeRangeActive,
              ]}
              onPress={() => setTimeRange(range)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  st.timeRangeText,
                  timeRange === range && st.timeRangeTextActive,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight Chart */}
        <View style={st.chartCard}>
          {filteredData.length >= 2 ? (
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <SvgGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={GREEN} />
                  <Stop offset="1" stopColor={GREEN_DIM} />
                </SvgGradient>
              </Defs>
              {[0.25, 0.5, 0.75].map((ratio) => (
                <Line
                  key={ratio}
                  x1={CHART_PADDING}
                  y1={CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2)}
                  x2={CHART_WIDTH - CHART_PADDING}
                  y2={CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2)}
                  stroke={BDR}
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
            <View style={st.chartEmpty}>
              <IconSymbol name="chart.bar.fill" size={40} color={T3} />
              <Text style={st.chartEmptyText}>
                Log at least 2 weights to see your chart
              </Text>
            </View>
          )}
        </View>

        {/* Recent Entries */}
        <Text style={st.sectionTitle}>Recent Entries</Text>
        {weightLog.length > 0 ? (
          [...weightLog]
            .reverse()
            .slice(0, 10)
            .map((entry) => (
              <View key={entry.id} style={st.entryRow}>
                <Text style={st.entryDate}>
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <View style={st.entryRight}>
                  <Text style={st.entryWeight}>
                    {entry.weight} {profile.unit}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteWeight(entry.id)}
                    style={st.deleteButton}
                    activeOpacity={0.6}
                  >
                    <IconSymbol name="trash.fill" size={16} color="#FF3B3B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
        ) : (
          <Text style={st.emptyText}>
            No weight entries yet. Tap &quot;Log Weight&quot; to start tracking.
          </Text>
        )}

        {/* Share Progress */}
        <TouchableOpacity
          style={st.shareButton}
          onPress={() => (router as any).push("/gains-card")}
          activeOpacity={0.7}
        >
          <IconSymbol name="square.and.arrow.up" size={20} color={GREEN} />
          <Text style={st.shareButtonText}>Share Progress</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal visible={showLogModal} transparent animationType="fade">
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <Text style={st.modalTitle}>Log Weight</Text>
            <View style={st.modalInputContainer}>
              <TextInput
                style={st.modalInputText}
                placeholder={`Weight (${profile.unit})`}
                placeholderTextColor={T3}
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
                returnKeyType="done"
                autoFocus
              />
            </View>
            <View style={st.modalButtons}>
              <TouchableOpacity
                style={st.modalCancelButton}
                onPress={() => setShowLogModal(false)}
                activeOpacity={0.7}
              >
                <Text style={st.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={st.modalSaveButton}
                onPress={handleLogWeight}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[GREEN, GREEN_DIM]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={st.modalSaveGrad}
                >
                  <Text style={st.modalSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const st = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", color: T1 },
  logButton: { borderRadius: 20, overflow: "hidden" },
  logButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logButtonText: { color: BG, fontSize: 14, fontWeight: "700" },
  weightCard: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  weightValue: { fontSize: 48, fontWeight: "800", color: T1 },
  weightUnit: { fontSize: 20, fontWeight: "600", color: T2 },
  weightLabel: { fontSize: 13, fontWeight: "500", color: T2, marginTop: 4 },
  weightTargetRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    alignItems: "center",
  },
  weightTarget: { fontSize: 14, fontWeight: "500", color: T2 },
  weightDiffPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  weightDiff: { fontSize: 14, fontWeight: "600" },
  timeRangeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BDR,
    alignItems: "center",
    backgroundColor: SURF,
  },
  timeRangeActive: {
    backgroundColor: GREEN_SUBTLE,
    borderColor: GREEN_BORDER,
  },
  timeRangeText: { fontSize: 13, fontWeight: "500", color: T3 },
  timeRangeTextActive: { color: GREEN },
  chartCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  chartEmpty: { alignItems: "center", paddingVertical: 30, gap: 10 },
  chartEmptyText: { fontSize: 14, color: T2, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: T1, marginBottom: 12 },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  entryDate: { fontSize: 15, color: T2 },
  entryWeight: { fontSize: 15, fontWeight: "600", color: T1 },
  entryRight: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12 },
  deleteButton: { padding: 6 },
  emptyText: { fontSize: 14, color: T2, textAlign: "center", paddingVertical: 20 },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_SUBTLE,
  },
  shareButtonText: { fontSize: 15, fontWeight: "600", color: GREEN },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 22,
    padding: 24,
    gap: 16,
    backgroundColor: SURF,
    borderWidth: 1,
    borderColor: BDR,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", textAlign: "center", color: T1 },
  modalInputContainer: {
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: BG,
    borderRadius: 14,
    overflow: "hidden",
  },
  modalInputText: {
    paddingHorizontal: 16,
    height: 52,
    fontSize: 20,
    fontWeight: "600",
    color: T1,
    textAlign: "center",
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BDR,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: { fontSize: 16, fontWeight: "600", color: T2 },
  modalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  modalSaveGrad: {
    flex: 1,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveText: { fontSize: 16, fontWeight: "700", color: BG },
});
