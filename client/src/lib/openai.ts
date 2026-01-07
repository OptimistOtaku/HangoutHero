import { apiRequest } from "./queryClient";

// Interfaces for the application
export interface PreferenceFormData {
  hangoutTypes: string[];
  duration: string;
  budget: string;
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
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  image: string;
  rating: string;
  duration: string;
}

export interface ItineraryResponse {
  id?: number;
  title: string;
  description: string;
  location: string;
  activities: ItineraryActivity[];
  recommendations: Recommendation[];
}

export async function generateItinerary(
  preferences: PreferenceFormData,
  locationData: LocationFormData
): Promise<ItineraryResponse> {
  const response = await apiRequest("POST", "/api/generate-itinerary", {
    preferences,
    locationData,
  });
  return await response.json();
}

export async function saveItinerary(
  itinerary: ItineraryResponse
): Promise<{ id: number; message: string }> {
  try {
    const response = await apiRequest("POST", "/api/save-itinerary", {
      itinerary,
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
