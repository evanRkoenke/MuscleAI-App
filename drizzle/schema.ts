import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscription Table ───
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tier: mysqlEnum("tier", ["free", "essential", "pro", "elite"]).default("free").notNull(),
  productId: varchar("productId", { length: 128 }),
  transactionId: varchar("transactionId", { length: 256 }),
  originalTransactionId: varchar("originalTransactionId", { length: 256 }),
  platform: mysqlEnum("platform", ["ios", "android", "web"]).default("ios"),
  purchaseDate: timestamp("purchaseDate"),
  expiresDate: timestamp("expiresDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── User Profile (Cloud Sync) ───
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetWeight: float("targetWeight"),
  currentWeight: float("currentWeight"),
  calorieGoal: int("calorieGoal"),
  proteinGoal: int("proteinGoal"),
  carbsGoal: int("carbsGoal"),
  fatGoal: int("fatGoal"),
  unit: mysqlEnum("unit", ["lbs", "kg"]).default("lbs"),
  heightFt: int("heightFt"),
  heightIn: int("heightIn"),
  goal: varchar("goal", { length: 32 }),
  trainingDays: int("trainingDays"),
  dietaryRestrictions: json("dietaryRestrictions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// ─── Meal Logs (Cloud Sync) ───
export const mealLogs = mysqlTable("meal_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: varchar("clientId", { length: 64 }).notNull(), // local UUID for dedup
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  calories: int("calories").default(0).notNull(),
  protein: float("protein").default(0).notNull(),
  carbs: float("carbs").default(0).notNull(),
  fat: float("fat").default(0).notNull(),
  sugar: float("sugar").default(0).notNull(),
  anabolicScore: int("anabolicScore").default(0).notNull(),
  imageUri: text("imageUri"),
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = typeof mealLogs.$inferInsert;

// ─── Weight Logs (Cloud Sync) ───
export const weightLogs = mysqlTable("weight_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: varchar("clientId", { length: 64 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  weight: float("weight").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = typeof weightLogs.$inferInsert;

// ─── Gains Cards (Cloud Sync) ───
export const gainsCards = mysqlTable("gains_cards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: varchar("clientId", { length: 64 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  weight: float("weight").notNull(),
  protein: float("protein").notNull(),
  calories: int("calories").notNull(),
  daysTracked: int("daysTracked").notNull(),
  anabolicScore: int("anabolicScore").notNull(),
  subscription: varchar("subscription", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GainsCard = typeof gainsCards.$inferSelect;
export type InsertGainsCard = typeof gainsCards.$inferInsert;
