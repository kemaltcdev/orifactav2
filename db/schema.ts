import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  service: text("service").notNull(),
  budget: text("budget").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at").notNull(),
});
