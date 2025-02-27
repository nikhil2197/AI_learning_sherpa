import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  isConfident: boolean("is_confident").notNull(),
  learnedNew: boolean("learned_new").notNull(),
  conversation: text("conversation"),
  lastRecommendation: text("last_recommendation"),
  chatDuration: integer("chat_duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    name: true,
    email: true,
  })
  .extend({
    email: z.string().email("Please enter a valid email address"),
  });

export const insertFeedbackSchema = createInsertSchema(feedbacks)
  .pick({
    userId: true,
    isConfident: true,
    learnedNew: true,
    conversation: true,
    lastRecommendation: true,
    chatDuration: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacks.$inferSelect;