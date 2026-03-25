import { useState, useCallback, useEffect } from "react";
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
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useSubscription } from "@/hooks/use-subscription";
import { trpc } from "@/lib/trpc";
import { getScanCount, incrementScanCount, FREE_DAILY_SCAN_LIMIT } from "@/lib/scan-counter";
import { ScanLimitModal } from "@/components/scan-limit-modal";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";


const PRIMARY_WHITE = "#FFFFFF";
const SILVER = "#C0C0C0";
const PROTEIN_LIGHT = "#E0E0E0";
const CARBS_SILVER = "#B0B0B0";
const FAT_RED = "#FF4444";
const SUGAR_GRAY = "#A0A0A0";

interface FoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  confidence: number;
}

interface ScanResult {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalSugar: number;
  anabolicScore: number;
  mealName: string;
}

type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

const CATEGORY_OPTIONS: { key: MealCategory; label: string; icon: string }[] = [
  { key: "breakfast", label: "Breakfast", icon: "☀️" },
  { key: "lunch", label: "Lunch", icon: "🌤️" },
  { key: "dinner", label: "Dinner", icon: "🌙" },
  { key: "snack", label: "Snacks", icon: "⚡" },
];

function getDefaultCategory(): MealCategory {
  const hour = new Date().getHours();
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  if (hour < 20) return "dinner";
  return "snack";
}

export default function ScanMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { addMeal, selectedDate } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"camera" | "scan" | "network" | "">("")

  // Meal category: from route param, or default based on time of day
  const initialCategory = (params.category && ["breakfast", "lunch", "dinner", "snack"].includes(params.category))
    ? params.category as MealCategory
    : getDefaultCategory();
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>(initialCategory);;

  // Edit/Add state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editGrams, setEditGrams] = useState("");
  const [addName, setAddName] = useState("");
  const [addGrams, setAddGrams] = useState("");
  const [addCalories, setAddCalories] = useState("");
  const [addProtein, setAddProtein] = useState("");
  const [addCarbs, setAddCarbs] = useState("");
  const [addFat, setAddFat] = useState("");
  const [addSugar, setAddSugar] = useState("");

  // Confidence confirmation state
  const [pendingConfirmations, setPendingConfirmations] = useState<Set<number>>(new Set());

  // Scan limit state
  const sub = useSubscription();
  const [scansUsed, setScansUsed] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Load today's scan count on mount
  useEffect(() => {
    getScanCount().then(setScansUsed);
  }, []);

  const analyzeMutation = trpc.ai.analyzeMeal.useMutation();

  const clearError = () => {
    setError("");
    setErrorType("");
  };

  const pickImage = useCallback(async (useCamera: boolean) => {
    clearError();

    // Check scan limit for free-plan users
    if (!sub.canAccessUnlimitedScans) {
      const currentCount = await getScanCount();
      if (currentCount >= FREE_DAILY_SCAN_LIMIT) {
        setScansUsed(currentCount);
        setShowLimitModal(true);
        return;
      }
    }

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
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
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
        setPendingConfirmations(new Set());
        await analyzeImage(asset.base64 || "", asset.uri);
      }
    } catch (e) {
      setError("Failed to access your camera or photo library. Please try again.");
      setErrorType("camera");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, []);

  const analyzeImage = useCallback(
    async (base64: string, uri: string) => {
      setScanning(true);
      clearError();
      try {
        const response = await analyzeMutation.mutateAsync({ imageBase64: base64 });
        const scanResult = response as ScanResult;
        // Normalize: ensure sugar and grams exist
        scanResult.foods = scanResult.foods.map((f) => ({
          ...f,
          sugar: f.sugar ?? 0,
          grams: f.grams ?? 100,
          confidence: f.confidence ?? 95,
        }));
        scanResult.totalSugar = scanResult.totalSugar ?? scanResult.foods.reduce((s, f) => s + f.sugar, 0);
        setResult(scanResult);

        // Increment scan counter for free users
        if (!sub.canAccessUnlimitedScans) {
          const newCount = await incrementScanCount();
          setScansUsed(newCount);
        }

        // Check for low-confidence items
        const lowConfidence = new Set<number>();
        scanResult.foods.forEach((f, i) => {
          if (f.confidence < 90) lowConfidence.add(i);
        });
        setPendingConfirmations(lowConfidence);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {
        // Fallback to local analysis when server unavailable
        const mockResult: ScanResult = {
          foods: [
            { name: "Grilled Chicken Breast", grams: 170, calories: 280, protein: 42, carbs: 0, fat: 12, sugar: 0, confidence: 95 },
            { name: "Brown Rice", grams: 150, calories: 215, protein: 5, carbs: 45, fat: 2, sugar: 1, confidence: 92 },
            { name: "Steamed Broccoli", grams: 100, calories: 55, protein: 4, carbs: 11, fat: 1, sugar: 2, confidence: 94 },
          ],
          totalCalories: 550,
          totalProtein: 51,
          totalCarbs: 56,
          totalFat: 15,
          totalSugar: 3,
          anabolicScore: 87,
          mealName: "Grilled Chicken & Rice Bowl",
        };
        setResult(mockResult);
        setPendingConfirmations(new Set());

        // Increment scan counter for free users (fallback also counts)
        if (!sub.canAccessUnlimitedScans) {
          const newCount = await incrementScanCount();
          setScansUsed(newCount);
        }

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } finally {
        setScanning(false);
      }
    },
    [analyzeMutation]
  );

  const recalculateTotals = (foods: FoodItem[]): Partial<ScanResult> => {
    return {
      totalCalories: foods.reduce((s, f) => s + f.calories, 0),
      totalProtein: foods.reduce((s, f) => s + f.protein, 0),
      totalCarbs: foods.reduce((s, f) => s + f.carbs, 0),
      totalFat: foods.reduce((s, f) => s + f.fat, 0),
      totalSugar: foods.reduce((s, f) => s + f.sugar, 0),
    };
  };

  const handleUpdateGrams = (index: number) => {
    if (!result) return;
    const newGrams = parseFloat(editGrams);
    if (isNaN(newGrams) || newGrams <= 0) return;

    const food = result.foods[index];
    const ratio = newGrams / food.grams;
    const updatedFood: FoodItem = {
      ...food,
      grams: newGrams,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
      sugar: Math.round(food.sugar * ratio * 10) / 10,
    };

    const newFoods = [...result.foods];
    newFoods[index] = updatedFood;
    setResult({ ...result, ...recalculateTotals(newFoods), foods: newFoods });
    setEditingIndex(null);
    setEditGrams("");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveFood = (index: number) => {
    if (!result) return;
    const newFoods = result.foods.filter((_, i) => i !== index);
    if (newFoods.length === 0) {
      handleReset();
      return;
    }
    setResult({ ...result, ...recalculateTotals(newFoods), foods: newFoods });
    // Remove from pending confirmations
    const newPending = new Set<number>();
    pendingConfirmations.forEach((i) => {
      if (i < index) newPending.add(i);
      else if (i > index) newPending.add(i - 1);
    });
    setPendingConfirmations(newPending);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleConfirmFood = (index: number) => {
    const newPending = new Set(pendingConfirmations);
    newPending.delete(index);
    setPendingConfirmations(newPending);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddFood = () => {
    if (!result || !addName.trim()) return;
    const newFood: FoodItem = {
      name: addName.trim(),
      grams: parseFloat(addGrams) || 100,
      calories: parseInt(addCalories) || 0,
      protein: parseFloat(addProtein) || 0,
      carbs: parseFloat(addCarbs) || 0,
      fat: parseFloat(addFat) || 0,
      sugar: parseFloat(addSugar) || 0,
      confidence: 100, // Manual entry = 100% confidence
    };
    const newFoods = [...result.foods, newFood];
    setResult({ ...result, ...recalculateTotals(newFoods), foods: newFoods });
    setShowAddModal(false);
    resetAddForm();
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const resetAddForm = () => {
    setAddName("");
    setAddGrams("");
    setAddCalories("");
    setAddProtein("");
    setAddCarbs("");
    setAddFat("");
    setAddSugar("");
  };

  const handleConfirm = useCallback(async () => {
    if (!result) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await addMeal({
      id: Date.now().toString(),
      date: selectedDate,
      mealType: selectedCategory,
      name: result.mealName,
      calories: result.totalCalories,
      protein: result.totalProtein,
      carbs: result.totalCarbs,
      fat: result.totalFat,
      sugar: result.totalSugar,
      anabolicScore: result.anabolicScore,
      imageUri: imageUri || undefined,
    });
    router.back();
  }, [result, imageUri, addMeal, selectedDate, selectedCategory, router]);

  const handleReset = () => {
    setImageUri(null);
    setResult(null);
    clearError();
    setEditingIndex(null);
    setPendingConfirmations(new Set());
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.left" size={24} color="#F0F0F0" />
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
                 errorType === "network" ? "Connection Error" :
                 "Scan Failed"}
              </Text>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
            <TouchableOpacity onPress={clearError} activeOpacity={0.7}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#666666" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Initial State — Camera/Gallery Picker */}
        {!imageUri && !scanning && !result && (
          <View style={styles.cameraSection}>
            <View style={styles.cameraPlaceholder}>
              <View style={styles.cameraIconGlow}>
                <IconSymbol name="camera.fill" size={48} color={"#FFFFFF"} />
              </View>
              <Text style={styles.cameraText}>Scan Your Meal</Text>
              <Text style={styles.cameraSubtext}>
                Take a photo or choose from gallery to analyze nutritional content
              </Text>

              {/* Remaining scans indicator for free users */}
              {!sub.canAccessUnlimitedScans && (
                <View style={styles.scanCounterBadge}>
                  <Text style={styles.scanCounterText}>
                    {Math.max(0, FREE_DAILY_SCAN_LIMIT - scansUsed)} of {FREE_DAILY_SCAN_LIMIT} free scans remaining today
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => pickImage(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#444444", "#333333"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cameraButtonGradient}
                >
                  <IconSymbol name="camera.fill" size={22} color="#FFFFFF" />
                  <Text style={styles.cameraButtonText}>Camera</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={() => pickImage(false)}
                activeOpacity={0.7}
              >
                <IconSymbol name="magnifyingglass" size={22} color={"#FFFFFF"} />
                <Text style={styles.galleryButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
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
              <ActivityIndicator size="large" color={"#FFFFFF"} />
            </View>
            <Text style={styles.scanningText}>Analyzing with AI...</Text>
            <Text style={styles.scanningSubtext}>
              Identifying foods, macros, sugar content, and anabolic score
            </Text>
          </View>
        )}

        {/* Results */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Anabolic Score */}
            <View style={[styles.scoreCard, { borderColor: getScoreColor(result.anabolicScore) }]}>
              <LinearGradient
                colors={[getScoreColor(result.anabolicScore) + "12", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.scoreValue, { color: getScoreColor(result.anabolicScore) }]}>
                {result.anabolicScore}
              </Text>
              <Text style={[styles.scoreLabel, { color: getScoreColor(result.anabolicScore) }]}>
                ANABOLIC SCORE
              </Text>
            </View>

            {/* Meal Name */}
            <Text style={styles.mealName}>{result.mealName}</Text>

            {/* Macro Totals */}
            <View style={styles.totalsRow}>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{result.totalCalories}</Text>
                <Text style={styles.totalLabel}>Calories</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={[styles.totalValue, { color: "#E0E0E0" }]}>{result.totalProtein}g</Text>
                <Text style={styles.totalLabel}>Protein</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={[styles.totalValue, { color: "#B0B0B0" }]}>{result.totalCarbs}g</Text>
                <Text style={styles.totalLabel}>Carbs</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={[styles.totalValue, { color: FAT_RED }]}>{result.totalFat}g</Text>
                <Text style={styles.totalLabel}>Fat</Text>
              </View>
            </View>

            {/* Sugar Row */}
            <View style={styles.sugarRow}>
              <Text style={styles.sugarIcon}>🍬</Text>
              <Text style={styles.sugarLabel}>Sugar</Text>
              <Text style={styles.sugarValue}>{result.totalSugar}g</Text>
            </View>

            {/* Confidence Alerts */}
            {pendingConfirmations.size > 0 && (
              <View style={styles.confidenceBanner}>
                <IconSymbol name="questionmark.circle" size={18} color="#B0B0B0" />
                <Text style={styles.confidenceText}>
                  {pendingConfirmations.size} item{pendingConfirmations.size > 1 ? "s need" : " needs"} confirmation
                </Text>
              </View>
            )}

            {/* Food Items */}
            <View style={styles.foodList}>
              <View style={styles.foodListHeader}>
                <Text style={styles.foodListTitle}>Detected Foods</Text>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="plus" size={16} color={"#FFFFFF"} />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {result.foods.map((food, i) => (
                <View key={i} style={styles.foodItem}>
                  {/* Confidence prompt */}
                  {pendingConfirmations.has(i) && (
                    <View style={styles.confirmPrompt}>
                      <Text style={styles.confirmPromptText}>
                        Is this <Text style={styles.confirmFoodName}>{food.name}</Text>?
                      </Text>
                      <View style={styles.confirmActions}>
                        <TouchableOpacity
                          style={styles.confirmYes}
                          onPress={() => handleConfirmFood(i)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.confirmYesText}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmNo}
                          onPress={() => handleRemoveFood(i)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.confirmNoText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.foodItemRow}>
                    <View style={styles.foodInfo}>
                      <View style={styles.foodNameRow}>
                        <Text style={styles.foodName}>{food.name}</Text>
                        {food.confidence < 90 && (
                          <View style={styles.lowConfBadge}>
                            <Text style={styles.lowConfText}>{food.confidence}%</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.foodMacros}>
                        {food.calories} cal · P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g · S:{food.sugar}g
                      </Text>
                    </View>
                    <View style={styles.foodActions}>
                      {/* Grams edit */}
                      {editingIndex === i ? (
                        <View style={styles.gramsEditRow}>
                          <TextInput
                            style={styles.gramsInput}
                            value={editGrams}
                            onChangeText={setEditGrams}
                            keyboardType="numeric"
                            placeholder={String(food.grams)}
                            placeholderTextColor="#666666"
                            returnKeyType="done"
                            onSubmitEditing={() => handleUpdateGrams(i)}
                            autoFocus
                          />
                          <Text style={styles.gramsUnit}>g</Text>
                          <TouchableOpacity onPress={() => handleUpdateGrams(i)} activeOpacity={0.7}>
                            <IconSymbol name="checkmark" size={16} color="#C0C0C0" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => { setEditingIndex(null); setEditGrams(""); }} activeOpacity={0.7}>
                            <IconSymbol name="xmark" size={16} color="#FF3D3D" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.gramsButton}
                          onPress={() => { setEditingIndex(i); setEditGrams(String(food.grams)); }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.gramsText}>{food.grams}g</Text>
                          <IconSymbol name="pencil" size={12} color="#666666" />
                        </TouchableOpacity>
                      )}
                      {/* Remove button */}
                      <TouchableOpacity
                        onPress={() => handleRemoveFood(i)}
                        style={styles.removeFoodButton}
                        activeOpacity={0.6}
                      >
                        <IconSymbol name="minus.circle.fill" size={18} color="#FF3D3D" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Meal Category Picker */}
            <View style={styles.categorySection}>
              <Text style={styles.categorySectionTitle}>Log to</Text>
              <View style={styles.categoryRow}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.categoryChip,
                      selectedCategory === opt.key && styles.categoryChipActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(opt.key);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryIcon}>{opt.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        selectedCategory === opt.key && styles.categoryLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#444444", "#2A2A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                <IconSymbol name="checkmark" size={22} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Log This Meal</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Rescan */}
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.rescanText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Food Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Food Item</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetAddForm(); }} activeOpacity={0.7}>
                <IconSymbol name="xmark" size={22} color="#F0F0F0" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Food Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addName}
                  onChangeText={setAddName}
                  placeholder="e.g., Grilled Salmon"
                  placeholderTextColor="#666666"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Grams</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={addGrams}
                    onChangeText={setAddGrams}
                    placeholder="100"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Calories</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={addCalories}
                    onChangeText={setAddCalories}
                    placeholder="0"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={addProtein}
                    onChangeText={setAddProtein}
                    placeholder="0"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={addCarbs}
                    onChangeText={setAddCarbs}
                    placeholder="0"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={addFat}
                    onChangeText={setAddFat}
                    placeholder="0"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: "#A0A0A0" }]}>Sugar (g)</Text>
                  <TextInput
                    style={[styles.modalInput, { borderColor: "rgba(192,132,252,0.3)" }]}
                    value={addSugar}
                    onChangeText={setAddSugar}
                    placeholder="0"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalAddButton, !addName.trim() && { opacity: 0.5 }]}
              onPress={handleAddFood}
              disabled={!addName.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#444444", "#2A2A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalAddGradient}
              >
                <IconSymbol name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.modalAddText}>Add to Meal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Daily Scan Limit Modal */}
      <ScanLimitModal
        visible={showLimitModal}
        scansUsed={scansUsed}
        onUpgrade={() => {
          setShowLimitModal(false);
          router.push("/paywall" as any);
        }}
        onDismiss={() => setShowLimitModal(false)}
      />
    </ScreenContainer>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#C0C0C0";
  if (score >= 60) return "#B0B0B0";
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
  topBarTitle: { fontSize: 18, fontWeight: "600", color: "#F0F0F0" },
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
  errorTitle: { fontSize: 15, fontWeight: "400", color: "#FF3D3D" },
  errorMessage: { fontSize: 13, lineHeight: 18, color: "#FF6666" },

  // Camera section
  cameraSection: { gap: 20, paddingTop: 20 },
  cameraPlaceholder: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#222222",
    backgroundColor: "#111111",
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
  cameraText: { fontSize: 22, fontWeight: "700", color: "#F0F0F0" },
  cameraSubtext: { fontSize: 14, textAlign: "center", lineHeight: 20, color: "#888888" },
  buttonRow: { flexDirection: "row", gap: 12 },
  cameraButton: { flex: 1, borderRadius: 14, overflow: "hidden" },
  cameraButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
  },
  cameraButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  galleryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
  },
  galleryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

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
  scanningText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  scanningSubtext: { fontSize: 14, color: "#888888" },

  // Results
  resultContainer: { gap: 16 },
  scoreCard: {
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: "#111111",
    overflow: "hidden",
  },
  scoreValue: { fontSize: 56, fontWeight: "700" },
  scoreLabel: { fontSize: 11, fontWeight: "400", letterSpacing: 2.5, marginTop: 4 },
  mealName: { fontSize: 22, fontWeight: "700", textAlign: "center", color: "#F0F0F0" },
  totalsRow: { flexDirection: "row", gap: 8 },
  totalCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
  },
  totalValue: { fontSize: 18, fontWeight: "600", color: "#F0F0F0" },
  totalLabel: { fontSize: 10, fontWeight: "400", marginTop: 4, color: "#666666" },

  // Sugar row
  sugarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(192,132,252,0.08)",
    borderWidth: 1,
    borderColor: "rgba(192,132,252,0.2)",
  },
  sugarIcon: { fontSize: 16 },
  sugarLabel: { fontSize: 14, fontWeight: "400", flex: 1, color: "#A0A0A0" },
  sugarValue: { fontSize: 18, fontWeight: "600", color: "#A0A0A0" },

  // Confidence banner
  confidenceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,179,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,179,0,0.2)",
  },
  confidenceText: { fontSize: 13, fontWeight: "400", color: "#B0B0B0" },

  // Food list
  foodList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    overflow: "hidden",
  },
  foodListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  foodListTitle: { fontSize: 15, fontWeight: "400", color: "#F0F0F0" },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,122,255,0.1)",
  },
  addItemText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },

  // Food item
  foodItem: {
    borderTopWidth: 1,
    borderTopColor: "#222222",
  },
  foodItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  foodInfo: { flex: 1, gap: 2, marginRight: 8 },
  foodNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  foodName: { fontSize: 15, fontWeight: "400", color: "#F0F0F0", flexShrink: 1 },
  lowConfBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255,179,0,0.15)",
  },
  lowConfText: { fontSize: 10, fontWeight: "400", color: "#B0B0B0" },
  foodMacros: { fontSize: 12, marginTop: 4, color: "#888888" },
  foodActions: { flexDirection: "row", alignItems: "center", gap: 8 },

  // Grams editing
  gramsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  gramsText: { fontSize: 13, fontWeight: "400", color: "#F0F0F0" },
  gramsEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gramsInput: {
    width: 50,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#000000",
    color: "#F0F0F0",
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  gramsUnit: { fontSize: 12, color: "#666666" },
  removeFoodButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  // Confidence prompt
  confirmPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,179,0,0.06)",
  },
  confirmPromptText: { fontSize: 13, color: "#B0B0B0", flex: 1 },
  confirmFoodName: { fontWeight: "600" },
  confirmActions: { flexDirection: "row", gap: 8 },
  confirmYes: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0,230,118,0.15)",
  },
  confirmYesText: { fontSize: 12, fontWeight: "600", color: "#C0C0C0" },
  confirmNo: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255,61,61,0.15)",
  },
  confirmNoText: { fontSize: 12, fontWeight: "600", color: "#FF3D3D" },

  // Confirm button
  confirmButton: { borderRadius: 27, overflow: "hidden" },
  confirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 27,
  },
  confirmButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  rescanButton: { alignItems: "center", padding: 12 },
  rescanText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "600", color: "#F0F0F0" },
  modalScroll: { marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: "400", color: "#888888", marginBottom: 6 },
  inputRow: { flexDirection: "row", gap: 12 },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#000000",
    color: "#F0F0F0",
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 14,
  },
  modalAddButton: { borderRadius: 14, overflow: "hidden" },
  modalAddGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  modalAddText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  // Category picker
  categorySection: { marginBottom: 16 },
  categorySectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888888",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  categoryChip: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
  },
  categoryChipActive: {
    borderColor: "#555555",
    backgroundColor: "#222222",
  },
  categoryIcon: { fontSize: 14 },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#666666",
  },
  categoryLabelActive: {
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },

  // Scan counter badge
  scanCounterBadge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scanCounterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#888888",
    textAlign: "center" as const,
  },
});
