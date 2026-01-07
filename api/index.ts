// Vercel serverless function for Express API
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { storage } from "../server/storage";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "AIzaSyAJUNmvY8b81BxN61kpaVu8TfGAl93yteo"
);

// Validation schemas
const preferenceSchema = z.object({
  hangoutTypes: z.array(z.string()),
  duration: z.string(),
  budget: z.string()
});

const locationSchema = z.object({
  location: z.string(),
  distance: z.string(),
  transportation: z.array(z.string())
});

const generateItinerarySchema = z.object({
  preferences: preferenceSchema,
  locationData: locationSchema
});

// Helper function to get random images
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

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { preferences, locationData } = generateItinerarySchema.parse(req.body);
    console.log("Generating itinerary for", locationData.location);
    
    let itineraryData: any;
    let useGemini = true;
    
    try {
      console.log("Attempting to use Gemini for personalized itinerary...");
      const prompt = `You are an expert travel planner with deep knowledge of Indian locations. You create detailed, realistic itineraries based on user preferences.

Generate a personalized hangout itinerary for ${locationData.location}.

Preferences:
- Activities: ${preferences.hangoutTypes.join(", ")}
- Duration: ${preferences.duration}
- Budget: ${preferences.budget}
- Maximum travel distance: ${locationData.distance}
- Transportation: ${locationData.transportation.join(", ")}

Please generate a complete itinerary with realistic locations, descriptions, and timeline. 
The response must be valid JSON format only (no markdown, no code blocks) and include:
1. A title and description for the itinerary
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
4. Three relevant recommended similar adventures with id, title, description, rating, and duration.

Make activities specific to the location, realistic, and based on actual venues. Include exact addresses.
Format all times appropriately. Make sure descriptions are engaging and 1-2 sentences long.
Focus on authentic Indian experiences.

Return only valid JSON without any markdown formatting or code blocks.`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      const generatedData = JSON.parse(responseText);
      
      if (generatedData.activities && Array.isArray(generatedData.activities)) {
        generatedData.activities = generatedData.activities.map((activity: any) => ({
          ...activity,
          image: activity.image || getRandomImageForCategory(activity.type || "cafe")
        }));
      }
      
      if (generatedData.recommendations && Array.isArray(generatedData.recommendations)) {
        generatedData.recommendations = generatedData.recommendations.map((rec: any) => ({
          ...rec,
          image: rec.image || getRandomImageForCategory("historical landmarks")
        }));
      }
      
      itineraryData = generatedData;
      console.log("Successfully generated personalized itinerary using Gemini AI");
    } catch (apiError) {
      console.log("Gemini API error, using fallback data:", apiError);
      useGemini = false;
    }
    
    if (!useGemini) {
      // Use fallback data (simplified for Vercel)
      const savedItinerary = await storage.saveItinerary({
        title: `${preferences.duration} Adventure in ${locationData.location}`,
        description: `Enjoy a ${preferences.budget.toLowerCase()} itinerary exploring ${locationData.location}.`,
        location: locationData.location,
        activities: [],
        recommendations: []
      });
      
      res.json({
        id: savedItinerary.id,
        ...savedItinerary.itinerary
      });
      return;
    }
    
    const savedItinerary = await storage.saveItinerary(itineraryData);
    res.json({
      id: savedItinerary.id,
      ...savedItinerary.itinerary
    });
  } catch (error) {
    console.error("Error generating itinerary:", error);
    res.status(500).json({ message: "Failed to generate itinerary. Please try again." });
  }
});

app.post("/api/save-itinerary", async (req, res) => {
  try {
    const { itinerary } = req.body;
    
    if (!itinerary || !itinerary.title || !itinerary.location) {
      return res.status(400).json({ message: "Invalid itinerary data" });
    }

    const { id, ...itineraryWithoutId } = itinerary;
    const savedItinerary = await storage.saveItinerary(itineraryWithoutId);
    
    res.json({
      id: savedItinerary.id,
      message: "Itinerary saved successfully",
      itinerary: savedItinerary.itinerary
    });
  } catch (error) {
    console.error("Error saving itinerary:", error);
    res.status(500).json({ message: "Failed to save itinerary. Please try again." });
  }
});

app.get("/api/itinerary/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid itinerary ID" });
    }
    const itinerary = await storage.getItinerary(id);
    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }
    res.json({
      id: itinerary.id,
      title: itinerary.title,
      description: itinerary.description,
      location: itinerary.location,
      activities: itinerary.activities as any,
      recommendations: itinerary.recommendations as any,
      createdAt: itinerary.createdAt,
    });
  } catch (error) {
    console.error("Error retrieving itinerary:", error);
    res.status(500).json({ message: "Failed to retrieve itinerary. Please try again." });
  }
});

app.get("/api/itineraries", async (req, res) => {
  try {
    const itineraries = await storage.getAllItineraries();
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

// Export the Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only handle API routes
  if (!req.url?.startsWith("/api")) {
    return res.status(404).json({ message: "Not found" });
  }
  
  return new Promise<void>((resolve) => {
    app(req as any, res as any, () => {
      resolve();
    });
  });
}

