import { useEffect, useMemo, useCallback, useState } from "react";
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
  TextInput,
  Modal,
  Image,
  Linking,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import type { GainsCardEntry, PersonalRecord } from "@/lib/app-context";
import { useSubscription } from "@/hooks/use-subscription";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";


const PRIMARY_WHITE = "#F5F5F5";
const SILVER = "#C0C0C0";
const PROTEIN_LIGHT = "#E0E0E0";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";
const TEXT_PRIMARY = "#F5F5F5";
const TEXT_SECONDARY = "#888888";
const TEXT_TERTIARY = "#666666";
const SCREEN_W = Dimensions.get("window").width;
const CARD_W = (SCREEN_W - 60) / 2;

const PR_ICONS: Record<string, { icon: "flame.fill" | "bolt.fill" | "star.fill" | "heart.fill" | "chart.line.uptrend.xyaxis" | "scalemass.fill"; color: string }> = {
  protein: { icon: "bolt.fill", color: "#E0E0E0" },
  calories: { icon: "flame.fill", color: "#B0B0B0" },
  anabolic: { icon: "star.fill", color: "#FFFFFF" },
  streak: { icon: "heart.fill", color: "#FF4444" },
  weight_gain: { icon: "chart.line.uptrend.xyaxis", color: "#C0C0C0" },
  weight_loss: { icon: "scalemass.fill", color: "#D0D0D0" },
};

const TIER_LABELS: Record<string, string> = {
  free: "FREE",
  essential: "ESSENTIAL",
  pro: "PRO",
  elite: "ELITE",
};

const TIER_COLORS: Record<string, string> = {
  free: TEXT_TERTIARY,
  essential: "#C0C0C0",
  pro: "#B0B0B0",
  elite: "#FFFFFF",
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
    updateProfile,
    removeGainsCard,
  } = useApp();
  const sub = useSubscription();

  // ─── Edit Profile State ───
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [saving, setSaving] = useState(false);

  // Sync edit fields when profile changes
  useEffect(() => {
    setEditName(profile.name);
    setEditEmail(profile.email);
  }, [profile.name, profile.email]);

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

  // ─── Profile Photo Picker ───
  const handlePickPhoto = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert("Update Profile Photo", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Camera Permission Required",
              "Please allow camera access in your device settings to take a profile photo.",
              [{ text: "OK" }]
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            await updateProfile({ profilePhotoUri: result.assets[0].uri });
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            await updateProfile({ profilePhotoUri: result.assets[0].uri });
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
      },
      ...(profile.profilePhotoUri
        ? [
            {
              text: "Remove Photo",
              style: "destructive" as const,
              onPress: async () => {
                await updateProfile({ profilePhotoUri: "" });
              },
            },
          ]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  // ─── Save Profile Edits ───
  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: trimmedName, email: trimmedEmail });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setEditModalVisible(false);
    } catch {
      Alert.alert("Error", "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Payment Method Management ───
  const handleManagePayment = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!sub.canManagePayment) {
      Alert.alert(
        "No Active Subscription",
        "Subscribe to a plan first, then you can manage your payment method here.",
        [
          { text: "Subscribe", onPress: () => (router as any).push("/paywall") },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    if (Platform.OS === "ios") {
      // iOS: Apple manages payment methods through Apple ID settings
      Alert.alert(
        "Update Payment Method",
        "Your subscription is managed through your Apple ID. You can update your payment method in your Apple ID settings.",
        [
          {
            text: "Open Apple ID Settings",
            onPress: () => Linking.openURL("https://apps.apple.com/account/billing"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else if (Platform.OS === "android") {
      Alert.alert(
        "Update Payment Method",
        "Your subscription is managed through Google Play. You can update your payment method in Google Play settings.",
        [
          {
            text: "Open Google Play",
            onPress: () => Linking.openURL("https://play.google.com/store/paymentmethods"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      // Web: Stripe Customer Portal
      Alert.alert(
        "Update Payment Method",
        "You can update your payment method through the Stripe billing portal.",
        [
          {
            text: "Open Billing Portal",
            onPress: () => Linking.openURL("https://billing.stripe.com/p/login/test"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  // ─── Gains Card Handlers ───
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

  // ─── Render Helpers ───
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
            <Text style={[styles.galleryCardStatValue, { color: "#E0E0E0" }]}>{item.protein}g</Text>
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
            <IconSymbol name="square.and.arrow.up" size={14} color={"#FFFFFF"} />
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
    const prConfig = PR_ICONS[item.category] || { icon: "star.fill" as const, color: "#FFFFFF" };
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

  // ─── Avatar Component ───
  const ProfileAvatar = useMemo(() => {
    const initial = profile.name ? profile.name[0].toUpperCase() : "M";
    return (
      <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} style={styles.avatarTouchable}>
        {profile.profilePhotoUri ? (
          <Image source={{ uri: profile.profilePhotoUri }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={["#444444", "#333333"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarInitial}>{initial}</Text>
          </LinearGradient>
        )}
        {/* Camera badge */}
        <View style={styles.cameraBadge}>
          <IconSymbol name="camera.fill" size={12} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  }, [profile.profilePhotoUri, profile.name]);

  const ListHeader = useMemo(() => (
    <>
      {/* ─── PROFILE HEADER ─── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {ProfileAvatar}
          <View style={[styles.tierBadge, { borderColor: TIER_COLORS[subscription] || TEXT_TERTIARY }]}>
            <Text style={[styles.tierBadgeText, { color: TIER_COLORS[subscription] || TEXT_TERTIARY }]}>
              {TIER_LABELS[subscription] || "FREE"}
            </Text>
          </View>
        </View>
        <Text style={styles.profileName}>{profile.name || "Muscle AI User"}</Text>
        <Text style={styles.profileEmail}>{profile.email || "Tap Edit Profile to set up"}</Text>

        {/* Edit Profile & Payment Buttons */}
        <View style={styles.profileActions}>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.8}
          >
            <IconSymbol name="pencil" size={14} color={"#FFFFFF"} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentBtn, !sub.canManagePayment && { opacity: 0.4 }]}
            onPress={() => {
              if (!sub.canManagePayment) {
                Alert.alert(
                  "Premium Feature",
                  "Subscribe to a paid plan to manage your payment method.",
                  [
                    { text: "Upgrade", onPress: () => (router as any).push("/paywall") },
                    { text: "Cancel", style: "cancel" },
                  ]
                );
              } else {
                handleManagePayment();
              }
            }}
            activeOpacity={0.8}
          >
            <IconSymbol name={!sub.canManagePayment ? "lock.fill" : "creditcard.fill"} size={14} color={!sub.canManagePayment ? TEXT_TERTIARY : TEXT_PRIMARY} />
            <Text style={[styles.paymentBtnText, !sub.canManagePayment && { color: TEXT_TERTIARY }]}>{!sub.canManagePayment ? "Locked" : "Payment"}</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={[styles.statBoxValue, { color: "#E0E0E0" }]}>{stats.totalProtein}g</Text>
          <Text style={styles.statBoxLabel}>Total Protein</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: "#FFFFFF" }]}>{stats.avgAnabolic}</Text>
          <Text style={styles.statBoxLabel}>Avg Anabolic</Text>
        </View>
      </View>

      {/* ─── PERSONAL RECORDS ─── */}
      <View style={styles.sectionHeader}>
        <IconSymbol name="star.fill" size={18} color="#B0B0B0" />
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
        <IconSymbol name="bolt.fill" size={18} color={"#FFFFFF"} />
        <Text style={styles.sectionTitle}>GAINS CARDS</Text>
        <TouchableOpacity
          style={styles.createCardBtn}
          onPress={handleCreateCard}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus" size={16} color={"#FFFFFF"} />
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
              colors={["#444444", "#333333"]}
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
  ), [profile, subscription, stats, personalRecords, gainsCards.length, renderPR, ProfileAvatar]);

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

      {/* ─── EDIT PROFILE MODAL ─── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <IconSymbol name="xmark" size={20} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            {/* Avatar in modal */}
            <View style={styles.modalAvatarRow}>
              {ProfileAvatar}
            </View>

            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>NAME</Text>
              <TextInput
                style={styles.fieldInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={TEXT_TERTIARY}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              {!sub.canEditEmail ? (
                <TouchableOpacity
                  style={styles.lockedField}
                  onPress={() => {
                    Alert.alert(
                      "Premium Feature",
                      "Upgrade to a paid plan to edit your email address.",
                      [
                        { text: "Upgrade", onPress: () => { setEditModalVisible(false); (router as any).push("/paywall"); } },
                        { text: "Cancel", style: "cancel" },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="lock.fill" size={14} color={TEXT_TERTIARY} />
                  <Text style={styles.lockedFieldText}>
                    {editEmail || "Upgrade to edit email"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={styles.fieldInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={TEXT_TERTIARY}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveProfile}
                />
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              activeOpacity={0.8}
              disabled={saving}
            >
              <LinearGradient
                colors={["#444444", "#333333"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGrad}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Payment Method Section */}
            {!sub.canManagePayment ? (
              <TouchableOpacity
                style={[styles.paymentRow, { opacity: 0.5 }]}
                onPress={() => {
                  Alert.alert(
                    "Premium Feature",
                    "Subscribe to a paid plan to manage your payment method.",
                    [
                      { text: "Upgrade", onPress: () => { setEditModalVisible(false); (router as any).push("/paywall"); } },
                      { text: "Cancel", style: "cancel" },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={styles.paymentRowLeft}>
                  <IconSymbol name="lock.fill" size={20} color={TEXT_TERTIARY} />
                  <View>
                    <Text style={styles.paymentRowLabel}>Payment Method</Text>
                    <Text style={styles.paymentRowSub}>Upgrade to manage payment</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={16} color={TEXT_TERTIARY} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.paymentRow}
                onPress={handleManagePayment}
                activeOpacity={0.7}
              >
                <View style={styles.paymentRowLeft}>
                  <IconSymbol name="creditcard.fill" size={20} color={"#FFFFFF"} />
                  <View>
                    <Text style={styles.paymentRowLabel}>Payment Method</Text>
                    <Text style={styles.paymentRowSub}>
                      {`${TIER_LABELS[subscription]} plan active`}
                    </Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={16} color={TEXT_TERTIARY} />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontWeight: "600",
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
  avatarTouchable: {
    position: "relative",
  },
  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#444444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#121212",
  },
  tierBadge: {
    marginTop: -12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: "#121212",
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1.5,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  profileEmail: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  profileActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  paymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  paymentBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
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
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: "400",
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
    fontWeight: "400",
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
    borderColor: "#FFFFFF",
  },
  createCardText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#FFFFFF",
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
    fontWeight: "400",
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
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  prUnit: {
    fontSize: 11,
    fontWeight: "400",
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
    fontWeight: "400",
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
    fontWeight: "400",
    color: TEXT_SECONDARY,
  },
  galleryCardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  galleryCardBadgeText: {
    fontSize: 9,
    fontWeight: "400",
    letterSpacing: 1,
  },
  galleryCardWeight: {
    fontSize: 26,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  galleryCardUnit: {
    fontSize: 14,
    fontWeight: "400",
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
    fontWeight: "400",
    color: TEXT_PRIMARY,
  },
  galleryCardStatLabel: {
    fontSize: 8,
    fontWeight: "400",
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
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  galleryCardAnabolicValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
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

  /* Edit Profile Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SURFACE,
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarRow: {
    alignItems: "center",
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 1.5,
    color: TEXT_SECONDARY,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  lockedField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    opacity: 0.5,
  },
  lockedFieldText: {
    fontSize: 16,
    color: TEXT_TERTIARY,
  },
  saveBtn: {
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 20,
  },
  saveGrad: {
    height: 50,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  paymentRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentRowLabel: {
    fontSize: 15,
    fontWeight: "400",
    color: TEXT_PRIMARY,
  },
  paymentRowSub: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
});
