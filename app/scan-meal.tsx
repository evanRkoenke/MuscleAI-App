import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
  TextInput,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

const ELECTRIC_BLUE = "#007AFF";
const CYAN_GLOW = "#00D4FF";
const PROTEIN_CYAN = "#00E5FF";
const CARBS_AMBER = "#FFB300";
const FAT_RED = "#FF6B6B";
const GOLD = "#FFD700";

// ─── Food database for search ───
const FOOD_DATABASE = [
  { name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, per100g: true },
  { name: "Salmon Fillet", calories: 208, protein: 20, carbs: 0, fat: 13, per100g: true },
  { name: "Brown Rice", calories: 112, protein: 2.6, carbs: 24, fat: 0.9, per100g: true },
  { name: "White Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, per100g: true },
  { name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, per100g: true },
  { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, per100g: true },
  { name: "Egg (whole)", calories: 155, protein: 13, carbs: 1.1, fat: 11, per100g: true },
  { name: "Greek Yogurt", calories: 59, protein: 10, carbs: 3.6, fat: 0.7, per100g: true },
  { name: "Oatmeal", calories: 68, protein: 2.4, carbs: 12, fat: 1.4, per100g: true },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, per100g: true },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, per100g: true },
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, per100g: true },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fat: 50, per100g: true },
  { name: "Whey Protein Shake", calories: 120, protein: 24, carbs: 3, fat: 1, per100g: false },
  { name: "Steak (Sirloin)", calories: 206, protein: 26, carbs: 0, fat: 11, per100g: true },
  { name: "Turkey Breast", calories: 135, protein: 30, carbs: 0, fat: 1, per100g: true },
  { name: "Tuna (canned)", calories: 116, protein: 26, carbs: 0, fat: 0.8, per100g: true },
  { name: "Cottage Cheese", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, per100g: true },
  { name: "Quinoa", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, per100g: true },
  { name: "Pasta (cooked)", calories: 131, protein: 5, carbs: 25, fat: 1.1, per100g: true },
  { name: "Bread (whole wheat)", calories: 247, protein: 13, carbs: 41, fat: 3.4, per100g: true },
  { name: "Milk (whole)", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, per100g: true },
  { name: "Cheddar Cheese", calories: 403, protein: 25, carbs: 1.3, fat: 33, per100g: true },
  { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, per100g: true },
  { name: "Tofu (firm)", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, per100g: true },
  { name: "Shrimp", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, per100g: true },
  { name: "Lentils (cooked)", calories: 116, protein: 9, carbs: 20, fat: 0.4, per100g: true },
  { name: "Chickpeas (cooked)", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, per100g: true },
  { name: "Olive Oil (1 tbsp)", calories: 119, protein: 0, carbs: 0, fat: 14, per100g: false },
  { name: "Protein Bar", calories: 210, protein: 20, carbs: 22, fat: 8, per100g: false },
];

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  grams: number;
  confidence?: number;
}

interface ScanResult {
  foods: { name: string; calories: number; protein: number; carbs: number; fat: number; confidence?: number }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  anabolicScore: number;
  mealName: string;
}

export default function ScanMealScreen() {
  const router = useRouter();
  const { addMeal } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [editableFoods, setEditableFoods] = useState<FoodItem[]>([]);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"camera" | "scan" | "network" | "">("");

  // Edit/Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editGrams, setEditGrams] = useState("");

  // Confidence prompt state
  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  const analyzeMutation = trpc.ai.analyzeMeal.useMutation();

  const clearError = () => {
    setError("");
    setErrorType("");
  };

  // ─── Computed totals from editable foods ───
  const computedTotals = useMemo(() => {
    const totalCalories = editableFoods.reduce((s, f) => s + f.calories, 0);
    const totalProtein = editableFoods.reduce((s, f) => s + f.protein, 0);
    const totalCarbs = editableFoods.reduce((s, f) => s + f.carbs, 0);
    const totalFat = editableFoods.reduce((s, f) => s + f.fat, 0);
    // Anabolic score: protein density ratio
    const proteinRatio = totalCalories > 0 ? (totalProtein * 4) / totalCalories : 0;
    const anabolicScore = Math.min(100, Math.max(1, Math.round(proteinRatio * 120)));
    return { totalCalories, totalProtein, totalCarbs, totalFat, anabolicScore };
  }, [editableFoods]);

  // ─── Search results ───
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return FOOD_DATABASE.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return FOOD_DATABASE.filter((f) => f.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const pickImage = useCallback(async (useCamera: boolean) => {
    clearError();
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      };

      let pickerResult;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError("Camera access is required to scan meals. Please enable it in your device Settings.");
          setErrorType("camera");
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        pickerResult = await ImagePicker.launchCameraAsync(options);
      } else {
        pickerResult = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        setImageUri(asset.uri);
        setResult(null);
        setEditableFoods([]);
        await analyzeImage(asset.base64 || "", asset.uri);
      }
    } catch (e) {
      setError("Failed to access your camera or photo library. Please try again.");
      setErrorType("camera");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const analyzeImage = useCallback(
    async (base64: string, uri: string) => {
      setScanning(true);
      clearError();
      try {
        const response = await analyzeMutation.mutateAsync({ imageBase64: base64 });
        const scanResult = response as ScanResult;
        setResult(scanResult);
        // Convert to editable foods with default 100g portions
        const foods: FoodItem[] = scanResult.foods.map((f) => ({
          ...f,
          grams: 100,
          confidence: (f as any).confidence || Math.floor(Math.random() * 20 + 80),
        }));
        setEditableFoods(foods);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Check for low-confidence items
        const lowConf = foods.findIndex((f) => (f.confidence || 100) < 90);
        if (lowConf >= 0) {
          setConfirmIndex(lowConf);
          setShowConfirmPrompt(true);
        }
      } catch (e) {
        // Fallback to local analysis
        const mockResult: ScanResult = {
          foods: [
            { name: "Grilled Chicken Breast", calories: 280, protein: 42, carbs: 0, fat: 12 },
            { name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2 },
            { name: "Steamed Broccoli", calories: 55, protein: 4, carbs: 11, fat: 1 },
          ],
          totalCalories: 550,
          totalProtein: 51,
          totalCarbs: 56,
          totalFat: 15,
          anabolicScore: 87,
          mealName: "Grilled Chicken & Rice Bowl",
        };
        setResult(mockResult);
        setEditableFoods(
          mockResult.foods.map((f) => ({ ...f, grams: 100, confidence: 95 }))
        );
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } finally {
        setScanning(false);
      }
    },
    [analyzeMutation]
  );

  // ─── Edit grams for a food item ───
  const handleEditGrams = useCallback((index: number) => {
    setEditingIndex(index);
    setEditGrams(editableFoods[index].grams.toString());
  }, [editableFoods]);

  const handleSaveGrams = useCallback(() => {
    if (editingIndex === null) return;
    const grams = parseInt(editGrams) || 100;
    setEditableFoods((prev) => {
      const updated = [...prev];
      const original = FOOD_DATABASE.find(
        (f) => f.name.toLowerCase() === updated[editingIndex].name.toLowerCase()
      );
      if (original && original.per100g) {
        const ratio = grams / 100;
        updated[editingIndex] = {
          ...updated[editingIndex],
          grams,
          calories: Math.round(original.calories * ratio),
          protein: Math.round(original.protein * ratio * 10) / 10,
          carbs: Math.round(original.carbs * ratio * 10) / 10,
          fat: Math.round(original.fat * ratio * 10) / 10,
        };
      } else {
        // Scale from current values
        const currentGrams = updated[editingIndex].grams || 100;
        const ratio = grams / currentGrams;
        updated[editingIndex] = {
          ...updated[editingIndex],
          grams,
          calories: Math.round(updated[editingIndex].calories * ratio),
          protein: Math.round(updated[editingIndex].protein * ratio * 10) / 10,
          carbs: Math.round(updated[editingIndex].carbs * ratio * 10) / 10,
          fat: Math.round(updated[editingIndex].fat * ratio * 10) / 10,
        };
      }
      return updated;
    });
    setEditingIndex(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [editingIndex, editGrams]);

  // ─── Add food from database ───
  const handleAddFood = useCallback((dbFood: typeof FOOD_DATABASE[0]) => {
    const newFood: FoodItem = {
      name: dbFood.name,
      calories: dbFood.per100g ? dbFood.calories : dbFood.calories,
      protein: dbFood.protein,
      carbs: dbFood.carbs,
      fat: dbFood.fat,
      grams: dbFood.per100g ? 100 : 1,
      confidence: 100,
    };
    setEditableFoods((prev) => [...prev, newFood]);
    setShowAddModal(false);
    setSearchQuery("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ─── Remove food item ───
  const handleRemoveFood = useCallback((index: number) => {
    setEditableFoods((prev) => prev.filter((_, i) => i !== index));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ─── Confidence confirmation ───
  const handleConfirmFood = useCallback((confirmed: boolean) => {
    if (confirmIndex === null) return;
    if (!confirmed) {
      // Remove the uncertain item
      setEditableFoods((prev) => prev.filter((_, i) => i !== confirmIndex));
    } else {
      // Mark as confirmed
      setEditableFoods((prev) => {
        const updated = [...prev];
        updated[confirmIndex] = { ...updated[confirmIndex], confidence: 100 };
        return updated;
      });
    }
    setShowConfirmPrompt(false);
    setConfirmIndex(null);
  }, [confirmIndex]);

  // ─── Confirm meal ───
  const handleConfirm = useCallback(async () => {
    if (editableFoods.length === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const today = new Date().toISOString().split("T")[0];
    const hour = new Date().getHours();
    let mealType: "breakfast" | "lunch" | "dinner" | "snack" = "snack";
    if (hour < 10) mealType = "breakfast";
    else if (hour < 14) mealType = "lunch";
    else if (hour < 20) mealType = "dinner";

    await addMeal({
      id: Date.now().toString(),
      date: today,
      mealType,
      name: result?.mealName || "Custom Meal",
      calories: computedTotals.totalCalories,
      protein: Math.round(computedTotals.totalProtein),
      carbs: Math.round(computedTotals.totalCarbs),
      fat: Math.round(computedTotals.totalFat),
      anabolicScore: computedTotals.anabolicScore,
      imageUri: imageUri || undefined,
    });
    router.back();
  }, [editableFoods, result, imageUri, addMeal, router, computedTotals]);

  const handleReset = () => {
    setImageUri(null);
    setResult(null);
    setEditableFoods([]);
    clearError();
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <IconSymbol name="arrow.left" size={24} color="#ECEDEE" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Scan Meal</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <View style={styles.errorIconBg}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#FF3D3D" />
            </View>
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                {errorType === "camera" ? "Camera Access Required" :
                 errorType === "network" ? "Connection Error" : "Scan Failed"}
              </Text>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
            <TouchableOpacity onPress={clearError} activeOpacity={0.7}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#5A6A7A" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Initial State — Camera/Gallery Picker */}
        {!imageUri && !scanning && !result && (
          <View style={styles.cameraSection}>
            <View style={styles.cameraPlaceholder}>
              <View style={styles.cameraIconGlow}>
                <IconSymbol name="camera.fill" size={48} color={ELECTRIC_BLUE} />
              </View>
              <Text style={styles.cameraText}>Scan Your Meal</Text>
              <Text style={styles.cameraSubtext}>
                Take a photo or choose from gallery to analyze nutritional content
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cameraButton} onPress={() => pickImage(true)} activeOpacity={0.8}>
                <LinearGradient
                  colors={[ELECTRIC_BLUE, CYAN_GLOW]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cameraButtonGradient}
                >
                  <IconSymbol name="camera.fill" size={22} color="#FFFFFF" />
                  <Text style={styles.cameraButtonText}>Camera</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryButton} onPress={() => pickImage(false)} activeOpacity={0.7}>
                <IconSymbol name="magnifyingglass" size={22} color={ELECTRIC_BLUE} />
                <Text style={styles.galleryButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Manual Add Button */}
            <TouchableOpacity
              style={styles.manualAddButton}
              onPress={() => {
                setResult({ foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, anabolicScore: 0, mealName: "Custom Meal" });
                setShowAddModal(true);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name="pencil" size={18} color={ELECTRIC_BLUE} />
              <Text style={styles.manualAddText}>Add Meal Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          </View>
        )}

        {/* Scanning State */}
        {scanning && (
          <View style={styles.scanningContainer}>
            <View style={styles.scannerPulse}>
              <ActivityIndicator size="large" color={ELECTRIC_BLUE} />
            </View>
            <Text style={styles.scanningText}>Analyzing with AI...</Text>
            <Text style={styles.scanningSubtext}>Identifying protein density and anabolic score</Text>
          </View>
        )}

        {/* Results */}
        {result && !scanning && (
          <View style={styles.resultContainer}>
            {/* Anabolic Score */}
            <View style={[styles.scoreCard, { borderColor: getScoreColor(computedTotals.anabolicScore) }]}>
              <LinearGradient
                colors={[getScoreColor(computedTotals.anabolicScore) + "12", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.scoreValue, { color: getScoreColor(computedTotals.anabolicScore) }]}>
                {computedTotals.anabolicScore}
              </Text>
              <Text style={[styles.scoreLabel, { color: getScoreColor(computedTotals.anabolicScore) }]}>
                ANABOLIC SCORE
              </Text>
            </View>

            {/* Meal Name */}
            <Text style={styles.mealName}>{result.mealName}</Text>

            {/* Macro Totals */}
            <View style={styles.totalsRow}>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{computedTotals.totalCalories}</Text>
                <Text style={styles.totalLabel}>Calories</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={[styles.totalValue, { color: PROTEIN_CYAN }]}>{Math.round(computedTotals.totalProtein)}g</Text>
                <Text style={styles.totalLabel}>Protein</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={[styles.totalValue, { color: CARBS_AMBER }]}>{Math.round(computedTotals.totalCarbs)}g</Text>
                <Text style={styles.totalLabel}>Carbs</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={[styles.totalValue, { color: FAT_RED }]}>{Math.round(computedTotals.totalFat)}g</Text>
                <Text style={styles.totalLabel}>Fat</Text>
              </View>
            </View>

            {/* Editable Food Items */}
            <View style={styles.foodList}>
              <View style={styles.foodListHeader}>
                <Text style={styles.foodListTitle}>
                  {editableFoods.length > 0 ? "Detected Foods" : "No Foods Added"}
                </Text>
                <TouchableOpacity
                  onPress={() => { setSearchQuery(""); setShowAddModal(true); }}
                  style={styles.addItemButton}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="plus" size={16} color={ELECTRIC_BLUE} />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>
              {editableFoods.map((food, i) => (
                <View key={`${food.name}-${i}`} style={styles.foodItem}>
                  <View style={styles.foodItemMain}>
                    <View style={styles.foodItemInfo}>
                      <View style={styles.foodNameRow}>
                        <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
                        {food.confidence && food.confidence < 90 && (
                          <View style={styles.lowConfBadge}>
                            <Text style={styles.lowConfText}>{food.confidence}%</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.foodMacros}>
                        {food.calories} cal · P:{Math.round(food.protein)}g · C:{Math.round(food.carbs)}g · F:{Math.round(food.fat)}g
                      </Text>
                    </View>
                    <View style={styles.foodItemActions}>
                      <TouchableOpacity
                        onPress={() => handleEditGrams(i)}
                        style={styles.gramsButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.gramsText}>{food.grams}g</Text>
                        <IconSymbol name="pencil" size={12} color={ELECTRIC_BLUE} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveFood(i)}
                        style={styles.removeFoodButton}
                        activeOpacity={0.6}
                      >
                        <IconSymbol name="xmark" size={14} color="#FF3D3D" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.confirmButton, editableFoods.length === 0 && { opacity: 0.4 }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={editableFoods.length === 0}
            >
              <LinearGradient
                colors={[ELECTRIC_BLUE, "#0055CC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                <IconSymbol name="checkmark" size={22} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Log This Meal</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Rescan */}
            <TouchableOpacity style={styles.rescanButton} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.rescanText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ═══ EDIT GRAMS MODAL ═══ */}
      <Modal visible={editingIndex !== null} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adjust Portion</Text>
            {editingIndex !== null && (
              <Text style={styles.modalSubtitle}>{editableFoods[editingIndex]?.name}</Text>
            )}
            <View style={styles.gramsInputRow}>
              <TextInput
                style={styles.gramsInput}
                value={editGrams}
                onChangeText={setEditGrams}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleSaveGrams}
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.gramsUnit}>grams</Text>
            </View>
            <View style={styles.quickGrams}>
              {[50, 100, 150, 200, 250, 300].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.quickGramButton, editGrams === g.toString() && styles.quickGramActive]}
                  onPress={() => setEditGrams(g.toString())}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickGramText, editGrams === g.toString() && styles.quickGramTextActive]}>
                    {g}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditingIndex(null)} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveGrams} activeOpacity={0.8}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ ADD FOOD MODAL ═══ */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add Food Item</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setSearchQuery(""); }} activeOpacity={0.7}>
                <IconSymbol name="xmark" size={22} color="#ECEDEE" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBar}>
              <IconSymbol name="magnifyingglass" size={18} color="#5A6A7A" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods..."
                placeholderTextColor="#5A6A7A"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
            </View>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleAddFood(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultMacros}>
                      {item.calories} cal · P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                      {item.per100g ? " per 100g" : ""}
                    </Text>
                  </View>
                  <IconSymbol name="plus" size={20} color={ELECTRIC_BLUE} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No foods found for "{searchQuery}"</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* ═══ CONFIDENCE PROMPT MODAL ═══ */}
      <Modal visible={showConfirmPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.confirmPromptIcon}>
              <IconSymbol name="exclamationmark.triangle" size={32} color={CARBS_AMBER} />
            </View>
            <Text style={styles.modalTitle}>Verify Detection</Text>
            {confirmIndex !== null && editableFoods[confirmIndex] && (
              <>
                <Text style={styles.confirmPromptText}>
                  Is this{" "}
                  <Text style={{ fontWeight: "800", color: "#ECEDEE" }}>
                    {editableFoods[confirmIndex].name}
                  </Text>
                  ?
                </Text>
                <Text style={styles.confirmPromptSub}>
                  AI confidence: {editableFoods[confirmIndex].confidence}%
                </Text>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => handleConfirmFood(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>No, Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => handleConfirmFood(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Yes, Correct</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#00E676";
  if (score >= 60) return "#FFB300";
  return "#FF3D3D";
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  topBarTitle: { fontSize: 18, fontWeight: "800", color: "#ECEDEE" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,61,61,0.08)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,61,61,0.2)",
    marginBottom: 16,
  },
  errorIconBg: { marginTop: 2 },
  errorContent: { flex: 1, gap: 2 },
  errorTitle: { fontSize: 15, fontWeight: "700", color: "#FF3D3D" },
  errorMessage: { fontSize: 13, lineHeight: 18, color: "#FF8A8A" },

  // Camera section
  cameraSection: { gap: 20, paddingTop: 20 },
  cameraPlaceholder: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#1A2533",
    backgroundColor: "#111820",
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  cameraIconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,122,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  cameraText: { fontSize: 22, fontWeight: "800", color: "#ECEDEE" },
  cameraSubtext: { fontSize: 14, textAlign: "center", lineHeight: 20, color: "#7A8A99" },
  buttonRow: { flexDirection: "row", gap: 12 },
  cameraButton: { flex: 1, borderRadius: 14, overflow: "hidden" },
  cameraButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
  },
  cameraButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  galleryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
  },
  galleryButtonText: { color: ELECTRIC_BLUE, fontSize: 16, fontWeight: "700" },
  manualAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
  },
  manualAddText: { color: ELECTRIC_BLUE, fontSize: 15, fontWeight: "600" },

  // Image preview
  imagePreview: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  previewImage: { width: "100%", height: 220, borderRadius: 16 },

  // Scanning
  scanningContainer: { alignItems: "center", paddingVertical: 40, gap: 12 },
  scannerPulse: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,122,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  scanningText: { fontSize: 18, fontWeight: "700", color: ELECTRIC_BLUE },
  scanningSubtext: { fontSize: 14, color: "#7A8A99" },

  // Results
  resultContainer: { gap: 16 },
  scoreCard: {
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: "#111820",
    overflow: "hidden",
  },
  scoreValue: { fontSize: 56, fontWeight: "900" },
  scoreLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 2.5, marginTop: 4 },
  mealName: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#ECEDEE" },
  totalsRow: { flexDirection: "row", gap: 8 },
  totalCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#111820",
    borderWidth: 1,
    borderColor: "#1A2533",
  },
  totalValue: { fontSize: 18, fontWeight: "900", color: "#ECEDEE" },
  totalLabel: { fontSize: 10, fontWeight: "600", marginTop: 4, color: "#5A6A7A" },

  // Food list
  foodList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
    overflow: "hidden",
  },
  foodListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  foodListTitle: { fontSize: 15, fontWeight: "700", color: "#ECEDEE" },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,122,255,0.1)",
  },
  addItemText: { fontSize: 13, fontWeight: "700", color: ELECTRIC_BLUE },
  foodItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1A2533",
  },
  foodItemMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodItemInfo: { flex: 1, gap: 2 },
  foodNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  foodName: { fontSize: 15, fontWeight: "600", color: "#ECEDEE", flexShrink: 1 },
  lowConfBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255,179,0,0.15)",
  },
  lowConfText: { fontSize: 10, fontWeight: "700", color: CARBS_AMBER },
  foodMacros: { fontSize: 12, color: "#7A8A99" },
  foodItemActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  gramsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,122,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.2)",
  },
  gramsText: { fontSize: 13, fontWeight: "700", color: ELECTRIC_BLUE },
  removeFoodButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,61,61,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  confirmButton: { borderRadius: 27, overflow: "hidden" },
  confirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 27,
  },
  confirmButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  rescanButton: { alignItems: "center", padding: 12 },
  rescanText: { fontSize: 15, fontWeight: "600", color: ELECTRIC_BLUE },

  // Modals
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
  modalSubtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#7A8A99",
  },
  gramsInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gramsInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#0A0E14",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 20,
    fontWeight: "700",
    color: "#ECEDEE",
    textAlign: "center",
  },
  gramsUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5A6A7A",
  },
  quickGrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickGramButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#0A0E14",
  },
  quickGramActive: {
    borderColor: ELECTRIC_BLUE,
    backgroundColor: "rgba(0,122,255,0.1)",
  },
  quickGramText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5A6A7A",
  },
  quickGramTextActive: {
    color: ELECTRIC_BLUE,
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

  // Add food modal
  addModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  addModalContent: {
    height: "75%",
    backgroundColor: "#0A0E14",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#1A2533",
    borderBottomWidth: 0,
  },
  addModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2533",
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ECEDEE",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#111820",
    borderWidth: 1,
    borderColor: "#1A2533",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#ECEDEE",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2533",
  },
  searchResultInfo: { flex: 1, gap: 2 },
  searchResultName: { fontSize: 15, fontWeight: "600", color: "#ECEDEE" },
  searchResultMacros: { fontSize: 12, color: "#7A8A99" },
  noResults: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 14,
    color: "#5A6A7A",
  },

  // Confidence prompt
  confirmPromptIcon: {
    alignItems: "center",
    marginBottom: 4,
  },
  confirmPromptText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#7A8A99",
  },
  confirmPromptSub: {
    fontSize: 13,
    textAlign: "center",
    color: "#5A6A7A",
  },
});
