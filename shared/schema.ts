import { pgTable, text, serial, numeric, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gdpData = pgTable("gdp_data", {
  id: serial("id").primaryKey(),
  countryName: text("country_name").notNull(),
  countryCode: varchar("country_code", { length: 3 }),
  year: numeric("year").notNull(),
  gdpValue: numeric("gdp_value"),
});

export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // point, line, circle, text
  content: text("content"), // for text annotations
  properties: text("properties").notNull(), // JSON string with properties like coordinates, color, etc.
  createdAt: numeric("created_at").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGdpDataSchema = createInsertSchema(gdpData).pick({
  countryName: true,
  countryCode: true,
  year: true,
  gdpValue: true,
});

export const insertAnnotationSchema = createInsertSchema(annotations).pick({
  type: true,
  content: true,
  properties: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GdpData = typeof gdpData.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;

// Air Quality Data Types
export interface AirQualityMeasurement {
  location: string;
  city?: string;
  country?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  parameter: string; // pm25, pm10, o3, etc.
  value: number;
  unit: string;
  lastUpdated: string;
}

export interface AirQualityData {
  measurements: AirQualityMeasurement[];
  timestamp: string;
}
