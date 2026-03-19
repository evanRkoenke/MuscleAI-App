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
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  essential: "Essential",
  pro: "Pro",
  elite: "Elite Annual",
};

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
    await setAuthenticated(false);
    router.replace("/auth");
  };

  const handleManageSubscription = () => {
    Linking.openURL("https://billing.stripe.com/p/login/test");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>PROFILE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Name</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>
              {profile.name || "Not set"}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Email</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>
              {profile.email || "Not set"}
            </Text>
          </View>
        </View>

        {/* Subscription Section */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>SUBSCRIPTION</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Current Plan</Text>
            <Text style={[styles.rowValue, { color: colors.primary }]}>
              {TIER_LABELS[subscription]}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row} onPress={handleManageSubscription} activeOpacity={0.7}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Manage Subscription</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>
          {subscription === "free" && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/paywall")}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowLabel, { color: colors.primary }]}>Upgrade Plan</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Goals Section */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>NUTRITION GOALS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Daily Calories</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>{profile.calorieGoal}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Protein Goal</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>{profile.proteinGoal}g</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Target Weight</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>
              {profile.targetWeight} {profile.unit}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowGoalModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: colors.primary }]}>Edit Goals</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={async () => {
              await updateProfile({ unit: profile.unit === "lbs" ? "kg" : "lbs" });
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Units</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>
              {profile.unit === "lbs" ? "Pounds (lbs)" : "Kilograms (kg)"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>SUPPORT</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => (router as any).push("/support")}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>AI Support Chat</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Terms of Service</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.muted }]}>Muscle AI v1.0.0</Text>
      </ScrollView>

      {/* Goal Edit Modal */}
      <Modal visible={showGoalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Goals</Text>

            {[
              { label: "Daily Calories", value: editCalories, setter: setEditCalories },
              { label: "Protein (g)", value: editProtein, setter: setEditProtein },
              { label: "Carbs (g)", value: editCarbs, setter: setEditCarbs },
              { label: "Fat (g)", value: editFat, setter: setEditFat },
              { label: `Target Weight (${profile.unit})`, value: editTargetWeight, setter: setEditTargetWeight },
            ].map((field) => (
              <View key={field.label} style={styles.modalField}>
                <Text style={[styles.modalFieldLabel, { color: colors.muted }]}>{field.label}</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
              </View>
            ))}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowGoalModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveGoals}
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
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
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
  },
  rowValue: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  logoutButton: {
    marginTop: 32,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 20,
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
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  modalField: {
    gap: 6,
  },
  modalFieldLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
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
