import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float, json } from "drizzle-orm/mysql-core";

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
 * Meals table — stores all scanned/manual meal entries per user.
 */
export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: varchar("clientId", { length: 64 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  calories: int("calories").notNull().default(0),
  protein: float("protein").notNull().default(0),
  carbs: float("carbs").notNull().default(0),
  fat: float("fat").notNull().default(0),
  anabolicScore: int("anabolicScore").notNull().default(0),
  imageUri: text("imageUri"),
  isFavorite: boolean("isFavorite").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;

/**
 * User profiles — nutrition goals, body metrics, subscription tier.
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  targetWeight: int("targetWeight").default(180),
  currentWeight: int("currentWeight").default(180),
  calorieGoal: int("calorieGoal").default(2500),
  proteinGoal: int("proteinGoal").default(200),
  carbsGoal: int("carbsGoal").default(250),
  fatGoal: int("fatGoal").default(80),
  unit: varchar("unit", { length: 10 }).default("lbs"),
  profilePhotoUri: text("profilePhotoUri"),
  subscription: varchar("subscription", { length: 32 }).default("free"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Weight log — daily weight entries per user.
 */
export const weightLog = mysqlTable("weightLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  weight: float("weight").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeightEntry = typeof weightLog.$inferSelect;
export type InsertWeightEntry = typeof weightLog.$inferInsert;

/**
 * Push notification tokens per user/device.
 */
export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 512 }).notNull(),
  platform: varchar("platform", { length: 16 }).notNull(), // ios, android, web
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
