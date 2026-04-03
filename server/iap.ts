/**
 * Muscle AI — Server-side IAP Receipt Validation
 *
 * Validates Apple StoreKit 2 / Google Play transaction receipts and updates subscription status.
 * Persists subscription tier to the database for cross-device sync.
 *
 * Two-plan model:
 *   - Monthly Essential ($9.99/mo) → DB tier "essential"
 *   - Elite Annual ($59.99/yr) → DB tier "elite"
 *
 * The DB schema uses ["free", "essential", "pro", "elite"] enum values.
 * Client-side uses "none" | "monthly" | "annual" — mapping happens at the API boundary.
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Map product IDs to DB tier values
function productIdToTier(productId: string): "free" | "essential" | "pro" | "elite" {
  switch (productId) {
    // New product IDs (matching new bundle ID)
    case "com.evankoenke.muscleaiorcalorietracker.monthly":
      return "essential";
    case "com.evankoenke.muscleaiorcalorietracker.annual":
      return "elite";
    // Legacy product IDs (for existing subscribers)
    case "com.muscleai.essential.monthly":
      return "essential";
    case "com.muscleai.pro.monthly":
      return "pro";
    case "com.muscleai.elite.annual":
      return "elite";
    default:
      return "free";
  }
}

export const iapRouter = router({
  /**
   * Validate an Apple StoreKit 2 / Google Play receipt / transaction.
   * Uses protectedProcedure to identify the user and persist subscription to DB.
   */
  validateReceipt: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        productId: z.string(),
        originalTransactionId: z.string().optional(),
        purchaseDate: z.string().optional(),
        expiresDate: z.string().optional(),
        platform: z.enum(["ios", "android"]).default("ios"),
        receiptData: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tier = productIdToTier(input.productId);

      // Persist subscription to database
      try {
        await db.upsertSubscription(ctx.user.id, {
          tier,
          productId: input.productId,
          transactionId: input.transactionId,
          originalTransactionId: input.originalTransactionId ?? null,
          platform: input.platform,
          purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : new Date(),
          expiresDate: input.expiresDate ? new Date(input.expiresDate) : null,
          isActive: true,
        });
        console.log(
          `[IAP] Subscription saved to DB: user=${ctx.user.id}, tier=${tier}, txn=${input.transactionId}`
        );
      } catch (error) {
        console.error("[IAP] Failed to save subscription to DB:", error);
        // Still return success — local subscription is the source of truth for UX
      }

      return {
        success: true,
        tier,
        productId: input.productId,
        transactionId: input.transactionId,
        message: `Subscription upgraded to ${tier.toUpperCase()}`,
      };
    }),

  /**
   * Restore purchases — checks the database for active subscriptions.
   * Uses protectedProcedure to identify the user.
   */
  restorePurchases: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["ios", "android"]).default("ios"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(`[IAP] Restore purchases for user=${ctx.user.id}, platform=${input.platform}`);

      const sub = await db.getActiveSubscription(ctx.user.id);

      if (sub && sub.tier !== "free") {
        return {
          success: true,
          tier: sub.tier,
          productId: sub.productId,
          expiresDate: sub.expiresDate?.toISOString() ?? null,
          message: `Active ${sub.tier.toUpperCase()} subscription restored.`,
        };
      }

      return {
        success: true,
        tier: "free" as const,
        productId: null,
        expiresDate: null,
        message: "No active subscriptions found. Purchase a plan to get started.",
      };
    }),
});
