import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { getCandidatesForLocation, getTrendingCandidates, type CityCandidate } from "./city-candidates.js";
import { rankCandidates, scorePlace, buildCandidateMatchReasons } from "./recommendation-scoring.js";

// Validation schemas
const preferenceSchema = z.object({
  hangoutTypes: z.array(z.string()),
  duration: z.string(),
  budget: z.string(),
  groupSize: z.string().optional(),
  mood: z.array(z.string()).optional()
});

const locationSchema = z.object({
  location: z.string(),
  distance: z.string(),
  transportation: z.array(z.string())
});

const generateItinerarySchema = z.object({
  preferences: preferenceSchema,
  locationData: locationSchema,
  userId: z.number().optional(),
  seedRecommendation: z.object({
    city: z.string().optional(),
    tags: z.array(z.string()).optional(),
    mood: z.array(z.string()).optional(),
    duration: z.string().optional(),
    budget: z.string().optional(),
    seedPlaces: z.array(z.string()).optional(),
    title: z.string().optional(),
  }).optional()
});

const placePhotoCache = new Map<string, { body: Buffer; contentType: string; expiresAt: number }>();
const PLACE_PHOTO_CACHE_MS = 1000 * 60 * 60 * 24;
const recommendationEvents: Array<{
  eventType: string;
  entityType: string;
  entityId: string;
  userId?: number;
  itineraryId?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}> = [];

// Types for API response
interface ItineraryActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  image: string;
  price: string;
  rating: string;
  timeOfDay: "morning" | "afternoon" | "evening";
  type: string;
  score?: number;
  matchReasons?: string[];
  tags?: string[];
  noveltyLevel?: "iconic" | "popular-local" | "hidden-gem" | "niche";
  neighborhood?: string;
  indoorOutdoor?: "indoor" | "outdoor" | "mixed";
  trendScore?: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  image: string;
  rating: string;
  duration: string;
  score?: number;
  matchReasons?: string[];
  tags?: string[];
  noveltyLevel?: "iconic" | "popular-local" | "hidden-gem" | "niche";
  neighborhood?: string;
  indoorOutdoor?: "indoor" | "outdoor" | "mixed";
  trendScore?: number;
  seedRecommendation?: {
    city?: string;
    tags?: string[];
    mood?: string[];
    duration?: string;
    budget?: string;
    seedPlaces?: string[];
    title?: string;
  };
}

interface ItineraryResponse {
  title: string;
  description: string;
  location: string;
  activities: ItineraryActivity[];
  recommendations: Recommendation[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/place-photo", async (req: Request, res: Response) => {
    const query = String(req.query.query || "").trim();
    const fallback = String(req.query.fallback || "").trim();
    const stockFallback = String(req.query.stockFallback || "").trim();

    if (!query) {
      return await redirectToImageFallback(res, query, fallback, stockFallback);
    }

    try {
      const photo = await fetchGooglePlacePhoto(query);

      if (!photo) {
        return await redirectToImageFallback(res, query, fallback, stockFallback);
      }

      res.setHeader("Content-Type", photo.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.send(photo.body);
    } catch (error) {
      console.error("Error fetching Google place photo:", error);
      return await redirectToImageFallback(res, query, fallback, stockFallback);
    }
  });

  app.get("/api/weather", async (req: Request, res: Response) => {
    const location = String(req.query.location || "").trim();

    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }

    try {
      const geocodeResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );

      if (!geocodeResponse.ok) {
        throw new Error("Failed to geocode location");
      }

      const geocodeData = await geocodeResponse.json();
      const match = geocodeData.results?.[0];

      if (!match) {
        return res.status(404).json({ message: "Location not found" });
      }

      const forecastResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`
      );

      if (!forecastResponse.ok) {
        throw new Error("Failed to fetch weather");
      }

      const forecastData = await forecastResponse.json();
      const current = forecastData.current;

      res.json({
        locationName: [match.name, match.admin1, match.country].filter(Boolean).join(", "),
        main: {
          temp: current.temperature_2m,
          humidity: current.relative_humidity_2m,
        },
        wind: {
          speed: current.wind_speed_10m,
        },
        weather: getWeatherDetails(current.weather_code),
      });
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather" });
    }
  });

  app.get("/api/place-suggestions", async (req: Request, res: Response) => {
    const input = String(req.query.input || "").trim();
    if (!input) {
      return res.json([]);
    }

    const FALLBACK_CITIES = [
      { text: "Delhi, India", placeId: "ch1" },
      { text: "Noida, Uttar Pradesh, India", placeId: "ch2" },
      { text: "Jaipur, Rajasthan, India", placeId: "ch3" },
      { text: "Mussoorie, Uttarakhand, India", placeId: "ch4" },
      { text: "Mumbai, Maharashtra, India", placeId: "ch5" },
      { text: "Bangalore, Karnataka, India", placeId: "ch6" },
      { text: "Pune, Maharashtra, India", placeId: "ch7" },
      { text: "Goa, India", placeId: "ch8" },
      { text: "Agra, Uttar Pradesh, India", placeId: "ch9" },
      { text: "Shimla, Himachal Pradesh, India", placeId: "ch10" },
      { text: "Manali, Himachal Pradesh, India", placeId: "ch11" },
      { text: "Dehradun, Uttarakhand, India", placeId: "ch12" },
      { text: "Kolkata, West Bengal, India", placeId: "ch13" },
      { text: "Hyderabad, Telangana, India", placeId: "ch14" },
      { text: "Chennai, Tamil Nadu, India", placeId: "ch15" },
    ];

    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      const matching = FALLBACK_CITIES.filter(c => 
        c.text.toLowerCase().includes(input.toLowerCase())
      );
      return res.json(matching);
    }

    try {
      const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify({
          input,
          includedPrimaryTypes: ["(cities)"],
          regionCode: "IN",
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Autocomplete failed with ${response.status}`);
      }

      const data = await response.json();
      const suggestions = (data.suggestions || []).map((s: any) => ({
        text: s.placePrediction?.text?.text || "",
        placeId: s.placePrediction?.placeId || "",
      }));

      const merged = [
        ...suggestions,
        ...FALLBACK_CITIES.filter(c => 
          c.text.toLowerCase().includes(input.toLowerCase()) &&
          !suggestions.some((s: any) => s.text.toLowerCase().includes(c.text.toLowerCase()))
        )
      ];

      res.json(merged);
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
      const matching = FALLBACK_CITIES.filter(c => 
        c.text.toLowerCase().includes(input.toLowerCase())
      );
      res.json(matching);
    }
  });

  app.post("/api/auth/sync", async (req: Request, res: Response) => {
    try {
      const { firebaseUid, username, email } = req.body;

      if (!firebaseUid) {
        return res.status(400).json({ message: "Firebase UID is required" });
      }

      // 1. Look up by firebaseUid (stored in password field) first
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      let isNew = false;

      if (!user) {
        // 2. If no user has this Firebase UID, check if their default username (email) is already taken
        const lookupName = email || username || `user_${firebaseUid.slice(0, 5)}`;
        const existingUserWithUsername = await storage.getUserByUsername(lookupName);
        
        // If the username is already taken by someone else, append a random suffix to make it unique
        const finalUsername = existingUserWithUsername 
          ? `${lookupName.split('@')[0]}_${Math.floor(1000 + Math.random() * 9000)}`
          : lookupName;

        user = await storage.createUser({
          username: finalUsername,
          password: firebaseUid,
        });
        isNew = true;
        console.log("Created database user for Firebase session:", user.id);
      } else {
        console.log("Synced existing user for Firebase session:", user.id);
      }

      res.json({
        id: user.id,
        username: user.username,
        isNew,
      });
    } catch (error) {
      console.error("Auth sync error:", error);
      res.status(500).json({ message: "Failed to synchronize user session" });
    }
  });

  app.post("/api/user/update", async (req: Request, res: Response) => {
    try {
      const { id, username } = req.body;

      if (!id || !username) {
        return res.status(400).json({ message: "User ID and new username are required" });
      }

      const updatedUser = await storage.updateUser(Number(id), String(username).trim());
      console.log("Updated user profile in database:", updatedUser.id, "to:", updatedUser.username);

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
      });
    } catch (error) {
      console.error("User profile update error:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.get("/api/prebuilt-itineraries", async (_req: Request, res: Response) => {
    try {
      const routes = await storage.getPrebuiltRoutes();

      res.json(routes.map((route) => ({
        slug: route.slug,
        city: route.city,
        mood: route.mood,
        stops: route.stops,
        accent: route.accent,
        image: route.image,
        tagline: route.tagline,
      })));
    } catch (error) {
      console.error("Error loading prebuilt itineraries:", error);
      res.status(500).json({ message: "Failed to load prebuilt itineraries" });
    }
  });

  app.get("/api/prebuilt-itineraries/:slug", async (req: Request, res: Response) => {
    try {
      const route = await storage.getPrebuiltRouteBySlug(String(req.params.slug));

      if (!route) {
        return res.status(404).json({ message: "Prebuilt itinerary not found" });
      }

      res.json({
        slug: route.slug,
        city: route.city,
        mood: route.mood,
        stops: route.stops,
        accent: route.accent,
        image: route.image,
        tagline: route.tagline,
        itinerary: route.itinerary,
      });
    } catch (error) {
      console.error("Error loading prebuilt itinerary:", error);
      res.status(500).json({ message: "Failed to load prebuilt itinerary" });
    }
  });

  app.get("/api/trending-places", async (req: Request, res: Response) => {
    const city = String(req.query.city || req.query.location || "Delhi").trim();
    const limit = Math.min(Number(req.query.limit || 10), 20);

    try {
      const stored = await storage.getTrendingPlaces(city, limit);

      if (stored.length > 0) {
        return res.json(stored);
      }

      return res.json(
        getTrendingCandidates(city, limit).map((candidate) => ({
          city: candidate.city,
          placeId: candidate.id,
          title: candidate.title,
          category: candidate.type,
          score: candidate.trendScore,
          metadata: {
            neighborhood: candidate.neighborhood,
            location: candidate.address,
            tags: candidate.tags,
            trendReason: candidate.trendReason,
            noveltyLevel: candidate.noveltyLevel,
            indoorOutdoor: candidate.indoorOutdoor,
          },
        }))
      );
    } catch (error) {
      console.error("Error loading trending places:", error);
      res.status(500).json({ message: "Failed to load trending places" });
    }
  });

  app.post("/api/recommendation-events", async (req: Request, res: Response) => {
    try {
      const payload = z.object({
        userId: z.number().optional(),
        itineraryId: z.number().optional(),
        eventType: z.string(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        city: z.string().optional(),
        candidateId: z.string().optional(),
        activityId: z.string().optional(),
        recommendationId: z.string().optional(),
        source: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      }).parse(req.body);

      const saved = await storage.recordRecommendationEvent({
        userId: payload.userId,
        itineraryId: payload.itineraryId,
        eventType: payload.eventType,
        city: payload.city,
        candidateId: payload.candidateId,
        activityId: payload.activityId,
        recommendationId: payload.recommendationId || payload.entityId,
        source: payload.source || payload.entityType,
        metadata: payload.metadata,
      });

      recommendationEvents.push({
        eventType: payload.eventType,
        entityType: payload.entityType || payload.source || "unknown",
        entityId: payload.entityId || payload.recommendationId || payload.activityId || payload.candidateId || "",
        userId: payload.userId,
        itineraryId: payload.itineraryId,
        metadata: payload.metadata,
        createdAt: saved.createdAt.toISOString(),
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Error recording recommendation event:", error);
      res.status(400).json({ message: "Invalid recommendation event" });
    }
  });

  // API endpoint to generate an itinerary
  app.post("/api/generate-itinerary", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const { preferences, locationData, userId, seedRecommendation } = generateItinerarySchema.parse(req.body);
      
      console.log("Generating itinerary for", locationData.location);
      const cacheKey = buildItineraryCacheKey(preferences, locationData, seedRecommendation);
      const cached = await storage.getItineraryCache(cacheKey);
      const rankedCandidates = rankCandidates(
        buildGenerationCandidates(locationData.location, seedRecommendation),
        preferences,
        locationData,
        18
      );
      
      // Initialize itinerary data with default
      let itineraryData: ItineraryResponse = {
        title: "Your Adventure",
        description: "A personalized itinerary just for you.",
        location: locationData.location,
        activities: [],
        recommendations: []
      };
      let useGemini = Boolean(process.env.GEMINI_API_KEY);
      
      // Try to use Gemini first when a valid API key is configured
      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not configured");
        }

        // ✅ FIXED: Use the correct @google/genai SDK
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("Attempting to use Gemini for personalized itinerary...");
        
        // Prepare the prompt for Gemini
        const groupSize = preferences.groupSize || "Solo";
        const moods = preferences.mood?.length ? preferences.mood.join(", ") : "Relaxed";
        const candidateBrief = formatCandidatesForPrompt(rankedCandidates);
        const cacheBrief = cached
          ? `\nA similar cached itinerary exists. Use it only as inspiration, then refresh 1-2 stops if the candidate pool gives a better fit:\n${JSON.stringify((cached.itinerary as any), null, 2).slice(0, 5000)}\n`
          : "";
        const seedBrief = seedRecommendation
          ? `\nThe user clicked this recommendation as the seed for the new route: ${JSON.stringify(seedRecommendation)}\n`
          : "";

        const prompt = `You are an expert travel planner with deep knowledge of Indian locations. You create detailed, realistic itineraries based on user preferences.

Generate a personalized hangout itinerary for ${locationData.location}.

Preferences:
- Activities: ${preferences.hangoutTypes.join(", ")}
- Duration: ${preferences.duration}
- Budget: ${preferences.budget}
- Group Size: ${groupSize}
- Vibe/Mood: ${moods}
- Maximum travel distance: ${locationData.distance}
- Transportation: ${locationData.transportation.join(", ")}
${seedBrief}
Grounded candidate places, ranked by local preference fit and trend signals:
${candidateBrief}
${cacheBrief}

IMPORTANT: Tailor the itinerary to the GROUP SIZE and VIBE/MOOD:
- For "Solo": Focus on safe, welcoming places good for solo travelers
- For "Couple": Include romantic, intimate spots perfect for two
- For "Small Group" (3-5): Balance activities that work well for groups but aren't too crowded
- For "Large Group" (6+): Focus on spacious venues, group-friendly spots, easy logistics

Match the activities to the VIBE/MOOD selected - if "Romantic", prioritize couples activities; if "Adventurous", prioritize active/exciting options; if "Foodie", prioritize culinary experiences; etc.

Discovery and novelty requirements:
- Prefer the grounded candidate places when they fit, and sequence them into a realistic route.
- Include at least 2 lesser-known, niche, local, or neighborhood-specific places when the candidate pool supports it.
- Include at least 1 place locals would realistically recommend but first-time travel blogs may miss.
- Avoid filling the plan with only famous city defaults. Use a 40% iconic / 60% fresh-local target unless the user clearly asked for iconic sightseeing.
- Do not invent fake venues. If unsure about a place name, use a neighborhood/activity description instead.
- Make trending places a boost, not an override; they still need to fit the user's mood, budget, group size, distance, and transport.

Please generate a complete itinerary with realistic locations, descriptions, and timeline.
The response must be valid JSON format only (no markdown, no code blocks) and include:
1. A title and description for the itinerary that reflects the vibe and group size
2. The location
3. A list of 6 activities (2 morning, 2 afternoon, 2 evening) with:
   - Unique ID (string)
   - Time (e.g., "9:00 AM")
   - Title
   - Description
   - Location (street address and neighborhood)
   - Price category (use "₹" for budget, "₹₹" for moderate, "₹₹₹" for expensive)
   - Rating (e.g., "4.8 ★")
   - Type (one of: "exploring", "eating", "historical", "cafe")
   - Time of day category ("morning", "afternoon", or "evening")
   - tags (array of strings)
   - matchReasons (array of 2-4 short strings)
   - noveltyLevel ("iconic", "popular-local", "hidden-gem", or "niche")
   - neighborhood
   - indoorOutdoor ("indoor", "outdoor", or "mixed")
   - trendScore (number 0-100 when known)
4. Three relevant recommended similar adventures with id, title, description, rating, duration, tags, matchReasons, noveltyLevel, neighborhood, indoorOutdoor, trendScore, and seedRecommendation.

Make activities specific to the location, realistic, and based on actual venues. Include exact addresses.
Format all times appropriately. Make sure descriptions are engaging and 1-2 sentences long.
Focus on authentic Indian experiences.

Return only valid JSON without any markdown formatting or code blocks.`;

        // ✅ FIXED: Use correct @google/genai API
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.8,
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingBudget: 0, // Disable thinking for faster responses
            },
          },
        });

        // ✅ FIXED: response.text is a string property, not a method
        const responseText = response.text;

        if (!responseText) {
          throw new Error("Empty response from Gemini");
        }

        itineraryData = normalizeGeneratedItinerary(
          JSON.parse(responseText),
          preferences,
          locationData,
          rankedCandidates
        );
        itineraryData = improveItineraryWithScoring(itineraryData, preferences, locationData, rankedCandidates);
        console.log("Successfully generated personalized itinerary using Gemini 2.5 Flash");
        
      } catch (apiError) {
        console.log("Gemini API error, using fallback data:", apiError);
        useGemini = false;
      }
      
      // If Gemini API failed or reached rate limit, use pre-configured data
      if (!useGemini) {
        console.log("Using pre-configured itinerary data for", locationData.location);

        // Create itineraries for different locations - Delhi is default
        const itineraries: Record<string, ItineraryResponse> = {
          "Default": {
            title: `${preferences.duration} Adventure in ${locationData.location}`,
            description: `Enjoy a ${preferences.budget.toLowerCase()} itinerary exploring the best of ${locationData.location} with a focus on ${preferences.hangoutTypes.join(", ").toLowerCase()}.`,
            location: locationData.location,
            activities: [
              {
                id: "act1",
                time: "9:00 AM",
                title: `Morning Exploration in ${locationData.location}`,
                description: "Start your day with a relaxing morning exploring local attractions and getting a feel for the area.",
                location: `${locationData.location} City Center`,
                image: getRandomImageForCategory("cafe atmosphere"),
                price: "₹",
                rating: "4.5 ★",
                timeOfDay: "morning",
                type: "exploring"
              },
              {
                id: "act2",
                time: "11:00 AM",
                title: "Local Cafe Experience",
                description: "Enjoy a coffee break at a popular local cafe known for its ambiance.",
                location: `${locationData.location} Main Street`,
                image: getRandomImageForCategory("cafe atmosphere"),
                price: "₹",
                rating: "4.6 ★",
                timeOfDay: "morning",
                type: "cafe"
              },
              {
                id: "act3",
                time: "1:30 PM",
                title: "Lunch at Local Favorite",
                description: "Savor delicious local cuisine at a well-reviewed restaurant.",
                location: `${locationData.location} Food District`,
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹",
                rating: "4.7 ★",
                timeOfDay: "afternoon",
                type: "eating"
              },
              {
                id: "act4",
                time: "3:30 PM",
                title: "City Walking Tour",
                description: "Explore the local culture and hidden gems on a self-guided walking tour.",
                location: `${locationData.location} Downtown`,
                image: getRandomImageForCategory("city exploration"),
                price: "Free",
                rating: "4.5 ★",
                timeOfDay: "afternoon",
                type: "exploring"
              },
              {
                id: "act5",
                time: "6:30 PM",
                title: "Sunset Viewpoint",
                description: "End your day with beautiful sunset views at a scenic location.",
                location: `${locationData.location} Viewpoint`,
                image: getRandomImageForCategory("city exploration"),
                price: "Free",
                rating: "4.8 ★",
                timeOfDay: "evening",
                type: "exploring"
              },
              {
                id: "act6",
                time: "8:00 PM",
                title: "Dinner and Relaxation",
                description: "Conclude with a satisfying dinner at a popular local restaurant.",
                location: `${locationData.location} Restaurant Row`,
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹",
                rating: "4.6 ★",
                timeOfDay: "evening",
                type: "eating"
              }
            ],
            recommendations: [
              {
                id: "rec1",
                title: "Historical Sites Tour",
                description: "Explore the historical landmarks and cultural heritage of the area.",
                image: getRandomImageForCategory("historical landmarks"),
                rating: "4.7 ★",
                duration: "Half day"
              },
              {
                id: "rec2",
                title: "Local Food Experience",
                description: "Discover the best local cuisine through guided food tours.",
                image: getRandomImageForCategory("restaurant dining"),
                rating: "4.8 ★",
                duration: "3-4 hours"
              },
              {
                id: "rec3",
                title: "Adventure Activities",
                description: "Experience thrilling outdoor activities and adventures nearby.",
                image: getRandomImageForCategory("people enjoying outings"),
                rating: "4.6 ★",
                duration: "Full day"
              }
            ]
          },
          "Delhi": {
            title: `${preferences.duration} Adventure in Delhi`,
            description: `Enjoy a ${preferences.budget.toLowerCase()} itinerary exploring the best of Delhi with a focus on ${preferences.hangoutTypes.join(", ").toLowerCase()}.`,
            location: "Delhi",
            activities: [
              {
                id: "act1",
                time: "9:00 AM",
                title: "Morning Chai at Connaught Place",
                description: "Start your day with a traditional chai and breakfast at one of the iconic cafes in this colonial-era shopping district.",
                location: "Connaught Place, New Delhi",
                image: getRandomImageForCategory("cafe atmosphere"),
                price: "₹",
                rating: "4.6 ★",
                timeOfDay: "morning",
                type: "cafe"
              },
              {
                id: "act2",
                time: "11:00 AM",
                title: "Visit Humayun's Tomb",
                description: "Explore this UNESCO World Heritage site with its stunning Mughal architecture and beautiful gardens.",
                location: "Mathura Road, Nizamuddin, New Delhi",
                image: getRandomImageForCategory("historical landmarks"),
                price: "₹₹",
                rating: "4.8 ★",
                timeOfDay: "morning",
                type: "historical"
              },
              {
                id: "act3",
                time: "1:30 PM",
                title: "Lunch at Karim's",
                description: "Enjoy authentic Mughlai cuisine at this legendary restaurant known for its kebabs and curries.",
                location: "16, Gali Kababian, Jama Masjid, Old Delhi",
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹",
                rating: "4.7 ★",
                timeOfDay: "afternoon",
                type: "eating"
              },
              {
                id: "act4",
                time: "3:30 PM",
                title: "Shop at Dilli Haat",
                description: "Browse handcrafted items, textiles, and souvenirs from across India at this open-air market.",
                location: "INA Market, New Delhi",
                image: getRandomImageForCategory("city exploration"),
                price: "₹",
                rating: "4.5 ★",
                timeOfDay: "afternoon",
                type: "exploring"
              },
              {
                id: "act5",
                time: "6:30 PM",
                title: "Sunset at India Gate",
                description: "Watch the sunset and see the monument beautifully lit up as evening falls.",
                location: "Rajpath, New Delhi",
                image: getRandomImageForCategory("historical landmarks"),
                price: "Free",
                rating: "4.9 ★",
                timeOfDay: "evening",
                type: "historical"
              },
              {
                id: "act6",
                time: "8:00 PM",
                title: "Dinner at Bukhara",
                description: "Experience one of Delhi's finest dining venues known for its Northwest Frontier cuisine and tandoori dishes.",
                location: "ITC Maurya, Diplomatic Enclave, Sardar Patel Marg",
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹₹",
                rating: "4.8 ★",
                timeOfDay: "evening",
                type: "eating"
              }
            ],
            recommendations: [
              {
                id: "rec1",
                title: "Historical Delhi Tour",
                description: "A full-day tour covering Red Fort, Qutub Minar, and other historical monuments in Delhi.",
                image: getRandomImageForCategory("historical landmarks"),
                rating: "4.7 ★",
                duration: "Full day"
              },
              {
                id: "rec2",
                title: "Food Walk in Old Delhi",
                description: "Sample the best street food Delhi has to offer in the narrow lanes of Chandni Chowk.",
                image: getRandomImageForCategory("restaurant dining"),
                rating: "4.9 ★",
                duration: "3-4 hours"
              },
              {
                id: "rec3",
                title: "Day Trip to Agra",
                description: "Visit the magnificent Taj Mahal and Agra Fort on a day trip from Delhi.",
                image: getRandomImageForCategory("historical landmarks"),
                rating: "4.8 ★",
                duration: "Full day"
              }
            ]
          },
          "Noida": {
            title: `${preferences.duration} Urban Experience in Noida`,
            description: `Discover the perfect blend of modernity and culture in Noida with this ${preferences.budget.toLowerCase()} itinerary focused on ${preferences.hangoutTypes.join(", ").toLowerCase()}.`,
            location: "Noida",
            activities: [
              {
                id: "act1",
                time: "9:30 AM",
                title: "Breakfast at Gardens Galleria Mall",
                description: "Start your day with breakfast at one of the many cafes in this premium shopping destination.",
                location: "Gardens Galleria Mall, Sector 38, Noida",
                image: getRandomImageForCategory("cafe atmosphere"),
                price: "₹₹",
                rating: "4.3 ★",
                timeOfDay: "morning",
                type: "cafe"
              },
              {
                id: "act2",
                time: "11:30 AM",
                title: "Visit Okhla Bird Sanctuary",
                description: "Explore this urban oasis which is home to over 300 bird species and provides a respite from the city's hustle.",
                location: "Okhla Bird Sanctuary, Sector 95, Noida",
                image: getRandomImageForCategory("city exploration"),
                price: "₹",
                rating: "4.4 ★",
                timeOfDay: "morning",
                type: "exploring"
              },
              {
                id: "act3",
                time: "2:00 PM",
                title: "Lunch at Sector 18 Market",
                description: "Enjoy a variety of cuisines at one of the many renowned restaurants in Noida's premier shopping district.",
                location: "Sector 18 Market, Noida",
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹",
                rating: "4.5 ★",
                timeOfDay: "afternoon",
                type: "eating"
              },
              {
                id: "act4",
                time: "4:00 PM",
                title: "Shopping at DLF Mall of India",
                description: "Browse through one of India's largest shopping malls featuring international and domestic brands.",
                location: "DLF Mall of India, Sector 18, Noida",
                image: getRandomImageForCategory("city exploration"),
                price: "₹₹₹",
                rating: "4.7 ★",
                timeOfDay: "afternoon",
                type: "exploring"
              },
              {
                id: "act5",
                time: "7:00 PM",
                title: "Evening Walk at Noida Golf Course",
                description: "Enjoy the sunset views at the beautifully maintained Noida Golf Course.",
                location: "Noida Golf Course, Sector 38, Noida",
                image: getRandomImageForCategory("city exploration"),
                price: "Free",
                rating: "4.6 ★",
                timeOfDay: "evening",
                type: "exploring"
              },
              {
                id: "act6",
                time: "8:30 PM",
                title: "Dinner at The Great India Place",
                description: "Conclude your day with dinner at one of the popular restaurants in this vibrant mall.",
                location: "The Great India Place, Sector 38A, Noida",
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹",
                rating: "4.4 ★",
                timeOfDay: "evening",
                type: "eating"
              }
            ],
            recommendations: [
              {
                id: "rec1",
                title: "Gaming Day at Worlds of Wonder",
                description: "Enjoy a fun-filled day at this amusement park and water park complex.",
                image: getRandomImageForCategory("people enjoying outings"),
                rating: "4.5 ★",
                duration: "Full day"
              },
              {
                id: "rec2",
                title: "Noida Art & Cultural Tour",
                description: "Discover the growing art scene in Noida with visits to galleries and cultural centers.",
                image: getRandomImageForCategory("historical landmarks"),
                rating: "4.3 ★",
                duration: "Half day"
              },
              {
                id: "rec3",
                title: "Wellness Day at Sector 104",
                description: "Indulge in spa treatments and wellness activities in Noida's luxury spas.",
                image: getRandomImageForCategory("cafe atmosphere"),
                rating: "4.7 ★",
                duration: "Half day"
              }
            ]
          },
          "Jaipur": {
            title: `${preferences.duration} Royal Experience in Jaipur`,
            description: `Experience the Pink City's royal heritage and vibrant culture with this ${preferences.budget.toLowerCase()} itinerary focused on ${preferences.hangoutTypes.join(", ").toLowerCase()}.`,
            location: "Jaipur",
            activities: [
              {
                id: "act1",
                time: "8:30 AM",
                title: "Breakfast at Lakshmi Misthan Bhandar",
                description: "Start your day with authentic Rajasthani breakfast at this iconic sweet shop and restaurant.",
                location: "Johari Bazaar Road, Jaipur",
                image: getRandomImageForCategory("cafe atmosphere"),
                price: "₹",
                rating: "4.6 ★",
                timeOfDay: "morning",
                type: "cafe"
              },
              {
                id: "act2",
                time: "10:00 AM",
                title: "Explore Amber Fort",
                description: "Visit this magnificent fort complex with its stunning architecture, intricate carvings, and breathtaking views.",
                location: "Amer, Jaipur",
                image: getRandomImageForCategory("historical landmarks"),
                price: "₹₹",
                rating: "4.9 ★",
                timeOfDay: "morning",
                type: "historical"
              },
              {
                id: "act3",
                time: "1:30 PM",
                title: "Lunch at Chokhi Dhani",
                description: "Experience authentic Rajasthani cuisine in this village-themed restaurant.",
                location: "Tonk Road, Jaipur",
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹",
                rating: "4.7 ★",
                timeOfDay: "afternoon",
                type: "eating"
              },
              {
                id: "act4",
                time: "3:30 PM",
                title: "Shopping at Johari Bazaar",
                description: "Browse through colorful textiles, jewelry, and handicrafts in this traditional market.",
                location: "Johari Bazaar, Jaipur",
                image: getRandomImageForCategory("city exploration"),
                price: "₹₹",
                rating: "4.5 ★",
                timeOfDay: "afternoon",
                type: "exploring"
              },
              {
                id: "act5",
                time: "6:00 PM",
                title: "Sunset at Nahargarh Fort",
                description: "Enjoy panoramic views of the Pink City as the sun sets behind the Aravalli hills.",
                location: "Nahargarh Fort, Jaipur",
                image: getRandomImageForCategory("historical landmarks"),
                price: "₹",
                rating: "4.8 ★",
                timeOfDay: "evening",
                type: "historical"
              },
              {
                id: "act6",
                time: "8:30 PM",
                title: "Dinner at 1135 AD",
                description: "Dine like royalty in this opulent restaurant located within Amber Fort.",
                location: "Amber Fort, Jaipur",
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹₹",
                rating: "4.8 ★",
                timeOfDay: "evening",
                type: "eating"
              }
            ],
            recommendations: [
              {
                id: "rec1",
                title: "Elephant Safari at Amer",
                description: "Experience a royal elephant ride at the iconic Amber Fort, just like the Maharajas once did.",
                image: getRandomImageForCategory("historical landmarks"),
                rating: "4.6 ★",
                duration: "Half day"
              },
              {
                id: "rec2",
                title: "Hot Air Balloon Ride",
                description: "Soar above the Pink City for a breathtaking aerial view of palaces and forts.",
                image: getRandomImageForCategory("city exploration"),
                rating: "4.9 ★",
                duration: "3 hours"
              },
              {
                id: "rec3",
                title: "Block Printing Workshop",
                description: "Learn the traditional art of Rajasthani block printing from local artisans.",
                image: getRandomImageForCategory("people enjoying outings"),
                rating: "4.7 ★",
                duration: "Half day"
              }
            ]
          },
          "Mussoorie": {
            title: `${preferences.duration} Mountain Retreat in Mussoorie`,
            description: `Escape to the Queen of Hills with this refreshing ${preferences.budget.toLowerCase()} itinerary focused on ${preferences.hangoutTypes.join(", ").toLowerCase()}.`,
            location: "Mussoorie",
            activities: [
              {
                id: "act1",
                time: "8:00 AM",
                title: "Breakfast at Landour Bakehouse",
                description: "Start your day with freshly baked treats and coffee at this charming bakery in Landour.",
                location: "Landour, Mussoorie",
                image: getRandomImageForCategory("cafe atmosphere"),
                price: "₹₹",
                rating: "4.7 ★",
                timeOfDay: "morning",
                type: "cafe"
              },
              {
                id: "act2",
                time: "10:00 AM",
                title: "Walk on Camel's Back Road",
                description: "Enjoy a scenic stroll on this picturesque road with beautiful mountain views.",
                location: "Camel's Back Road, Mussoorie",
                image: getRandomImageForCategory("city exploration"),
                price: "Free",
                rating: "4.5 ★",
                timeOfDay: "morning",
                type: "exploring"
              },
              {
                id: "act3",
                time: "1:00 PM",
                title: "Lunch at Café Ivy",
                description: "Savor delicious food with panoramic views of the Doon Valley.",
                location: "Mall Road, Mussoorie",
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹",
                rating: "4.6 ★",
                timeOfDay: "afternoon",
                type: "eating"
              },
              {
                id: "act4",
                time: "3:00 PM",
                title: "Visit Company Garden",
                description: "Explore this beautiful garden with a mini lake, fountain, and various flower species.",
                location: "Company Garden, Mussoorie",
                image: getRandomImageForCategory("city exploration"),
                price: "₹",
                rating: "4.4 ★",
                timeOfDay: "afternoon",
                type: "exploring"
              },
              {
                id: "act5",
                time: "5:30 PM",
                title: "Sunset at Gun Hill",
                description: "Take the cable car to Gun Hill for spectacular sunset views over the Himalayas.",
                location: "Gun Hill, Mussoorie",
                image: getRandomImageForCategory("city exploration"),
                price: "₹₹",
                rating: "4.7 ★",
                timeOfDay: "evening",
                type: "exploring"
              },
              {
                id: "act6",
                time: "8:00 PM",
                title: "Dinner at Little Llama Café",
                description: "End your day with delicious food at this cozy café known for its warm ambiance.",
                location: "Mall Road, Mussoorie",
                image: getRandomImageForCategory("restaurant dining"),
                price: "₹₹",
                rating: "4.5 ★",
                timeOfDay: "evening",
                type: "eating"
              }
            ],
            recommendations: [
              {
                id: "rec1",
                title: "Trek to Lal Tibba",
                description: "Hike to the highest point in Mussoorie for unparalleled views of the Himalayan ranges.",
                image: getRandomImageForCategory("city exploration"),
                rating: "4.8 ★",
                duration: "Half day"
              },
              {
                id: "rec2",
                title: "Literary Tour of Landour",
                description: "Visit the homes and haunts of famous authors who made Mussoorie their home.",
                image: getRandomImageForCategory("historical landmarks"),
                rating: "4.6 ★",
                duration: "3-4 hours"
              },
              {
                id: "rec3",
                title: "Day Trip to Kempty Falls",
                description: "Enjoy a refreshing day at this beautiful waterfall just outside Mussoorie.",
                image: getRandomImageForCategory("city exploration"),
                rating: "4.5 ★",
                duration: "Half day"
              }
            ]
          }
        };

        // Select the appropriate itinerary based on location
        let locationToUse = "Default";

        // Match location against our available itineraries
        if (locationData.location.toLowerCase().includes("delhi")) {
          locationToUse = "Delhi";
        } else if (locationData.location.toLowerCase().includes("noida")) {
          locationToUse = "Noida";
        } else if (locationData.location.toLowerCase().includes("jaipur")) {
          locationToUse = "Jaipur";
        } else if (locationData.location.toLowerCase().includes("mussoorie")) {
          locationToUse = "Mussoorie";
        }

        itineraryData = itineraries[locationToUse];
      }
      itineraryData = improveItineraryWithScoring(itineraryData, preferences, locationData, rankedCandidates);
      
      itineraryData = withGooglePlaceImages(itineraryData, locationData.location);

      // Save the generated itinerary to storage
      try {
        await storage.saveItineraryCache({
          cacheKey,
          city: locationData.location,
          preferences: { preferences, locationData, seedRecommendation },
          itinerary: itineraryData as any,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        });

        const savedItinerary = await storage.saveItinerary(itineraryData, userId);
        console.log("Generated itinerary saved with ID:", savedItinerary.id);
        
        // Send the response with itinerary ID included
        res.json({
          id: savedItinerary.id,
          ...savedItinerary.itinerary
        });
      } catch (saveError) {
        console.error("Error saving generated itinerary (non-fatal):", saveError);
        // Still return the itinerary even if save fails
        res.json(itineraryData);
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
      res.status(500).json({ message: "Failed to generate itinerary. Please try again." });
    }
  });

  // API endpoint to save an itinerary (explicit save action)
  app.post("/api/save-itinerary", async (req: Request, res: Response) => {
    try {
      const { itinerary, userId } = req.body;
      
      console.log("Save itinerary request received:", { 
        hasItinerary: !!itinerary,
        hasTitle: !!itinerary?.title,
        hasLocation: !!itinerary?.location,
        hasId: !!itinerary?.id,
        userId: userId
      });
      
      if (!itinerary || !itinerary.title || !itinerary.location) {
        console.error("Invalid itinerary data:", JSON.stringify(itinerary, null, 2));
        return res.status(400).json({ message: "Invalid itinerary data: missing title or location" });
      }

      // Validate required fields
      if (!itinerary.activities || !Array.isArray(itinerary.activities)) {
        console.error("Invalid itinerary: activities missing or not an array");
        return res.status(400).json({ message: "Invalid itinerary data: activities must be an array" });
      }

      if (!itinerary.recommendations || !Array.isArray(itinerary.recommendations)) {
        console.error("Invalid itinerary: recommendations missing or not an array");
        return res.status(400).json({ message: "Invalid itinerary data: recommendations must be an array" });
      }

      // Remove id if present (we'll create a new save entry)
      const { id, ...itineraryWithoutId } = itinerary;
      
      const savedItinerary = await storage.saveItinerary(itineraryWithoutId, userId ? Number(userId) : undefined);
      
      console.log("Itinerary saved successfully with ID:", savedItinerary.id, "for user:", userId);
      
      res.json({
        id: savedItinerary.id,
        message: "Itinerary saved successfully",
        itinerary: savedItinerary.itinerary
      });
    } catch (error) {
      console.error("Error saving itinerary:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Failed to save itinerary. Please try again.",
        error: errorMessage
      });
    }
  });

  app.get("/api/user/itineraries/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const userItineraries = await storage.getAllItineraries(userId);
      
      const formatted = userItineraries.map(it => ({
        id: it.id,
        title: it.title,
        description: it.description,
        location: it.location,
        activities: it.activities as any,
        recommendations: it.recommendations as any,
        createdAt: it.createdAt,
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Error retrieving user itineraries:", error);
      res.status(500).json({ message: "Failed to retrieve saved itineraries. Please try again." });
    }
  });

  // API endpoint to get a saved itinerary by ID
  app.get("/api/itinerary/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid itinerary ID" });
      }

      const itinerary = await storage.getItinerary(id);
      
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      // Convert to ItineraryResponse format
      res.json({
        id: itinerary.id,
        userId: itinerary.userId,
        title: itinerary.title,
        description: itinerary.description,
        location: itinerary.location,
        activities: itinerary.activities as any,
        recommendations: itinerary.recommendations as any,
        createdAt: itinerary.createdAt,
        notes: itinerary.notes,
      });
    } catch (error) {
      console.error("Error retrieving itinerary:", error);
      res.status(500).json({ message: "Failed to retrieve itinerary. Please try again." });
    }
  });

  // API endpoint to update itinerary notes (journal entries)
  app.post("/api/itinerary/:id/notes", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid itinerary ID" });
      }

      const itinerary = await storage.getItinerary(id);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      // Sync updated notes
      const updated = await storage.updateItineraryNotes(id, notes || "");
      console.log(`Updated notes for itinerary ID: ${id}`);
      
      res.json({
        id: updated.id,
        message: "Journal notes saved successfully",
        notes: updated.notes
      });
    } catch (error) {
      console.error("Error updating itinerary notes:", error);
      res.status(500).json({ message: "Failed to save journal notes. Please try again." });
    }
  });

  // API endpoint to delete a saved itinerary
  app.delete("/api/itinerary/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid itinerary ID" });
      }

      const itinerary = await storage.getItinerary(id);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      await storage.deleteItinerary(id);
      console.log(`Deleted itinerary ID: ${id}`);

      res.json({
        id,
        message: "Itinerary deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting itinerary:", error);
      res.status(500).json({ message: "Failed to delete itinerary. Please try again." });
    }
  });

  // API endpoint to get all saved itineraries
  app.get("/api/itineraries", async (req: Request, res: Response) => {
    try {
      const itineraries = await storage.getAllItineraries();
      
      // Convert to response format
      const formatted = itineraries.map(it => ({
        id: it.id,
        title: it.title,
        description: it.description,
        location: it.location,
        activities: it.activities as any,
        recommendations: it.recommendations as any,
        createdAt: it.createdAt,
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Error retrieving itineraries:", error);
      res.status(500).json({ message: "Failed to retrieve itineraries. Please try again." });
    }
  });

  // Create and return HTTP server
  const server = createServer(app);
  return server;
}

// Helper function to normalize generated itinerary from Gemini
function normalizeGeneratedItinerary(
  generatedData: any,
  preferences: z.infer<typeof preferenceSchema>,
  locationData: z.infer<typeof locationSchema>,
  rankedCandidates: Array<CityCandidate & { score: number; matchReasons: string[] }> = []
): ItineraryResponse {
  const activitiesSource =
    generatedData.activities ||
    generatedData.itinerary?.activities ||
    generatedData.day_plan ||
    generatedData.dayPlan ||
    generatedData.stops ||
    [];

  const generatedActivities = Array.isArray(activitiesSource)
    ? activitiesSource.slice(0, 6).map((activity: any, index: number) => {
        const type = normalizeActivityType(activity.type);
        const timeOfDay = normalizeTimeOfDay(
          activity.timeOfDay || activity.time_of_day_category || activity.time_of_day,
          index
        );

        return {
          id: String(activity.id || `activity-${index + 1}`),
          time: String(activity.time || defaultTimeForIndex(index)),
          title: String(activity.title || `Stop ${index + 1}`),
          description: String(activity.description || "A selected stop for your itinerary."),
          location: String(activity.location || locationData.location),
          image: String(activity.image || getRandomImageForCategory(categoryForActivityType(type))),
          price: String(activity.price || activity.price_category || activity.priceCategory || "₹₹"),
          rating: String(activity.rating || "4.6 ★"),
          timeOfDay,
          type,
          score: numberOrUndefined(activity.score),
          matchReasons: normalizeStringArray(activity.matchReasons || activity.match_reasons || activity.whyThisFits),
          tags: normalizeStringArray(activity.tags),
          noveltyLevel: normalizeNoveltyLevel(activity.noveltyLevel || activity.novelty_level),
          neighborhood: optionalString(activity.neighborhood),
          indoorOutdoor: normalizeIndoorOutdoor(activity.indoorOutdoor || activity.indoor_outdoor),
          trendScore: numberOrUndefined(activity.trendScore || activity.trend_score),
        };
      })
    : [];

  const activities =
    generatedActivities.length >= 6
      ? generatedActivities
      : [
          ...generatedActivities,
          ...buildFallbackActivities(locationData.location, rankedCandidates).slice(generatedActivities.length),
        ];

  const recommendationsSource =
    generatedData.recommendations ||
    generatedData.recommended_similar_adventures ||
    generatedData.recommendedSimilarAdventures ||
    generatedData.similar_adventures ||
    [];

  const recommendations = Array.isArray(recommendationsSource)
    ? recommendationsSource.slice(0, 3).map((rec: any, index: number) => ({
        id: String(rec.id || `recommendation-${index + 1}`),
        title: String(rec.title || `More ${locationData.location} ideas`),
        description: String(rec.description || "A related plan based on your selected mood and city."),
        image: String(rec.image || getRandomImageForCategory("historical landmarks")),
        rating: String(rec.rating || "4.7 ★"),
        duration: String(rec.duration || preferences.duration),
        score: numberOrUndefined(rec.score),
        matchReasons: normalizeStringArray(rec.matchReasons || rec.match_reasons || rec.whyThisFits),
        tags: normalizeStringArray(rec.tags),
        noveltyLevel: normalizeNoveltyLevel(rec.noveltyLevel || rec.novelty_level),
        neighborhood: optionalString(rec.neighborhood),
        indoorOutdoor: normalizeIndoorOutdoor(rec.indoorOutdoor || rec.indoor_outdoor),
        trendScore: numberOrUndefined(rec.trendScore || rec.trend_score),
        seedRecommendation: rec.seedRecommendation || rec.seed_recommendation || {
          city: locationData.location,
          tags: normalizeStringArray(rec.tags),
          mood: preferences.mood || [],
          duration: String(rec.duration || preferences.duration),
          budget: preferences.budget,
          seedPlaces: normalizeStringArray(rec.seedPlaces || rec.seed_places || rec.title),
          title: String(rec.title || `More ${locationData.location} ideas`),
        },
      }))
    : [];

  return {
    title: String(generatedData.title || `${preferences.duration} in ${locationData.location}`),
    description: String(
      generatedData.description ||
        `A ${preferences.budget.toLowerCase()} itinerary shaped around ${preferences.hangoutTypes.join(", ").toLowerCase()}.`
    ),
    location: String(generatedData.location || locationData.location),
    activities,
    recommendations: recommendations.length > 0
      ? recommendations
      : buildFallbackRecommendations(locationData.location, preferences.duration, rankedCandidates, preferences),
  };
}

function normalizeActivityType(type: unknown): string {
  const normalized = String(type || "").toLowerCase();

  if (["exploring", "eating", "historical", "cafe"].includes(normalized)) {
    return normalized;
  }

  if (normalized.includes("food") || normalized.includes("restaurant")) {
    return "eating";
  }

  if (normalized.includes("history") || normalized.includes("heritage")) {
    return "historical";
  }

  if (normalized.includes("coffee") || normalized.includes("cafe")) {
    return "cafe";
  }

  return "exploring";
}

function normalizeTimeOfDay(value: unknown, index: number): "morning" | "afternoon" | "evening" {
  const normalized = String(value || "").toLowerCase();

  if (normalized.includes("morning")) return "morning";
  if (normalized.includes("afternoon")) return "afternoon";
  if (normalized.includes("evening")) return "evening";

  if (index < 2) return "morning";
  if (index < 4) return "afternoon";
  return "evening";
}

function defaultTimeForIndex(index: number): string {
  return ["9:00 AM", "11:00 AM", "1:30 PM", "3:30 PM", "6:00 PM", "8:00 PM"][index] || "10:00 AM";
}

function categoryForActivityType(type: string): string {
  const categoryMap: Record<string, string> = {
    cafe: "cafe atmosphere",
    eating: "restaurant dining",
    exploring: "city exploration",
    historical: "historical landmarks",
  };

  return categoryMap[type] || "city exploration";
}

function buildGenerationCandidates(
  location: string,
  seedRecommendation?: z.infer<typeof generateItinerarySchema>["seedRecommendation"]
): CityCandidate[] {
  const candidates = getCandidatesForLocation(seedRecommendation?.city || location);

  if (!seedRecommendation?.tags?.length && !seedRecommendation?.seedPlaces?.length) {
    return candidates;
  }

  const seedTerms = new Set([
    ...(seedRecommendation.tags || []),
    ...(seedRecommendation.seedPlaces || []),
    seedRecommendation.title,
  ].filter(Boolean).map((value) => String(value).toLowerCase()));

  return [...candidates].sort((a, b) => seedAffinity(b, seedTerms) - seedAffinity(a, seedTerms));
}

function seedAffinity(candidate: CityCandidate, seedTerms: Set<string>): number {
  const searchable = [
    candidate.title,
    candidate.neighborhood,
    candidate.type,
    candidate.noveltyLevel,
    ...candidate.tags,
    ...candidate.moodTags,
  ].join(" ").toLowerCase();

  let score = 0;
  seedTerms.forEach((term) => {
    if (searchable.includes(term)) score += 1;
  });
  return score;
}

function formatCandidatesForPrompt(candidates: Array<CityCandidate & { score: number; matchReasons: string[] }>): string {
  if (candidates.length === 0) {
    return "No curated candidates available. Generate cautiously using verified, findable places.";
  }

  return candidates.map((candidate, index) => (
    `${index + 1}. ${candidate.title} | ${candidate.neighborhood} | ${candidate.address} | type=${candidate.type} | novelty=${candidate.noveltyLevel} | budget=${candidate.budgetTier} | groupFit=${candidate.groupFit.join(", ")} | indoorOutdoor=${candidate.indoorOutdoor} | trendScore=${candidate.trendScore} | score=${candidate.score} | tags=${candidate.tags.join(", ")} | reasons=${candidate.matchReasons.join(", ")}`
  )).join("\n");
}

function buildItineraryCacheKey(
  preferences: z.infer<typeof preferenceSchema>,
  locationData: z.infer<typeof locationSchema>,
  seedRecommendation?: z.infer<typeof generateItinerarySchema>["seedRecommendation"]
): string {
  const parts = [
    locationData.location,
    [...preferences.hangoutTypes].sort().join("+"),
    [...(preferences.mood || [])].sort().join("+"),
    preferences.duration,
    preferences.budget,
    preferences.groupSize || "Solo",
    locationData.distance,
    [...locationData.transportation].sort().join("+"),
    seedRecommendation?.title || "",
  ];

  return parts.map((part) => String(part).trim().toLowerCase().replace(/\s+/g, "-")).join("|");
}

function improveItineraryWithScoring(
  itinerary: ItineraryResponse,
  preferences: z.infer<typeof preferenceSchema>,
  locationData: z.infer<typeof locationSchema>,
  rankedCandidates: Array<CityCandidate & { score: number; matchReasons: string[] }>
): ItineraryResponse {
  const usedTitles = new Set<string>();
  const fallbackPool = rankedCandidates.filter((candidate) => !usedTitles.has(candidate.title.toLowerCase()));

  const activities = itinerary.activities.slice(0, 6).map((activity, index) => {
    const key = activity.title.toLowerCase();
    const duplicate = usedTitles.has(key);
    usedTitles.add(key);

    if (duplicate && fallbackPool[index]) {
      return activityFromCandidate(fallbackPool[index], index);
    }

    const score = scorePlace(activity, preferences, locationData);
    return {
      ...activity,
      score: activity.score ?? score.score,
      matchReasons: normalizeStringArray(activity.matchReasons).length
        ? normalizeStringArray(activity.matchReasons)
        : score.matchReasons,
    };
  });

  const filledActivities = activities.length >= 6
    ? activities
    : [
        ...activities,
        ...rankedCandidates.slice(activities.length, 6).map((candidate, index) =>
          activityFromCandidate(candidate, activities.length + index)
        ),
      ];

  const recommendations = itinerary.recommendations.slice(0, 3).map((recommendation, index) => {
    const score = scorePlace(recommendation, preferences, locationData);
    return {
      ...recommendation,
      score: recommendation.score ?? score.score,
      matchReasons: normalizeStringArray(recommendation.matchReasons).length
        ? normalizeStringArray(recommendation.matchReasons)
        : score.matchReasons,
      seedRecommendation: recommendation.seedRecommendation || {
        city: locationData.location,
        tags: recommendation.tags || [],
        mood: preferences.mood || [],
        duration: recommendation.duration,
        budget: preferences.budget,
        seedPlaces: [recommendation.title],
        title: recommendation.title,
      },
    };
  });

  return {
    ...itinerary,
    activities: filledActivities,
    recommendations: recommendations.length > 0
      ? recommendations
      : buildFallbackRecommendations(locationData.location, preferences.duration, rankedCandidates, preferences),
  };
}

function activityFromCandidate(candidate: CityCandidate & { score: number; matchReasons: string[] }, index: number): ItineraryActivity {
  return {
    id: `candidate-act-${index + 1}`,
    time: defaultTimeForIndex(index),
    title: candidate.title,
    description: `${candidate.trendReason} It fits the route with a ${candidate.noveltyLevel.replace("-", " ")} stop in ${candidate.neighborhood}.`,
    location: candidate.address,
    image: getRandomImageForCategory(candidate.imageCategory),
    price: priceForCandidate(candidate),
    rating: candidate.rating,
    timeOfDay: normalizeTimeOfDay(undefined, index),
    type: candidate.type,
    score: candidate.score,
    matchReasons: candidate.matchReasons,
    tags: candidate.tags,
    noveltyLevel: candidate.noveltyLevel,
    neighborhood: candidate.neighborhood,
    indoorOutdoor: candidate.indoorOutdoor,
    trendScore: candidate.trendScore,
  };
}

function priceForCandidate(candidate: CityCandidate): string {
  if (candidate.budgetTier === "free") return "Free";
  if (candidate.budgetTier === "budget") return "₹";
  if (candidate.budgetTier === "luxury") return "₹₹₹";
  return "₹₹";
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function optionalString(value: unknown): string | undefined {
  const normalized = String(value || "").trim();
  return normalized || undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeNoveltyLevel(value: unknown): ItineraryActivity["noveltyLevel"] {
  const normalized = String(value || "").toLowerCase();
  if (["iconic", "popular-local", "hidden-gem", "niche"].includes(normalized)) {
    return normalized as ItineraryActivity["noveltyLevel"];
  }
  return undefined;
}

function normalizeIndoorOutdoor(value: unknown): ItineraryActivity["indoorOutdoor"] {
  const normalized = String(value || "").toLowerCase();
  if (["indoor", "outdoor", "mixed"].includes(normalized)) {
    return normalized as ItineraryActivity["indoorOutdoor"];
  }
  return undefined;
}

function buildFallbackRecommendations(
  location: string,
  duration: string,
  rankedCandidates: Array<CityCandidate & { score: number; matchReasons: string[] }> = [],
  preferences?: z.infer<typeof preferenceSchema>
): Recommendation[] {
  const candidateRecommendations = rankedCandidates.slice(0, 3).map((candidate, index) => ({
    id: `rec-candidate-${index + 1}`,
    title: `${candidate.title} Route`,
    description: `${candidate.trendReason} Build a focused plan around ${candidate.neighborhood} with stops that match your selected vibe.`,
    image: getRandomImageForCategory(candidate.imageCategory),
    rating: candidate.rating,
    duration: candidate.estimatedDuration || duration,
    score: candidate.score,
    matchReasons: candidate.matchReasons,
    tags: candidate.tags,
    noveltyLevel: candidate.noveltyLevel,
    neighborhood: candidate.neighborhood,
    indoorOutdoor: candidate.indoorOutdoor,
    trendScore: candidate.trendScore,
    seedRecommendation: {
      city: candidate.city,
      tags: candidate.tags,
      mood: preferences?.mood || [],
      duration,
      budget: preferences?.budget,
      seedPlaces: [candidate.title],
      title: `${candidate.title} Route`,
    },
  }));

  if (candidateRecommendations.length >= 3) {
    return candidateRecommendations;
  }

  const fallbackRecommendations: Recommendation[] = [
    {
      id: "rec-gemini-1",
      title: `${location} Heritage Walk`,
      description: "A slower route through landmark streets, old neighborhoods, and memorable local stops.",
      image: getRandomImageForCategory("historical landmarks"),
      rating: "4.7 ★",
      duration,
      matchReasons: ["Cultural fit", "Local discovery"],
      tags: ["heritage", "walkable"],
      noveltyLevel: "popular-local",
      seedRecommendation: { city: location, tags: ["heritage", "walkable"], duration, title: `${location} Heritage Walk` },
    },
    {
      id: "rec-gemini-2",
      title: `${location} Food Trail`,
      description: "A compact plan built around popular local eateries, cafe breaks, and easy transit.",
      image: getRandomImageForCategory("restaurant dining"),
      rating: "4.8 ★",
      duration: "3-4 hours",
      matchReasons: ["Foodie match", "Easy transit"],
      tags: ["foodie", "local"],
      noveltyLevel: "popular-local",
      seedRecommendation: { city: location, tags: ["foodie", "local"], duration: "3-4 hours", title: `${location} Food Trail` },
    },
    {
      id: "rec-gemini-3",
      title: `${location} Easygoing City Edit`,
      description: "A relaxed set of scenic stops and low-pressure places for a casual day out.",
      image: getRandomImageForCategory("city exploration"),
      rating: "4.6 ★",
      duration: "Half day",
      matchReasons: ["Relaxed pacing", "Low friction"],
      tags: ["relaxed", "scenic"],
      noveltyLevel: "hidden-gem",
      seedRecommendation: { city: location, tags: ["relaxed", "scenic"], duration: "Half day", title: `${location} Easygoing City Edit` },
    },
  ];

  return fallbackRecommendations.slice(0, 3);
}

function buildFallbackActivities(
  location: string,
  rankedCandidates: Array<CityCandidate & { score: number; matchReasons: string[] }> = []
): ItineraryActivity[] {
  const candidateActivities = rankedCandidates.slice(0, 6).map((candidate, index) => ({
    id: `candidate-act-${index + 1}`,
    time: defaultTimeForIndex(index),
    title: candidate.title,
    description: `${candidate.trendReason} This stop fits a ${candidate.noveltyLevel.replace("-", " ")} route around ${candidate.neighborhood}.`,
    location: candidate.address,
    image: getRandomImageForCategory(candidate.imageCategory),
    price: priceForCandidate(candidate),
    rating: candidate.rating,
    timeOfDay: normalizeTimeOfDay(undefined, index),
    type: candidate.type,
    score: candidate.score,
    matchReasons: candidate.matchReasons,
    tags: candidate.tags,
    noveltyLevel: candidate.noveltyLevel,
    neighborhood: candidate.neighborhood,
    indoorOutdoor: candidate.indoorOutdoor,
    trendScore: candidate.trendScore,
  }));

  if (candidateActivities.length >= 6) {
    return candidateActivities;
  }

  return [
    {
      id: "fallback-act-1",
      time: "9:00 AM",
      title: `Morning walk in ${location}`,
      description: "Start with an easy landmark walk to get oriented and keep the first stop low-pressure.",
      location: `${location} city center`,
      image: getRandomImageForCategory("city exploration"),
      price: "Free",
      rating: "4.5 ★",
      timeOfDay: "morning",
      type: "exploring",
    },
    {
      id: "fallback-act-2",
      time: "11:00 AM",
      title: "Cafe pause",
      description: "Take a relaxed coffee break at a well-reviewed local cafe before the busier afternoon stops.",
      location: `${location} main market`,
      image: getRandomImageForCategory("cafe atmosphere"),
      price: "₹",
      rating: "4.6 ★",
      timeOfDay: "morning",
      type: "cafe",
    },
    {
      id: "fallback-act-3",
      time: "1:30 PM",
      title: "Local lunch stop",
      description: "Choose a popular neighborhood restaurant for a practical lunch break with local flavor.",
      location: `${location} food district`,
      image: getRandomImageForCategory("restaurant dining"),
      price: "₹₹",
      rating: "4.6 ★",
      timeOfDay: "afternoon",
      type: "eating",
    },
    {
      id: "fallback-act-4",
      time: "3:30 PM",
      title: "Culture and neighborhood explore",
      description: "Spend the afternoon around a heritage site, art street, museum, or walkable market nearby.",
      location: `${location} heritage area`,
      image: getRandomImageForCategory("historical landmarks"),
      price: "₹",
      rating: "4.5 ★",
      timeOfDay: "afternoon",
      type: "historical",
    },
    {
      id: "fallback-act-5",
      time: "6:00 PM",
      title: "Golden-hour viewpoint",
      description: "Move to a scenic public space or promenade for a calmer evening transition.",
      location: `${location} viewpoint`,
      image: getRandomImageForCategory("city exploration"),
      price: "Free",
      rating: "4.7 ★",
      timeOfDay: "evening",
      type: "exploring",
    },
    {
      id: "fallback-act-6",
      time: "8:00 PM",
      title: "Dinner closeout",
      description: "End with dinner at a reliable local restaurant that fits the selected budget and group size.",
      location: `${location} restaurant district`,
      image: getRandomImageForCategory("restaurant dining"),
      price: "₹₹",
      rating: "4.6 ★",
      timeOfDay: "evening",
      type: "eating",
    },
  ];
}

function withGooglePlaceImages(itinerary: ItineraryResponse, baseLocation: string): ItineraryResponse {
  return {
    ...itinerary,
    activities: itinerary.activities.map((activity) => ({
      ...activity,
      image: buildPlacePhotoProxyUrl(
        `${activity.title} ${activity.location || baseLocation}`,
        resolveStockImageFallback(activity.image, categoryForActivityType(activity.type))
      ),
    })),
    recommendations: itinerary.recommendations.map((recommendation) => ({
      ...recommendation,
      image: buildPlacePhotoProxyUrl(
        `${recommendation.title} ${baseLocation}`,
        resolveStockImageFallback(recommendation.image, "historical landmarks")
      ),
    })),
  };
}

function resolveStockImageFallback(image: string | undefined, category: string): string {
  if (image && /^https?:\/\//.test(image) && !image.includes("maps.googleapis.com")) {
    return image;
  }

  return getRandomImageForCategory(category);
}

function buildPlacePhotoProxyUrl(query: string, fallback: string): string {
  const params = new URLSearchParams({
    query,
    stockFallback: fallback,
  });

  return `/api/place-photo?${params.toString()}`;
}

function getGoogleMapsApiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
}

function buildGoogleStreetViewUrl(query: string): string | null {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return null;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/streetview");
  url.searchParams.set("size", "900x560");
  url.searchParams.set("location", query);
  url.searchParams.set("fov", "82");
  url.searchParams.set("pitch", "2");
  url.searchParams.set("source", "outdoor");
  url.searchParams.set("return_error_code", "true");
  url.searchParams.set("key", apiKey);

  return url.toString();
}

async function fetchGooglePlacePhoto(query: string): Promise<{ body: Buffer; contentType: string } | null> {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return null;
  }

  const cacheKey = query.toLowerCase();
  const cached = placePhotoCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return { body: cached.body, contentType: cached.contentType };
  }

  for (const candidateQuery of buildPlacePhotoQueries(query)) {
    const photo =
      await fetchGooglePlacePhotoNew(candidateQuery, apiKey) ||
      await fetchGooglePlacePhotoLegacy(candidateQuery, apiKey);

    if (photo) {
      placePhotoCache.set(cacheKey, {
        ...photo,
        expiresAt: Date.now() + PLACE_PHOTO_CACHE_MS,
      });

      return photo;
    }
  }

  return null;
}

function buildPlacePhotoQueries(query: string): string[] {
  const candidates: string[] = [];
  
  const cleanPunctuation = (str: string) => str.replace(/^[^a-zA-Z0-9\u00C0-\u017F]+|[^a-zA-Z0-9\u00C0-\u017F]+$/g, "").trim();

  // 1. Original query cleaned of extreme punctuation
  candidates.push(cleanPunctuation(query));

  // 2. Clean common prefix phrases and words
  let cleaned = query.replace(/^\b(explore|visit|trek to|walk on|stroll along|sunset at|sunrise at|shopping at|dinner at|lunch at|breakfast at|morning walk in|day trip to|tour of|ride at|safari at|workshop at|experience at|savor at|enjoy at|view at|go to|take a|have a)\b/gi, "");
  
  cleaned = cleaned
    .replace(/\b(visit|morning|evening|afternoon|breakfast|lunch|dinner|at|the|a|an|in|to|on|of|with|for)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
    
  candidates.push(cleanPunctuation(cleaned));

  // 3. Deduplicate overlapping words
  const words = cleaned.split(/\s+/);
  const uniqueWords: string[] = [];
  const wordSet = new Set<string>();
  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleanWord) continue;
    if (!wordSet.has(cleanWord)) {
      wordSet.add(cleanWord);
      uniqueWords.push(word);
    }
  }
  const deduplicated = uniqueWords.join(" ");
  candidates.push(cleanPunctuation(deduplicated));

  // 4. Try just the first 4 words if the deduplicated query is still long
  if (uniqueWords.length > 4) {
    candidates.push(cleanPunctuation(uniqueWords.slice(0, 4).join(" ")));
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

async function fetchGooglePlacePhotoNew(
  query: string,
  apiKey: string
): Promise<{ body: Buffer; contentType: string } | null> {
  const searchResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 1,
      regionCode: "IN",
    }),
  });

  if (!searchResponse.ok) {
    console.warn(`Google Places search failed with ${searchResponse.status}`);
    return null;
  }

  const searchData = await searchResponse.json();
  const photoName = searchData.places?.[0]?.photos?.[0]?.name;

  if (!photoName) {
    return null;
  }

  const mediaResponse = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=900&key=${encodeURIComponent(apiKey)}`,
    { redirect: "follow" }
  );

  if (!mediaResponse.ok) {
    console.warn(`Google Places photo failed with ${mediaResponse.status}`);
    return null;
  }

  const contentType = mediaResponse.headers.get("content-type") || "image/jpeg";
  const body = Buffer.from(await mediaResponse.arrayBuffer());

  return { body, contentType };
}

async function fetchGooglePlacePhotoLegacy(
  query: string,
  apiKey: string
): Promise<{ body: Buffer; contentType: string } | null> {
  const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  searchUrl.searchParams.set("input", query);
  searchUrl.searchParams.set("inputtype", "textquery");
  searchUrl.searchParams.set("fields", "photos,name");
  searchUrl.searchParams.set("key", apiKey);

  const searchResponse = await fetch(searchUrl);

  if (!searchResponse.ok) {
    console.warn(`Google legacy Places search failed with ${searchResponse.status}`);
    return null;
  }

  const searchData = await searchResponse.json();
  const photoReference = searchData.candidates?.[0]?.photos?.[0]?.photo_reference;

  if (!photoReference) {
    return null;
  }

  const photoUrl = new URL("https://maps.googleapis.com/maps/api/place/photo");
  photoUrl.searchParams.set("maxwidth", "900");
  photoUrl.searchParams.set("photo_reference", photoReference);
  photoUrl.searchParams.set("key", apiKey);

  const photoResponse = await fetch(photoUrl, { redirect: "follow" });

  if (!photoResponse.ok) {
    console.warn(`Google legacy Places photo failed with ${photoResponse.status}`);
    return null;
  }

  const contentType = photoResponse.headers.get("content-type") || "image/jpeg";
  const body = Buffer.from(await photoResponse.arrayBuffer());

  return { body, contentType };
}

async function redirectToImageFallback(res: Response, query: string, fallback: string, stockFallback = "") {
  const googleStreetViewUrl = buildGoogleStreetViewUrl(query);

  if (googleStreetViewUrl) {
    const googleFallback = await fetchImageUrl(googleStreetViewUrl);

    if (googleFallback) {
      res.setHeader("Content-Type", googleFallback.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.send(googleFallback.body);
    }
  }

  const resolvedFallback = stockFallback || fallback;

  if (resolvedFallback && /^https?:\/\//.test(resolvedFallback)) {
    return res.redirect(302, resolvedFallback);
  }

  if (fallback && /^https?:\/\//.test(fallback)) {
    return res.redirect(302, fallback);
  }

  return res.status(404).json({ message: "Place photo unavailable" });
}

async function fetchImageUrl(url: string): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const response = await fetch(url, { redirect: "follow" });
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !contentType.startsWith("image/")) {
      return null;
    }

    return {
      body: Buffer.from(await response.arrayBuffer()),
      contentType,
    };
  } catch (error) {
    console.warn("Image fallback fetch failed");
    return null;
  }
}

function getRandomImageForCategory(category: string): string {
  const categoryImages: Record<string, string[]> = {
    "cafe atmosphere": [
      "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640"
    ],
    "historical landmarks": [
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640"
    ],
    "restaurant dining": [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640"
    ],
    "city exploration": [
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1519830105440-63603408ebe0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640"
    ],
    "people enjoying outings": [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1471560090527-d1af5e4e6eb6?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640",
      "https://images.unsplash.com/photo-1536625737227-92a1fc042e7e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=640"
    ]
  };

  const images = categoryImages[category] || categoryImages["cafe atmosphere"];
  return images[Math.floor(Math.random() * images.length)];
}

function getWeatherDetails(code: number): { condition: string; icon: "sun" | "cloud" | "drizzle" | "rain" | "storm" | "snow" | "fog" } {
  if (code === 0) return { condition: "Clear", icon: "sun" };
  if ([1, 2, 3].includes(code)) return { condition: "Partly cloudy", icon: "cloud" };
  if ([45, 48].includes(code)) return { condition: "Foggy", icon: "fog" };
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: "Drizzle", icon: "drizzle" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: "Rain", icon: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: "Snow", icon: "snow" };
  if ([95, 96, 99].includes(code)) return { condition: "Thunderstorm", icon: "storm" };
  return { condition: "Cloudy", icon: "cloud" };
}
