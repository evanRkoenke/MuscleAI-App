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

describe("Subscription Feature Access — Two-Plan Model (No Trial)", () => {
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

    it("none tier should have NO features", () => {
      for (const feature of allFeatures) {
        expect(hasFeatureAccess("none", feature)).toBe(false);
      }
    });

    it("monthly tier should unlock ALL features", () => {
      for (const feature of allFeatures) {
        expect(hasFeatureAccess("monthly", feature)).toBe(true);
      }
    });

    it("annual tier should unlock ALL features", () => {
      for (const feature of allFeatures) {
        expect(hasFeatureAccess("annual", feature)).toBe(true);
      }
    });
  });

  // ─── Paid Tier Detection ───
  describe("Paid Tier Detection", () => {
    it("none should not be paid", () => {
      expect(isPaidTier("none")).toBe(false);
    });

    it("monthly should be paid", () => {
      expect(isPaidTier("monthly")).toBe(true);
    });

    it("annual should be paid", () => {
      expect(isPaidTier("annual")).toBe(true);
    });
  });

  // ─── Tier Labels ───
  describe("Tier Labels", () => {
    it("should return correct labels", () => {
      expect(getTierLabel("none")).toBe("No Plan");
      expect(getTierLabel("monthly")).toBe("Monthly Essential");
      expect(getTierLabel("annual")).toBe("Elite Annual");
    });
  });

  // ─── Tier Colors ───
  describe("Tier Colors", () => {
    it("should return non-empty color strings", () => {
      const tiers: SubscriptionTier[] = ["none", "monthly", "annual"];
      for (const tier of tiers) {
        const color = getTierColor(tier);
        expect(color).toBeTruthy();
        expect(color.startsWith("#")).toBe(true);
      }
    });

    it("annual should have white color", () => {
      expect(getTierColor("annual")).toBe("#FFFFFF");
    });
  });

  // ─── Tier Hierarchy ───
  describe("Tier Hierarchy", () => {
    it("annual should be at least annual", () => {
      expect(isTierAtLeast("annual", "annual")).toBe(true);
    });

    it("annual should be at least monthly", () => {
      expect(isTierAtLeast("annual", "monthly")).toBe(true);
    });

    it("monthly should NOT be at least annual", () => {
      expect(isTierAtLeast("monthly", "annual")).toBe(false);
    });

    it("none should NOT be at least monthly", () => {
      expect(isTierAtLeast("none", "monthly")).toBe(false);
    });

    it("monthly should be at least monthly", () => {
      expect(isTierAtLeast("monthly", "monthly")).toBe(true);
    });
  });

  // ─── Minimum Tier for Feature ───
  describe("Minimum Tier for Feature", () => {
    it("all features should require monthly as minimum (no free tier)", () => {
      const allFeatures: Feature[] = [
        "ai_scan", "meal_logging", "basic_analytics", "advanced_analytics",
        "forecast_12_month", "priority_sync", "gains_cards_pro",
        "unlimited_scans", "priority_support", "edit_email", "manage_payment",
      ];
      for (const feature of allFeatures) {
        const minTier = getMinimumTierForFeature(feature);
        expect(minTier).toBe("monthly");
      }
    });
  });

  // ─── Welcome Messages ───
  describe("Welcome Messages", () => {
    it("monthly welcome should exist", () => {
      expect(WELCOME_MESSAGES.monthly.title).toBeTruthy();
      expect(WELCOME_MESSAGES.monthly.body).toBeTruthy();
    });

    it("annual welcome should exist", () => {
      expect(WELCOME_MESSAGES.annual.title).toBeTruthy();
      expect(WELCOME_MESSAGES.annual.body).toBeTruthy();
    });

    it("all welcome messages should have non-empty title and body", () => {
      const tiers: Array<"monthly" | "annual"> = ["monthly", "annual"];
      for (const tier of tiers) {
        expect(WELCOME_MESSAGES[tier].title.length).toBeGreaterThan(0);
        expect(WELCOME_MESSAGES[tier].body.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── Feature Unlock on Payment ───
  describe("Feature Unlock on Payment", () => {
    it("subscribing from none to monthly should unlock all features", () => {
      const premiumFeatures: Feature[] = [
        "ai_scan", "meal_logging", "advanced_analytics",
        "forecast_12_month", "priority_sync", "gains_cards_pro",
        "unlimited_scans", "edit_email", "manage_payment",
      ];
      for (const feature of premiumFeatures) {
        expect(hasFeatureAccess("none", feature)).toBe(false);
        expect(hasFeatureAccess("monthly", feature)).toBe(true);
      }
    });

    it("subscription status persists (tier value is a simple string)", () => {
      const tiers: SubscriptionTier[] = ["none", "monthly", "annual"];
      for (const tier of tiers) {
        expect(typeof tier).toBe("string");
        expect(JSON.stringify(tier)).toBeTruthy();
        expect(JSON.parse(JSON.stringify(tier))).toBe(tier);
      }
    });
  });

  // ─── Lock Overlay Logic ───
  describe("Lock Overlay Logic", () => {
    it("all features should be locked for none tier", () => {
      expect(hasFeatureAccess("none", "forecast_12_month")).toBe(false);
      expect(hasFeatureAccess("none", "priority_sync")).toBe(false);
      expect(hasFeatureAccess("none", "manage_payment")).toBe(false);
    });

    it("all features should be unlocked for any paid tier", () => {
      const paidTiers: SubscriptionTier[] = ["monthly", "annual"];
      for (const tier of paidTiers) {
        expect(hasFeatureAccess(tier, "forecast_12_month")).toBe(true);
        expect(hasFeatureAccess(tier, "priority_sync")).toBe(true);
        expect(hasFeatureAccess(tier, "manage_payment")).toBe(true);
      }
    });
  });
});
