import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { meals, userProfiles, weightLog, pushTokens } from "../drizzle/schema";

// Inline db getter to avoid stale module resolution
let _syncDb: ReturnType<typeof drizzle> | null = null;
async function getSyncDb() {
  if (!_syncDb && process.env.DATABASE_URL) {
    try { _syncDb = drizzle(process.env.DATABASE_URL); } catch { _syncDb = null; }
  }
  return _syncDb;
}

export const syncRouter = router({
  // ─── Meals ───
  getMeals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getSyncDb();
    if (!db) return [];
    return db.select().from(meals).where(eq(meals.userId, ctx.user.id)).orderBy(desc(meals.createdAt));
  }),

  upsertMeal: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        date: z.string(),
        mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
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
      const db = await getSyncDb();
      if (!db) return { success: false };
      const existing = await db.select().from(meals)
        .where(and(eq(meals.userId, ctx.user.id), eq(meals.clientId, input.clientId)))
        .limit(1);
      if (existing.length > 0) {
        await db.update(meals).set({
          name: input.name,
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          anabolicScore: input.anabolicScore,
          isFavorite: input.isFavorite ?? false,
        }).where(eq(meals.id, existing[0].id));
      } else {
        await db.insert(meals).values({
          userId: ctx.user.id,
          clientId: input.clientId,
          date: input.date,
          mealType: input.mealType,
          name: input.name,
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          anabolicScore: input.anabolicScore,
          imageUri: input.imageUri ?? null,
          isFavorite: input.isFavorite ?? false,
        });
      }
      return { success: true };
    }),

  deleteMeal: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getSyncDb();
      if (!db) return { success: false };
      await db.delete(meals).where(and(eq(meals.userId, ctx.user.id), eq(meals.clientId, input.clientId)));
      return { success: true };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ clientId: z.string(), isFavorite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getSyncDb();
      if (!db) return { success: false };
      await db.update(meals).set({ isFavorite: input.isFavorite })
        .where(and(eq(meals.userId, ctx.user.id), eq(meals.clientId, input.clientId)));
      return { success: true };
    }),

  // ─── Profile ───
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getSyncDb();
    if (!db) return null;
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
    return result.length > 0 ? result[0] : null;
  }),

  upsertProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().optional(),
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
      const db = await getSyncDb();
      if (!db) return { success: false };
      const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
      if (existing.length > 0) {
        await db.update(userProfiles).set(input).where(eq(userProfiles.userId, ctx.user.id));
      } else {
        await db.insert(userProfiles).values({ userId: ctx.user.id, ...input });
      }
      return { success: true };
    }),

  // ─── Weight Log ───
  getWeightLog: protectedProcedure.query(async ({ ctx }) => {
    const db = await getSyncDb();
    if (!db) return [];
    return db.select().from(weightLog).where(eq(weightLog.userId, ctx.user.id)).orderBy(desc(weightLog.createdAt));
  }),

  addWeight: protectedProcedure
    .input(z.object({ date: z.string(), weight: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getSyncDb();
      if (!db) return { success: false };
      const existing = await db.select().from(weightLog)
        .where(and(eq(weightLog.userId, ctx.user.id), eq(weightLog.date, input.date)))
        .limit(1);
      if (existing.length > 0) {
        await db.update(weightLog).set({ weight: input.weight }).where(eq(weightLog.id, existing[0].id));
      } else {
        await db.insert(weightLog).values({ userId: ctx.user.id, date: input.date, weight: input.weight });
      }
      return { success: true };
    }),

  // ─── Push Tokens ───
  registerPushToken: protectedProcedure
    .input(z.object({ token: z.string(), platform: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getSyncDb();
      if (!db) return { success: false };
      const existing = await db.select().from(pushTokens)
        .where(and(eq(pushTokens.userId, ctx.user.id), eq(pushTokens.token, input.token)))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(pushTokens).values({ userId: ctx.user.id, token: input.token, platform: input.platform });
      }
      return { success: true };
    }),
});
