import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  canContact: boolean("can_contact").notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks)
  .pick({
    name: true,
    email: true,
    canContact: true,
  })
  .extend({
    email: z.string().email("Please enter a valid email address"),
  });

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacks.$inferSelect;
