import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

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
 * Keywords table for paper search
 */
export const keywords = mysqlTable("keywords", {
  id: int("id").autoincrement().primaryKey(),
  keyword: varchar("keyword", { length: 255 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = typeof keywords.$inferInsert;

/**
 * Papers table for storing fetched papers
 */
export const papers = mysqlTable("papers", {
  id: int("id").autoincrement().primaryKey(),
  arxivId: varchar("arxivId", { length: 64 }).notNull().unique(),
  title: text("title").notNull(),
  titleJa: text("titleJa"),
  authors: text("authors").notNull(),
  abstract: text("abstract").notNull(),
  abstractJa: text("abstractJa"),
  journal: varchar("journal", { length: 255 }),
  publishedAt: bigint("publishedAt", { mode: "number" }),
  arxivUrl: varchar("arxivUrl", { length: 512 }).notNull(),
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  keyword: varchar("keyword", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;
