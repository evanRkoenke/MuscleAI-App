import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

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

/**
 * User profile / biometrics — one row per user.
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  targetWeight: float("targetWeight").default(180),
  currentWeight: float("currentWeight").default(175),
  calorieGoal: int("calorieGoal").default(2500),
  proteinGoal: int("proteinGoal").default(200),
  carbsGoal: int("carbsGoal").default(250),
  fatGoal: int("fatGoal").default(80),
  unit: varchar("unit", { length: 10 }).default("lbs"),
  profilePhotoUri: text("profilePhotoUri"),
  subscription: varchar("subscription", { length: 20 }).default("free"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Meal entries — many per user, keyed by date + mealType.
 */
export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("clientId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  mealType: varchar("mealType", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  calories: float("calories").default(0).notNull(),
  protein: float("protein").default(0).notNull(),
  carbs: float("carbs").default(0).notNull(),
  fat: float("fat").default(0).notNull(),
  anabolicScore: float("anabolicScore").default(0).notNull(),
  imageUri: text("imageUri"),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;

/**
 * Weight log — one entry per user per date.
 */
export const weightLog = mysqlTable("weight_log", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("clientId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  weight: float("weight").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeightLogEntry = typeof weightLog.$inferSelect;
export type InsertWeightLogEntry = typeof weightLog.$inferInsert;

/**
 * Push notification tokens — one per device per user.
 */
export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 512 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
