import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  phone: text("phone").notNull(),
});

export const messageTable = sqliteTable("message", {
  id: int("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  timestamp: text("timestamp").default(sql`(CURRENT_TIMESTAMP)`),
  senderId: text("sender_id")
    .notNull()
    .references(() => userTable.id),
});
