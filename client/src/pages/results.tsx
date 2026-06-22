import { useState, useEffect, useRef } from "react";
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
import { CITY_CARDS } from "@/lib/city-data";
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
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPolaroid, setShowPolaroid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user, loginWithGoogle } = useAuth();

  useEffect(() => {
    const loadItinerary = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const itineraryId = params.get("id");
        const itineraryData = sessionStorage.getItem("itineraryData");

        if (itineraryData) {
          const parsed = JSON.parse(itineraryData);
          setItinerary(parsed);
          return;
        }

        if (itineraryId) {
          const response = await fetch(`/api/itinerary/${itineraryId}`);
          if (!response.ok) {
            throw new Error("Unable to load saved itinerary");
          }

          const savedItinerary = await response.json();
          setItinerary(savedItinerary);
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

  // Sync isSaved state based on itinerary ownership
  useEffect(() => {
    if (itinerary) {
      // It is only considered saved if it has a database ID AND belongs to the logged-in user
      setIsSaved(Boolean(itinerary.id && itinerary.userId && user && itinerary.userId === user.id));
    } else {
      setIsSaved(false);
    }
  }, [itinerary, user]);

  interface Sticker {
    id: string;
    type: string;
    x: number;
    y: number;
    rotate: number;
  }

  const AVAILABLE_STICKERS = [
    { type: "coffee", emoji: "☕", label: "Coffee", color: "bg-[#fcedda] border-[#e6ccb2]" },
    { type: "camera", emoji: "📷", label: "Snap", color: "bg-[#e8f1f5] border-[#b0cddb]" },
    { type: "ticket", emoji: "🎫", label: "Admit One", color: "bg-[#f5e6eb] border-[#dbb2be]" },
    { type: "heart", emoji: "💖", label: "Love It", color: "bg-[#ffe6e6] border-[#ffa3a3]" },
    { type: "star", emoji: "⭐", label: "Must Visit", color: "bg-[#fff9db] border-[#ffe066]" },
    { type: "suitcase", emoji: "🧳", label: "Adventure", color: "bg-[#e2f0d9] border-[#a9d18e]" },
    { type: "flight", emoji: "✈️", label: "Explore", color: "bg-[#e6f2ff] border-[#99ccff]" },
  ];

  const parseJournalData = (rawNotes: string | undefined): { text: string; stickers: Sticker[] } => {
    if (!rawNotes) return { text: "", stickers: [] };
    try {
      const parsed = JSON.parse(rawNotes);
      if (parsed && typeof parsed === "object" && "text" in parsed) {
        return {
          text: parsed.text || "",
          stickers: Array.isArray(parsed.stickers) ? parsed.stickers : []
        };
      }
    } catch (e) {
      // Return raw notes directly if not a valid JSON structure
    }
    return { text: rawNotes, stickers: [] };
  };

  const [journalNotes, setJournalNotes] = useState("");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Drag and drop states
  const [dragStickerId, setDragStickerId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartStickerCoords, setDragStartStickerCoords] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync journal notes and stickers when itinerary changes
  useEffect(() => {
    if (itinerary) {
      const { text, stickers: parsedStickers } = parseJournalData(itinerary.notes);
      setJournalNotes(text);
      setStickers(parsedStickers);
    }
  }, [itinerary]);

  const handleStickerDragStart = (e: React.MouseEvent | React.TouchEvent, id: string, x: number, y: number) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStickerId(id);
    setDragStartPos({ x: clientX, y: clientY });
    setDragStartStickerCoords({ x, y });
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!dragStickerId || !containerRef.current) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStartPos.x;
      const deltaY = clientY - dragStartPos.y;
      
      const percentDeltaX = (deltaX / containerRect.width) * 100;
      const percentDeltaY = (deltaY / containerRect.height) * 100;
      
      let newX = Math.max(5, Math.min(95, dragStartStickerCoords.x + percentDeltaX));
      let newY = Math.max(5, Math.min(95, dragStartStickerCoords.y + percentDeltaY));
      
      setStickers((prev) => 
        prev.map((s) => s.id === dragStickerId ? { ...s, x: newX, y: newY } : s)
      );
    };
    
    const handleDragEnd = () => {
      setDragStickerId(null);
    };
    
    if (dragStickerId) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [dragStickerId, dragStartPos, dragStartStickerCoords]);

  const handleAddSticker = (type: string) => {
    const newSticker: Sticker = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      x: 30 + Math.random() * 40,
      y: 35 + Math.random() * 30,
      rotate: Math.floor(Math.random() * 40) - 20,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const handleSaveNotes = async () => {
    if (!itinerary || !itinerary.id) return;
    
    setIsSavingNotes(true);
    try {
      const serializedData = JSON.stringify({
        text: journalNotes,
        stickers: stickers
      });

      const response = await fetch(`/api/itinerary/${itinerary.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: serializedData }),
      });
      
      if (!response.ok) throw new Error("Failed to save journal notes");
      
      const data = await response.json();
      
      const updatedItinerary = { ...itinerary, notes: data.notes };
      setItinerary(updatedItinerary);
      sessionStorage.setItem("itineraryData", JSON.stringify(updatedItinerary));
      
      toast({
        title: "Journal Stamped! ✍️",
        description: "Your travel notes and sticker designs have been securely saved to this scrapbook page.",
      });
    } catch (error) {
      toast({
        title: "Failed to save journal",
        description: "Could not save your notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const persistItinerary = async () => {
    console.log("[DEBUG] persistItinerary called, itinerary:", itinerary, "user:", user);
    if (!itinerary) return null;
    // Only return the existing ID if it is already owned by this user
    if (itinerary.id && itinerary.userId && user && itinerary.userId === user.id) {
      console.log("[DEBUG] Itinerary already owned and saved, id:", itinerary.id);
      return itinerary.id;
    }

    setIsSaving(true);
    try {
      console.log("[DEBUG] Calling saveItinerary API...");
      const result = await saveItinerary(itinerary, user?.id);
      console.log("[DEBUG] saveItinerary API success, result:", result);
      const updatedItinerary = { ...itinerary, id: result.id, userId: user?.id };
      setItinerary(updatedItinerary);
      setIsSaved(true);
      sessionStorage.setItem("itineraryData", JSON.stringify(updatedItinerary));
      return result.id;
    } catch (e) {
      console.error("[DEBUG] saveItinerary API error:", e);
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyShareLink = async () => {
    console.log("[DEBUG] handleCopyShareLink called");
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

  const handleShareClick = () => {
    console.log("[DEBUG] handleShareClick called. user:", user, "showLoginPrompt before:", showLoginPrompt);
    if (!user) {
      setShowLoginPrompt(true);
      console.log("[DEBUG] Set showLoginPrompt to true");
    } else {
      setShowPolaroid(true);
      console.log("[DEBUG] Set showPolaroid to true");
    }
  };

  const handleSave = async () => {
    console.log("[DEBUG] handleSave called. itinerary:", itinerary, "isSaved:", isSaved, "user:", user);
    if (!itinerary || isSaved) return;

    if (!user) {
      setShowLoginPrompt(true);
      console.log("[DEBUG] Set showLoginPrompt to true due to guest user");
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

  console.log("[DEBUG] Results render. showLoginPrompt:", showLoginPrompt, "showPolaroid:", showPolaroid, "user:", user);

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
                    onClick={handleShareClick}
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

          {/* Traveler's Scrapbook Journal Lined Card */}
          {user && itinerary.id && itinerary.userId === user.id && (
            <Card className="overflow-hidden rounded-[22px] border border-[rgba(244,208,63,0.45)] bg-[#fffdf6] p-5 shadow-[0_24px_60px_rgba(255,56,92,0.07)] md:rounded-3xl md:p-8 relative">
              {/* Visual Stamp Ribbon */}
              <div className="absolute -right-3 -top-2 select-none opacity-40 pointer-events-none transform rotate-[14deg] font-scrap text-3xl font-black text-primary border-2 border-primary rounded-xl px-3 py-0.5">
                JOURNAL PAGE
              </div>

              <div className="mb-6">
                <p className="text-sm font-bold uppercase text-primary">Traveler's Scrapbook Journal</p>
                <h2 className="mt-3 font-heading text-[2.15rem] font-extrabold leading-[0.95] text-[#111318] md:mt-4 md:text-5xl">
                  Capture your memories
                </h2>
                <p className="mt-3 text-slate-500 text-sm leading-relaxed max-w-xl">
                  This scrapbook page is active in your passport! Jot down details, memories, cafe recommendations, or travel notes below.
                </p>
              </div>

              {/* Sticker Selection Tray */}
              <div className="mt-5">
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Decorate your page with travel stamps:</p>
                <div className="flex flex-wrap gap-2.5">
                  {AVAILABLE_STICKERS.map((st) => (
                    <button
                      key={st.type}
                      onClick={() => handleAddSticker(st.type)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-dashed text-xs font-bold text-slate-700 transition-all hover:scale-105 hover:-rotate-2 cursor-pointer shadow-sm ${st.color}`}
                    >
                      <span className="text-sm">{st.emoji}</span>
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lined Notebook Paper Card */}
              <div 
                ref={containerRef}
                className="relative mt-5 rounded-2xl border border-[rgba(244,208,63,0.35)] bg-[#faf8f0] p-5 md:p-6 shadow-inner min-h-[300px] overflow-hidden"
              >
                {/* Visual red margin line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 border-r border-dashed border-red-300 pointer-events-none" />
                
                {/* Render placed stickers */}
                {stickers.map((st) => {
                  const stickerDef = AVAILABLE_STICKERS.find(s => s.type === st.type);
                  return (
                    <div
                      key={st.id}
                      onMouseDown={(e) => handleStickerDragStart(e, st.id, st.x, st.y)}
                      onTouchStart={(e) => handleStickerDragStart(e, st.id, st.x, st.y)}
                      style={{
                        left: `${st.x}%`,
                        top: `${st.y}%`,
                        transform: `translate(-50%, -50%) rotate(${st.rotate}deg)`,
                      }}
                      className={`absolute z-30 cursor-move select-none p-2 rounded-xl border border-dashed shadow-md transition-shadow hover:shadow-lg flex flex-col items-center justify-center min-w-[75px] ${stickerDef?.color || "bg-white border-slate-300"}`}
                    >
                      <span className="text-2xl pointer-events-none">{stickerDef?.emoji}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600 select-none pointer-events-none mt-1">{stickerDef?.label}</span>
                      
                      {/* Delete Sticker Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStickers(prev => prev.filter(s => s.id !== st.id));
                        }}
                        className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow cursor-pointer text-[9px] font-bold"
                        title="Remove stamp"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}

                <textarea
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  placeholder="Today we planned to go to Connaught Place. Must order the special cold brew at Blue Tokai!..."
                  rows={8}
                  className="w-full bg-transparent pl-8 border-none text-slate-700 font-scrap text-[1.45rem] leading-[2.15rem] focus:outline-none focus:ring-0 resize-y relative z-10 min-h-[220px]"
                  style={{
                    backgroundImage: "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0) 95%, rgba(0,0,0,0.06) 95%, rgba(0,0,0,0.06) 100%)",
                    backgroundSize: "100% 2.15rem",
                    lineHeight: "2.15rem"
                  }}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="rounded-full bg-primary px-8 py-5 text-sm font-bold text-white hover:bg-[#ff5977] shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSavingNotes ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Stamping Journal...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
                      </svg>
                      Stamp Journal (Save Notes)
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

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

        {showLoginPrompt && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowLoginPrompt(false)}
          >
            <div 
              className="rounded-sm border border-[#f5dba2] bg-[#fffdeb] p-8 shadow-2xl max-w-sm w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setShowLoginPrompt(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
                title="Close"
              >
                ✕
              </button>

              {/* Scrapbook Washi Tape Strip on the dialog top edge */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-4.5 opacity-90 rotate-[-1deg] z-10 select-none pointer-events-none"
                style={{
                  background: "repeating-linear-gradient(45deg, rgba(255, 56, 92, 0.1) 0px, rgba(255, 56, 92, 0.1) 6px, rgba(255, 56, 92, 0.22) 6px, rgba(255, 56, 92, 0.22) 12px)",
                  borderLeft: "1px dashed rgba(245, 219, 162, 0.8)",
                  borderRight: "1px dashed rgba(245, 219, 162, 0.8)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              />

              <div className="pt-2 text-center">
                <h3 className="font-scrap text-4xl font-bold text-[#4a3728]">
                  Stamp Your Passport! 🎒
                </h3>
                <p className="font-scrap text-xl text-[#322519] leading-snug mt-3">
                  Authenticate your Voyager Passport to preserve this custom route, collect ranks, and unlock Polaroid postcards.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleLoginAndSave}
                  className="w-full h-10 rounded bg-[#fffdf0] border border-dashed border-[#4a3728]/60 hover:border-[#4a3728] hover:bg-[#fffcda] active:scale-[0.98] text-[#4a3728] transition-all duration-300 font-scrap text-2xl font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <svg className="h-4 w-4 fill-[#4a3728]" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.69 5.69 0 018.25 12.8a5.69 5.69 0 015.741-5.7 5.6 5.6 0 013.9 1.505l3.19-3.19A9.914 9.914 0 0013.99 2.25c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 10.02-4.06 10.02-10.18 0-.68-.061-1.33-.18-1.785H12.24z" />
                  </svg>
                  Stamp Passport (Free)
                </button>
                <Button
                  variant="ghost"
                  onClick={() => setShowLoginPrompt(false)}
                  className="h-9 font-scrap text-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        )}

        {showPolaroid && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPolaroid(false)}
          >
            <div 
              className="max-w-xs w-full p-6 bg-white border border-[#f5dba2] shadow-2xl rounded-sm flex flex-col items-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setShowPolaroid(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
                title="Close"
              >
                ✕
              </button>

              <div className="bg-[#fcfbf9] p-3 shadow-md border border-slate-200/60 flex flex-col items-center w-full aspect-[4/5]">
                <div className="w-full aspect-square overflow-hidden bg-slate-100 relative rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                  <img 
                    src={
                      CITY_CARDS.find(
                        (c) => c.name.toLowerCase() === itinerary.location.toLowerCase()
                      )?.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500"
                    } 
                    alt={itinerary.location} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2 left-2 bg-white/80 px-2 py-0.5 rounded text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    📍 {itinerary.location}
                  </div>
                </div>
                <div className="pt-4 pb-2 w-full text-center">
                  <p className="font-scrap text-3xl text-[#4a3728] leading-tight font-bold">
                    {itinerary.title}
                  </p>
                  <p className="text-[9px] font-heading font-bold uppercase text-slate-400 mt-2 tracking-widest">
                    Stamp ID: #{itinerary.id || "TEMP"} • @{user?.username?.split("@")[0]}
                  </p>
                </div>
              </div>
              
              <p className="text-[11px] font-scrap text-[#4a3728] text-center mt-3 leading-relaxed px-2">
                "A snapshot of your custom traveler scrapbook page, ready to export and share."
              </p>

              <div className="mt-4 flex flex-col gap-2 w-full">
                <Button
                  className="w-full h-8.5 rounded-full bg-primary text-white font-bold text-xs"
                  onClick={handleCopyShareLink}
                >
                  Copy Share Link 🔗
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-8.5 rounded-full border-slate-300 font-semibold text-slate-700 text-xs bg-white"
                  onClick={() => {
                    toast({
                      title: "Postcard Generated! 📸",
                      description: "Your polaroid memory postcard is downloaded to your device.",
                    });
                    setShowPolaroid(false);
                  }}
                >
                  Download Polaroid Memory
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
