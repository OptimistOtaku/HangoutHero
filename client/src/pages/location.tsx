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

  const handleGenerate = () => {
    sessionStorage.setItem("locationData", JSON.stringify(locationData));
    setRoute("/loading");
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="relative mx-auto max-w-5xl">
        <ProgressSteps currentStep={2} />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-8"
        >
          <Card className="overflow-hidden rounded-3xl border border-[rgba(244,208,63,0.45)] bg-white/85 shadow-[0_24px_60px_rgba(255,56,92,0.08)]">
            <CardContent className="p-6 md:p-10">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase text-primary">Location</p>
                <h1 className="mt-4 font-heading text-5xl leading-none text-[#111318] md:text-6xl">
                  Where should this itinerary happen?
                </h1>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Choose a city, or type your own area. We’ll keep the plan tuned to travel range and transport.
                </p>
              </div>

              <div className="mt-8">
                <Input
                  type="text"
                  placeholder="Enter a city or neighborhood"
                  className="h-14 rounded-full border-slate-300 bg-white px-6 text-lg"
                  value={locationData.location}
                  onChange={(e) => setLocationData((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
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
                    className={`group overflow-hidden rounded-3xl border text-left transition-all ${
                      location.selected
                        ? "border-primary shadow-[0_18px_38px_rgba(255,56,92,0.14)]"
                        : "border-[rgba(244,208,63,0.45)] shadow-[0_8px_20px_rgba(16,24,40,0.04)]"
                    }`}
                  >
                    <div className="relative h-40">
                      <ScrapbookImage src={location.image} alt={location.name} className="h-full w-full" />
                      <div className={`absolute inset-0 ${location.selected ? "bg-primary/25" : "bg-black/30"} transition-colors group-hover:bg-black/20`} />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="font-heading text-3xl leading-none">{location.name}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-[rgba(244,208,63,0.4)] bg-[rgba(255,249,239,0.72)] p-6">
                  <p className="mb-3 text-sm font-semibold uppercase text-slate-500">Distance</p>
                  <Select
                    value={locationData.distance}
                    onValueChange={(value) => setLocationData((prev) => ({ ...prev, distance: value }))}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-slate-300 bg-white text-base">
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Walking distance only (1-2 miles)">Walking distance only (1-2 miles)</SelectItem>
                      <SelectItem value="Moderate (up to 5 miles)">Moderate (up to 5 miles)</SelectItem>
                      <SelectItem value="Any distance (with transportation)">Any distance (with transportation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-3xl border border-[rgba(244,208,63,0.4)] bg-white p-6">
                  <p className="mb-3 text-sm font-semibold uppercase text-slate-500">Transport</p>
                  <div className="flex flex-wrap gap-3">
                    {["Walking", "Public Transit", "Rideshare", "Driving"].map((type) => {
                      const active = locationData.transportation.includes(type);
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={active ? "default" : "outline"}
                          className={`rounded-full px-5 ${
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

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  className="h-14 rounded-full border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 hover:border-primary"
                  onClick={() => setRoute("/questionnaire")}
                >
                  Back
                </Button>
                <Button
                  className="h-14 rounded-full bg-primary px-10 text-lg font-bold text-white hover:bg-[#ff5977]"
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
