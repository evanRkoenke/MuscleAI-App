import { relations } from "drizzle-orm";
import { users, userProfiles, meals, weightLog, pushTokens } from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  meals: many(meals),
  weightLog: many(weightLog),
  pushTokens: many(pushTokens),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  user: one(users, { fields: [meals.userId], references: [users.id] }),
}));

export const weightLogRelations = relations(weightLog, ({ one }) => ({
  user: one(users, { fields: [weightLog.userId], references: [users.id] }),
}));

export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, { fields: [pushTokens.userId], references: [users.id] }),
}));
