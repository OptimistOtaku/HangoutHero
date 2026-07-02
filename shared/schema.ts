import { pgTable, text, serial, integer, jsonb, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
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

export const recommendationEvents = pgTable("recommendation_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  itineraryId: integer("itinerary_id").references(() => itineraries.id),
  eventType: text("event_type").notNull(),
  city: text("city"),
  candidateId: text("candidate_id"),
  activityId: text("activity_id"),
  recommendationId: text("recommendation_id"),
  source: text("source"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventTypeIdx: index("recommendation_events_event_type_idx").on(table.eventType),
  cityIdx: index("recommendation_events_city_idx").on(table.city),
  userIdIdx: index("recommendation_events_user_id_idx").on(table.userId),
}));

export const trendingPlaces = pgTable("trending_places", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  placeId: text("place_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  score: integer("score").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  cityScoreIdx: index("trending_places_city_score_idx").on(table.city, table.score),
  placeIdUnique: uniqueIndex("trending_places_place_id_unique").on(table.placeId),
}));

export const itineraryCache = pgTable("itinerary_cache", {
  id: serial("id").primaryKey(),
  cacheKey: text("cache_key").notNull().unique(),
  city: text("city").notNull(),
  preferences: jsonb("preferences").notNull(),
  itinerary: jsonb("itinerary").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  cacheKeyIdx: index("itinerary_cache_cache_key_idx").on(table.cacheKey),
  cityIdx: index("itinerary_cache_city_idx").on(table.city),
}));

export const cityCandidates = pgTable("city_candidates", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  candidateId: text("candidate_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  image: text("image"),
  price: text("price"),
  rating: text("rating"),
  duration: text("duration"),
  tags: jsonb("tags"),
  metadata: jsonb("metadata"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  cityIdx: index("city_candidates_city_idx").on(table.city),
  citySortIdx: index("city_candidates_city_sort_idx").on(table.city, table.sortOrder),
  candidateIdUnique: uniqueIndex("city_candidates_candidate_id_unique").on(table.candidateId),
}));

export const recommendationMetadataSchema = z.object({
  source: z.string().optional(),
  score: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  placeId: z.string().optional(),
  candidateId: z.string().optional(),
  reasons: z.array(z.string()).optional(),
}).passthrough();

export const activityMetadataSchema = recommendationMetadataSchema.extend({
  travelTimeMinutes: z.number().int().nonnegative().optional(),
  popularity: z.number().optional(),
});

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
  type: z.string(),
  metadata: activityMetadataSchema.optional(),
});

export const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string(),
  rating: z.string(),
  duration: z.string(),
  metadata: recommendationMetadataSchema.optional(),
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

export const insertRecommendationEventSchema = createInsertSchema(recommendationEvents).pick({
  userId: true,
  itineraryId: true,
  eventType: true,
  city: true,
  candidateId: true,
  activityId: true,
  recommendationId: true,
  source: true,
  metadata: true,
});

export const insertTrendingPlaceSchema = createInsertSchema(trendingPlaces).pick({
  city: true,
  placeId: true,
  title: true,
  category: true,
  score: true,
  metadata: true,
});

export const insertItineraryCacheSchema = createInsertSchema(itineraryCache).pick({
  cacheKey: true,
  city: true,
  preferences: true,
  itinerary: true,
  expiresAt: true,
});

export const insertCityCandidateSchema = createInsertSchema(cityCandidates).pick({
  city: true,
  candidateId: true,
  title: true,
  category: true,
  location: true,
  image: true,
  price: true,
  rating: true,
  duration: true,
  tags: true,
  metadata: true,
  sortOrder: true,
});

export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
export type Itinerary = typeof itineraries.$inferSelect;
export type PrebuiltRoute = typeof prebuiltRoutes.$inferSelect;
export type InsertPrebuiltRoute = z.infer<typeof insertPrebuiltRouteSchema>;
export type RecommendationEvent = typeof recommendationEvents.$inferSelect;
export type InsertRecommendationEvent = z.infer<typeof insertRecommendationEventSchema>;
export type TrendingPlace = typeof trendingPlaces.$inferSelect;
export type InsertTrendingPlace = z.infer<typeof insertTrendingPlaceSchema>;
export type ItineraryCache = typeof itineraryCache.$inferSelect;
export type InsertItineraryCache = z.infer<typeof insertItineraryCacheSchema>;
export type CityCandidate = typeof cityCandidates.$inferSelect;
export type InsertCityCandidate = z.infer<typeof insertCityCandidateSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type ActivityMetadata = z.infer<typeof activityMetadataSchema>;
export type RecommendationMetadata = z.infer<typeof recommendationMetadataSchema>;
export type ItineraryResponse = z.infer<typeof itineraryResponseSchema>;
