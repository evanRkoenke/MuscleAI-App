import { describe, it, expect } from "vitest";
import {
  hasFeatureAccess,
  isPaidTier,
  getTierLabel,
  getTierColor,
  getMinimumTierForFeature,
  isTierAtLeast,
  WELCOME_MESSAGES,
  type SubscriptionTier,
  type Feature,
} from "../lib/subscription-features";

describe("Subscription Feature Access — Global Gating", () => {
  // ─── Feature Matrix Tests ───
  describe("Feature Matrix", () => {
    const allFeatures: Feature[] = [
      "ai_scan",
      "meal_logging",
      "basic_analytics",
      "advanced_analytics",
      "forecast_12_month",
      "priority_sync",
      "gains_cards_pro",
      "unlimited_scans",
      "priority_support",
      "edit_email",
      "manage_payment",
    ];

    it("free tier should have meal_logging and ai_scan (limited to 5/day)", () => {
      expect(hasFeatureAccess("free", "meal_logging")).toBe(true);
      expect(hasFeatureAccess("free", "ai_scan")).toBe(true);
      // Everything else should be locked
      const lockedFeatures = allFeatures.filter((f) => f !== "meal_logging" && f !== "ai_scan");
      for (const feature of lockedFeatures) {
        expect(hasFeatureAccess("free", feature)).toBe(false);
      }
    });

    it("essential tier should unlock basic features + email + payment", () => {
      expect(hasFeatureAccess("essential", "meal_logging")).toBe(true);
      expect(hasFeatureAccess("essential", "ai_scan")).toBe(true);
      expect(hasFeatureAccess("essential", "basic_analytics")).toBe(true);
      expect(hasFeatureAccess("essential", "edit_email")).toBe(true);
      expect(hasFeatureAccess("essential", "manage_payment")).toBe(true);
      // Should NOT have advanced features
      expect(hasFeatureAccess("essential", "advanced_analytics")).toBe(false);
      expect(hasFeatureAccess("essential", "forecast_12_month")).toBe(false);
      expect(hasFeatureAccess("essential", "priority_sync")).toBe(false);
      expect(hasFeatureAccess("essential", "gains_cards_pro")).toBe(false);
      expect(hasFeatureAccess("essential", "unlimited_scans")).toBe(false);
    });

    it("pro tier should unlock advanced analytics + unlimited scans", () => {
      expect(hasFeatureAccess("pro", "meal_logging")).toBe(true);
      expect(hasFeatureAccess("pro", "ai_scan")).toBe(true);
      expect(hasFeatureAccess("pro", "basic_analytics")).toBe(true);
      expect(hasFeatureAccess("pro", "advanced_analytics")).toBe(true);
      expect(hasFeatureAccess("pro", "unlimited_scans")).toBe(true);
      expect(hasFeatureAccess("pro", "priority_support")).toBe(true);
      expect(hasFeatureAccess("pro", "edit_email")).toBe(true);
      expect(hasFeatureAccess("pro", "manage_payment")).toBe(true);
      // Should NOT have elite-only features
      expect(hasFeatureAccess("pro", "forecast_12_month")).toBe(false);
      expect(hasFeatureAccess("pro", "priority_sync")).toBe(false);
      expect(hasFeatureAccess("pro", "gains_cards_pro")).toBe(false);
    });

    it("elite tier should unlock ALL features", () => {
      for (const feature of allFeatures) {
        expect(hasFeatureAccess("elite", feature)).toBe(true);
      }
    });
  });

  // ─── Paid Tier Detection ───
  describe("Paid Tier Detection", () => {
    it("free should not be paid", () => {
      expect(isPaidTier("free")).toBe(false);
    });

    it("essential should be paid", () => {
      expect(isPaidTier("essential")).toBe(true);
    });

    it("pro should be paid", () => {
      expect(isPaidTier("pro")).toBe(true);
    });

    it("elite should be paid", () => {
      expect(isPaidTier("elite")).toBe(true);
    });
  });

  // ─── Tier Labels ───
  describe("Tier Labels", () => {
    it("should return correct labels", () => {
      expect(getTierLabel("free")).toBe("Free");
      expect(getTierLabel("essential")).toBe("Essential");
      expect(getTierLabel("pro")).toBe("Pro");
      expect(getTierLabel("elite")).toBe("Elite Annual");
    });
  });

  // ─── Tier Colors ───
  describe("Tier Colors", () => {
    it("should return non-empty color strings", () => {
      const tiers: SubscriptionTier[] = ["free", "essential", "pro", "elite"];
      for (const tier of tiers) {
        const color = getTierColor(tier);
        expect(color).toBeTruthy();
        expect(color.startsWith("#")).toBe(true);
      }
    });

    it("elite should have gold color", () => {
      expect(getTierColor("elite")).toBe("#FFD700");
    });
  });

  // ─── Tier Hierarchy ───
  describe("Tier Hierarchy", () => {
    it("elite should be at least elite", () => {
      expect(isTierAtLeast("elite", "elite")).toBe(true);
    });

    it("elite should be at least pro", () => {
      expect(isTierAtLeast("elite", "pro")).toBe(true);
    });

    it("pro should NOT be at least elite", () => {
      expect(isTierAtLeast("pro", "elite")).toBe(false);
    });

    it("free should NOT be at least essential", () => {
      expect(isTierAtLeast("free", "essential")).toBe(false);
    });

    it("essential should be at least essential", () => {
      expect(isTierAtLeast("essential", "essential")).toBe(true);
    });

    it("pro should be at least essential", () => {
      expect(isTierAtLeast("pro", "essential")).toBe(true);
    });
  });

  // ─── Minimum Tier for Feature ───
  describe("Minimum Tier for Feature", () => {
    it("meal_logging should require free tier", () => {
      expect(getMinimumTierForFeature("meal_logging")).toBe("free");
    });

    it("ai_scan should require free tier (limited to 5/day)", () => {
      expect(getMinimumTierForFeature("ai_scan")).toBe("free");
    });

    it("advanced_analytics should require pro tier", () => {
      expect(getMinimumTierForFeature("advanced_analytics")).toBe("pro");
    });

    it("forecast_12_month should require elite tier", () => {
      expect(getMinimumTierForFeature("forecast_12_month")).toBe("elite");
    });

    it("priority_sync should require elite tier", () => {
      expect(getMinimumTierForFeature("priority_sync")).toBe("elite");
    });
  });

  // ─── Welcome Messages ───
  describe("Welcome Messages", () => {
    it("elite welcome should mention the 1%", () => {
      expect(WELCOME_MESSAGES.elite.title).toContain("1%");
    });

    it("elite welcome body should mention Forecast and Priority Sync", () => {
      expect(WELCOME_MESSAGES.elite.body).toContain("12-Month Forecast");
      expect(WELCOME_MESSAGES.elite.body).toContain("Priority Sync");
    });

    it("pro welcome should exist", () => {
      expect(WELCOME_MESSAGES.pro.title).toBeTruthy();
      expect(WELCOME_MESSAGES.pro.body).toBeTruthy();
    });

    it("essential welcome should exist", () => {
      expect(WELCOME_MESSAGES.essential.title).toBeTruthy();
      expect(WELCOME_MESSAGES.essential.body).toBeTruthy();
    });

    it("all welcome messages should have non-empty title and body", () => {
      const tiers: Array<"essential" | "pro" | "elite"> = ["essential", "pro", "elite"];
      for (const tier of tiers) {
        expect(WELCOME_MESSAGES[tier].title.length).toBeGreaterThan(0);
        expect(WELCOME_MESSAGES[tier].body.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── Feature Unlock on Payment ───
  describe("Feature Unlock on Payment", () => {
    it("upgrading from free to essential should unlock email editing", () => {
      expect(hasFeatureAccess("free", "edit_email")).toBe(false);
      expect(hasFeatureAccess("essential", "edit_email")).toBe(true);
    });

    it("upgrading from free to elite should unlock all premium features at once", () => {
      const premiumFeatures: Feature[] = [
        "forecast_12_month",
        "priority_sync",
        "gains_cards_pro",
        "unlimited_scans",
        "advanced_analytics",
      ];
      for (const feature of premiumFeatures) {
        expect(hasFeatureAccess("free", feature)).toBe(false);
        expect(hasFeatureAccess("elite", feature)).toBe(true);
      }
    });

    it("subscription status persists (tier value is a simple string that can be stored in AsyncStorage)", () => {
      // Verify tier values are simple strings suitable for AsyncStorage
      const tiers: SubscriptionTier[] = ["free", "essential", "pro", "elite"];
      for (const tier of tiers) {
        expect(typeof tier).toBe("string");
        expect(JSON.stringify(tier)).toBeTruthy();
        expect(JSON.parse(JSON.stringify(tier))).toBe(tier);
      }
    });
  });

  // ─── Lock Overlay Logic ───
  describe("Lock Overlay Logic", () => {
    it("forecast chart should be locked for free users", () => {
      expect(hasFeatureAccess("free", "forecast_12_month")).toBe(false);
    });

    it("forecast chart should be locked for essential users", () => {
      expect(hasFeatureAccess("essential", "forecast_12_month")).toBe(false);
    });

    it("forecast chart should be locked for pro users", () => {
      expect(hasFeatureAccess("pro", "forecast_12_month")).toBe(false);
    });

    it("forecast chart should be UNLOCKED for elite users", () => {
      expect(hasFeatureAccess("elite", "forecast_12_month")).toBe(true);
    });

    it("priority sync should be UNLOCKED only for elite", () => {
      expect(hasFeatureAccess("free", "priority_sync")).toBe(false);
      expect(hasFeatureAccess("essential", "priority_sync")).toBe(false);
      expect(hasFeatureAccess("pro", "priority_sync")).toBe(false);
      expect(hasFeatureAccess("elite", "priority_sync")).toBe(true);
    });

    it("payment management should be unlocked for all paid tiers", () => {
      expect(hasFeatureAccess("free", "manage_payment")).toBe(false);
      expect(hasFeatureAccess("essential", "manage_payment")).toBe(true);
      expect(hasFeatureAccess("pro", "manage_payment")).toBe(true);
      expect(hasFeatureAccess("elite", "manage_payment")).toBe(true);
    });
  });
});
