import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Profile Router ──────────────────────────────────────────────────

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return db.getProfile(ctx.user.id);
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        targetWeight: z.number().optional(),
        currentWeight: z.number().optional(),
        calorieGoal: z.number().optional(),
        proteinGoal: z.number().optional(),
        carbsGoal: z.number().optional(),
        fatGoal: z.number().optional(),
        unit: z.string().optional(),
        profilePhotoUri: z.string().optional(),
        subscription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.upsertProfile(ctx.user.id, input);
      return { success: true };
    }),
});

// ─── Meals Router ────────────────────────────────────────────────────

export const mealsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserMeals(ctx.user.id);
  }),

  add: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        date: z.string(),
        mealType: z.string(),
        name: z.string(),
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
        anabolicScore: z.number(),
        imageUri: z.string().optional(),
        isFavorite: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await db.addMeal({
        ...input,
        userId: ctx.user.id,
        imageUri: input.imageUri ?? null,
        isFavorite: input.isFavorite ?? false,
      });
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteMeal(ctx.user.id, input.clientId);
      return { success: true };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ clientId: z.string(), isFavorite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.toggleMealFavorite(ctx.user.id, input.clientId, input.isFavorite);
      return { success: true };
    }),

  /** Bulk sync: client sends all local meals, server replaces for this user */
  bulkSync: protectedProcedure
    .input(
      z.array(
        z.object({
          clientId: z.string(),
          date: z.string(),
          mealType: z.string(),
          name: z.string(),
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fat: z.number(),
          anabolicScore: z.number(),
          imageUri: z.string().nullable().optional(),
          isFavorite: z.boolean().optional(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Get existing cloud meals
      const existing = await db.getUserMeals(ctx.user.id);
      const existingIds = new Set(existing.map((m) => m.clientId));
      const inputIds = new Set(input.map((m) => m.clientId));

      // Add meals that exist locally but not in cloud
      for (const meal of input) {
        if (!existingIds.has(meal.clientId)) {
          await db.addMeal({
            ...meal,
            userId: ctx.user.id,
            imageUri: meal.imageUri ?? null,
            isFavorite: meal.isFavorite ?? false,
          });
        } else {
          // Update favorite status if changed
          const cloudMeal = existing.find((m) => m.clientId === meal.clientId);
          if (cloudMeal && cloudMeal.isFavorite !== (meal.isFavorite ?? false)) {
            await db.toggleMealFavorite(ctx.user.id, meal.clientId, meal.isFavorite ?? false);
          }
        }
      }

      // Return the full merged list
      return db.getUserMeals(ctx.user.id);
    }),
});

// ─── Weight Router ───────────────────────────────────────────────────

export const weightRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserWeightLog(ctx.user.id);
  }),

  add: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        date: z.string(),
        weight: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.addWeightEntry({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteWeightEntry(ctx.user.id, input.clientId);
      return { success: true };
    }),

  bulkSync: protectedProcedure
    .input(
      z.array(
        z.object({
          clientId: z.string(),
          date: z.string(),
          weight: z.number(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.getUserWeightLog(ctx.user.id);
      const existingIds = new Set(existing.map((w) => w.clientId));

      for (const entry of input) {
        if (!existingIds.has(entry.clientId)) {
          await db.addWeightEntry({ ...entry, userId: ctx.user.id });
        }
      }

      return db.getUserWeightLog(ctx.user.id);
    }),
});

// ─── Push Tokens Router ──────────────────────────────────────────────

export const pushRouter = router({
  registerToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        platform: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.upsertPushToken(ctx.user.id, input.token, input.platform);
      return { success: true };
    }),

  removeToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.removePushToken(ctx.user.id, input.token);
      return { success: true };
    }),
});
