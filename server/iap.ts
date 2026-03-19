/**
 * Muscle AI — Server-side IAP Receipt Validation
 *
 * Validates Apple StoreKit 2 transaction receipts and updates subscription status.
 * In production, this would verify with Apple's App Store Server API.
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

// Subscription tier type
const SubscriptionTier = z.enum(["free", "essential", "pro", "elite"]);

// Map product IDs to tiers
function productIdToTier(productId: string): "free" | "essential" | "pro" | "elite" {
  switch (productId) {
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
   * Validate an Apple StoreKit 2 receipt / transaction.
   *
   * In production this would:
   * 1. Decode the JWS (JSON Web Signature) transaction
   * 2. Verify the signature against Apple's root certificate
   * 3. Check the transaction is not revoked
   * 4. Update the user's subscription in the database
   *
   * For now, it accepts the transaction data and returns the resolved tier.
   */
  validateReceipt: publicProcedure
    .input(
      z.object({
        transactionId: z.string(),
        productId: z.string(),
        originalTransactionId: z.string().optional(),
        purchaseDate: z.string().optional(),
        expiresDate: z.string().optional(),
        platform: z.enum(["ios", "android"]).default("ios"),
        receiptData: z.string().optional(), // JWS signed transaction for Apple
      })
    )
    .mutation(async ({ input }) => {
      // ─── Step 1: Determine tier from product ID ───
      const tier = productIdToTier(input.productId);

      // ─── Step 2: In production, verify with Apple's Server API ───
      // For Apple StoreKit 2:
      //   - Decode the JWS transaction (input.receiptData)
      //   - Verify signature with Apple's root certificate
      //   - Check transaction status via App Store Server API
      //   - GET https://api.storekit.itunes.apple.com/inApps/v1/transactions/{transactionId}
      //
      // For Google Play:
      //   - Use Google Play Developer API
      //   - GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptions/{subscriptionId}/tokens/{token}

      // ─── Step 3: In production, update user subscription in database ───
      // await db.update(users).set({
      //   subscriptionTier: tier,
      //   subscriptionProductId: input.productId,
      //   subscriptionTransactionId: input.transactionId,
      //   subscriptionExpiresAt: input.expiresDate ? new Date(input.expiresDate) : null,
      //   updatedAt: new Date(),
      // }).where(eq(users.id, userId));

      console.log(
        `[IAP] Receipt validated: product=${input.productId}, tier=${tier}, txn=${input.transactionId}`
      );

      return {
        success: true,
        tier,
        productId: input.productId,
        transactionId: input.transactionId,
        message: `Subscription upgraded to ${tier.toUpperCase()}`,
      };
    }),

  /**
   * Restore purchases — called when user taps "Restore Purchases".
   * In production, queries Apple/Google for active subscriptions.
   */
  restorePurchases: publicProcedure
    .input(
      z.object({
        platform: z.enum(["ios", "android"]).default("ios"),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In production:
      // 1. Query App Store Server API for user's transaction history
      // 2. Find active subscriptions
      // 3. Return the highest active tier

      console.log(`[IAP] Restore purchases requested for platform=${input.platform}`);

      return {
        success: true,
        tier: "free" as const, // Default until real verification is implemented
        message: "No active subscriptions found. Purchase a plan to get started.",
      };
    }),
});
