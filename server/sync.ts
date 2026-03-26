/**
 * Muscle AI — Cloud Sync Router
 *
 * Protected tRPC endpoints for syncing user data to/from the centralized database.
 * Only paid subscribers (Essential/Pro/Elite) can use cloud sync.
 * Free users get an "upgrade required" response.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Helpers ───
async function requirePaidSubscription(userId: number) {
  const sub = await db.getActiveSubscription(userId);
  const tier = sub?.tier ?? "free";
  if (tier === "free") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "SYNC_REQUIRES_SUBSCRIPTION",
    });
  }
  return tier;
}

// ─── Zod Schemas ───
const MealSchema = z.object({
  clientId: z.string(),
  date: z.string(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  sugar: z.number().default(0),
  anabolicScore: z.number().default(0),
  imageUri: z.string().nullable().optional(),
  isFavorite: z.boolean().default(false),
});

const WeightEntrySchema = z.object({
  clientId: z.string(),
  date: z.string(),
  weight: z.number(),
});

const GainsCardSchema = z.object({
  clientId: z.string(),
  date: z.string(),
  weight: z.number(),
  protein: z.number(),
  calories: z.number(),
  daysTracked: z.number(),
  anabolicScore: z.number(),
  subscription: z.string(),
});

const ProfileSchema = z.object({
  targetWeight: z.number().nullable().optional(),
  currentWeight: z.number().nullable().optional(),
  calorieGoal: z.number().nullable().optional(),
  proteinGoal: z.number().nullable().optional(),
  carbsGoal: z.number().nullable().optional(),
  fatGoal: z.number().nullable().optional(),
  unit: z.enum(["lbs", "kg"]).optional(),
  heightFt: z.number().nullable().optional(),
  heightIn: z.number().nullable().optional(),
  goal: z.string().nullable().optional(),
  trainingDays: z.number().nullable().optional(),
  dietaryRestrictions: z.array(z.string()).nullable().optional(),
});

// ─── Sync Router ───
export const syncRouter = router({
  /**
   * Get the user's subscription status from the database.
   * This is used on login to restore subscription tier.
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await db.getActiveSubscription(ctx.user.id);
    return {
      tier: sub?.tier ?? "free",
      productId: sub?.productId ?? null,
      expiresDate: sub?.expiresDate?.toISOString() ?? null,
      isActive: sub?.isActive ?? false,
    };
  }),

  /**
   * Push all local data to the cloud (full sync upload).
   * Only available for paid subscribers.
   */
  pushData: protectedProcedure
    .input(
      z.object({
        profile: ProfileSchema.optional(),
        meals: z.array(MealSchema).optional(),
        weightLog: z.array(WeightEntrySchema).optional(),
        gainsCards: z.array(GainsCardSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requirePaidSubscription(ctx.user.id);

      const results = { profile: false, meals: 0, weightLog: 0, gainsCards: 0 };

      // Sync profile
      if (input.profile) {
        await db.upsertUserProfile(ctx.user.id, input.profile as any);
        results.profile = true;
      }

      // Sync meals
      if (input.meals && input.meals.length > 0) {
        await db.syncMeals(ctx.user.id, input.meals);
        results.meals = input.meals.length;
      }

      // Sync weight log
      if (input.weightLog && input.weightLog.length > 0) {
        await db.syncWeightLogs(ctx.user.id, input.weightLog);
        results.weightLog = input.weightLog.length;
      }

      // Sync gains cards
      if (input.gainsCards && input.gainsCards.length > 0) {
        await db.syncGainsCards(ctx.user.id, input.gainsCards);
        results.gainsCards = input.gainsCards.length;
      }

      console.log(`[Sync] Push complete for user ${ctx.user.id}:`, results);

      return { success: true, synced: results };
    }),

  /**
   * Pull all cloud data to the device (full sync download).
   * Only available for paid subscribers.
   */
  pullData: protectedProcedure.query(async ({ ctx }) => {
    await requirePaidSubscription(ctx.user.id);

    const [profile, meals, weightLog, gainsCardsList] = await Promise.all([
      db.getUserProfile(ctx.user.id),
      db.getUserMeals(ctx.user.id),
      db.getUserWeightLogs(ctx.user.id),
      db.getUserGainsCards(ctx.user.id),
    ]);

    return {
      profile: profile
        ? {
            targetWeight: profile.targetWeight,
            currentWeight: profile.currentWeight,
            calorieGoal: profile.calorieGoal,
            proteinGoal: profile.proteinGoal,
            carbsGoal: profile.carbsGoal,
            fatGoal: profile.fatGoal,
            unit: profile.unit,
            heightFt: profile.heightFt,
            heightIn: profile.heightIn,
            goal: profile.goal,
            trainingDays: profile.trainingDays,
            dietaryRestrictions: profile.dietaryRestrictions,
          }
        : null,
      meals: meals.map((m) => ({
        clientId: m.clientId,
        date: m.date,
        mealType: m.mealType,
        name: m.name,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        sugar: m.sugar,
        anabolicScore: m.anabolicScore,
        imageUri: m.imageUri,
        isFavorite: m.isFavorite,
      })),
      weightLog: weightLog.map((w) => ({
        clientId: w.clientId,
        date: w.date,
        weight: w.weight,
      })),
      gainsCards: gainsCardsList.map((c) => ({
        clientId: c.clientId,
        date: c.date,
        weight: c.weight,
        protein: c.protein,
        calories: c.calories,
        daysTracked: c.daysTracked,
        anabolicScore: c.anabolicScore,
        subscription: c.subscription,
      })),
    };
  }),

  /**
   * Check if the user has existing cloud data (used for second-device detection).
   * Available for all authenticated users — returns whether cloud data exists
   * and the user's subscription tier.
   */
  checkCloudData: protectedProcedure.query(async ({ ctx }) => {
    const sub = await db.getActiveSubscription(ctx.user.id);
    const tier = sub?.tier ?? "free";

    // Check if there's any cloud data for this user
    const meals = await db.getUserMeals(ctx.user.id);
    const hasCloudData = meals.length > 0;

    return {
      tier,
      hasCloudData,
      mealCount: meals.length,
      isPaid: tier !== "free",
    };
  }),
});
