import { useState } from "react";
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
import * as Haptics from "expo-haptics";

const ELECTRIC_BLUE = "#007AFF";

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  essential: "Essential ($9.99/mo)",
  pro: "Pro ($19.99/mo)",
  elite: "Elite Annual ($79.99/yr)",
};

const TIER_COLORS: Record<string, string> = {
  free: "#7A8A99",
  essential: "#00E676",
  pro: "#FFB300",
  elite: ELECTRIC_BLUE,
};

// Stripe Customer Portal — In production, the server creates a Billing Portal
// session via Stripe API and returns the URL. The portal lets users upgrade,
// downgrade, update payment methods, and cancel subscriptions.
// For now we route to the Stripe Checkout links as a fallback.
const STRIPE_CHECKOUT_LINKS: Record<string, string> = {
  essential: "https://buy.stripe.com/14A5kwbol0r55F92wmbEA06",
  pro: "https://buy.stripe.com/8x214gdwt3Dh6Jd1sibEA04",
  elite: "https://buy.stripe.com/28E00c3VTa1FffJc6WbEA05",
};

// Production Stripe Customer Portal URL
// This would be created dynamically via: POST /v1/billing_portal/sessions
const STRIPE_CUSTOMER_PORTAL = "https://billing.stripe.com/p/login/test_muscleai";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile, subscription, updateProfile, setAuthenticated, setSubscription } = useApp();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editCalories, setEditCalories] = useState(profile.calorieGoal.toString());
  const [editProtein, setEditProtein] = useState(profile.proteinGoal.toString());
  const [editCarbs, setEditCarbs] = useState(profile.carbsGoal.toString());
  const [editFat, setEditFat] = useState(profile.fatGoal.toString());
  const [editTargetWeight, setEditTargetWeight] = useState(profile.targetWeight.toString());
  const [managingSubscription, setManagingSubscription] = useState(false);

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

    if (subscription === "free") {
      // Free users go to paywall to subscribe
      router.push("/paywall");
      return;
    }

    setManagingSubscription(true);
    try {
      // In production, call server to create a Stripe Billing Portal session:
      //   const res = await trpc.stripe.createPortalSession.mutate();
      //   await Linking.openURL(res.url);
      // Fallback: open the Stripe Customer Portal login page
      const portalUrl = STRIPE_CUSTOMER_PORTAL;
      const canOpen = await Linking.canOpenURL(portalUrl);
      if (canOpen) {
        await Linking.openURL(portalUrl);
      } else {
        // Fallback to checkout link for the current plan
        const checkoutUrl = STRIPE_CHECKOUT_LINKS[subscription];
        if (checkoutUrl) {
          await Linking.openURL(checkoutUrl);
        } else {
          Alert.alert(
            "Unable to Open",
            "Could not open the subscription management page. Please contact Muscle Support for help.",
            [
              { text: "Contact Support", onPress: () => (router as any).push("/support") },
              { text: "Cancel", style: "cancel" },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Unable to connect to the billing portal. Please check your internet connection and try again.",
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
            // In production: call Stripe API to cancel
            await setSubscription("free");
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
          <IconSymbol name="arrow.left" size={24} color="#ECEDEE" />
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
              {subscription === "free" ? "Subscribe" : "Manage Subscription"}
            </Text>
            {managingSubscription ? (
              <ActivityIndicator size="small" color={ELECTRIC_BLUE} />
            ) : (
              <IconSymbol name="chevron.right" size={18} color="#5A6A7A" />
            )}
          </TouchableOpacity>
          {subscription !== "free" && (
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
          {subscription === "free" && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/paywall")}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowLabel, { color: ELECTRIC_BLUE }]}>Upgrade Plan</Text>
                <IconSymbol name="chevron.right" size={18} color={ELECTRIC_BLUE} />
              </TouchableOpacity>
            </>
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
            <Text style={[styles.rowLabel, { color: ELECTRIC_BLUE }]}>Edit Goals</Text>
            <IconSymbol name="chevron.right" size={18} color={ELECTRIC_BLUE} />
          </TouchableOpacity>
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
            <IconSymbol name="chevron.right" size={18} color="#5A6A7A" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL("https://muscleai.app/privacy")}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={18} color="#5A6A7A" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL("https://muscleai.app/terms")}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <IconSymbol name="chevron.right" size={18} color="#5A6A7A" />
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
    fontWeight: "800",
    color: "#ECEDEE",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
    color: "#5A6A7A",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
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
    fontWeight: "500",
    color: "#ECEDEE",
  },
  rowValue: {
    fontSize: 15,
    color: "#7A8A99",
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
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginLeft: 16,
    backgroundColor: "#1A2533",
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
    fontWeight: "600",
    color: "#FF3D3D",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 20,
    color: "#5A6A7A",
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
    backgroundColor: "#111820",
    borderWidth: 1,
    borderColor: "#1A2533",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    color: "#ECEDEE",
  },
  modalField: {
    gap: 6,
  },
  modalFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7A8A99",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#0A0E14",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 16,
    fontWeight: "600",
    color: "#ECEDEE",
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
    borderColor: "#1A2533",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7A8A99",
  },
  modalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: ELECTRIC_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
