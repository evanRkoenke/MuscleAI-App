import { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const { width: SW } = Dimensions.get("window");

// ─── Ring geometry ───
const RING_SIZE = Math.min(SW * 0.62, 260);
const RING_STROKE = 18;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

// ─── Brand palette ───
const ACCENT = "#FFFFFF";
const ACCENT_DIM = "#777777";
const SILVER = "#C0C0C0";
const PROT = "#E0E0E0";
const CARB = "#B0B0B0";
const FATR = "#FF3D3D";
const BG = "#000000";
const SURF = "#0A0A0A";
const SURF2 = "#111111";
const BDR = "#222222";
const T1 = "#F0F0F0";
const T2 = "#888888";
const T3 = "#444444";

function scoreColor(s: number) {
  return s >= 80 ? "#C0C0C0" : s >= 60 ? "#B0B0B0" : "#FF3D3D";
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, getTodayCalories, getTodayMacros, getTodayMeals } = useApp();

  const cal = getTodayCalories();
  const mac = getTodayMacros();
  const rem = Math.max(0, profile.calorieGoal - cal);
  const prog = Math.min(1, cal / profile.calorieGoal);
  const dashOff = RING_C * (1 - prog * 0.75); // max 270° sweep

  const meals = getTodayMeals();
  const last = meals.length > 0 ? meals[meals.length - 1] : null;

  const doScan = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (router as any).push("/scan-meal");
  }, [router]);

  return (
    <ScreenContainer containerClassName="bg-transparent">
      {/* Full-screen dark background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[BG, "#000000", BG]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <View style={s.hdr}>
          <TouchableOpacity
            onPress={() => (router as any).push("/profile")}
            style={s.hdrAvatar}
            activeOpacity={0.7}
          >
            {profile.profilePhotoUri ? (
              <Image source={{ uri: profile.profilePhotoUri }} style={s.hdrAvatarImg} />
            ) : (
              <LinearGradient
                colors={[ACCENT, SILVER]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.hdrAvatarFallback}
              >
                <Text style={s.hdrAvatarText}>
                  {(profile.name || "M").charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
          <Text style={s.hdrTitle}>MUSCLE AI</Text>
          <TouchableOpacity
            onPress={() => (router as any).push("/settings")}
            style={s.hdrGear}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={20} color={T3} />
          </TouchableOpacity>
        </View>

        {/* ═══ CALORIE RING ═══ */}
        <View style={s.ringWrap}>
          {/* Multi-layer glow */}
          <View style={s.glow1} />
          <View style={s.glow2} />
          <View style={s.glow3} />

          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={"#777777"} />
                <Stop offset="0.4" stopColor={ACCENT} />
                <Stop offset="1" stopColor={SILVER} />
              </SvgGradient>
            </Defs>
            {/* Track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#1A1A1A"
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            {/* Progress arc */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="url(#rg)"
              strokeWidth={RING_STROKE}
              fill="transparent"
              strokeDasharray={RING_C}
              strokeDashoffset={dashOff}
              strokeLinecap="round"
              rotation="-225"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>

          {/* Center text */}
          <View style={s.ringCenter}>
            <Text style={s.ringNum}>{rem.toLocaleString()}</Text>
            <Text style={s.ringLabel}>Calories Remaining</Text>
          </View>
        </View>

        {/* ═══ MACRO ROW ═══ */}
        <View style={s.macRow}>
          {[
            { val: mac.protein, unit: "g", label: "PROTEIN", color: PROT },
            { val: mac.carbs, unit: "g", label: "CARBS", color: CARB },
            { val: mac.fat, unit: "g", label: "FAT", color: FATR },
            { val: mac.sugar, unit: "g", label: "SUGAR", color: "#A0A0A0" },
          ].map((m) => (
            <View key={m.label} style={s.macCard}>
              <Text style={s.macVal}>
                {m.val}
                <Text style={s.macUnit}>{m.unit}</Text>
              </Text>
              <Text style={[s.macLbl, { color: m.color }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <View style={s.qRow}>
          <TouchableOpacity style={s.qBtn} onPress={doScan} activeOpacity={0.7}>
            <IconSymbol name="camera.fill" size={15} color={ACCENT} />
            <Text style={s.qTxt}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.qBtn}
            onPress={() => router.push("/(tabs)/meals")}
            activeOpacity={0.7}
          >
            <IconSymbol name="fork.knife" size={15} color={ACCENT} />
            <Text style={s.qTxt}>Meals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.qBtn}
            onPress={() => router.push("/(tabs)/forecast")}
            activeOpacity={0.7}
          >
            <IconSymbol name="chart.line.uptrend.xyaxis" size={15} color={ACCENT} />
            <Text style={s.qTxt}>Forecast</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ PROTEIN PRIORITY ═══ */}
        <View style={s.ppCard}>
          <Text style={s.ppHdr}>PROTEIN PRIORITY</Text>
          {last ? (
            <View style={s.ppBody}>
              <View style={s.ppLeft}>
                <Text style={s.ppName} numberOfLines={1}>{last.name}</Text>
                <Text style={s.ppDetail}>{last.calories} cal · {last.protein}g protein</Text>
              </View>
              <View style={[s.ppBadge, { backgroundColor: scoreColor(last.anabolicScore) + "18", borderColor: scoreColor(last.anabolicScore) + "40" }]}>
                <Text style={[s.ppScore, { color: scoreColor(last.anabolicScore) }]}>{last.anabolicScore}</Text>
                <Text style={[s.ppScoreLbl, { color: scoreColor(last.anabolicScore) }]}>ANABOLIC{"\n"}SCORE</Text>
              </View>
            </View>
          ) : (
            <View style={s.ppEmpty}>
              <IconSymbol name="camera.fill" size={28} color={T3} />
              <Text style={s.ppEmptyTxt}>Scan your first meal to see your Anabolic Score</Text>
            </View>
          )}
        </View>

        {/* ═══ MUSCLE SUPPORT ═══ */}
        <TouchableOpacity
          style={s.supCard}
          onPress={() => (router as any).push("/support")}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["rgba(0,122,255,0.08)", "rgba(0,212,255,0.03)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <IconSymbol name="bubble.left.fill" size={22} color={ACCENT} />
          <View style={s.supInfo}>
            <Text style={s.supTitle}>Muscle Support</Text>
            <Text style={s.supSub}>AI-powered help, 24/7</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={T3} />
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ═══ FLOATING CAMERA FAB ═══ */}
      <TouchableOpacity style={s.fab} onPress={doScan} activeOpacity={0.8}>
        <View style={s.fabGlow} />
        <LinearGradient
          colors={[ACCENT, SILVER]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.fabInner}
        >
          <IconSymbol name="camera.fill" size={26} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },

  /* Header */
  hdr: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  hdrTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 5,
    color: T1,
    fontStyle: "italic",
  },
  hdrAvatar: { padding: 2 },
  hdrAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  hdrAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  hdrAvatarText: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  hdrGear: { padding: 8 },

  /* Ring */
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 4,
    width: RING_SIZE + 60,
    height: RING_SIZE + 60,
  },
  glow1: {
    position: "absolute",
    width: RING_SIZE + 50,
    height: RING_SIZE + 50,
    borderRadius: (RING_SIZE + 50) / 2,
    backgroundColor: "rgba(0,122,255,0.06)",
  },
  glow2: {
    position: "absolute",
    width: RING_SIZE + 30,
    height: RING_SIZE + 30,
    borderRadius: (RING_SIZE + 30) / 2,
    backgroundColor: "transparent",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 0,
  },
  glow3: {
    position: "absolute",
    width: RING_SIZE + 10,
    height: RING_SIZE + 10,
    borderRadius: (RING_SIZE + 10) / 2,
    backgroundColor: "transparent",
    shadowColor: SILVER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 0,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  ringNum: {
    fontSize: 50,
    fontWeight: "900",
    color: T1,
    letterSpacing: -2,
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: T2,
    marginTop: 2,
  },

  /* Macros */
  macRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  macCard: {
    flex: 1,
    backgroundColor: SURF2,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BDR,
    gap: 5,
  },
  macVal: {
    fontSize: 28,
    fontWeight: "900",
    color: T1,
  },
  macUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: T2,
  },
  macLbl: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  /* Quick actions */
  qRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  qBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
  },
  qTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: T1,
  },

  /* Protein Priority */
  ppCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF2,
    marginBottom: 12,
  },
  ppHdr: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.5,
    color: T1,
    marginBottom: 14,
  },
  ppBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ppLeft: { flex: 1, gap: 4 },
  ppName: { fontSize: 17, fontWeight: "700", color: T1 },
  ppDetail: { fontSize: 14, color: T2 },
  ppBadge: {
    width: 76,
    height: 76,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  ppScore: { fontSize: 30, fontWeight: "900" },
  ppScoreLbl: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 9,
    marginTop: 2,
  },
  ppEmpty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  ppEmptyTxt: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: T3,
  },

  /* Muscle Support */
  supCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF2,
    gap: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  supInfo: { flex: 1 },
  supTitle: { fontSize: 16, fontWeight: "700", color: T1 },
  supSub: { fontSize: 13, marginTop: 2, color: T2 },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  fabGlow: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ACCENT,
    opacity: 0.25,
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
});
