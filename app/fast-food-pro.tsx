import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";

// ─── Types ───
interface MenuItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tip: string;
}

interface Restaurant {
  id: string;
  name: string;
  category: string;
  items: MenuItem[];
}

// ─── Fast Food Database ───
const RESTAURANTS: Restaurant[] = [
  {
    id: "culvers",
    name: "Culver's",
    category: "Burgers",
    items: [
      { name: "ButterBurger (Single)", calories: 390, protein: 25, carbs: 38, fat: 17, tip: "Skip the cheese to save 70 cal" },
      { name: "ButterBurger (Double)", calories: 540, protein: 38, carbs: 38, fat: 28, tip: "Best protein-to-calorie ratio on the menu" },
      { name: "Grilled Chicken Sandwich", calories: 420, protein: 36, carbs: 40, fat: 14, tip: "Ask for no mayo to cut 100 cal" },
      { name: "Chicken Tenders (4pc)", calories: 460, protein: 28, carbs: 28, fat: 26, tip: "Pair with side salad instead of fries" },
      { name: "Garden Fresco Salad w/ Chicken", calories: 350, protein: 32, carbs: 18, fat: 16, tip: "Use half the dressing to save 80 cal" },
    ],
  },
  {
    id: "chickfila",
    name: "Chick-fil-A",
    category: "Chicken",
    items: [
      { name: "Grilled Chicken Sandwich", calories: 390, protein: 28, carbs: 44, fat: 12, tip: "One of the leanest fast food sandwiches" },
      { name: "Grilled Nuggets (12ct)", calories: 200, protein: 38, carbs: 2, fat: 4, tip: "Elite protein density — 38g for 200 cal" },
      { name: "Grilled Chicken Cool Wrap", calories: 350, protein: 28, carbs: 29, fat: 14, tip: "Great macro balance for a wrap" },
      { name: "Egg White Grill", calories: 300, protein: 25, carbs: 31, fat: 7, tip: "Best breakfast option for lean bulking" },
      { name: "Spicy Southwest Salad", calories: 450, protein: 33, carbs: 40, fat: 19, tip: "Ask for grilled chicken instead of fried" },
    ],
  },
  {
    id: "chipotle",
    name: "Chipotle",
    category: "Mexican",
    items: [
      { name: "Chicken Bowl (no rice)", calories: 400, protein: 46, carbs: 16, fat: 16, tip: "Double chicken for +32g protein (+$3)" },
      { name: "Steak Bowl (no rice)", calories: 430, protein: 44, carbs: 16, fat: 20, tip: "Extra fajita veggies are free" },
      { name: "Chicken Burrito", calories: 665, protein: 42, carbs: 72, fat: 22, tip: "Great for bulking — skip sour cream to cut 110 cal" },
      { name: "Sofritas Bowl", calories: 380, protein: 18, carbs: 40, fat: 16, tip: "Add chicken for a complete amino acid profile" },
      { name: "Chicken Salad Bowl", calories: 480, protein: 44, carbs: 24, fat: 22, tip: "Skip the chips — they add 570 empty cal" },
    ],
  },
  {
    id: "mcdonalds",
    name: "McDonald's",
    category: "Burgers",
    items: [
      { name: "McDouble (no bun)", calories: 240, protein: 20, carbs: 7, fat: 15, tip: "Keto-friendly option with solid protein" },
      { name: "Egg McMuffin", calories: 300, protein: 17, carbs: 30, fat: 12, tip: "Best breakfast macro ratio at McDonald's" },
      { name: "Grilled Chicken Sandwich", calories: 400, protein: 28, carbs: 44, fat: 12, tip: "Ask for no mayo to save 100 cal" },
      { name: "6pc Chicken McNuggets", calories: 250, protein: 15, carbs: 15, fat: 15, tip: "Pair with a side salad for a balanced meal" },
      { name: "Southwest Grilled Chicken Salad", calories: 350, protein: 37, carbs: 20, fat: 14, tip: "Use half the dressing packet" },
    ],
  },
  {
    id: "subway",
    name: "Subway",
    category: "Subs",
    items: [
      { name: "Rotisserie Chicken (6\")", calories: 350, protein: 29, carbs: 44, fat: 7, tip: "One of the leanest sub options" },
      { name: "Turkey Breast (6\")", calories: 280, protein: 18, carbs: 44, fat: 3, tip: "Add double meat for +12g protein" },
      { name: "Steak & Cheese (6\")", calories: 380, protein: 26, carbs: 44, fat: 12, tip: "Skip the cheese to save 50 cal" },
      { name: "Chicken Breast (6\")", calories: 320, protein: 23, carbs: 44, fat: 5, tip: "Load up on veggies — they're free" },
      { name: "Protein Bowl (Chicken)", calories: 240, protein: 26, carbs: 12, fat: 8, tip: "Best option for low-carb high-protein" },
    ],
  },
  {
    id: "wendys",
    name: "Wendy's",
    category: "Burgers",
    items: [
      { name: "Jr. Hamburger", calories: 250, protein: 13, carbs: 25, fat: 12, tip: "Order 2 for 26g protein under 500 cal" },
      { name: "Grilled Chicken Sandwich", calories: 370, protein: 34, carbs: 36, fat: 10, tip: "Best protein-per-calorie sandwich" },
      { name: "Grilled Chicken Wrap", calories: 270, protein: 20, carbs: 24, fat: 10, tip: "Light and lean — great for cutting" },
      { name: "Power Mediterranean Chicken Salad", calories: 480, protein: 43, carbs: 24, fat: 24, tip: "Use half the dressing to cut 100 cal" },
      { name: "Chili (Large)", calories: 330, protein: 23, carbs: 31, fat: 12, tip: "High protein comfort food — great in winter" },
    ],
  },
  {
    id: "tacobell",
    name: "Taco Bell",
    category: "Mexican",
    items: [
      { name: "Power Menu Bowl (Chicken)", calories: 470, protein: 26, carbs: 50, fat: 20, tip: "Ask for extra chicken (+$1)" },
      { name: "Chicken Soft Taco (Fresco)", calories: 140, protein: 12, carbs: 16, fat: 3, tip: "Order 3 for 36g protein at 420 cal" },
      { name: "Black Bean Crunchwrap", calories: 510, protein: 13, carbs: 72, fat: 18, tip: "Add chicken for +12g protein" },
      { name: "Grilled Chicken Burrito", calories: 430, protein: 22, carbs: 50, fat: 16, tip: "Decent macro split for a burrito" },
      { name: "Chicken Quesadilla", calories: 510, protein: 28, carbs: 38, fat: 28, tip: "High in fat but good protein" },
    ],
  },
  {
    id: "popeyes",
    name: "Popeyes",
    category: "Chicken",
    items: [
      { name: "Blackened Chicken Tenders (5pc)", calories: 260, protein: 44, carbs: 2, fat: 8, tip: "Best protein-to-calorie ratio in fast food" },
      { name: "Chicken Sandwich (Classic)", calories: 700, protein: 28, carbs: 50, fat: 42, tip: "Very high fat — save for cheat day" },
      { name: "3pc Mild Chicken (Breast, Leg, Thigh)", calories: 710, protein: 52, carbs: 28, fat: 42, tip: "Remove skin to cut 150+ cal" },
      { name: "Green Beans (Regular)", calories: 50, protein: 2, carbs: 7, fat: 2, tip: "Best side — skip the fries" },
      { name: "Red Beans & Rice (Regular)", calories: 230, protein: 9, carbs: 31, fat: 8, tip: "Decent complex carb side" },
    ],
  },
];

// ─── Helpers ───
function proteinScore(item: MenuItem): number {
  return item.calories > 0 ? Math.round((item.protein * 4 / item.calories) * 100) : 0;
}

function scoreColor(pct: number): string {
  if (pct >= 40) return "#FFFFFF";
  if (pct >= 25) return "#C0C0C0";
  return "#888888";
}

export default function FastFoodProScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const filteredRestaurants = useMemo(() => {
    if (!search.trim()) return RESTAURANTS;
    const q = search.toLowerCase();
    return RESTAURANTS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.items.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [search]);

  const selectedRestaurant = useMemo(
    () => RESTAURANTS.find((r) => r.id === selectedChain),
    [selectedChain]
  );

  const sortedItems = useMemo(() => {
    if (!selectedRestaurant) return [];
    return [...selectedRestaurant.items].sort(
      (a, b) => proteinScore(b) - proteinScore(a)
    );
  }, [selectedRestaurant]);

  const renderChainItem = ({ item }: { item: Restaurant }) => {
    const topItem = [...item.items].sort((a, b) => proteinScore(b) - proteinScore(a))[0];
    const topScore = proteinScore(topItem);
    return (
      <TouchableOpacity
        style={st.chainCard}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedChain(item.id);
        }}
        activeOpacity={0.7}
      >
        <View style={st.chainInfo}>
          <Text style={st.chainName}>{item.name}</Text>
          <Text style={st.chainCategory}>{item.category} · {item.items.length} items</Text>
        </View>
        <View style={st.chainRight}>
          <Text style={[st.chainTopScore, { color: scoreColor(topScore) }]}>
            {topScore}%
          </Text>
          <Text style={st.chainTopLabel}>TOP</Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#444444" />
      </TouchableOpacity>
    );
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const pScore = proteinScore(item);
    return (
      <View style={st.menuItem}>
        <View style={st.menuItemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={st.menuItemName}>{item.name}</Text>
            <Text style={st.menuItemMacros}>
              {item.calories} cal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
            </Text>
          </View>
          <View style={[st.proteinBadge, { borderColor: scoreColor(pScore) + "40", backgroundColor: scoreColor(pScore) + "10" }]}>
            <Text style={[st.proteinBadgeText, { color: scoreColor(pScore) }]}>{pScore}%</Text>
            <Text style={st.proteinBadgeLabel}>protein</Text>
          </View>
        </View>
        <View style={st.tipRow}>
          <IconSymbol name="bolt.fill" size={12} color="#888888" />
          <Text style={st.tipText}>{item.tip}</Text>
        </View>
      </View>
    );
  };

  // ─── Detail View ───
  if (selectedRestaurant) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={st.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedChain(null);
            }}
            style={st.backButton}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.left" size={24} color="#F0F0F0" />
          </TouchableOpacity>
          <Text style={st.topBarTitle}>{selectedRestaurant.name}</Text>
          <View style={st.backButton} />
        </View>

        <View style={st.detailHeader}>
          <Text style={st.detailSubtitle}>Ranked by protein density</Text>
        </View>

        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.name}
          renderItem={renderMenuItem}
          contentContainerStyle={st.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={st.separator} />}
        />
      </ScreenContainer>
    );
  }

  // ─── List View ───
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={st.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={st.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.left" size={24} color="#F0F0F0" />
        </TouchableOpacity>
        <Text style={st.topBarTitle}>Fast Food Pro</Text>
        <View style={st.backButton} />
      </View>

      {/* Header */}
      <View style={st.headerSection}>
        <LinearGradient
          colors={["rgba(255,255,255,0.04)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
        <IconSymbol name="storefront.fill" size={28} color="#FFFFFF" />
        <Text style={st.headerTitle}>Highest Protein Options</Text>
        <Text style={st.headerSubtitle}>
          AI-ranked menu items at major chains, sorted by protein-to-calorie ratio
        </Text>
      </View>

      {/* Search */}
      <View style={st.searchContainer}>
        <IconSymbol name="magnifyingglass" size={18} color="#666666" />
        <TextInput
          style={st.searchInput}
          placeholder="Search chains or menu items..."
          placeholderTextColor="#444444"
          value={search}
          onChangeText={setSearch}
          returnKeyType="done"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
            <IconSymbol name="xmark.circle.fill" size={18} color="#444444" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={renderChainItem}
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={st.separator} />}
        ListEmptyComponent={
          <View style={st.emptyState}>
            <Text style={st.emptyText}>No restaurants found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const st = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  topBarTitle: { fontFamily: Typography.fontFamily, fontSize: 18, fontWeight: "600", color: "#F0F0F0" },
  headerSection: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A1A1A",
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  headerTitle: { fontFamily: Typography.fontFamilyBold, fontSize: 20, fontWeight: "700", color: "#F0F0F0", textAlign: "center" },
  headerSubtitle: { fontFamily: Typography.fontFamily, fontSize: 13, color: "#666666", textAlign: "center", lineHeight: 18 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
    backgroundColor: "#0A0A0A",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: 15,
    color: "#F0F0F0",
    height: "100%",
  },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  separator: { height: 1, backgroundColor: "#111111", marginVertical: 2 },
  chainCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  chainInfo: { flex: 1, gap: 2 },
  chainName: { fontFamily: Typography.fontFamily, fontSize: 16, fontWeight: "600", color: "#F0F0F0" },
  chainCategory: { fontFamily: Typography.fontFamily, fontSize: 13, color: "#666666" },
  chainRight: { alignItems: "center" },
  chainTopScore: { fontFamily: Typography.fontFamilyBold, fontSize: 18, fontWeight: "700" },
  chainTopLabel: { fontFamily: Typography.fontFamily, fontSize: 9, color: "#444444", letterSpacing: 1.5 },
  detailHeader: { paddingHorizontal: 16, paddingBottom: 8 },
  detailSubtitle: { fontFamily: Typography.fontFamily, fontSize: 13, color: "#666666" },
  menuItem: { paddingVertical: 14, gap: 8 },
  menuItemHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  menuItemName: { fontFamily: Typography.fontFamily, fontSize: 16, fontWeight: "600", color: "#F0F0F0" },
  menuItemMacros: { fontFamily: Typography.fontFamily, fontSize: 13, color: "#888888", marginTop: 2 },
  proteinBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
  },
  proteinBadgeText: { fontFamily: Typography.fontFamilyBold, fontSize: 16, fontWeight: "700" },
  proteinBadgeLabel: { fontFamily: Typography.fontFamily, fontSize: 9, color: "#666666", letterSpacing: 1 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 2 },
  tipText: { fontFamily: Typography.fontFamily, fontSize: 12, color: "#888888", flex: 1, lineHeight: 16 },
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontFamily: Typography.fontFamily, fontSize: 15, color: "#444444" },
});
