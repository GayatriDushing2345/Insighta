import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessesTable = pgTable("businesses", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  description: text("description").notNull(),
  website: text("website"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;

export const datasetsTable = pgTable("datasets", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  fileType: text("file_type").notNull(),
  status: text("status").notNull().default("pending"),
  rowCount: integer("row_count").notNull().default(0),
  columns: jsonb("columns"),
  rawData: text("raw_data"),
  summary: text("summary"),
  statistics: jsonb("statistics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDatasetSchema = createInsertSchema(datasetsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDataset = z.infer<typeof insertDatasetSchema>;
export type Dataset = typeof datasetsTable.$inferSelect;

export const insightsTable = pgTable("insights", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  datasetId: integer("dataset_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInsightSchema = createInsertSchema(insightsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insightsTable.$inferSelect;

export const queriesTable = pgTable("queries", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  userId: text("user_id"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sources: jsonb("sources"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuerySchema = createInsertSchema(queriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queriesTable.$inferSelect;
