import { pgTable, text, serial, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Itinerary schema
export const itineraries = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  activities: jsonb("activities").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
}, (table) => ({
  userIdIdx: index("itineraries_user_id_idx").on(table.userId),
}));

export const prebuiltRoutes = pgTable("prebuilt_routes", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  city: text("city").notNull(),
  mood: text("mood").notNull(),
  stops: text("stops").notNull(),
  accent: text("accent").notNull(),
  image: text("image").notNull(),
  tagline: text("tagline").notNull(),
  itinerary: jsonb("itinerary").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("prebuilt_routes_slug_idx").on(table.slug),
  sortOrderIdx: index("prebuilt_routes_sort_order_idx").on(table.sortOrder),
}));

// Defining the shape of the activities and recommendations in the itinerary
export const activitySchema = z.object({
  id: z.string(),
  time: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  image: z.string(),
  price: z.string(),
  rating: z.string(),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]),
  type: z.string()
});

export const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string(),
  rating: z.string(),
  duration: z.string()
});

export const itineraryResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  activities: z.array(activitySchema),
  recommendations: z.array(recommendationSchema)
});

export const itinerarySchema = itineraryResponseSchema;

export const insertItinerarySchema = createInsertSchema(itineraries).pick({
  userId: true,
  title: true,
  description: true,
  location: true,
  activities: true,
  recommendations: true,
  notes: true
});

export const insertPrebuiltRouteSchema = createInsertSchema(prebuiltRoutes).pick({
  slug: true,
  city: true,
  mood: true,
  stops: true,
  accent: true,
  image: true,
  tagline: true,
  itinerary: true,
  sortOrder: true,
});

export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
export type Itinerary = typeof itineraries.$inferSelect;
export type PrebuiltRoute = typeof prebuiltRoutes.$inferSelect;
export type InsertPrebuiltRoute = z.infer<typeof insertPrebuiltRouteSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type ItineraryResponse = z.infer<typeof itineraryResponseSchema>;
