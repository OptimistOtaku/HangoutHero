import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { ItineraryTimeline } from "@/components/ui/itinerary-timeline";
import { RecommendationCard } from "@/components/ui/recommendation-card";
import { useToast } from "@/hooks/use-toast";
import { ItineraryResponse, saveItinerary } from "@/lib/openai";
import { GoogleMap } from "@/components/ui/google-map";
import { WeatherWidget } from "@/components/ui/weather-widget";
import { motion } from "framer-motion";

export default function Results() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadItinerary = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const itineraryId = params.get("id");
        const itineraryData = sessionStorage.getItem("itineraryData");

        if (itineraryData) {
          const parsed = JSON.parse(itineraryData);
          setItinerary(parsed);
          setIsSaved(Boolean(parsed.id));
          return;
        }

        if (itineraryId) {
          const response = await fetch(`/api/itinerary/${itineraryId}`);
          if (!response.ok) {
            throw new Error("Unable to load saved itinerary");
          }

          const savedItinerary = await response.json();
          setItinerary(savedItinerary);
          setIsSaved(true);
          sessionStorage.setItem("itineraryData", JSON.stringify(savedItinerary));
          return;
        }

        toast({
          title: "Missing itinerary data",
          description: "We couldn't find your itinerary. Please start over.",
          variant: "destructive"
        });
        setLocation("/");
      } catch (error) {
        toast({
          title: "Unable to load itinerary",
          description: error instanceof Error ? error.message : "Please start over.",
          variant: "destructive"
        });
        setLocation("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadItinerary();
  }, [setLocation, toast]);

  const persistItinerary = async () => {
    if (!itinerary) return null;
    if (itinerary.id) return itinerary.id;

    setIsSaving(true);
    try {
      const result = await saveItinerary(itinerary);
      const updatedItinerary = { ...itinerary, id: result.id };
      setItinerary(updatedItinerary);
      setIsSaved(true);
      sessionStorage.setItem("itineraryData", JSON.stringify(updatedItinerary));
      return result.id;
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!itinerary) return;

    try {
      const savedId = await persistItinerary();
      if (!savedId) return;

      const shareUrl = `${window.location.origin}/results?id=${savedId}`;
      const canUseNativeShare = typeof navigator.share === "function";

      if (canUseNativeShare) {
        await navigator.share({
          title: itinerary.title,
          text: itinerary.description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      toast({
        title: "Itinerary ready to share",
        description: canUseNativeShare ? "Share sheet opened." : "Share link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Share failed",
        description: error instanceof Error ? error.message : "Could not share your itinerary.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!itinerary || isSaved) return;

    try {
      const id = await persistItinerary();
      if (!id) return;

      toast({
        title: "Itinerary saved!",
        description: "Your itinerary has been saved successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Failed to save",
        description: `Could not save your itinerary: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  if (isLoading || !itinerary) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-slate-600">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <ProgressSteps currentStep={3} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-8 grid gap-8"
        >
          <Card className="overflow-hidden rounded-3xl border border-[rgba(244,208,63,0.45)] bg-white/88 p-6 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-sm font-bold uppercase text-primary">Generated itinerary</p>
                <h1 className="mt-4 font-heading text-5xl leading-none text-[#111318] md:text-6xl">
                  {itinerary.title}
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  {itinerary.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-full border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 hover:border-primary"
                    onClick={handleShare}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className={`rounded-full px-5 text-base font-semibold ${
                      isSaved
                        ? "border-green-500 bg-green-50 text-green-700 hover:border-green-600"
                        : "border-slate-300 bg-white text-slate-700 hover:border-primary"
                    }`}
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                  >
                    {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    className="rounded-full bg-primary px-5 text-base font-semibold text-white hover:bg-[#ff5977]"
                    onClick={() => setLocation("/questionnaire")}
                  >
                    Customize
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                <WeatherWidget location={itinerary.location} />
                <div className="rounded-3xl border border-[rgba(244,208,63,0.4)] bg-[rgba(255,249,239,0.72)] p-5">
                  <p className="text-xs font-bold uppercase text-slate-500">Destination</p>
                  <p className="mt-3 font-heading text-3xl leading-none text-[#111318]">{itinerary.location}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Built from your selected mood, transport preferences, and travel distance.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-3xl border border-[rgba(244,208,63,0.45)] bg-white/88 p-4 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:p-6">
            <GoogleMap activities={itinerary.activities} location={itinerary.location} />
          </Card>

          <Card className="rounded-3xl border border-[rgba(244,208,63,0.45)] bg-white/88 p-6 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:p-8">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase text-primary">Timeline</p>
              <h2 className="mt-4 font-heading text-4xl leading-none text-[#111318] md:text-5xl">
                Your day, sequenced
              </h2>
            </div>
            <ItineraryTimeline activities={itinerary.activities} />
          </Card>

          {itinerary.recommendations?.length > 0 && (
            <div>
              <div className="mb-6">
                <p className="text-sm font-bold uppercase text-primary">More ideas</p>
                <h2 className="mt-4 font-heading text-4xl leading-none text-[#111318] md:text-5xl">
                  Similar adventures you might like
                </h2>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {itinerary.recommendations.map((recommendation) => (
                  <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Button
              className="h-14 rounded-full bg-primary px-10 text-lg font-bold text-white hover:bg-[#ff5977]"
              onClick={() => {
                sessionStorage.clear();
                setLocation("/");
              }}
            >
              Plan another adventure
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
