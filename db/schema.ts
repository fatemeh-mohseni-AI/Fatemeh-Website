import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const anonymousMessages = sqliteTable("anonymous_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
  sourceRoute: text("source_route").notNull(),
  ipHash: text("ip_hash").notNull(),
  browserFamily: text("browser_family").notNull(),
  deviceType: text("device_type").notNull(),
});
