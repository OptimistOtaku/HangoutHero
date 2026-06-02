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

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export function GoogleMap({ activities, location }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [directionsRenderer, setDirectionsRenderer] = useState<any | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const googleMaps = (window as any).google;

  // Load Google Maps script
  useEffect(() => {
    if (googleMaps?.maps) {
      setIsScriptLoaded(true);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Missing VITE_GOOGLE_MAPS_API_KEY. Set it in your environment.");
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
  }, [googleMaps?.maps]);

  // Initialize map
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current) return;

    const geocoder = new googleMaps.maps.Geocoder();

    // Geocode the location to center the map
    geocoder.geocode({ address: location }, (results: any[] | null, status: string) => {
      let center = { lat: 28.6139, lng: 77.209 }; // Default to Delhi

      if (status === "OK" && results && results[0]) {
        center = results[0].geometry.location.toJSON();
      }

      const newMap = new googleMaps.maps.Map(mapRef.current!, {
        center,
        zoom: 13,
        styles: [
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f5f2e9" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#d2dfdb" }]
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#e3e8e1" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#fae2d0" }]
          },
          {
            featureType: "administrative",
            elementType: "labels.text.fill",
            stylers: [{ color: "#7a6f5d" }]
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
      const renderer = new googleMaps.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#FF385C",
          strokeWeight: 6,
          strokeOpacity: 0.85
        }
      });
      setDirectionsRenderer(renderer);
    });
  }, [googleMaps, isScriptLoaded, location]);

  // Add markers for activities
  useEffect(() => {
    if (!map || !activities.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];

    const geocoder = new googleMaps.maps.Geocoder();

    activities.forEach((activity, index) => {
      const geocodeActivity = async () => {
        try {
          const result = await new Promise<any[]>((resolve, reject) => {
            geocoder.geocode(
              { address: `${activity.location}, ${location}` },
              (results: any[] | null, status: string) => {
                if (status === "OK" && results) {
                  resolve(results);
                } else {
                  reject(status);
                }
              }
            );
          });

          if (result[0]) {
            const marker = new googleMaps.maps.Marker({
              map,
              position: result[0].geometry.location,
              title: activity.title,
              label: {
                text: (index + 1).toString(),
                color: "white",
                fontWeight: "bold"
              },
              icon: {
                path: googleMaps.maps.SymbolPath.CIRCLE,
                scale: 15,
                fillColor: "#FF385C",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2
              }
            });

            const infoWindow = new googleMaps.maps.InfoWindow({
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
      const bounds = new googleMaps.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [googleMaps, map, activities, location]);

  // Calculate and show route
  const showDirections = () => {
    if (!map || !directionsRenderer || markers.length < 2) return;

    const directionsService = new googleMaps.maps.DirectionsService();

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
        travelMode: googleMaps.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      },
      (result: any, status: string) => {
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
      <div className="flex h-80 w-full items-center justify-center rounded-[18px] bg-gray-100 md:h-96 md:rounded-xl">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-primary text-2xl mb-2"></i>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-80 w-full rounded-[18px] md:h-96 md:rounded-xl" />

      {/* Map controls */}
      <div className="absolute bottom-3 left-3 flex gap-2 md:bottom-4 md:left-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={showRoute ? clearRoute : showDirections}
          className="h-10 rounded-full bg-white/92 text-xs font-bold shadow-lg backdrop-blur-sm md:text-sm"
        >
          <i className={`fas fa-${showRoute ? "times" : "route"} mr-2`}></i>
          {showRoute ? "Hide Route" : "Show Route"}
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute right-3 top-3 rounded-xl bg-white/90 p-2 shadow-lg backdrop-blur-sm md:right-4 md:top-4 md:p-3">
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <div className="w-4 h-4 rounded-full bg-[#FF385C] border-2 border-white"></div>
          <span className="text-gray-700">Activities</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs md:text-sm">
          <div className="w-6 h-1 bg-[#FF385C]"></div>
          <span className="text-gray-700">Route</span>
        </div>
      </div>
    </div>
  );
}
