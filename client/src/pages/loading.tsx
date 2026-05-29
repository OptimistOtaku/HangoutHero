import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { generateItinerary, PreferenceFormData, LocationFormData } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WandSparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Loading() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);

  const funFacts = [
    "We balance your mood, timing, and distance so the route feels usable.",
    "Live weather is added to the results page to ground the itinerary in the current destination.",
    "The app prioritizes realistic sequencing over random venue lists.",
    "Each plan is tailored around activity type, budget, group size, and travel style.",
  ];

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const preferenceDataStr = sessionStorage.getItem("preferenceData");
        const locationDataStr = sessionStorage.getItem("locationData");

        if (!preferenceDataStr || !locationDataStr) {
          toast({
            title: "Missing information",
            description: "We couldn't find your preferences or location data. Please start over.",
            variant: "destructive"
          });
          setLocation("/");
          return;
        }

        const preferenceData: PreferenceFormData = JSON.parse(preferenceDataStr);
        const locationData: LocationFormData = JSON.parse(locationDataStr);
        const itinerary = await generateItinerary(preferenceData, locationData);

        sessionStorage.setItem("itineraryData", JSON.stringify(itinerary));

        setTimeout(() => {
          setLocation("/results");
        }, 1800);
      } catch (error) {
        console.error("Error generating itinerary:", error);
        toast({
          title: "Error",
          description: "Failed to generate your itinerary. Please try again.",
          variant: "destructive"
        });
        setLocation("/questionnaire");
      }
    };

    fetchItinerary();
  }, [setLocation, toast]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 94 ? prev : prev + 2));
    }, 120);

    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % funFacts.length);
    }, 2200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(factInterval);
    };
  }, []);

  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-8 top-16 h-32 w-32 rotate-12 border border-[rgba(255,180,0,0.14)]" />
        <div className="absolute bottom-16 right-10 h-24 w-24 rotate-[-10deg] border border-[rgba(255,56,92,0.12)]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <Card className="overflow-hidden rounded-3xl border border-[rgba(244,208,63,0.45)] bg-white/88 shadow-[0_24px_60px_rgba(255,56,92,0.08)]">
          <CardContent className="p-8 text-center md:p-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <motion.div
                className="text-primary"
                animate={{ rotate: [0, 12, -12, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <WandSparkles className="h-11 w-11" />
              </motion.div>
            </div>

            <h1 className="mt-8 font-heading text-5xl leading-none text-[#111318] md:text-6xl">
              Crafting your itinerary
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              HangoutHero is using AI to turn your preferences into a route with believable pacing, location fit, and a better day flow.
            </p>

            <div className="mx-auto mt-10 w-full max-w-xl overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className="h-4 rounded-full bg-gradient-to-r from-primary via-[#ff7d9a] to-accent"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25 }}
                initial={{ width: "0%" }}
              />
            </div>

            <div className="mt-8 rounded-3xl border border-[rgba(244,208,63,0.4)] bg-[rgba(255,249,239,0.72)] p-5 text-left">
              <p className="text-xs font-bold uppercase text-primary">Generating</p>
              <p className="mt-3 text-base leading-7 text-slate-600">{funFacts[currentFact]}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
