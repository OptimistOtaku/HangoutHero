import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { MapPin, Menu, Sparkles, X, LogOut, Bookmark, Calendar, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
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

const navItems = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Mood boards", href: "/#journey-styles" },
  { label: "Why it works", href: "/#why-hangouthero" },
];

export default function Header() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Auth state & profile sheet state
  const { user, loginWithGoogle, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[rgba(244,208,63,0.42)] bg-[rgba(255,250,242,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 md:px-8 md:py-4">
          <Link href="/">
            <div className="flex cursor-pointer items-center gap-3 md:gap-4" onClick={() => setIsMenuOpen(false)}>
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white shadow-[0_14px_30px_rgba(255,56,92,0.25)] md:h-14 md:w-14 md:rounded-2xl">
                <MapPin className="h-5 w-5 fill-white md:h-6 md:w-6" />
                <div className="absolute -right-2 -top-2 rounded-full bg-[#fff1a8] p-1 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              </div>
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
                    <p className="mt-1 text-xs text-slate-500 truncate">{user.email || user.username}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  
                  <DropdownMenuItem 
                    onClick={() => setIsProfileOpen(true)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-primary/10 hover:text-primary"
                  >
                    <Bookmark className="h-4 w-4" />
                    Saved Scrapbooks
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
                onClick={loginWithGoogle}
                variant="outline"
                className="h-11 rounded-full border-primary/40 bg-white px-5 text-sm font-bold text-primary hover:bg-primary/5 hover:text-primary shadow-sm flex items-center gap-2"
              >
                <svg className="h-4 w-4 fill-primary" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.69 5.69 0 018.25 12.8a5.69 5.69 0 015.741-5.7 5.6 5.6 0 013.9 1.505l3.19-3.19A9.914 9.914 0 0013.99 2.25c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 10.02-4.06 10.02-10.18 0-.68-.061-1.33-.18-1.785H12.24z" />
                </svg>
                Sign In
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <Avatar 
                onClick={() => setIsProfileOpen(true)}
                className="h-10 w-10 border-2 border-primary/40 shadow-sm cursor-pointer"
              >
                <AvatarImage src={user.photoURL} alt={user.displayName || user.username} />
                <AvatarFallback className="bg-primary/10 font-bold text-primary">
                  {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
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
                    Saved Scrapbooks
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
                    loginWithGoogle();
                  }}
                  variant="outline" 
                  className="w-full rounded-full border-primary/40 py-6 text-base font-bold text-primary flex items-center justify-center gap-2 bg-white hover:bg-primary/5"
                >
                  <svg className="h-4 w-4 fill-primary" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.69 5.69 0 018.25 12.8a5.69 5.69 0 015.741-5.7 5.6 5.6 0 013.9 1.505l3.19-3.19A9.914 9.914 0 0013.99 2.25c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 10.02-4.06 10.02-10.18 0-.68-.061-1.33-.18-1.785H12.24z" />
                  </svg>
                  Sign In with Google
                </Button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Slide-out Scrapbook Sheet */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent className="overflow-y-auto border-l border-[rgba(240,215,154,0.78)] bg-[rgba(255,252,247,0.98)] p-6 shadow-2xl w-full sm:max-w-md">
          <SheetHeader className="pb-4 border-b border-dashed border-slate-200">
            <SheetTitle className="font-heading text-3xl font-extrabold text-[#111318] flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Bookmark className="h-5 w-5 fill-white" />
              </div>
              My Scrapbooks
            </SheetTitle>
            <SheetDescription className="text-slate-500 font-scrap text-lg leading-none mt-2">
              your personalized saved adventures
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {loadingTrips ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                <p className="text-sm font-semibold">Opening your scrapbooks...</p>
              </div>
            ) : savedTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Globe className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-700">No saved trips yet</h3>
                <p className="mt-2 text-sm max-w-[240px] leading-relaxed">
                  Design a route in any city and click the bookmark icon to start your scrapbook!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {savedTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="relative group overflow-hidden rounded-3xl border border-[rgba(240,215,154,0.78)] bg-white p-4 shadow-[0_12px_24px_rgba(94,71,45,0.06)] hover:shadow-[0_18px_38px_rgba(255,56,92,0.09)] transition-all duration-300"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-bold text-primary">
                        <MapPin className="h-3 w-3 fill-primary" />
                        {trip.location}
                      </span>
                      <h4 className="mt-2 font-heading text-[1.28rem] font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">
                        {trip.title}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 truncate-2-lines">
                        {trip.description}
                      </p>
                      
                      <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-100 pt-3">
                        <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-slate-400 uppercase">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(trip.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        
                        <Button
                          onClick={() => handleLoadTrip(trip)}
                          size="sm"
                          className="rounded-full bg-primary/10 px-4 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
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
    </>
  );
}
