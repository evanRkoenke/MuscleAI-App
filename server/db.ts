import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  subscriptions,
  InsertSubscription,
  userProfiles,
  InsertUserProfile,
  mealLogs,
  InsertMealLog,
  weightLogs,
  InsertWeightLog,
  gainsCards,
  InsertGainsCard,
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
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

// ─── Subscriptions ───
export async function getActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.isActive, true)))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertSubscription(userId: number, data: Omit<InsertSubscription, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deactivate any existing active subscriptions
  await db
    .update(subscriptions)
    .set({ isActive: false })
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.isActive, true)));

  // Insert the new subscription
  await db.insert(subscriptions).values({
    userId,
    ...data,
  });
}

// ─── User Profiles (Cloud Sync) ───
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertUserProfile(userId: number, data: Omit<InsertUserProfile, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserProfile(userId);
  if (existing) {
    await db
      .update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
  }
}

// ─── Meal Logs (Cloud Sync) ───
export async function getUserMeals(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(mealLogs)
    .where(eq(mealLogs.userId, userId))
    .orderBy(desc(mealLogs.createdAt));
}

export async function syncMeals(userId: number, meals: Omit<InsertMealLog, "userId">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (meals.length === 0) return;

  // Get existing client IDs for this user to avoid duplicates
  const existing = await db
    .select({ clientId: mealLogs.clientId })
    .from(mealLogs)
    .where(eq(mealLogs.userId, userId));

  const existingIds = new Set(existing.map((e) => e.clientId));
  const newMeals = meals.filter((m) => !existingIds.has(m.clientId));

  if (newMeals.length > 0) {
    // Insert in batches of 50 to avoid query size limits
    for (let i = 0; i < newMeals.length; i += 50) {
      const batch = newMeals.slice(i, i + 50);
      await db.insert(mealLogs).values(batch.map((m) => ({ ...m, userId })));
    }
  }
}

export async function deleteMeal(userId: number, clientId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(mealLogs)
    .where(and(eq(mealLogs.userId, userId), eq(mealLogs.clientId, clientId)));
}

// ─── Weight Logs (Cloud Sync) ───
export async function getUserWeightLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(desc(weightLogs.createdAt));
}

export async function syncWeightLogs(userId: number, entries: Omit<InsertWeightLog, "userId">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (entries.length === 0) return;

  const existing = await db
    .select({ clientId: weightLogs.clientId })
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId));

  const existingIds = new Set(existing.map((e) => e.clientId));
  const newEntries = entries.filter((e) => !existingIds.has(e.clientId));

  if (newEntries.length > 0) {
    for (let i = 0; i < newEntries.length; i += 50) {
      const batch = newEntries.slice(i, i + 50);
      await db.insert(weightLogs).values(batch.map((e) => ({ ...e, userId })));
    }
  }
}

// ─── Gains Cards (Cloud Sync) ───
export async function getUserGainsCards(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(gainsCards)
    .where(eq(gainsCards.userId, userId))
    .orderBy(desc(gainsCards.createdAt));
}

export async function syncGainsCards(userId: number, cards: Omit<InsertGainsCard, "userId">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (cards.length === 0) return;

  const existing = await db
    .select({ clientId: gainsCards.clientId })
    .from(gainsCards)
    .where(eq(gainsCards.userId, userId));

  const existingIds = new Set(existing.map((e) => e.clientId));
  const newCards = cards.filter((c) => !existingIds.has(c.clientId));

  if (newCards.length > 0) {
    for (let i = 0; i < newCards.length; i += 50) {
      const batch = newCards.slice(i, i + 50);
      await db.insert(gainsCards).values(batch.map((c) => ({ ...c, userId })));
    }
  }
}
