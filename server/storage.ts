import {
  users,
  itineraries,
  prebuiltRoutes,
  recommendationEvents,
  trendingPlaces,
  itineraryCache,
  cityCandidates,
  type User,
  type InsertUser,
  type Itinerary,
  type InsertItinerary,
  type PrebuiltRoute,
  type RecommendationEvent,
  type InsertRecommendationEvent,
  type TrendingPlace,
  type InsertTrendingPlace,
  type ItineraryCache,
  type InsertItineraryCache,
  type CityCandidate,
  type InsertCityCandidate,
} from "../shared/schema.js";
import type { ItineraryResponse } from "../client/src/lib/openai";
import { db } from "./db.js";
import { asc, desc, eq } from "drizzle-orm";
import { DEFAULT_PREBUILT_ROUTES } from "./prebuilt-routes.js";
import { DEFAULT_CITY_CANDIDATES } from "./curated-candidates.js";


export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, username: string): Promise<User>;
  saveItinerary(itinerary: ItineraryResponse, userId?: number): Promise<{ id: number; itinerary: ItineraryResponse }>;
  getItinerary(id: number): Promise<Itinerary | undefined>;
  getAllItineraries(userId?: number): Promise<Itinerary[]>;
  deleteItinerary(id: number): Promise<void>;
  updateItineraryNotes(id: number, notes: string): Promise<Itinerary>;
  getPrebuiltRoutes(): Promise<PrebuiltRoute[]>;
  getPrebuiltRouteBySlug(slug: string): Promise<PrebuiltRoute | undefined>;
  recordRecommendationEvent(event: InsertRecommendationEvent): Promise<RecommendationEvent>;
  getRecommendationEvents(limit?: number): Promise<RecommendationEvent[]>;
  upsertTrendingPlace(place: InsertTrendingPlace): Promise<TrendingPlace>;
  getTrendingPlaces(city: string, limit?: number): Promise<TrendingPlace[]>;
  saveItineraryCache(cache: InsertItineraryCache): Promise<ItineraryCache>;
  getItineraryCache(cacheKey: string): Promise<ItineraryCache | undefined>;
  upsertCityCandidate(candidate: InsertCityCandidate): Promise<CityCandidate>;
  getCityCandidates(city: string, limit?: number): Promise<CityCandidate[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private itineraries: Map<number, { itinerary: ItineraryResponse; userId?: number }>;
  private prebuiltRoutes: Map<string, PrebuiltRoute>;
  private recommendationEvents: Map<number, RecommendationEvent>;
  private trendingPlaces: Map<string, TrendingPlace>;
  private itineraryCache: Map<string, ItineraryCache>;
  private cityCandidates: Map<string, CityCandidate>;
  currentId: number;
  currentItineraryId: number;
  currentPrebuiltRouteId: number;
  currentRecommendationEventId: number;
  currentTrendingPlaceId: number;
  currentItineraryCacheId: number;
  currentCityCandidateId: number;

  constructor() {
    this.users = new Map();
    this.itineraries = new Map();
    this.prebuiltRoutes = new Map();
    this.recommendationEvents = new Map();
    this.trendingPlaces = new Map();
    this.itineraryCache = new Map();
    this.cityCandidates = new Map();
    this.currentId = 1;
    this.currentItineraryId = 1;
    this.currentPrebuiltRouteId = 1;
    this.currentRecommendationEventId = 1;
    this.currentTrendingPlaceId = 1;
    this.currentItineraryCacheId = 1;
    this.currentCityCandidateId = 1;
    this.seedPrebuiltRoutes();
    this.seedCityCandidates();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.password === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, username: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, username };
    this.users.set(id, updated);
    return updated;
  }
  
  async saveItinerary(itinerary: ItineraryResponse, userId?: number): Promise<{ id: number; itinerary: ItineraryResponse }> {
    const id = this.currentItineraryId++;
    this.itineraries.set(id, { itinerary, userId });
    return { id, itinerary };
  }

  async getItinerary(id: number): Promise<Itinerary | undefined> {
    const saved = this.itineraries.get(id);
    if (!saved) return undefined;
    
    // Convert to Itinerary format
    return {
      id,
      userId: saved.userId || null,
      title: saved.itinerary.title,
      description: saved.itinerary.description,
      location: saved.itinerary.location,
      activities: saved.itinerary.activities as any,
      recommendations: saved.itinerary.recommendations as any,
      createdAt: new Date(),
      notes: saved.itinerary.notes || null,
    };
  }

  async getAllItineraries(userId?: number): Promise<Itinerary[]> {
    const all = Array.from(this.itineraries.entries()).map(([id, item]) => ({
      id,
      userId: item.userId || null,
      title: item.itinerary.title,
      description: item.itinerary.description,
      location: item.itinerary.location,
      activities: item.itinerary.activities as any,
      recommendations: item.itinerary.recommendations as any,
      createdAt: new Date(),
      notes: item.itinerary.notes || null,
    }));
    
    return userId ? all.filter(i => i.userId === userId) : all;
  }

  async deleteItinerary(id: number): Promise<void> {
    this.itineraries.delete(id);
  }

  async updateItineraryNotes(id: number, notes: string): Promise<Itinerary> {
    const saved = this.itineraries.get(id);
    if (!saved) throw new Error("Itinerary not found");
    const updatedItinerary = { ...saved.itinerary, notes };
    this.itineraries.set(id, { itinerary: updatedItinerary, userId: saved.userId });
    return {
      id,
      userId: saved.userId || null,
      title: updatedItinerary.title,
      description: updatedItinerary.description,
      location: updatedItinerary.location,
      activities: updatedItinerary.activities as any,
      recommendations: updatedItinerary.recommendations as any,
      createdAt: new Date(),
      notes: updatedItinerary.notes || null,
    };
  }

  async getPrebuiltRoutes(): Promise<PrebuiltRoute[]> {
    return Array.from(this.prebuiltRoutes.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getPrebuiltRouteBySlug(slug: string): Promise<PrebuiltRoute | undefined> {
    return this.prebuiltRoutes.get(slug);
  }

  async recordRecommendationEvent(event: InsertRecommendationEvent): Promise<RecommendationEvent> {
    const saved: RecommendationEvent = {
      id: this.currentRecommendationEventId++,
      userId: event.userId || null,
      itineraryId: event.itineraryId || null,
      eventType: event.eventType,
      city: event.city || null,
      candidateId: event.candidateId || null,
      activityId: event.activityId || null,
      recommendationId: event.recommendationId || null,
      source: event.source || null,
      metadata: event.metadata || null,
      createdAt: new Date(),
    };
    this.recommendationEvents.set(saved.id, saved);
    return saved;
  }

  async getRecommendationEvents(limit = 100): Promise<RecommendationEvent[]> {
    return Array.from(this.recommendationEvents.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async upsertTrendingPlace(place: InsertTrendingPlace): Promise<TrendingPlace> {
    const existing = this.trendingPlaces.get(place.placeId);
    const saved: TrendingPlace = {
      id: existing?.id || this.currentTrendingPlaceId++,
      city: place.city,
      placeId: place.placeId,
      title: place.title,
      category: place.category,
      score: place.score || 0,
      metadata: place.metadata || null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.trendingPlaces.set(saved.placeId, saved);
    return saved;
  }

  async getTrendingPlaces(city: string, limit = 10): Promise<TrendingPlace[]> {
    return Array.from(this.trendingPlaces.values())
      .filter((place) => place.city.toLowerCase() === city.toLowerCase())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async saveItineraryCache(cache: InsertItineraryCache): Promise<ItineraryCache> {
    const existing = this.itineraryCache.get(cache.cacheKey);
    const saved: ItineraryCache = {
      id: existing?.id || this.currentItineraryCacheId++,
      cacheKey: cache.cacheKey,
      city: cache.city,
      preferences: cache.preferences,
      itinerary: cache.itinerary,
      expiresAt: cache.expiresAt,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.itineraryCache.set(saved.cacheKey, saved);
    return saved;
  }

  async getItineraryCache(cacheKey: string): Promise<ItineraryCache | undefined> {
    const cached = this.itineraryCache.get(cacheKey);
    if (!cached || cached.expiresAt <= new Date()) return undefined;
    return cached;
  }

  async upsertCityCandidate(candidate: InsertCityCandidate): Promise<CityCandidate> {
    const existing = this.cityCandidates.get(candidate.candidateId);
    const saved: CityCandidate = {
      id: existing?.id || this.currentCityCandidateId++,
      city: candidate.city,
      candidateId: candidate.candidateId,
      title: candidate.title,
      category: candidate.category,
      location: candidate.location,
      image: candidate.image || null,
      price: candidate.price || null,
      rating: candidate.rating || null,
      duration: candidate.duration || null,
      tags: candidate.tags || null,
      metadata: candidate.metadata || null,
      sortOrder: candidate.sortOrder || 0,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.cityCandidates.set(saved.candidateId, saved);
    return saved;
  }

  async getCityCandidates(city: string, limit = 20): Promise<CityCandidate[]> {
    return Array.from(this.cityCandidates.values())
      .filter((candidate) => candidate.city.toLowerCase() === city.toLowerCase())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, limit);
  }

  private seedPrebuiltRoutes() {
    DEFAULT_PREBUILT_ROUTES.forEach((route) => {
      this.prebuiltRoutes.set(route.slug, {
        ...route,
        id: this.currentPrebuiltRouteId++,
        sortOrder: route.sortOrder || 0,
        createdAt: new Date(),
      });
    });
  }

  private seedCityCandidates() {
    DEFAULT_CITY_CANDIDATES.forEach((candidate) => {
      void this.upsertCityCandidate(candidate);
    });
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(users).where(eq(users.password, firebaseUid)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, username: string): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(users).set({ username }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async saveItinerary(itinerary: ItineraryResponse, userId?: number): Promise<{ id: number; itinerary: ItineraryResponse }> {
    if (!db) throw new Error("Database not configured");
    const insertData: InsertItinerary = {
      userId: userId || null,
      title: itinerary.title,
      description: itinerary.description,
      location: itinerary.location,
      activities: itinerary.activities as any,
      recommendations: itinerary.recommendations as any,
      notes: itinerary.notes || null,
    };

    const result = await db.insert(itineraries).values(insertData).returning();
    const saved = result[0];
    
    return {
      id: saved.id,
      itinerary: {
        title: saved.title,
        description: saved.description,
        location: saved.location,
        activities: saved.activities as any,
        recommendations: saved.recommendations as any,
        notes: saved.notes || undefined,
      },
    };
  }

  async getItinerary(id: number): Promise<Itinerary | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(itineraries).where(eq(itineraries.id, id)).limit(1);
    return result[0];
  }

  async getAllItineraries(userId?: number): Promise<Itinerary[]> {
    if (!db) throw new Error("Database not configured");
    if (userId) {
      return await db.select().from(itineraries).where(eq(itineraries.userId, userId));
    }
    return await db.select().from(itineraries);
  }

  async deleteItinerary(id: number): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(itineraries).where(eq(itineraries.id, id));
  }

  async updateItineraryNotes(id: number, notes: string): Promise<Itinerary> {
    if (!db) throw new Error("Database not configured");
    const result = await db.update(itineraries).set({ notes }).where(eq(itineraries.id, id)).returning();
    if (result.length === 0) throw new Error("Itinerary not found");
    return result[0];
  }

  async getPrebuiltRoutes(): Promise<PrebuiltRoute[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(prebuiltRoutes).orderBy(asc(prebuiltRoutes.sortOrder));
  }

  async getPrebuiltRouteBySlug(slug: string): Promise<PrebuiltRoute | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(prebuiltRoutes).where(eq(prebuiltRoutes.slug, slug)).limit(1);
    return result[0];
  }

  async recordRecommendationEvent(event: InsertRecommendationEvent): Promise<RecommendationEvent> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(recommendationEvents).values(event).returning();
    return result[0];
  }

  async getRecommendationEvents(limit = 100): Promise<RecommendationEvent[]> {
    if (!db) throw new Error("Database not configured");
    return await db.select().from(recommendationEvents).orderBy(desc(recommendationEvents.createdAt)).limit(limit);
  }

  async upsertTrendingPlace(place: InsertTrendingPlace): Promise<TrendingPlace> {
    if (!db) throw new Error("Database not configured");
    const existing = await db.select().from(trendingPlaces).where(eq(trendingPlaces.placeId, place.placeId)).limit(1);

    if (existing[0]) {
      const result = await db
        .update(trendingPlaces)
        .set({
          city: place.city,
          title: place.title,
          category: place.category,
          score: place.score || 0,
          metadata: place.metadata,
          updatedAt: new Date(),
        })
        .where(eq(trendingPlaces.placeId, place.placeId))
        .returning();
      return result[0];
    }

    const result = await db.insert(trendingPlaces).values(place).returning();
    return result[0];
  }

  async getTrendingPlaces(city: string, limit = 10): Promise<TrendingPlace[]> {
    if (!db) throw new Error("Database not configured");
    return await db
      .select()
      .from(trendingPlaces)
      .where(eq(trendingPlaces.city, city))
      .orderBy(desc(trendingPlaces.score))
      .limit(limit);
  }

  async saveItineraryCache(cache: InsertItineraryCache): Promise<ItineraryCache> {
    if (!db) throw new Error("Database not configured");
    const existing = await db.select().from(itineraryCache).where(eq(itineraryCache.cacheKey, cache.cacheKey)).limit(1);

    if (existing[0]) {
      const result = await db
        .update(itineraryCache)
        .set({
          city: cache.city,
          preferences: cache.preferences,
          itinerary: cache.itinerary,
          expiresAt: cache.expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(itineraryCache.cacheKey, cache.cacheKey))
        .returning();
      return result[0];
    }

    const result = await db.insert(itineraryCache).values(cache).returning();
    return result[0];
  }

  async getItineraryCache(cacheKey: string): Promise<ItineraryCache | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(itineraryCache).where(eq(itineraryCache.cacheKey, cacheKey)).limit(1);
    const cached = result[0];
    if (!cached || cached.expiresAt <= new Date()) return undefined;
    return cached;
  }

  async upsertCityCandidate(candidate: InsertCityCandidate): Promise<CityCandidate> {
    if (!db) throw new Error("Database not configured");
    const existing = await db.select().from(cityCandidates).where(eq(cityCandidates.candidateId, candidate.candidateId)).limit(1);

    if (existing[0]) {
      const result = await db
        .update(cityCandidates)
        .set({
          city: candidate.city,
          title: candidate.title,
          category: candidate.category,
          location: candidate.location,
          image: candidate.image,
          price: candidate.price,
          rating: candidate.rating,
          duration: candidate.duration,
          tags: candidate.tags,
          metadata: candidate.metadata,
          sortOrder: candidate.sortOrder || 0,
          updatedAt: new Date(),
        })
        .where(eq(cityCandidates.candidateId, candidate.candidateId))
        .returning();
      return result[0];
    }

    const result = await db.insert(cityCandidates).values(candidate).returning();
    return result[0];
  }

  async getCityCandidates(city: string, limit = 20): Promise<CityCandidate[]> {
    if (!db) throw new Error("Database not configured");
    return await db
      .select()
      .from(cityCandidates)
      .where(eq(cityCandidates.city, city))
      .orderBy(asc(cityCandidates.sortOrder))
      .limit(limit);
  }
}

// Use database storage if DATABASE_URL is set, otherwise fall back to memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : new MemStorage();
