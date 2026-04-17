import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Activity {
  id: string;
  title: string;
  location: string;
  time: string;
}

interface GoogleMapProps {
  activities: Activity[];
  location: string;
}

// Your API key
const GOOGLE_MAPS_API_KEY = "AIzaSyCpF-fBVBbpDjKst7jsLerOPdcIwmqcoUE";

export function GoogleMap({ activities, location }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showRoute, setShowRoute] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    (window as any).initMap = () => {
      setIsScriptLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current) return;

    const geocoder = new google.maps.Geocoder();

    // Geocode the location to center the map
    geocoder.geocode({ address: location }, (results, status) => {
      let center = { lat: 28.6139, lng: 77.209 }; // Default to Delhi

      if (status === "OK" && results && results[0]) {
        center = results[0].geometry.location.toJSON();
      }

      const newMap = new google.maps.Map(mapRef.current!, {
        center,
        zoom: 13,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ saturation: -20 }, { lightness: 10 }]
          },
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      setMap(newMap);

      // Initialize directions renderer
      const renderer = new google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#FF385C",
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      setDirectionsRenderer(renderer);
    });
  }, [isScriptLoaded, location]);

  // Add markers for activities
  useEffect(() => {
    if (!map || !activities.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    const geocoder = new google.maps.Geocoder();

    activities.forEach((activity, index) => {
      const geocodeActivity = async () => {
        try {
          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode(
              { address: `${activity.location}, ${location}` },
              (results, status) => {
                if (status === "OK" && results) {
                  resolve(results);
                } else {
                  reject(status);
                }
              }
            );
          });

          if (result[0]) {
            const marker = new google.maps.Marker({
              map,
              position: result[0].geometry.location,
              title: activity.title,
              label: {
                text: (index + 1).toString(),
                color: "white",
                fontWeight: "bold"
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 15,
                fillColor: "#FF385C",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; max-width: 200px;">
                  <h3 style="font-weight: bold; margin-bottom: 5px; color: #FF385C;">${activity.time}</h3>
                  <p style="font-weight: 600; margin-bottom: 5px;">${activity.title}</p>
                  <p style="font-size: 12px; color: #666;">${activity.location}</p>
                </div>
              `
            });

            marker.addListener("click", () => {
              infoWindow.open(map, marker);
            });

            newMarkers.push(marker);
          }
        } catch (error) {
          console.error("Geocoding error for activity:", activity.title, error);
        }
      };

      geocodeActivity();
    });

    setMarkers(newMarkers);

    // Fit bounds to include all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, activities, location]);

  // Calculate and show route
  const showDirections = () => {
    if (!map || !directionsRenderer || markers.length < 2) return;

    const directionsService = new google.maps.DirectionsService();

    const waypoints = markers.slice(1, -1).map(marker => ({
      location: marker.getPosition()!,
      stopover: true
    }));

    const origin = markers[0].getPosition()!;
    const destination = markers[markers.length - 1].getPosition()!;

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result);
          setShowRoute(true);
        }
      }
    );
  };

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] } as any);
      setShowRoute(false);
    }
  };

  if (!isScriptLoaded) {
    return (
      <div className="w-full h-72 md:h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-primary text-2xl mb-2"></i>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-72 md:h-96 rounded-xl" />

      {/* Map controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={showRoute ? clearRoute : showDirections}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <i className={`fas fa-${showRoute ? "times" : "route"} mr-2`}></i>
          {showRoute ? "Hide Route" : "Show Route"}
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-full bg-[#FF385C] border-2 border-white"></div>
          <span className="text-gray-700">Activities</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <div className="w-6 h-1 bg-[#FF385C]"></div>
          <span className="text-gray-700">Route</span>
        </div>
      </div>
    </div>
  );
}
