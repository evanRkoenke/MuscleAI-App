/**
 * Muscle AI — In-App Purchase Service (Native IAP)
 *
 * Two-plan model with native App Store / Google Play purchases:
 *   - Monthly Essential: $9.99/mo
 *   - Elite Annual: $59.99/yr (Best Value - Save 50%)
 *
 * Both plans give identical full access to all features.
 * Uses expo-iap for native StoreKit 2 (iOS) and Google Play Billing (Android).
 * Falls back gracefully when native IAP module is not available (web / Expo Go).
 */

import { Platform } from "react-native";
import type { SubscriptionTier } from "./subscription-features";

// ─── Product IDs (must match App Store Connect / Google Play Console) ───
export const IAP_PRODUCTS = {
  MONTHLY_ESSENTIAL: "com.evankoenke.muscleaiorcalorietracker.monthly",
  ELITE_ANNUAL: "com.evankoenke.muscleaiorcalorietracker.annual",
} as const;

export const ALL_PRODUCT_IDS = [
  IAP_PRODUCTS.MONTHLY_ESSENTIAL,
  IAP_PRODUCTS.ELITE_ANNUAL,
];

// ─── Tier mapping ───
export { type SubscriptionTier } from "./subscription-features";

export function productIdToTier(productId: string): SubscriptionTier {
  switch (productId) {
    case IAP_PRODUCTS.MONTHLY_ESSENTIAL:
      return "monthly";
    case IAP_PRODUCTS.ELITE_ANNUAL:
      return "annual";
    default:
      return "none";
  }
}

export function tierToProductId(tier: SubscriptionTier): string | null {
  switch (tier) {
    case "monthly":
      return IAP_PRODUCTS.MONTHLY_ESSENTIAL;
    case "annual":
      return IAP_PRODUCTS.ELITE_ANNUAL;
    default:
      return null;
  }
}

// ─── Plan metadata (used by paywall UI) ───
export interface PlanInfo {
  id: string;
  productId: string;
  name: string;
  price: string;
  period: string;
  savings?: string;
  features: string[];
  highlighted: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: "annual",
    productId: IAP_PRODUCTS.ELITE_ANNUAL,
    name: "ELITE ANNUAL",
    price: "$59.99",
    period: "/year",
    savings: "BEST VALUE — SAVE 50%",
    features: [
      "Unlimited AI Meal Scans",
      "Advanced Analytics & Insights",
      "12-Month Muscle Forecast",
      "Cloud Sync Across Devices",
      "Gains Cards Pro Templates",
      "Priority Support",
    ],
    highlighted: true,
  },
  {
    id: "monthly",
    productId: IAP_PRODUCTS.MONTHLY_ESSENTIAL,
    name: "MONTHLY ESSENTIAL",
    price: "$9.99",
    period: "/month",
    features: [
      "Unlimited AI Meal Scans",
      "Advanced Analytics & Insights",
      "12-Month Muscle Forecast",
      "Cloud Sync Across Devices",
      "Gains Cards Pro Templates",
      "Priority Support",
    ],
    highlighted: false,
  },
];

// ─── Check if native IAP is available ───
let _iapAvailable: boolean | null = null;

export function isNativeIAPAvailable(): boolean {
  if (_iapAvailable !== null) return _iapAvailable;

  if (Platform.OS === "web") {
    _iapAvailable = false;
    return false;
  }

  // Check if the expo-iap native module is available
  try {
    const { TurboModuleRegistry } = require("react-native");
    // expo-iap registers as ExpoIapModule
    const mod = TurboModuleRegistry.get("ExpoIapModule");
    _iapAvailable = mod != null;
  } catch {
    _iapAvailable = false;
  }

  return _iapAvailable;
}

// ─── Validate receipt on server ───
export async function validateReceiptOnServer(purchase: {
  transactionId?: string;
  productId: string;
  originalTransactionId?: string;
  purchaseDate?: string;
  expiresDate?: string;
  platform: "ios" | "android";
  receiptData?: string;
}): Promise<{ success: boolean; tier: string }> {
  try {
    const { vanillaTrpc } = await import("@/lib/trpc");
    const result = await vanillaTrpc.iap.validateReceipt.mutate({
      transactionId: purchase.transactionId || `txn_${Date.now()}`,
      productId: purchase.productId,
      originalTransactionId: purchase.originalTransactionId,
      purchaseDate: purchase.purchaseDate,
      expiresDate: purchase.expiresDate,
      platform: purchase.platform,
      receiptData: purchase.receiptData,
    });
    return { success: result.success, tier: result.tier };
  } catch (error) {
    console.error("[IAP] Server validation failed:", error);
    // Still allow the purchase locally — server sync can happen later
    return { success: true, tier: productIdToTier(purchase.productId) };
  }
}
