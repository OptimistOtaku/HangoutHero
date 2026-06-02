import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { LocationFormData } from "@/lib/openai";
import { ScrapbookImage } from "@/components/ui/scrapbook-image";
import { motion } from "framer-motion";
import { CITY_CARDS } from "@/lib/city-data";
import { useLocation } from "wouter";

interface LocationOption {
  name: string;
  image: string;
  selected: boolean;
}

const defaultLocationData: LocationFormData = {
  location: "Delhi",
  distance: "Moderate (up to 5 miles)",
  transportation: ["Walking", "Public Transit"]
};

const baseLocations: LocationOption[] = CITY_CARDS.slice(0, 4).map((city, index) => ({
  name: city.name,
  image: city.image,
  selected: index === 0,
}));

export default function Location() {
  const [, setRoute] = useLocation();
  const [locationData, setLocationData] = useState<LocationFormData>(defaultLocationData);
  const [locations, setLocations] = useState<LocationOption[]>(baseLocations);
  
  // Suggestion states
  const [suggestions, setSuggestions] = useState<Array<{ text: string; placeId: string }>>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const savedPrefs = sessionStorage.getItem("preferenceData");
    const savedLocationData = sessionStorage.getItem("locationData");

    if (!savedPrefs) {
      setRoute("/questionnaire");
      return;
    }

    if (savedLocationData) {
      const parsedLocationData: LocationFormData = JSON.parse(savedLocationData);
      setLocationData(parsedLocationData);
      setLocations(
        baseLocations.map((loc) => ({
          ...loc,
          selected: loc.name.toLowerCase() === parsedLocationData.location.toLowerCase(),
        }))
      );
    }
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    if (!locationData.location || locationData.location.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/place-suggestions?input=${encodeURIComponent(locationData.location)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          // Only pop open suggestions if the user is currently focusing/clicking the search bar
          if (isFocused && data.length > 0) {
            setSuggestionsOpen(true);
          }
        }
      } catch (error) {
        console.error("Suggestions fetch error:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationData.location, isFocused]);

  const handleSelectSuggestion = (cityName: string) => {
    // Standardize to the primary city name for cleaner AI queries
    const shortName = cityName.split(",")[0].trim();
    
    setLocationData((prev) => ({ ...prev, location: shortName }));
    setSuggestionsOpen(false);

    // Sync predefined city card selected state
    setLocations((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.name.toLowerCase() === shortName.toLowerCase(),
      }))
    );
  };

  const handleGenerate = () => {
    sessionStorage.setItem("locationData", JSON.stringify(locationData));
    setRoute("/loading");
  };

  return (
    <section className="relative mx-auto max-w-7xl px-3 py-5 md:px-8 md:py-8">
      <div className="relative mx-auto max-w-5xl">
        <ProgressSteps currentStep={2} />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-5 md:mt-8"
        >
          <Card className="overflow-hidden rounded-[22px] border border-[rgba(244,208,63,0.45)] bg-white/85 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:rounded-3xl">
            <CardContent className="p-4 md:p-10">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase text-primary">Location</p>
                <h1 className="mt-3 font-heading text-[2.45rem] font-extrabold leading-[0.95] text-[#111318] md:mt-4 md:text-6xl">
                  Where should this itinerary happen?
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg md:leading-8">
                  Choose a city, or type your own area. We’ll keep the plan tuned to travel range and transport.
                </p>
              </div>

              <div className="relative mt-7 md:mt-8">
                <Input
                  type="text"
                  placeholder="Enter a city or neighborhood"
                  className="h-[3.25rem] rounded-full border-slate-300 bg-white px-5 text-base md:h-14 md:px-6 md:text-lg"
                  value={locationData.location}
                  onChange={(e) => setLocationData((prev) => ({ ...prev, location: e.target.value }))}
                  onFocus={() => {
                    setIsFocused(true);
                    if (suggestions.length > 0) setSuggestionsOpen(true);
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    setTimeout(() => setSuggestionsOpen(false), 200);
                  }}
                />

                {suggestionsOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl backdrop-blur-md">
                    {loadingSuggestions && (
                      <div className="flex items-center justify-center p-3 text-slate-500 text-sm">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Searching...
                      </div>
                    )}
                    {suggestions.map((s) => (
                      <button
                        key={s.placeId}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleSelectSuggestion(s.text)}
                      >
                        <svg
                          className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-primary"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                        <span className="truncate">{s.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-4 md:gap-4">
                {locations.map((location, index) => (
                  <motion.button
                    key={location.name}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    onClick={() => {
                      setLocationData((prev) => ({ ...prev, location: location.name }));
                      setLocations((prev) =>
                        prev.map((item) => ({ ...item, selected: item.name === location.name }))
                      );
                    }}
                    className={`group overflow-hidden rounded-[20px] border text-left transition-all md:rounded-3xl ${
                      location.selected
                        ? "border-primary shadow-[0_18px_38px_rgba(255,56,92,0.14)]"
                        : "border-[rgba(244,208,63,0.45)] shadow-[0_8px_20px_rgba(16,24,40,0.04)]"
                    }`}
                  >
                    <div className="relative h-32 md:h-40">
                      <ScrapbookImage src={location.image} alt={location.name} className="h-full w-full" />
                      <div className={`absolute inset-0 ${location.selected ? "bg-primary/25" : "bg-black/30"} transition-colors group-hover:bg-black/20`} />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="font-heading text-2xl leading-none md:text-3xl">{location.name}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-7 grid gap-4 md:mt-10 lg:grid-cols-2 lg:gap-6">
                <div className="rounded-[20px] border border-[rgba(244,208,63,0.4)] bg-[rgba(255,249,239,0.72)] p-4 md:rounded-3xl md:p-6">
                  <p className="mb-3 text-sm font-semibold uppercase text-slate-500">Distance</p>
                  <Select
                    value={locationData.distance}
                    onValueChange={(value) => setLocationData((prev) => ({ ...prev, distance: value }))}
                  >
                    <SelectTrigger className="h-[3.25rem] rounded-2xl border-slate-300 bg-white text-base md:h-14">
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Walking distance only (1-2 miles)">Walking distance only (1-2 miles)</SelectItem>
                      <SelectItem value="Moderate (up to 5 miles)">Moderate (up to 5 miles)</SelectItem>
                      <SelectItem value="Any distance (with transportation)">Any distance (with transportation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-[20px] border border-[rgba(244,208,63,0.4)] bg-white p-4 md:rounded-3xl md:p-6">
                  <p className="mb-3 text-sm font-semibold uppercase text-slate-500">Transport</p>
                  <div className="flex flex-wrap gap-3">
                    {["Walking", "Public Transit", "Rideshare", "Driving"].map((type) => {
                      const active = locationData.transportation.includes(type);
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={active ? "default" : "outline"}
                          className={`h-11 flex-1 rounded-full px-4 text-sm sm:flex-none md:px-5 ${
                            active
                              ? "bg-primary text-white hover:bg-[#ff5977]"
                              : "border-slate-300 bg-white text-slate-700 hover:border-primary"
                          }`}
                          onClick={() =>
                            setLocationData((prev) => ({
                              ...prev,
                              transportation: active
                                ? prev.transportation.filter((item) => item !== type)
                                : [...prev.transportation, type]
                            }))
                          }
                        >
                          {type}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-between md:mt-10">
                <Button
                  variant="outline"
                  className="h-14 rounded-full border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 hover:border-primary"
                  onClick={() => setRoute("/questionnaire")}
                >
                  Back
                </Button>
                <Button
                  className="h-14 rounded-full bg-primary px-10 text-base font-bold text-white hover:bg-[#ff5977] md:text-lg"
                  onClick={handleGenerate}
                >
                  Generate itinerary
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
