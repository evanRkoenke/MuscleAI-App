/**
 * Muscle AI — In-App Purchase Service
 *
 * Wraps expo-iap (StoreKit 2 on iOS, Google Play Billing on Android)
 * with a web fallback to Stripe Payment Links.
 *
 * Product IDs must match those configured in App Store Connect / Google Play Console.
 */

import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

// ─── Product IDs (configure these in App Store Connect) ───
export const IAP_PRODUCTS = {
  ESSENTIAL_MONTHLY: "com.muscleai.essential.monthly",
  PRO_MONTHLY: "com.muscleai.pro.monthly",
  ELITE_ANNUAL: "com.muscleai.elite.annual",
} as const;

export const ALL_PRODUCT_IDS = [
  IAP_PRODUCTS.ESSENTIAL_MONTHLY,
  IAP_PRODUCTS.PRO_MONTHLY,
  IAP_PRODUCTS.ELITE_ANNUAL,
];

// ─── Stripe fallback links (for web) ───
export const STRIPE_LINKS: Record<string, string> = {
  [IAP_PRODUCTS.ELITE_ANNUAL]:
    "https://buy.stripe.com/28E00c3VTa1FffJc6WbEA05",
  [IAP_PRODUCTS.PRO_MONTHLY]:
    "https://buy.stripe.com/8x214gdwt3Dh6Jd1sibEA04",
  [IAP_PRODUCTS.ESSENTIAL_MONTHLY]:
    "https://buy.stripe.com/14A5kwbol0r55F92wmbEA06",
};

// ─── Tier mapping ───
export type SubscriptionTier = "free" | "essential" | "pro" | "elite";

export function productIdToTier(productId: string): SubscriptionTier {
  switch (productId) {
    case IAP_PRODUCTS.ESSENTIAL_MONTHLY:
      return "essential";
    case IAP_PRODUCTS.PRO_MONTHLY:
      return "pro";
    case IAP_PRODUCTS.ELITE_ANNUAL:
      return "elite";
    default:
      return "free";
  }
}

export function tierToProductId(tier: SubscriptionTier): string | null {
  switch (tier) {
    case "essential":
      return IAP_PRODUCTS.ESSENTIAL_MONTHLY;
    case "pro":
      return IAP_PRODUCTS.PRO_MONTHLY;
    case "elite":
      return IAP_PRODUCTS.ELITE_ANNUAL;
    default:
      return null;
  }
}

// ─── Plan metadata (used by UI) ───
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
    id: "elite",
    productId: IAP_PRODUCTS.ELITE_ANNUAL,
    name: "ELITE ANNUAL",
    price: "$79.99",
    period: "/year",
    savings: "66% SAVINGS",
    features: [
      "12-Month Muscle Forecast",
      "Priority Sync",
      "Unlimited AI Scans",
      "Advanced Analytics",
      "Gains Cards Pro Templates",
    ],
    highlighted: true,
  },
  {
    id: "pro",
    productId: IAP_PRODUCTS.PRO_MONTHLY,
    name: "PRO",
    price: "$19.99",
    period: "/month",
    features: [
      "Unlimited AI Scans",
      "Advanced Analytics",
      "Priority Support",
    ],
    highlighted: false,
  },
  {
    id: "essential",
    productId: IAP_PRODUCTS.ESSENTIAL_MONTHLY,
    name: "ESSENTIAL",
    price: "$9.99",
    period: "/month",
    features: [
      "50 AI Scans/month",
      "Basic Analytics",
      "Meal Logging",
    ],
    highlighted: false,
  },
];

// ─── Web fallback purchase (opens Stripe in browser) ───
export async function purchaseViaStripe(productId: string): Promise<void> {
  const url = STRIPE_LINKS[productId];
  if (url) {
    await WebBrowser.openBrowserAsync(url);
  }
}

// ─── Check if native IAP is available ───
export function isNativeIAPAvailable(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}
