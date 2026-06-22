import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { MapPin, Menu, Sparkles, X, LogOut, Bookmark, Calendar, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { StickyNotePopup } from "@/components/ui/sticky-note-popup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navItems = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Mood boards", href: "/#journey-styles" },
  { label: "Why it works", href: "/#why-hangouthero" },
];

export default function Header() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Auth state & profile sheet state
  const { user, loginWithGoogle, logout, updateUsername } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Trip deletion state
  const [tripToDelete, setTripToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile editing state
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState("");

  const handleDeleteClick = (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    setTripToDelete(trip);
  };

  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/itinerary/${tripToDelete.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete itinerary");
      }

      setSavedTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
      
      const params = new URLSearchParams(window.location.search);
      const currentId = params.get("id");
      if (currentId && parseInt(currentId) === tripToDelete.id) {
        sessionStorage.removeItem("itineraryData");
        setLocation("/");
      }

      toast({
        title: "Scrapbook Page Ripped Out 🗑️",
        description: `"${tripToDelete.title}" has been permanently deleted from your passport.`,
      });
    } catch (error) {
      toast({
        title: "Could not delete trip",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setTripToDelete(null);
    }
  };

  // External profile drawer trigger
  useEffect(() => {
    const handleOpenProfile = () => setIsProfileOpen(true);
    window.addEventListener("open-traveler-profile", handleOpenProfile);
    return () => window.removeEventListener("open-traveler-profile", handleOpenProfile);
  }, []);

  // Traveler Onboarding state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingHandle, setOnboardingHandle] = useState("");
  const [onboardingError, setOnboardingError] = useState("");
  const [onboardingSaving, setOnboardingSaving] = useState(false);

  // Suggest a clean handle when new user logs in
  useEffect(() => {
    if (user && user.isNew) {
      const defaultSuggest = (user.displayName || user.email || "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 15);
      setOnboardingHandle(defaultSuggest || `explorer_${Math.floor(Math.random() * 1000)}`);
      setIsOnboardingOpen(true);
    } else {
      setIsOnboardingOpen(false);
    }
  }, [user]);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError("");
    
    const cleanHandle = onboardingHandle.trim();
    if (!cleanHandle) {
      setOnboardingError("Handle cannot be empty.");
      return;
    }
    
    if (cleanHandle.length < 3) {
      setOnboardingError("Handle must be at least 3 characters.");
      return;
    }
    
    if (cleanHandle.length > 20) {
      setOnboardingError("Handle cannot exceed 20 characters.");
      return;
    }
    
    if (!/^[a-z0-9_]+$/i.test(cleanHandle)) {
      setOnboardingError("Handle must only contain letters, numbers, and underscores.");
      return;
    }
    
    setOnboardingSaving(true);
    try {
      await updateUsername(cleanHandle);
      setIsOnboardingOpen(false);
    } catch (err) {
      setOnboardingError("Handle already taken or failed to save. Please try another.");
    } finally {
      setOnboardingSaving(false);
    }
  };

  // Fetch saved trips whenever profile sheet opens
  useEffect(() => {
    if (isProfileOpen && user?.id) {
      const fetchTrips = async () => {
        setLoadingTrips(true);
        try {
          const response = await fetch(`/api/user/itineraries/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setSavedTrips(data);
          }
        } catch (error) {
          console.error("Error fetching user trips:", error);
        } finally {
          setLoadingTrips(false);
        }
      };
      fetchTrips();
    }
  }, [isProfileOpen, user?.id]);

  const handleAnchorNav = (href: string) => {
    setIsMenuOpen(false);
    const [path, hash] = href.split("#");

    if (path && path !== location) {
      setLocation(path);
    }

    window.setTimeout(() => {
      if (hash) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
  };

  const handleLoadTrip = (trip: any) => {
    sessionStorage.setItem("itineraryData", JSON.stringify(trip));
    sessionStorage.setItem(
      "locationData",
      JSON.stringify({
        location: trip.location,
        distance: "Moderate (up to 5 miles)",
        transportation: ["Walking"],
      })
    );
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    setLocation(`/results?id=${trip.id}`);
  };

  const handleSaveHandle = async () => {
    if (!newHandle.trim()) return;
    try {
      await updateUsername(newHandle.trim());
      setIsEditingHandle(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[rgba(244,208,63,0.42)] bg-[rgba(255,250,242,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 md:px-8 md:py-4">
          <Link href="/">
            <div className="flex cursor-pointer items-center gap-3 md:gap-4" onClick={() => setIsMenuOpen(false)}>
              <img
                src="/favicon.png"
                alt="HangoutHero Logo"
                className="h-12 w-12 shrink-0 rounded-[14px] shadow-[0_10px_24px_rgba(255,56,92,0.18)] md:h-16 md:w-16 md:rounded-2xl"
              />
              <div>
                <p className="font-heading text-[1.28rem] font-extrabold leading-none text-[#101218] md:text-[2rem]">
                  HangoutHero
                </p>
                <p className="font-scrap -mt-1 text-[1.22rem] leading-none text-[#ff7d9a] md:text-2xl">plan it like a page</p>
              </div>
            </div>
          </Link>


          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleAnchorNav(item.href)}
                className="text-[1rem] font-semibold text-slate-700 transition-colors hover:text-primary"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {/* Standard Nav Actions */}
            {location === "/" && (
              <Button asChild variant="ghost" className="rounded-full px-4 text-base font-semibold text-slate-700 hover:bg-white/60 hover:text-primary">
                <button type="button" onClick={() => handleAnchorNav("/#journey-styles")}>Browse Cities</button>
              </Button>
            )}

            <Button asChild className="rounded-full bg-primary px-7 py-6 text-base font-bold text-white hover:bg-[#ff5977] shadow-md">
              <Link href="/questionnaire">Start Planning</Link>
            </Button>

            {/* Profile Dropdown Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-11 w-11 cursor-pointer border-2 border-primary/40 shadow-sm transition-all hover:scale-105 hover:border-primary">
                    <AvatarImage src={user.photoURL} alt={user.displayName || user.username} />
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">
                      {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-md">
                  <DropdownMenuLabel className="px-3 py-2 text-slate-800">
                    <p className="font-heading text-sm font-bold truncate leading-none">{user.displayName || "Explorer"}</p>
                    <p className="mt-1 text-xs text-slate-500 truncate">@{user.username || "explorer"}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  
                  <DropdownMenuItem 
                    onClick={() => setIsProfileOpen(true)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-primary/10 hover:text-primary"
                  >
                    <Bookmark className="h-4 w-4" />
                    Explorer Profile
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setIsProfileOpen(true)}
                variant="outline"
                className="h-11 w-11 rounded-full border-slate-200 bg-white/80 p-0 text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5 shadow-sm flex items-center justify-center transition-all duration-300"
                title="My Traveler Passport"
              >
                <Bookmark className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <Avatar 
                onClick={() => setIsProfileOpen(true)}
                className="h-10 w-10 border-2 border-primary/40 shadow-sm cursor-pointer"
              >
                <AvatarImage src={user.photoURL} alt={user.displayName || user.username} />
                <AvatarFallback className="bg-primary/10 font-bold text-primary">
                  {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button
                onClick={() => setIsProfileOpen(true)}
                variant="ghost"
                size="icon"
                className="rounded-full text-slate-600 hover:text-primary hover:bg-primary/5 shrink-0 h-10 w-10 flex items-center justify-center"
                title="My Traveler Passport"
              >
                <Bookmark className="h-5 w-5" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full shrink-0"
              aria-label="Open navigation"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-[rgba(244,208,63,0.42)] bg-[rgba(255,250,242,0.98)] px-3 py-3 shadow-[0_22px_40px_rgba(94,71,45,0.08)] md:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleAnchorNav(item.href)}
                  className="rounded-2xl bg-white/54 px-4 py-3 text-left text-base font-semibold text-slate-700 hover:bg-white/80"
                >
                  {item.label}
                </button>
              ))}
              
              <Link href="/questionnaire">
                <Button className="mt-2 w-full rounded-full bg-primary py-6 text-base font-bold text-white hover:bg-[#ff5977]">
                  Start Planning
                </Button>
              </Link>
              
              {user ? (
                <>
                  <Button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfileOpen(true);
                    }}
                    variant="outline" 
                    className="w-full rounded-full border-slate-300 py-6 text-base font-semibold text-slate-700 flex items-center justify-center gap-2 bg-white"
                  >
                    <Bookmark className="h-4 w-4 text-primary" />
                    Explorer Profile
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    variant="ghost" 
                    className="w-full rounded-full py-6 text-base font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileOpen(true);
                  }}
                  variant="outline" 
                  className="w-full rounded-full border-slate-300 py-6 text-base font-semibold text-slate-700 flex items-center justify-center gap-2 bg-white hover:bg-primary/5 hover:text-primary hover:border-primary"
                >
                  <Bookmark className="h-4 w-4 text-primary" />
                  My Traveler Passport
                </Button>
              )}
            </nav>
          </div>
        )}
        <StickyNotePopup />
      </header>

      {/* Slide-out Scrapbook Sheet */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent className="overflow-y-auto border-l border-[rgba(240,215,154,0.78)] bg-[rgba(255,252,247,0.98)] p-6 shadow-2xl w-full sm:max-w-md">
          <SheetHeader className="pb-4 border-b border-dashed border-slate-200">
            <SheetTitle className="font-heading text-3xl font-extrabold text-[#111318] flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Bookmark className="h-5 w-5 fill-white" />
              </div>
              My Profile
            </SheetTitle>
            <SheetDescription className="text-slate-500 font-scrap text-lg leading-none mt-2">
              your personalized explorer scrapbook
            </SheetDescription>
          </SheetHeader>

          {/* Traveler Passport Card */}
          {user ? (
            <div className="mt-6 rounded-3xl border border-[rgba(240,215,154,0.85)] bg-[rgba(255,252,247,0.95)] p-4 shadow-[0_12px_24px_rgba(94,71,45,0.06)] relative overflow-hidden">
              {/* Visual Stamp Overlay */}
              <div className="absolute -right-2 -top-1 select-none opacity-8 pointer-events-none transform rotate-[18deg] font-scrap text-4xl font-black text-primary border-4 border-primary rounded-xl px-2.5 py-0.5">
                APPROVED
              </div>
              
              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-3">Traveler Passport</p>
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-20 w-20 border-2 border-[rgba(240,215,154,0.9)] rounded-2xl shadow-md">
                    <AvatarImage src={user.photoURL} alt={user.displayName || user.username} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                      {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Explorer Name</p>
                  <p className="font-heading text-lg font-extrabold text-slate-800 truncate mt-0.5 leading-tight">
                    {user.displayName || "Anonymous Traveler"}
                  </p>
                  
                  <div className="mt-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Explorer Handle</p>
                    {isEditingHandle ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-slate-500 font-semibold text-sm">@</span>
                        <input
                          type="text"
                          value={newHandle}
                          onChange={(e) => setNewHandle(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold outline-none focus:border-primary"
                        />
                        <button
                          onClick={handleSaveHandle}
                          className="bg-green-500 text-white rounded-lg p-1 hover:bg-green-600 transition-all shrink-0"
                          title="Save handle"
                        >
                          <svg className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="font-bold text-primary text-sm truncate">
                          @{user.username || "explorer"}
                        </p>
                        <button
                          onClick={() => {
                            setNewHandle(user.username);
                            setIsEditingHandle(true);
                          }}
                          className="text-slate-400 hover:text-primary transition-colors shrink-0"
                          title="Edit handle"
                        >
                          <svg className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Traveler Stats Bento Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-dashed border-slate-200">
                <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Scrapbooks</p>
                  <p className="font-heading text-2xl font-black text-primary mt-1 leading-none">{savedTrips.length}</p>
                </div>
                <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Explorer Rank</p>
                  <p className="font-scrap text-lg font-bold text-slate-600 mt-1 leading-none truncate">
                    {savedTrips.length >= 5 ? "Elite Pathfinder" : savedTrips.length >= 2 ? "Active Voyager" : "Novice Explorer"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-[rgba(240,215,154,0.85)] bg-[rgba(255,252,247,0.85)] p-4 shadow-[0_12px_24px_rgba(94,71,45,0.04)] relative overflow-hidden">
              {/* Dynamic Visual Stamp */}
              <div className="absolute -right-3 -top-2 select-none opacity-40 pointer-events-none transform rotate-[14deg] font-scrap text-3xl font-black text-slate-400 border-2 border-dashed border-slate-400 rounded-xl px-2 py-0.5">
                INACTIVE
              </div>
              
              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-3">Traveler Passport</p>
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  <div className="h-20 w-20 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center bg-white/60">
                    <Globe className="h-8 w-8 text-slate-300" />
                  </div>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Explorer Name</p>
                  <p className="font-heading text-lg font-extrabold text-slate-400 mt-0.5 leading-tight">
                    Guest Voyager
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Authenticate your Traveler Passport with Google to preserve your personalized routes, keep track of your explorations, and earn your Explorer Rank.
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
                <Button
                  onClick={loginWithGoogle}
                  className="w-full h-11 rounded-full bg-primary font-bold text-white hover:bg-[#ff5977] text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.69 5.69 0 018.25 12.8a5.69 5.69 0 015.741-5.7 5.6 5.6 0 013.9 1.505l3.19-3.19A9.914 9.914 0 0013.99 2.25c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 10.02-4.06 10.02-10.18 0-.68-.061-1.33-.18-1.785H12.24z" />
                  </svg>
                  Stamp My Passport
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="font-heading text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-primary fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
              </svg>
              My Saved Scrapbooks
            </h3>
            
            {loadingTrips ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
                <p className="text-xs font-semibold">Opening scrapbooks...</p>
              </div>
            ) : savedTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                  <Globe className="h-7 w-7 text-slate-300" />
                </div>
                <h4 className="font-heading text-lg font-bold text-slate-700">Empty Scrapbook</h4>
                <p className="mt-2 text-xs max-w-[220px] leading-relaxed">
                  Design a route in any city and click the bookmark icon to start your scrapbook!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {savedTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="relative group overflow-hidden rounded-3xl border border-[rgba(240,215,154,0.78)] bg-white p-4 shadow-[0_12px_24px_rgba(94,71,45,0.04)] hover:shadow-[0_18px_38px_rgba(255,56,92,0.07)] transition-all duration-300"
                  >
                    {/* Delete Scrapbook Button */}
                    <button
                      onClick={(e) => handleDeleteClick(e, trip)}
                      className="absolute top-4 right-4 p-2 rounded-full border border-dashed border-red-200 bg-[#fffcfb] text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-400 transition-all duration-200 focus:opacity-100 shadow-sm z-20 cursor-pointer"
                      title="Rip page out (Delete)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                        <MapPin className="h-2.5 w-2.5 fill-primary" />
                        {trip.location}
                      </span>
                      <h4 className="mt-2 font-heading text-[1.2rem] font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors pr-6">
                        {trip.title}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                        {trip.description}
                      </p>
                      
                      <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-100 pt-3">
                        <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-slate-400 uppercase">
                          <Calendar className="h-3 w-3" />
                          {new Date(trip.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        
                        <Button
                          onClick={() => handleLoadTrip(trip)}
                          size="sm"
                          className="rounded-full bg-primary/10 px-4 text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          View Trip
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Traveler Onboarding Dialog */}
      <Dialog open={isOnboardingOpen} onOpenChange={(open) => {
        if (!open && user?.isNew) return; // Force handle selection
        setIsOnboardingOpen(open);
      }}>
        <DialogContent className="rounded-3xl border border-[rgba(240,215,154,0.85)] bg-[rgba(255,250,242,0.98)] p-6 shadow-2xl backdrop-blur-md max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl font-extrabold text-[#111318] text-center flex flex-col items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                <Globe className="h-6 w-6" />
              </div>
              Register Passport Handle
            </DialogTitle>
            <DialogDescription className="text-center text-slate-600 text-sm leading-relaxed mt-4">
              Welcome to HangoutHero, explorer! Stamp your official traveler passport by selecting a custom traveler handle.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOnboardingSubmit} className="mt-6 flex flex-col gap-4">
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Explorer Username / Handle
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 font-bold text-base">@</span>
                <input
                  type="text"
                  value={onboardingHandle}
                  onChange={(e) => {
                    setOnboardingHandle(e.target.value);
                    setOnboardingError("");
                  }}
                  placeholder="traveler_handle"
                  className="w-full h-12 bg-white border border-[rgba(244,208,63,0.5)] rounded-2xl pl-8 pr-4 text-sm font-bold text-slate-800 focus:bg-white focus:border-primary outline-none transition-all"
                  required
                />
              </div>
              {onboardingError && (
                <p className="text-xs font-semibold text-red-500 mt-1.5 pl-1.5">{onboardingError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={onboardingSaving}
              className="mt-2 h-12 w-full rounded-full bg-primary font-bold text-white hover:bg-[#ff5977] text-sm flex items-center justify-center gap-2 shadow-md"
            >
              {onboardingSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Stamping...
                </>
              ) : (
                <>
                  Stamp My Passport
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rip Out (Delete) Confirmation Dialog */}
      <AlertDialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border border-[rgba(244,208,63,0.45)] bg-[rgba(255,250,242,0.98)] p-6 shadow-2xl backdrop-blur-md max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-3xl font-extrabold text-[#111318] text-center flex flex-col items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-dashed border-red-300 shadow-md">
                <Trash2 className="h-6 w-6" />
              </div>
              Rip out page?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-600 text-sm leading-relaxed mt-4">
              Are you sure you want to rip this page out of your travel scrapbook? This will permanently delete the itinerary <strong className="text-slate-800">"{tripToDelete?.title}"</strong> and all saved journal notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex flex-col gap-3">
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteTrip();
              }}
              disabled={isDeleting}
              className="h-12 rounded-full bg-red-500 font-bold text-white hover:bg-red-600 text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Ripping Page...
                </>
              ) : (
                "Yes, Rip Page Out"
              )}
            </AlertDialogAction>
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-11 rounded-full border border-slate-300 bg-white font-semibold text-slate-700 hover:border-primary text-xs cursor-pointer"
            >
              Keep Page
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
