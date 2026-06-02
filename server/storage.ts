import { users, itineraries, type User, type InsertUser, type Itinerary, type InsertItinerary } from "../shared/schema.js";
import type { ItineraryResponse } from "../client/src/lib/openai";
import { db } from "./db.js";
import { eq } from "drizzle-orm";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private itineraries: Map<number, { itinerary: ItineraryResponse; userId?: number }>;
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
}

// Use database storage if DATABASE_URL is set, otherwise fall back to memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : new MemStorage();
