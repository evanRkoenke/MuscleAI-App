import { eq, and, desc } from "drizzle-orm"; 
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  meals,
  InsertMeal,
  userProfiles,
  InsertUserProfile,
  weightLog,
  InsertWeightEntry,
  pushTokens,
  InsertPushToken,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Meals ───

export async function getMealsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meals).where(eq(meals.userId, userId)).orderBy(desc(meals.createdAt));
}

export async function upsertMeal(data: {
  userId: number;
  clientId: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  anabolicScore: number;
  imageUri?: string | null;
  isFavorite?: boolean;
}) {
  const db = await getDb();
  if (!db) return;
  // Check if exists
  const existing = await db.select().from(meals)
    .where(and(eq(meals.userId, data.userId), eq(meals.clientId, data.clientId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(meals).set({
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      anabolicScore: data.anabolicScore,
      isFavorite: data.isFavorite ?? false,
    }).where(eq(meals.id, existing[0].id));
  } else {
    await db.insert(meals).values({
      userId: data.userId,
      clientId: data.clientId,
      date: data.date,
      mealType: data.mealType,
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      anabolicScore: data.anabolicScore,
      imageUri: data.imageUri ?? null,
      isFavorite: data.isFavorite ?? false,
    });
  }
}

export async function deleteMealByClientId(userId: number, clientId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(meals).where(and(eq(meals.userId, userId), eq(meals.clientId, clientId)));
}

export async function toggleMealFavorite(userId: number, clientId: string, isFavorite: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(meals).set({ isFavorite }).where(and(eq(meals.userId, userId), eq(meals.clientId, clientId)));
}

// ─── User Profiles ───

export async function getProfileByUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertProfile(userId: number, data: Partial<Omit<InsertUserProfile, "id" | "userId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
  }
}

// ─── Weight Log ───

export async function getWeightLogByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weightLog).where(eq(weightLog.userId, userId)).orderBy(desc(weightLog.createdAt));
}

export async function addWeightEntry(userId: number, date: string, weight: number) {
  const db = await getDb();
  if (!db) return;
  // Upsert by date
  const existing = await db.select().from(weightLog)
    .where(and(eq(weightLog.userId, userId), eq(weightLog.date, date)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(weightLog).set({ weight }).where(eq(weightLog.id, existing[0].id));
  } else {
    await db.insert(weightLog).values({ userId, date, weight });
  }
}

// ─── Push Tokens ───

export async function registerPushToken(userId: number, token: string, platform: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(pushTokens).values({ userId, token, platform });
  }
}

export async function getPushTokensByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
}
