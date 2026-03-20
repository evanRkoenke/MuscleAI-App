import { and, eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  meals,
  InsertMeal,
  userProfiles,
  InsertUserProfile,
  weightLog,
  InsertWeightLogEntry,
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

// ─── Users ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

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

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── User Profiles ───────────────────────────────────────────────────

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertProfile(userId: number, data: Partial<Omit<InsertUserProfile, "id" | "userId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getProfile(userId);
  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
  }
}

// ─── Meals ───────────────────────────────────────────────────────────

export async function getUserMeals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meals).where(eq(meals.userId, userId)).orderBy(desc(meals.createdAt));
}

export async function addMeal(data: InsertMeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(meals).values(data);
  return result[0].insertId;
}

export async function updateMeal(userId: number, clientId: string, data: Partial<Omit<InsertMeal, "id" | "userId" | "clientId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meals).set(data).where(and(eq(meals.userId, userId), eq(meals.clientId, clientId)));
}

export async function deleteMeal(userId: number, clientId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(meals).where(and(eq(meals.userId, userId), eq(meals.clientId, clientId)));
}

export async function toggleMealFavorite(userId: number, clientId: string, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meals).set({ isFavorite }).where(and(eq(meals.userId, userId), eq(meals.clientId, clientId)));
}

// ─── Weight Log ──────────────────────────────────────────────────────

export async function getUserWeightLog(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weightLog).where(eq(weightLog.userId, userId)).orderBy(asc(weightLog.date));
}

export async function addWeightEntry(data: InsertWeightLogEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(weightLog).values(data);
}

export async function deleteWeightEntry(userId: number, clientId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(weightLog).where(and(eq(weightLog.userId, userId), eq(weightLog.clientId, clientId)));
}

// ─── Push Tokens ─────────────────────────────────────────────────────

export async function upsertPushToken(userId: number, token: string, platform: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if this token already exists for this user
  const existing = await db
    .select()
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(pushTokens).set({ platform, updatedAt: new Date() }).where(eq(pushTokens.id, existing[0].id));
  } else {
    await db.insert(pushTokens).values({ userId, token, platform });
  }
}

export async function getUserPushTokens(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
}

export async function getAllPushTokens() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushTokens);
}

export async function removePushToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
}
