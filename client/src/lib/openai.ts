import { apiRequest } from "./queryClient";

// Interfaces for the application
export interface PreferenceFormData {
  hangoutTypes: string[];
  duration: string;
  budget: string;
  groupSize: string;
  mood: string[];
}

export interface LocationFormData {
  location: string;
  distance: string;
  transportation: string[];
}

export interface ItineraryActivity {
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
  coordinates?: {
    lat: number;
    lng: number;
  };
  score?: number;
  matchReasons?: string[];
  tags?: string[];
  noveltyLevel?: string;
  neighborhood?: string;
  indoorOutdoor?: string;
  trendScore?: number;
}

export interface SeedRecommendation {
  city?: string;
  tags?: string[];
  mood?: string[];
  duration?: string;
  budget?: string;
  seedPlaces?: string[];
  title?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  image: string;
  rating: string;
  duration: string;
  score?: number;
  matchReasons?: string[];
  tags?: string[];
  noveltyLevel?: string;
  neighborhood?: string;
  indoorOutdoor?: string;
  trendScore?: number;
  seedRecommendation?: SeedRecommendation;
}

export interface ItineraryResponse {
  id?: number;
  userId?: number;
  title: string;
  description: string;
  location: string;
  activities: ItineraryActivity[];
  recommendations: Recommendation[];
  notes?: string;
}

export async function generateItinerary(
  preferences: PreferenceFormData,
  locationData: LocationFormData,
  seedRecommendation?: SeedRecommendation
): Promise<ItineraryResponse> {
  const response = await apiRequest("POST", "/api/generate-itinerary", {
    preferences,
    locationData,
    seedRecommendation,
  });
  return await response.json();
}

export async function saveItinerary(
  itinerary: ItineraryResponse,
  userId?: number
): Promise<{ id: number; message: string }> {
  try {
    const response = await apiRequest("POST", "/api/save-itinerary", {
      itinerary,
      userId,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in saveItinerary:", error);
    // Re-throw with more context
    throw error;
  }
}

// Utility function to map image categories to activities based on type
export function getImageCategoryForActivity(type: string): string {
  const typeToCategory: Record<string, string> = {
    "exploring": "city exploration",
    "eating": "restaurant dining",
    "historical": "historical landmarks",
    "cafe": "cafe atmosphere"
  };
  
  return typeToCategory[type.toLowerCase()] || "people enjoying outings";
}
