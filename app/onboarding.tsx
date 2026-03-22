import { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const PRIMARY_WHITE = "#FFFFFF";
const SILVER = "#C0C0C0";

interface SlideData {
  id: string;
  title: string;
  highlight: string;
  subtitle: string;
  icon: "flame.fill" | "camera.fill" | "chart.line.uptrend.xyaxis";
  iconSize: number;
}

const slides: SlideData[] = [
  {
    id: "1",
    title: "ACHIEVE PEAK",
    highlight: "PERFORMANCE",
    subtitle: "Optimize your training with AI-powered nutrition tracking",
    icon: "flame.fill",
    iconSize: 64,
  },
  {
    id: "2",
    title: "THE ULTIMATE",
    highlight: "NUTRITION OS",
    subtitle: "Calculate calories, scan your meals, and track every macro",
    icon: "camera.fill",
    iconSize: 64,
  },
  {
    id: "3",
    title: "UNLOCK YOUR",
    highlight: "12-MONTH JOURNEY",
    subtitle: "Achieve your goals with precision AI planning and forecasting",
    icon: "chart.line.uptrend.xyaxis",
    iconSize: 64,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace("/auth");
    }
  };

  const handleSkip = () => {
    router.replace("/auth");
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow}>
            <IconSymbol name={item.icon} size={item.iconSize} color={"#FFFFFF"} />
          </View>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.highlight}>{item.highlight}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        <View style={styles.bottomSection}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentIndex ? "#FFFFFF" : "#222222",
                    width: index === currentIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FFFFFF", "#C0C0C0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: {
    position: "absolute",
    top: 8,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: { fontSize: 16, fontWeight: "500", color: "#666666" },
  slide: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  slideContent: { alignItems: "center", gap: 16 },
  iconContainer: { marginBottom: 24 },
  iconGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,122,255,0.1)",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 2,
    color: "#F0F0F0",
  },
  highlight: {
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
    marginTop: -8,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginTop: 8,
    paddingHorizontal: 20,
    color: "#888888",
  },
  bottomSection: { paddingHorizontal: 24, paddingBottom: 24, gap: 24 },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  nextButton: { borderRadius: 28, overflow: "hidden" },
  nextGradient: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
