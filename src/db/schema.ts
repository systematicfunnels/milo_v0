import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  otp_code: text("otp_code"),
  otp_expires_at: timestamp("otp_expires_at", { withTimezone: true }),
  is_verified: boolean("is_verified").default(false),
  whatsapp_connected: boolean("whatsapp_connected").default(false),
  telegram_connected: boolean("telegram_connected").default(false),
  telegram_chat_id: text("telegram_chat_id"),
  whatsapp_phone: text("whatsapp_phone"),
  bot_name: text("bot_name").default("Milo Bot"),
  subscription_tier: text("subscription_tier").default("free"),
  reminders_count_this_month: integer("reminders_count_this_month").default(0),
  reminders_reset_at: timestamp("reminders_reset_at", { withTimezone: true }).defaultNow(),
  api_calls_today: integer("api_calls_today").default(0),
  api_calls_reset_at: timestamp("api_calls_reset_at", { withTimezone: true }).defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  reminder_time: timestamp("reminder_time", { withTimezone: true }).notNull(),
  platform: text("platform").notNull(), // 'telegram' | 'whatsapp'
  status: text("status").notNull().default("pending"), // 'pending' | 'sent' | 'failed' | 'cancelled'
  location: text("location"),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
