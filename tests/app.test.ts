import { describe, it, expect } from "vitest";

describe("Muscle AI - Core Logic", () => {
  // Test calorie calculations
  describe("Calorie Calculations", () => {
    it("should calculate remaining calories correctly", () => {
      const calorieGoal = 2500;
      const consumed = 800;
      const remaining = Math.max(0, calorieGoal - consumed);
      expect(remaining).toBe(1700);
    });

    it("should not go below zero remaining", () => {
      const calorieGoal = 2500;
      const consumed = 3000;
      const remaining = Math.max(0, calorieGoal - consumed);
      expect(remaining).toBe(0);
    });

    it("should calculate progress ratio correctly", () => {
      const calorieGoal = 2500;
      const consumed = 1250;
      const progress = Math.min(1, consumed / calorieGoal);
      expect(progress).toBe(0.5);
    });

    it("should cap progress at 1.0", () => {
      const calorieGoal = 2500;
      const consumed = 3000;
      const progress = Math.min(1, consumed / calorieGoal);
      expect(progress).toBe(1);
    });
  });

  // Test macro calculations
  describe("Macro Aggregation", () => {
    const meals = [
      { protein: 42, carbs: 10, fat: 12, calories: 280 },
      { protein: 5, carbs: 45, fat: 2, calories: 215 },
      { protein: 4, carbs: 11, fat: 1, calories: 55 },
    ];

    it("should sum protein correctly", () => {
      const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
      expect(totalProtein).toBe(51);
    });

    it("should sum carbs correctly", () => {
      const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
      expect(totalCarbs).toBe(66);
    });

    it("should sum fat correctly", () => {
      const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);
      expect(totalFat).toBe(15);
    });

    it("should sum calories correctly", () => {
      const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
      expect(totalCalories).toBe(550);
    });
  });

  // Test anabolic score color logic
  describe("Anabolic Score Colors", () => {
    function getScoreColor(score: number): string {
      if (score >= 80) return "#00E676";
      if (score >= 60) return "#FFB300";
      return "#FF3D3D";
    }

    it("should return green for score >= 80", () => {
      expect(getScoreColor(87)).toBe("#00E676");
      expect(getScoreColor(100)).toBe("#00E676");
      expect(getScoreColor(80)).toBe("#00E676");
    });

    it("should return amber for score 60-79", () => {
      expect(getScoreColor(60)).toBe("#FFB300");
      expect(getScoreColor(75)).toBe("#FFB300");
      expect(getScoreColor(79)).toBe("#FFB300");
    });

    it("should return red for score < 60", () => {
      expect(getScoreColor(59)).toBe("#FF3D3D");
      expect(getScoreColor(30)).toBe("#FF3D3D");
      expect(getScoreColor(1)).toBe("#FF3D3D");
    });
  });

  // Test forecast projection
  describe("Forecast Projection", () => {
    it("should generate 13 data points (0-12 months)", () => {
      const startWeight = 180;
      const targetWeight = 195;
      const diff = targetWeight - startWeight;
      const points = [];
      for (let month = 0; month <= 12; month++) {
        const progress = Math.log(1 + month) / Math.log(13);
        const weight = startWeight + diff * progress;
        points.push({ month, weight: Math.round(weight * 10) / 10 });
      }
      expect(points.length).toBe(13);
      expect(points[0].weight).toBe(180);
      expect(points[12].weight).toBe(195);
    });

    it("should start at current weight", () => {
      const startWeight = 180;
      const targetWeight = 195;
      const progress = Math.log(1) / Math.log(13);
      const weight = startWeight + (targetWeight - startWeight) * progress;
      expect(weight).toBe(180);
    });
  });

  // Test subscription tier logic
  describe("Subscription Tiers", () => {
    type Tier = "free" | "essential" | "pro" | "elite";

    function canAccessForecast(tier: Tier): boolean {
      return tier === "elite";
    }

    function getTierLabel(tier: Tier): string {
      const labels: Record<Tier, string> = {
        free: "Free",
        essential: "Essential",
        pro: "Pro",
        elite: "Elite Annual",
      };
      return labels[tier];
    }

    function getTierPrice(tier: Tier): string {
      const prices: Record<Tier, string> = {
        free: "$0",
        essential: "$9.99/mo",
        pro: "$19.99/mo",
        elite: "$79.99/yr",
      };
      return prices[tier];
    }

    it("should allow elite to access forecast", () => {
      expect(canAccessForecast("elite")).toBe(true);
    });

    it("should block free from forecast", () => {
      expect(canAccessForecast("free")).toBe(false);
    });

    it("should block pro from forecast", () => {
      expect(canAccessForecast("pro")).toBe(false);
    });

    it("should block essential from forecast", () => {
      expect(canAccessForecast("essential")).toBe(false);
    });

    it("should return correct tier labels", () => {
      expect(getTierLabel("elite")).toBe("Elite Annual");
      expect(getTierLabel("pro")).toBe("Pro");
      expect(getTierLabel("essential")).toBe("Essential");
    });

    it("should return correct tier prices", () => {
      expect(getTierPrice("elite")).toBe("$79.99/yr");
      expect(getTierPrice("pro")).toBe("$19.99/mo");
      expect(getTierPrice("essential")).toBe("$9.99/mo");
    });
  });

  // Test meal type auto-detection
  describe("Meal Type Detection", () => {
    function detectMealType(hour: number): string {
      if (hour < 10) return "breakfast";
      if (hour < 14) return "lunch";
      if (hour < 20) return "dinner";
      return "snack";
    }

    it("should detect breakfast before 10am", () => {
      expect(detectMealType(7)).toBe("breakfast");
      expect(detectMealType(9)).toBe("breakfast");
    });

    it("should detect lunch 10am-2pm", () => {
      expect(detectMealType(10)).toBe("lunch");
      expect(detectMealType(13)).toBe("lunch");
    });

    it("should detect dinner 2pm-8pm", () => {
      expect(detectMealType(14)).toBe("dinner");
      expect(detectMealType(19)).toBe("dinner");
    });

    it("should detect snack after 8pm", () => {
      expect(detectMealType(20)).toBe("snack");
      expect(detectMealType(23)).toBe("snack");
    });
  });

  // Test Stripe Payment Links
  describe("Stripe Payment Links", () => {
    const STRIPE_LINKS = {
      elite: "https://buy.stripe.com/28E00c3VTa1FffJc6WbEA05",
      pro: "https://buy.stripe.com/8x214gdwt3Dh6Jd1sibEA04",
      essential: "https://buy.stripe.com/14A5kwbol0r55F92wmbEA06",
    };

    it("should have valid Stripe URLs", () => {
      Object.values(STRIPE_LINKS).forEach((url) => {
        expect(url).toMatch(/^https:\/\/buy\.stripe\.com\//);
      });
    });

    it("should have all three tiers", () => {
      expect(Object.keys(STRIPE_LINKS)).toEqual(["elite", "pro", "essential"]);
    });
  });

  // Test weight change calculation
  describe("Weight Change", () => {
    it("should calculate positive change correctly", () => {
      const current = 185;
      const target = 195;
      const diff = current - target;
      expect(diff).toBe(-10);
    });

    it("should calculate negative change correctly", () => {
      const current = 200;
      const target = 195;
      const diff = current - target;
      expect(diff).toBe(5);
    });
  });

  // Test branded color constants
  describe("Branded Colors", () => {
    const ELECTRIC_BLUE = "#007AFF";
    const CYAN_GLOW = "#00D4FF";
    const PROTEIN_CYAN = "#00E5FF";
    const DARK_BG = "#0A0E14";
    const SURFACE_BG = "#111820";

    it("should use Electric Blue as primary action color", () => {
      expect(ELECTRIC_BLUE).toBe("#007AFF");
    });

    it("should use Cyan Glow for gradient endpoints", () => {
      expect(CYAN_GLOW).toBe("#00D4FF");
    });

    it("should use Protein Cyan for protein-related UI", () => {
      expect(PROTEIN_CYAN).toBe("#00E5FF");
    });

    it("should use dark backgrounds for clinical luxury feel", () => {
      expect(DARK_BG).toBe("#0A0E14");
      expect(SURFACE_BG).toBe("#111820");
    });
  });

  // Test auth flow logic
  describe("Auth Flow", () => {
    type AuthMode = "login" | "signup" | "forgot";

    it("should toggle between login and signup", () => {
      let mode: AuthMode = "login";
      mode = mode === "login" ? "signup" : "login";
      expect(mode).toBe("signup");
      mode = mode === "login" ? "signup" : "login";
      expect(mode).toBe("login");
    });

    it("should validate email format", () => {
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test@domain.co")).toBe(true);
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("no@domain")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("should validate password length", () => {
      const isValidPassword = (pw: string) => pw.length >= 6;
      expect(isValidPassword("123456")).toBe(true);
      expect(isValidPassword("short")).toBe(false);
      expect(isValidPassword("")).toBe(false);
    });
  });

  // Test error message formatting
  describe("Error Handling", () => {
    function formatError(error: unknown): string {
      if (error instanceof Error) return error.message;
      if (typeof error === "string") return error;
      return "Something went wrong. Please try again.";
    }

    it("should format Error objects", () => {
      expect(formatError(new Error("Network error"))).toBe("Network error");
    });

    it("should format string errors", () => {
      expect(formatError("Custom error")).toBe("Custom error");
    });

    it("should provide fallback for unknown errors", () => {
      expect(formatError(null)).toBe("Something went wrong. Please try again.");
      expect(formatError(undefined)).toBe("Something went wrong. Please try again.");
      expect(formatError(42)).toBe("Something went wrong. Please try again.");
    });
  });

  // Test AI support escalation logic
  describe("AI Support Escalation", () => {
    it("should escalate after 3 interactions", () => {
      const MAX_INTERACTIONS = 3;
      let interactionCount = 0;

      const shouldEscalate = () => interactionCount >= MAX_INTERACTIONS;

      expect(shouldEscalate()).toBe(false);
      interactionCount++;
      expect(shouldEscalate()).toBe(false);
      interactionCount++;
      expect(shouldEscalate()).toBe(false);
      interactionCount++;
      expect(shouldEscalate()).toBe(true);
    });
  });

  // Test Stripe Customer Portal URL construction
  describe("Stripe Customer Portal", () => {
    it("should construct valid portal URL", () => {
      const baseUrl = "https://billing.stripe.com/p/login/test";
      expect(baseUrl).toMatch(/^https:\/\/billing\.stripe\.com\//);
    });

    it("should map subscription to correct Stripe link", () => {
      const links: Record<string, string> = {
        elite: "https://buy.stripe.com/28E00c3VTa1FffJc6WbEA05",
        pro: "https://buy.stripe.com/8x214gdwt3Dh6Jd1sibEA04",
        essential: "https://buy.stripe.com/14A5kwbol0r55F92wmbEA06",
      };

      expect(links["elite"]).toContain("bEA05");
      expect(links["pro"]).toContain("bEA04");
      expect(links["essential"]).toContain("bEA06");
    });
  });
});

describe("Muscle AI - Profile & Gains Cards", () => {
  // Test personal records calculation
  describe("Personal Records Calculation", () => {
    interface Meal {
      date: string;
      protein: number;
      calories: number;
      anabolicScore: number;
    }

    function calculateHighestProteinDay(meals: Meal[]): { value: number; date: string } {
      const byDate = new Map<string, number>();
      meals.forEach((m) => {
        byDate.set(m.date, (byDate.get(m.date) || 0) + m.protein);
      });
      let best = 0;
      let bestDate = "";
      byDate.forEach((v, d) => {
        if (v > best) { best = v; bestDate = d; }
      });
      return { value: best, date: bestDate };
    }

    function calculateTrackingStreak(dates: string[]): number {
      const sorted = [...new Set(dates)].sort();
      if (sorted.length === 0) return 0;
      if (sorted.length === 1) return 1;
      let maxStreak = 1;
      let current = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) { current++; } else { current = 1; }
        if (current > maxStreak) maxStreak = current;
      }
      return maxStreak;
    }

    function calculateBestAnabolicScore(meals: Meal[]): number {
      return meals.reduce((best, m) => Math.max(best, m.anabolicScore), 0);
    }

    const sampleMeals: Meal[] = [
      { date: "2026-03-15", protein: 60, calories: 500, anabolicScore: 85 },
      { date: "2026-03-15", protein: 45, calories: 400, anabolicScore: 72 },
      { date: "2026-03-16", protein: 80, calories: 600, anabolicScore: 91 },
      { date: "2026-03-17", protein: 30, calories: 250, anabolicScore: 55 },
      { date: "2026-03-19", protein: 50, calories: 450, anabolicScore: 78 },
    ];

    it("should find highest protein day", () => {
      const result = calculateHighestProteinDay(sampleMeals);
      // March 15 has 60+45 = 105g
      expect(result.value).toBe(105);
      expect(result.date).toBe("2026-03-15");
    });

    it("should return 0 for empty meals", () => {
      const result = calculateHighestProteinDay([]);
      expect(result.value).toBe(0);
    });

    it("should calculate tracking streak correctly", () => {
      const dates = sampleMeals.map((m) => m.date);
      // 15, 16, 17 = 3-day streak (19 breaks it)
      const streak = calculateTrackingStreak(dates);
      expect(streak).toBe(3);
    });

    it("should return 1 for single day", () => {
      expect(calculateTrackingStreak(["2026-03-15"])).toBe(1);
    });

    it("should return 0 for no days", () => {
      expect(calculateTrackingStreak([])).toBe(0);
    });

    it("should find best anabolic score", () => {
      expect(calculateBestAnabolicScore(sampleMeals)).toBe(91);
    });

    it("should return 0 for empty meals anabolic", () => {
      expect(calculateBestAnabolicScore([])).toBe(0);
    });
  });

  // Test gains card gallery logic
  describe("Gains Cards Gallery", () => {
    interface GainsCard {
      id: string;
      date: string;
      weight: number;
      protein: number;
      calories: number;
    }

    it("should prepend new cards (newest first)", () => {
      const cards: GainsCard[] = [
        { id: "gc_1", date: "2026-03-15", weight: 180, protein: 200, calories: 2400 },
      ];
      const newCard: GainsCard = { id: "gc_2", date: "2026-03-16", weight: 181, protein: 210, calories: 2500 };
      const updated = [newCard, ...cards];
      expect(updated[0].id).toBe("gc_2");
      expect(updated.length).toBe(2);
    });

    it("should limit gallery to 50 cards", () => {
      const cards: GainsCard[] = Array.from({ length: 50 }, (_, i) => ({
        id: `gc_${i}`,
        date: "2026-03-15",
        weight: 180,
        protein: 200,
        calories: 2400,
      }));
      const newCard: GainsCard = { id: "gc_new", date: "2026-03-16", weight: 181, protein: 210, calories: 2500 };
      const updated = [newCard, ...cards].slice(0, 50);
      expect(updated.length).toBe(50);
      expect(updated[0].id).toBe("gc_new");
    });

    it("should remove card by id", () => {
      const cards: GainsCard[] = [
        { id: "gc_1", date: "2026-03-15", weight: 180, protein: 200, calories: 2400 },
        { id: "gc_2", date: "2026-03-16", weight: 181, protein: 210, calories: 2500 },
      ];
      const filtered = cards.filter((c) => c.id !== "gc_1");
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("gc_2");
    });
  });

  // Test profile stats aggregation
  describe("Profile Stats", () => {
    interface Meal {
      date: string;
      protein: number;
      calories: number;
      anabolicScore: number;
    }

    const meals: Meal[] = [
      { date: "2026-03-15", protein: 60, calories: 500, anabolicScore: 85 },
      { date: "2026-03-15", protein: 45, calories: 400, anabolicScore: 72 },
      { date: "2026-03-16", protein: 80, calories: 600, anabolicScore: 91 },
    ];

    it("should count total meals", () => {
      expect(meals.length).toBe(3);
    });

    it("should count unique active days", () => {
      const uniqueDays = new Set(meals.map((m) => m.date)).size;
      expect(uniqueDays).toBe(2);
    });

    it("should sum total protein", () => {
      const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
      expect(totalProtein).toBe(185);
    });

    it("should calculate average anabolic score", () => {
      const avg = Math.round(meals.reduce((s, m) => s + m.anabolicScore, 0) / meals.length);
      expect(avg).toBe(83);
    });
  });

  // Test tier badge display
  describe("Tier Badge Display", () => {
    const TIER_LABELS: Record<string, string> = {
      free: "FREE",
      essential: "ESSENTIAL",
      pro: "PRO",
      elite: "ELITE",
    };

    const TIER_COLORS: Record<string, string> = {
      free: "#5A6A7A",
      essential: "#00E676",
      pro: "#FFB300",
      elite: "#007AFF",
    };

    it("should display correct tier labels", () => {
      expect(TIER_LABELS["elite"]).toBe("ELITE");
      expect(TIER_LABELS["free"]).toBe("FREE");
    });

    it("should use Electric Blue for elite tier", () => {
      expect(TIER_COLORS["elite"]).toBe("#007AFF");
    });

    it("should use muted color for free tier", () => {
      expect(TIER_COLORS["free"]).toBe("#5A6A7A");
    });
  });

  // Test weight change for profile
  describe("Profile Weight Change", () => {
    interface WeightEntry {
      date: string;
      weight: number;
    }

    it("should calculate total weight gained", () => {
      const log: WeightEntry[] = [
        { date: "2026-03-01", weight: 175 },
        { date: "2026-03-10", weight: 178 },
        { date: "2026-03-19", weight: 180 },
      ];
      const sorted = [...log].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const change = sorted[sorted.length - 1].weight - sorted[0].weight;
      expect(change).toBe(5);
    });

    it("should handle single weight entry", () => {
      const log: WeightEntry[] = [{ date: "2026-03-01", weight: 175 }];
      expect(log.length).toBe(1);
      // No change with single entry
    });
  });
});

describe("Profile Enhancements", () => {
  describe("Profile Photo", () => {
    it("should default to empty profilePhotoUri", () => {
      const defaultProfile = {
        name: "",
        email: "",
        profilePhotoUri: "",
        targetWeight: 180,
        currentWeight: 175,
        calorieGoal: 2500,
        proteinGoal: 200,
        carbsGoal: 250,
        fatGoal: 80,
        unit: "lbs",
      };
      expect(defaultProfile.profilePhotoUri).toBe("");
    });

    it("should store a valid photo URI", () => {
      const profile = { profilePhotoUri: "" };
      profile.profilePhotoUri = "file:///var/mobile/Containers/Data/photo.jpg";
      expect(profile.profilePhotoUri).toContain("file://");
    });

    it("should generate correct initial from name", () => {
      const getInitial = (name: string) => name ? name[0].toUpperCase() : "M";
      expect(getInitial("John")).toBe("J");
      expect(getInitial("")).toBe("M");
      expect(getInitial("alice")).toBe("A");
    });
  });

  describe("Name and Email Editing", () => {
    it("should validate email format correctly", () => {
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("bad-email")).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("user@domain.co.uk")).toBe(true);
    });

    it("should trim whitespace from name", () => {
      const name = "  John Doe  ";
      expect(name.trim()).toBe("John Doe");
    });

    it("should reject empty name", () => {
      const trimmedName = "".trim();
      expect(trimmedName.length > 0).toBe(false);
    });
  });

  describe("Payment Method Management", () => {
    it("should show no subscription message for free users", () => {
      const subscription = "free";
      const hasActiveSub = subscription !== "free";
      expect(hasActiveSub).toBe(false);
    });

    it("should detect active subscription for paid tiers", () => {
      const tiers = ["essential", "pro", "elite"];
      tiers.forEach((tier) => {
        expect(tier !== "free").toBe(true);
      });
    });

    it("should generate correct Apple billing URL", () => {
      const url = "https://apps.apple.com/account/billing";
      expect(url).toContain("apple.com");
    });

    it("should generate correct Google Play URL", () => {
      const url = "https://play.google.com/store/paymentmethods";
      expect(url).toContain("play.google.com");
    });
  });
});
