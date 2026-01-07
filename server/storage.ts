import { users, itineraries, type User, type InsertUser, type Itinerary, type InsertItinerary } from "@shared/schema";
import type { ItineraryResponse } from "../client/src/lib/openai";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveItinerary(itinerary: ItineraryResponse, userId?: number): Promise<{ id: number; itinerary: ItineraryResponse }>;
  getItinerary(id: number): Promise<Itinerary | undefined>;
  getAllItineraries(userId?: number): Promise<Itinerary[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private itineraries: Map<number, ItineraryResponse>;
  currentId: number;
  currentItineraryId: number;

  constructor() {
    this.users = new Map();
    this.itineraries = new Map();
    this.currentId = 1;
    this.currentItineraryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async saveItinerary(itinerary: ItineraryResponse, userId?: number): Promise<{ id: number; itinerary: ItineraryResponse }> {
    const id = this.currentItineraryId++;
    this.itineraries.set(id, itinerary);
    return { id, itinerary };
  }

  async getItinerary(id: number): Promise<Itinerary | undefined> {
    const saved = this.itineraries.get(id);
    if (!saved) return undefined;
    
    // Convert to Itinerary format
    return {
      id,
      userId: null,
      title: saved.title,
      description: saved.description,
      location: saved.location,
      activities: saved.activities as any,
      recommendations: saved.recommendations as any,
      createdAt: new Date(),
    };
  }

  async getAllItineraries(userId?: number): Promise<Itinerary[]> {
    const all = Array.from(this.itineraries.entries()).map(([id, itinerary]) => ({
      id,
      userId: userId || null,
      title: itinerary.title,
      description: itinerary.description,
      location: itinerary.location,
      activities: itinerary.activities as any,
      recommendations: itinerary.recommendations as any,
      createdAt: new Date(),
    }));
    
    return userId ? all.filter(i => i.userId === userId) : all;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(users).values(insertUser).returning();
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
}

// Use database storage if DATABASE_URL is set, otherwise fall back to memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : new MemStorage();
