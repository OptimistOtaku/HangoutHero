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
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const { user, loginWithGoogle } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const persistItinerary = async () => {
    if (!itinerary) return null;
    if (itinerary.id) return itinerary.id;

    setIsSaving(true);
    try {
      const result = await saveItinerary(itinerary, user?.id);
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

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      const id = await persistItinerary();
      if (!id) return;

      toast({
        title: "Saved to Profile!",
        description: "This itinerary is now securely saved in your scrapbook profile.",
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

  const handleLoginAndSave = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  // Automatically save if user logs in via the prompt and itinerary is not yet saved
  useEffect(() => {
    if (user && showLoginPrompt && itinerary && !isSaved) {
      setShowLoginPrompt(false);
      handleSave();
    }
  }, [user, showLoginPrompt, itinerary, isSaved]);

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
    <section className="relative mx-auto max-w-7xl px-3 py-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <ProgressSteps currentStep={3} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-5 grid gap-5 md:mt-8 md:gap-8"
        >
          <Card className="overflow-hidden rounded-[22px] border border-[rgba(244,208,63,0.45)] bg-white/88 p-4 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:rounded-3xl md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-sm font-bold uppercase text-primary">Your HangoutHero Route</p>
                <h1 className="mt-3 font-heading text-[2.45rem] font-extrabold leading-[0.95] text-[#111318] md:mt-4 md:text-6xl">
                  {itinerary.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
                  {itinerary.description}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 md:mt-8">
                  <Button
                    variant="outline"
                    className="rounded-full border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-primary sm:px-5 sm:text-base"
                    onClick={handleShare}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className={`rounded-full px-3 text-sm font-semibold sm:px-5 sm:text-base ${
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
                    className="rounded-full bg-primary px-3 text-sm font-semibold text-white hover:bg-[#ff5977] sm:px-5 sm:text-base"
                    onClick={() => setLocation("/questionnaire")}
                  >
                    Customize
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                <WeatherWidget location={itinerary.location} />
                <div className="rounded-[20px] border border-[rgba(244,208,63,0.4)] bg-[rgba(255,249,239,0.72)] p-4 md:rounded-3xl md:p-5">
                  <p className="text-xs font-bold uppercase text-slate-500">Destination</p>
                  <p className="mt-3 font-heading text-2xl leading-none text-[#111318] md:text-3xl">{itinerary.location}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Tuned around your selected mood, transport preferences, and travel distance.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-[22px] border border-[rgba(244,208,63,0.45)] bg-white/88 p-3 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:rounded-3xl md:p-6">
            <GoogleMap activities={itinerary.activities} location={itinerary.location} />
          </Card>

          <Card className="rounded-[22px] border border-[rgba(244,208,63,0.45)] bg-white/88 p-4 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:rounded-3xl md:p-8">
            <div className="mb-6 md:mb-8">
              <p className="text-sm font-bold uppercase text-primary">Route Timeline</p>
              <h2 className="mt-3 font-heading text-[2.15rem] font-extrabold leading-[0.95] text-[#111318] md:mt-4 md:text-5xl">
                Your day, in order
              </h2>
            </div>
            <ItineraryTimeline activities={itinerary.activities} />
          </Card>

          {itinerary.recommendations?.length > 0 && (
            <div>
              <div className="mb-6">
                <p className="text-sm font-bold uppercase text-primary">Next Route Ideas</p>
                <h2 className="mt-3 font-heading text-[2.15rem] font-extrabold leading-[0.95] text-[#111318] md:mt-4 md:text-5xl">
                  Keep the plan going
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3 md:gap-6">
                {itinerary.recommendations.map((recommendation) => (
                  <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Button
              className="h-14 w-full rounded-full bg-primary px-10 text-base font-bold text-white hover:bg-[#ff5977] sm:w-auto md:text-lg"
              onClick={() => {
                sessionStorage.clear();
                setLocation("/");
              }}
            >
              Plan Another Hangout
            </Button>
          </div>
        </motion.div>

        <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <DialogContent className="rounded-3xl border border-[rgba(244,208,63,0.45)] bg-[rgba(255,250,242,0.98)] p-6 shadow-2xl backdrop-blur-md max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading text-3xl font-extrabold text-[#111318] text-center flex flex-col items-center gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </div>
                Save to profile
              </DialogTitle>
              <DialogDescription className="text-center text-slate-600 text-sm leading-relaxed mt-4">
                Authenticate with Google to permanently preserve this personalized hangout route, track your past explorations, and access them from any device.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={handleLoginAndSave}
                className="h-12 rounded-full bg-primary font-bold text-white hover:bg-[#ff5977] text-sm flex items-center justify-center gap-3 shadow-md"
              >
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.69 5.69 0 018.25 12.8a5.69 5.69 0 015.741-5.7 5.6 5.6 0 013.9 1.505l3.19-3.19A9.914 9.914 0 0013.99 2.25c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 10.02-4.06 10.02-10.18 0-.68-.061-1.33-.18-1.785H12.24z" />
                </svg>
                Sign in with Google
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLoginPrompt(false)}
                className="h-11 rounded-full border-slate-300 bg-white font-semibold text-slate-700 hover:border-primary text-xs"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
