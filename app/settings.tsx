import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { useSubscription } from "@/hooks/use-subscription";
import { CloudSyncUpsell } from "@/components/cloud-sync-upsell";
import { formatLastSync } from "@/lib/cloud-sync";
import { getPendingCount, formatQueueStatus } from "@/lib/offline-queue";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";
import { ProteinWidgetSmall, ProteinWidgetMedium } from "@/components/protein-widget";


const PRIMARY_WHITE = "#FFFFFF";

const TIER_LABELS: Record<string, string> = {
  none: "No Plan",
  monthly: "Monthly Essential ($9.99/mo)",
  annual: "Elite Annual ($59.99/yr)",
};

const TIER_COLORS: Record<string, string> = {
  none: "#444444",
  monthly: "#C0C0C0",
  annual: "#FFFFFF",
};

// Subscription management is handled through native App Store / Google Play

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile, subscription, updateProfile, setAuthenticated, setSubscription, syncToCloud, lastSyncTime } = useApp();
  const sub = useSubscription();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editCalories, setEditCalories] = useState(profile.calorieGoal.toString());
  const [editProtein, setEditProtein] = useState(profile.proteinGoal.toString());
  const [editCarbs, setEditCarbs] = useState(profile.carbsGoal.toString());
  const [editFat, setEditFat] = useState(profile.fatGoal.toString());
  const [editTargetWeight, setEditTargetWeight] = useState(profile.targetWeight.toString());
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [showSyncUpsell, setShowSyncUpsell] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  useEffect(() => {
    getPendingCount().then(setPendingQueueCount).catch(() => {});
  }, []);

  const handleSaveGoals = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updateProfile({
      calorieGoal: parseInt(editCalories) || 2500,
      proteinGoal: parseInt(editProtein) || 200,
      carbsGoal: parseInt(editCarbs) || 250,
      fatGoal: parseInt(editFat) || 80,
      targetWeight: parseInt(editTargetWeight) || 180,
    });
    setShowGoalModal(false);
  };

  const handleLogout = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await setAuthenticated(false);
    router.replace("/auth");
  };

  const handleManageSubscription = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!sub.isPaid) {
      // Free users go to paywall to subscribe via native IAP
      (router as any).push("/paywall?from=settings");
      return;
    }

    setManagingSubscription(true);
    try {
      if (Platform.OS === "ios") {
        // On iOS: open the native subscription management screen
        // This deep link opens Settings > Apple ID > Subscriptions
        const iosSubsUrl = "https://apps.apple.com/account/subscriptions";
        const canOpen = await Linking.canOpenURL(iosSubsUrl);
        if (canOpen) {
          await Linking.openURL(iosSubsUrl);
        } else {
          Alert.alert(
            "Manage Subscription",
            "Go to Settings > Apple ID > Subscriptions to manage your Muscle AI subscription.",
            [{ text: "OK" }]
          );
        }
      } else if (Platform.OS === "android") {
        // On Android: open Google Play subscription management
        const androidSubsUrl = "https://play.google.com/store/account/subscriptions";
        await Linking.openURL(androidSubsUrl);
      } else {
        // Web: subscriptions are managed through the native app
        Alert.alert(
          "Manage Subscription",
          "Subscriptions are managed through the App Store or Google Play Store. Please open the Muscle AI app on your device to manage your subscription.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Unable to open subscription management. Please try again or contact Muscle Support.",
        [
          { text: "Try Again", onPress: handleManageSubscription },
          { text: "Contact Support", onPress: () => (router as any).push("/support") },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: async () => {
            // Direct to native subscription management
            if (Platform.OS === "ios") {
              await Linking.openURL("https://apps.apple.com/account/subscriptions");
            } else if (Platform.OS === "android") {
              await Linking.openURL("https://play.google.com/store/account/subscriptions");
            } else {
              Alert.alert("Cancel Subscription", "Please manage your subscription through the App Store or Google Play Store on your device.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.left" size={24} color="#F0F0F0" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{profile.name || "Not set"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{profile.email || "Not set"}</Text>
          </View>
        </View>

        {/* Subscription Section */}
        <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current Plan</Text>
            <View style={styles.planBadge}>
              <View style={[styles.planDot, { backgroundColor: TIER_COLORS[subscription] }]} />
              <Text style={[styles.planText, { color: TIER_COLORS[subscription] }]}>
                {TIER_LABELS[subscription]}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={handleManageSubscription}
            activeOpacity={0.7}
            disabled={managingSubscription}
          >
            <Text style={styles.rowLabel}>
              {!sub.isPaid ? "Subscribe" : "Manage Subscription"}
            </Text>
            {managingSubscription ? (
              <ActivityIndicator size="small" color={"#FFFFFF"} />
            ) : (
              <IconSymbol name="chevron.right" size={18} color="#666666" />
            )}
          </TouchableOpacity>
          {/* Upgrade Plan — show for Essential and Pro users (not Elite, they're already at top tier) */}
          {subscription === "monthly" && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/paywall?from=settings" as any);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowLabel, { color: "#FFFFFF" }]}>Upgrade to Annual</Text>
                <View style={styles.upgradeBadge}>
                  <Text style={styles.upgradeBadgeText}>SAVE 50%</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
          {sub.isPaid && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                onPress={handleCancelSubscription}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowLabel, { color: "#FF3D3D" }]}>Cancel Subscription</Text>
                <IconSymbol name="chevron.right" size={18} color="#FF3D3D" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Cloud Sync */}
        <Text style={styles.sectionLabel}>CLOUD SYNC</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowValue}>
              {sub.isPaid ? "Active" : "Local Only"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Last Synced</Text>
            <Text style={styles.rowValue}>
              {formatLastSync(lastSyncTime)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Offline Queue</Text>
            <Text style={styles.rowValue}>{formatQueueStatus(pendingQueueCount)}</Text>
          </View>
          <View style={styles.divider} />
          {sub.isPaid ? (
            <TouchableOpacity
              style={styles.row}
              onPress={async () => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSyncing(true);
                const result = await syncToCloud();
                setIsSyncing(false);
                // Refresh pending count after sync
                getPendingCount().then(setPendingQueueCount).catch(() => {});
                Alert.alert(result.success ? "Synced" : "Sync Failed", result.message);
              }}
              activeOpacity={0.7}
              disabled={isSyncing}
            >
              <Text style={[styles.rowLabel, { color: "#FFFFFF" }]}>
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Text>
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol name="icloud.fill" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.row}
              onPress={() => setShowSyncUpsell(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { color: "#FFFFFF" }]}>Unlock Cloud Sync</Text>
              <IconSymbol name="lock.fill" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Nutrition Goals */}
        <Text style={styles.sectionLabel}>NUTRITION GOALS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily Calories</Text>
            <Text style={styles.rowValue}>{profile.calorieGoal}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Protein Goal</Text>
            <Text style={styles.rowValue}>{profile.proteinGoal}g</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Target Weight</Text>
            <Text style={styles.rowValue}>{profile.targetWeight} {profile.unit}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowGoalModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: "#FFFFFF" }]}>Edit Goals</Text>
            <IconSymbol name="chevron.right" size={18} color={"#FFFFFF"} />
          </TouchableOpacity>
        </View>

        {/* Widget Preview */}
        <Text style={styles.sectionLabel}>HOME SCREEN WIDGET</Text>
        <View style={styles.widgetPreviewContainer}>
          <Text style={styles.widgetPreviewLabel}>Add to your home screen for quick protein tracking</Text>
          <View style={styles.widgetRow}>
            <ProteinWidgetSmall
              proteinCurrent={profile.proteinGoal > 0 ? Math.round(profile.proteinGoal * 0.6) : 120}
              proteinGoal={profile.proteinGoal}
              caloriesCurrent={0}
              caloriesGoal={profile.calorieGoal}
            />
          </View>
          <Text style={styles.widgetHint}>Long press your home screen → tap + → search "Muscle AI"</Text>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={async () => {
              await updateProfile({ unit: profile.unit === "lbs" ? "kg" : "lbs" });
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Units</Text>
            <Text style={styles.rowValue}>
              {profile.unit === "lbs" ? "Pounds (lbs)" : "Kilograms (kg)"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => (router as any).push("/support")}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>AI Support Chat</Text>
            <IconSymbol name="chevron.right" size={18} color="#666666" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL("https://muscleai.app/privacy")}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={18} color="#666666" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL("https://muscleai.app/terms")}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <IconSymbol name="chevron.right" size={18} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Muscle AI v1.0.0</Text>
      </ScrollView>

      {/* Goal Edit Modal */}
      <Modal visible={showGoalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Goals</Text>

            {[
              { label: "Daily Calories", value: editCalories, setter: setEditCalories },
              { label: "Protein (g)", value: editProtein, setter: setEditProtein },
              { label: "Carbs (g)", value: editCarbs, setter: setEditCarbs },
              { label: "Fat (g)", value: editFat, setter: setEditFat },
              { label: `Target Weight (${profile.unit})`, value: editTargetWeight, setter: setEditTargetWeight },
            ].map((field) => (
              <View key={field.label} style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
              </View>
            ))}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowGoalModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveGoals}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cloud Sync Upsell Modal */}
      <CloudSyncUpsell
        visible={showSyncUpsell}
        onClose={() => setShowSyncUpsell(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    color: "#F0F0F0",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
    color: "#666666",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "400",
    color: "#F0F0F0",
  },
  rowValue: {
    fontSize: 15,
    color: "#888888",
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  planDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  planText: {
    fontSize: 14,
    fontWeight: "400",
  },
  divider: {
    height: 1,
    marginLeft: 16,
    backgroundColor: "#222222",
  },
  logoutButton: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: "#FF3D3D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FF3D3D",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 20,
    color: "#666666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    gap: 14,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#F0F0F0",
  },
  modalField: {
    gap: 6,
  },
  modalFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888888",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#000000",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 16,
    fontWeight: "600",
    color: "#F0F0F0",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222222",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888888",
  },
  modalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#444444",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  widgetPreviewContainer: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  widgetPreviewLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
  },
  widgetRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  widgetHint: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    color: "#444444",
    textAlign: "center",
    lineHeight: 16,
  },
  upgradeBadge: {
    backgroundColor: "#222222",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#333333",
  },
  upgradeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#FFFFFF",
  },
});
