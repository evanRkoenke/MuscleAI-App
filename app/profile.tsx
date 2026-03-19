import { useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Share,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import type { GainsCardEntry, PersonalRecord } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const ELECTRIC_BLUE = "#007AFF";
const CYAN_GLOW = "#00D4FF";
const PROTEIN_CYAN = "#00E5FF";
const SURFACE = "#111820";
const BORDER = "#1A2533";
const TEXT_PRIMARY = "#ECEDEE";
const TEXT_SECONDARY = "#7A8A99";
const TEXT_TERTIARY = "#5A6A7A";
const SCREEN_W = Dimensions.get("window").width;
const CARD_W = (SCREEN_W - 60) / 2;

const PR_ICONS: Record<string, { icon: "flame.fill" | "bolt.fill" | "star.fill" | "heart.fill" | "chart.line.uptrend.xyaxis" | "scalemass.fill"; color: string }> = {
  protein: { icon: "bolt.fill", color: PROTEIN_CYAN },
  calories: { icon: "flame.fill", color: "#FFB300" },
  anabolic: { icon: "star.fill", color: ELECTRIC_BLUE },
  streak: { icon: "heart.fill", color: "#FF6B6B" },
  weight_gain: { icon: "chart.line.uptrend.xyaxis", color: "#00E676" },
  weight_loss: { icon: "scalemass.fill", color: "#FF9800" },
};

const TIER_LABELS: Record<string, string> = {
  free: "FREE",
  essential: "ESSENTIAL",
  pro: "PRO",
  elite: "ELITE",
};

const TIER_COLORS: Record<string, string> = {
  free: TEXT_TERTIARY,
  essential: "#00E676",
  pro: "#FFB300",
  elite: ELECTRIC_BLUE,
};

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    subscription,
    weightLog,
    meals,
    gainsCards,
    personalRecords,
    updatePersonalRecords,
    removeGainsCard,
    getTodayCalories,
    getTodayMacros,
  } = useApp();

  // Recalculate personal records when screen mounts
  useEffect(() => {
    updatePersonalRecords();
  }, [meals.length, weightLog.length]);

  const stats = useMemo(() => {
    const totalMeals = meals.length;
    const uniqueDays = new Set(meals.map((m) => m.date)).size;
    const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
    const avgAnabolic =
      meals.length > 0
        ? Math.round(meals.reduce((s, m) => s + m.anabolicScore, 0) / meals.length)
        : 0;
    return { totalMeals, uniqueDays, totalProtein, avgAnabolic };
  }, [meals]);

  const handleShareCard = useCallback(async (card: GainsCardEntry) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await Share.share({
        message: `My Muscle AI Progress\n\nWeight: ${card.weight} ${profile.unit}\nProtein: ${card.protein}g\nCalories: ${card.calories}\nAnabolic Score: ${card.anabolicScore}/100\nDays Tracked: ${card.daysTracked}\n\n@muscleai.app`,
        title: "My Gains Card",
      });
    } catch {
      // silent
    }
  }, [profile.unit]);

  const handleDeleteCard = useCallback((id: string) => {
    Alert.alert(
      "Delete Gains Card",
      "Are you sure you want to remove this card from your gallery?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeGainsCard(id);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  }, [removeGainsCard]);

  const handleCreateCard = () => {
    (router as any).push("/gains-card");
  };

  const renderGainsCard = useCallback(({ item }: { item: GainsCardEntry }) => {
    const date = new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return (
      <View style={styles.galleryCard}>
        <LinearGradient
          colors={["rgba(0,122,255,0.06)", "rgba(0,212,255,0.02)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.galleryCardHeader}>
          <Text style={styles.galleryCardDate}>{date}</Text>
          <View style={[styles.galleryCardBadge, { backgroundColor: (TIER_COLORS[item.subscription] || TEXT_TERTIARY) + "20" }]}>
            <Text style={[styles.galleryCardBadgeText, { color: TIER_COLORS[item.subscription] || TEXT_TERTIARY }]}>
              {TIER_LABELS[item.subscription] || "FREE"}
            </Text>
          </View>
        </View>
        <Text style={styles.galleryCardWeight}>
          {item.weight}
          <Text style={styles.galleryCardUnit}> {profile.unit}</Text>
        </Text>
        <View style={styles.galleryCardStats}>
          <View style={styles.galleryCardStat}>
            <Text style={[styles.galleryCardStatValue, { color: PROTEIN_CYAN }]}>{item.protein}g</Text>
            <Text style={styles.galleryCardStatLabel}>PROTEIN</Text>
          </View>
          <View style={styles.galleryCardStat}>
            <Text style={styles.galleryCardStatValue}>{item.calories}</Text>
            <Text style={styles.galleryCardStatLabel}>CAL</Text>
          </View>
        </View>
        <View style={styles.galleryCardAnabolic}>
          <Text style={styles.galleryCardAnabolicLabel}>ANABOLIC</Text>
          <Text style={styles.galleryCardAnabolicValue}>{item.anabolicScore}</Text>
        </View>
        <View style={styles.galleryCardActions}>
          <TouchableOpacity
            style={styles.galleryCardActionBtn}
            onPress={() => handleShareCard(item)}
            activeOpacity={0.7}
          >
            <IconSymbol name="square.and.arrow.up" size={14} color={ELECTRIC_BLUE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.galleryCardActionBtn}
            onPress={() => handleDeleteCard(item.id)}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark" size={14} color="#FF3D3D" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [profile.unit, handleShareCard, handleDeleteCard]);

  const renderPR = useCallback(({ item }: { item: PersonalRecord }) => {
    const prConfig = PR_ICONS[item.category] || { icon: "star.fill" as const, color: ELECTRIC_BLUE };
    const date = new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return (
      <View style={styles.prRow}>
        <View style={[styles.prIconBg, { backgroundColor: prConfig.color + "18" }]}>
          <IconSymbol name={prConfig.icon} size={18} color={prConfig.color} />
        </View>
        <View style={styles.prInfo}>
          <Text style={styles.prLabel}>{item.label}</Text>
          <Text style={styles.prDate}>{date}</Text>
        </View>
        <View style={styles.prValueContainer}>
          <Text style={styles.prValue}>{item.value}</Text>
          <Text style={styles.prUnit}>{item.unit}</Text>
        </View>
      </View>
    );
  }, []);

  const ListHeader = useMemo(() => (
    <>
      {/* ─── PROFILE HEADER ─── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[ELECTRIC_BLUE, CYAN_GLOW]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarInitial}>
              {profile.name ? profile.name[0].toUpperCase() : "M"}
            </Text>
          </LinearGradient>
          <View style={[styles.tierBadge, { borderColor: TIER_COLORS[subscription] || TEXT_TERTIARY }]}>
            <Text style={[styles.tierBadgeText, { color: TIER_COLORS[subscription] || TEXT_TERTIARY }]}>
              {TIER_LABELS[subscription] || "FREE"}
            </Text>
          </View>
        </View>
        <Text style={styles.profileName}>{profile.name || "Muscle AI User"}</Text>
        <Text style={styles.profileEmail}>{profile.email || "Set up your profile in Settings"}</Text>
      </View>

      {/* ─── STATS SUMMARY ─── */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{stats.totalMeals}</Text>
          <Text style={styles.statBoxLabel}>Meals Tracked</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{stats.uniqueDays}</Text>
          <Text style={styles.statBoxLabel}>Active Days</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: PROTEIN_CYAN }]}>{stats.totalProtein}g</Text>
          <Text style={styles.statBoxLabel}>Total Protein</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: ELECTRIC_BLUE }]}>{stats.avgAnabolic}</Text>
          <Text style={styles.statBoxLabel}>Avg Anabolic</Text>
        </View>
      </View>

      {/* ─── PERSONAL RECORDS ─── */}
      <View style={styles.sectionHeader}>
        <IconSymbol name="star.fill" size={18} color="#FFB300" />
        <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
      </View>
      {personalRecords.length === 0 ? (
        <View style={styles.emptyCard}>
          <IconSymbol name="star.fill" size={32} color={TEXT_TERTIARY} />
          <Text style={styles.emptyText}>Start tracking meals to unlock your personal records</Text>
        </View>
      ) : (
        <View style={styles.prContainer}>
          {personalRecords.map((pr) => (
            <View key={pr.id}>
              {renderPR({ item: pr })}
            </View>
          ))}
        </View>
      )}

      {/* ─── GAINS CARDS GALLERY ─── */}
      <View style={styles.sectionHeader}>
        <IconSymbol name="bolt.fill" size={18} color={ELECTRIC_BLUE} />
        <Text style={styles.sectionTitle}>GAINS CARDS</Text>
        <TouchableOpacity
          style={styles.createCardBtn}
          onPress={handleCreateCard}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus" size={16} color={ELECTRIC_BLUE} />
          <Text style={styles.createCardText}>Create</Text>
        </TouchableOpacity>
      </View>
      {gainsCards.length === 0 && (
        <View style={styles.emptyCard}>
          <IconSymbol name="bolt.fill" size={32} color={TEXT_TERTIARY} />
          <Text style={styles.emptyText}>No Gains Cards yet. Create one to share your progress!</Text>
          <TouchableOpacity
            style={styles.emptyCreateBtn}
            onPress={handleCreateCard}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[ELECTRIC_BLUE, CYAN_GLOW]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyCreateGrad}
            >
              <Text style={styles.emptyCreateText}>Create Gains Card</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </>
  ), [profile, subscription, stats, personalRecords, gainsCards.length, renderPR]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.left" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => (router as any).push("/settings")}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="gearshape.fill" size={22} color={TEXT_SECONDARY} />
        </TouchableOpacity>
      </View>

      {/* ─── CONTENT ─── */}
      {gainsCards.length > 0 ? (
        <FlatList
          data={gainsCards}
          renderItem={renderGainsCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.galleryRow}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_PRIMARY,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Profile header */
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  tierBadge: {
    marginTop: -12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: "#0A0E14",
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT_PRIMARY,
  },
  profileEmail: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },

  /* Stats grid */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    minWidth: (SCREEN_W - 60) / 2 - 5,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: "900",
    color: TEXT_PRIMARY,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    color: TEXT_PRIMARY,
  },
  createCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ELECTRIC_BLUE,
  },
  createCardText: {
    fontSize: 13,
    fontWeight: "700",
    color: ELECTRIC_BLUE,
  },

  /* Personal Records */
  prContainer: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 20,
  },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  prIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  prInfo: {
    flex: 1,
    gap: 2,
  },
  prLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  prDate: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  prValueContainer: {
    alignItems: "flex-end",
  },
  prValue: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT_PRIMARY,
  },
  prUnit: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 28,
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: TEXT_SECONDARY,
  },
  emptyCreateBtn: {
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 4,
  },
  emptyCreateGrad: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  emptyCreateText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* Gains Cards Gallery */
  galleryRow: {
    gap: 10,
    marginBottom: 10,
  },
  galleryCard: {
    width: CARD_W,
    borderRadius: 16,
    padding: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    gap: 8,
  },
  galleryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  galleryCardDate: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  galleryCardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  galleryCardBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  galleryCardWeight: {
    fontSize: 26,
    fontWeight: "900",
    color: TEXT_PRIMARY,
  },
  galleryCardUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_SECONDARY,
  },
  galleryCardStats: {
    flexDirection: "row",
    gap: 12,
  },
  galleryCardStat: {
    gap: 2,
  },
  galleryCardStatValue: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT_PRIMARY,
  },
  galleryCardStatLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: TEXT_TERTIARY,
    letterSpacing: 1,
  },
  galleryCardAnabolic: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,122,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  galleryCardAnabolicLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: ELECTRIC_BLUE,
    letterSpacing: 1,
  },
  galleryCardAnabolicValue: {
    fontSize: 18,
    fontWeight: "900",
    color: ELECTRIC_BLUE,
  },
  galleryCardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  galleryCardActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
});
