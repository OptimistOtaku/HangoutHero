import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StickyNotePopup() {
  const { user, loading, loginWithGoogle } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isThankYou, setIsThankYou] = useState(false);
  const [wasGuest, setWasGuest] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Initialize and check auth state
  useEffect(() => {
    if (!loading) {
      if (!user) {
        const dismissed = sessionStorage.getItem("hideStickyNote") === "true";
        if (!dismissed) {
          setIsOpen(true);
          setWasGuest(true);
        }
      } else {
        setIsOpen(false);
        setWasGuest(false);
      }
    }
  }, [loading, user]);

  // Monitor scroll behavior to trigger the popup after scroll threshold
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setHasScrolled(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Transition to Thank You state if they log in during this session
  useEffect(() => {
    if (user && wasGuest && isOpen && !isThankYou) {
      setIsThankYou(true);
      // Auto-dismiss the thank you note after 4.5 seconds
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [user, wasGuest, isOpen, isThankYou]);

  // If loading screen is active, hidden, or user hasn't scrolled yet, don't show
  if (location === "/loading" || !isOpen || !hasScrolled) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    if (!isThankYou) {
      sessionStorage.setItem("hideStickyNote", "true");
    }
  };

  return (
    <div
      className={`z-50 transition-all duration-700 ease-in-out w-44 origin-top animate-in fade-in slide-in-from-top-6
        /* Desktop: Taped directly to navbar bottom-right and hangs down */
        md:absolute md:top-full md:right-12 md:bottom-auto md:left-auto md:translate-y-[-2px]
        /* Mobile: Fixed overlay bottom-right */
        fixed bottom-6 right-6 top-auto left-auto
      `}
    >
      {/* Translucent scrapbook Washi Tape Strip overlapping the navbar bottom border */}
      <div
        className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-5 opacity-90 rotate-[-1.5deg] z-10 select-none pointer-events-none"
        style={{
          // Striped vintage masking tape texture matching site primary pink and secondary teal accents
          background: isThankYou 
            ? "repeating-linear-gradient(45deg, rgba(86, 207, 184, 0.15) 0px, rgba(86, 207, 184, 0.15) 6px, rgba(86, 207, 184, 0.35) 6px, rgba(86, 207, 184, 0.35) 12px)" // Teal stripe tape
            : "repeating-linear-gradient(45deg, rgba(255, 56, 92, 0.1) 0px, rgba(255, 56, 92, 0.1) 6px, rgba(255, 56, 92, 0.22) 6px, rgba(255, 56, 92, 0.22) 12px)", // Rose stripe tape
          borderLeft: "1px dashed rgba(245, 219, 162, 0.8)",
          borderRight: "1px dashed rgba(245, 219, 162, 0.8)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          backdropFilter: "blur(1.5px)",
        }}
      />

      {/* Sticky Note Body with Swing Interaction & Soft Curl Shadows */}
      <div
        className={`w-full p-3.5 aspect-square flex flex-col justify-between scrapbook-note relative transition-all duration-300 ease-out
          ${isThankYou ? "-rotate-1 bg-[#f4fbf7] border-emerald-300" : "-rotate-2 bg-[#fffdeb] border-[#f5dba2]/80"}
          border rounded-sm hover:rotate-1 hover:scale-102 hover:translate-y-1`}
        style={{
          // Custom shadow mimicking paper corner lifting slightly
          boxShadow: "0 8px 20px -4px rgba(94, 71, 45, 0.16), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 -4px 10px rgba(0,0,0,0.02)",
          backgroundImage: isThankYou
            ? "linear-gradient(135deg, rgba(244, 251, 247, 0.98), rgba(224, 247, 232, 0.95))"
            : "linear-gradient(135deg, rgba(255, 253, 235, 0.98), rgba(254, 249, 195, 0.92))",
        }}
      >
        {/* Lined paper lines overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 border-t border-dashed border-amber-700/20 mt-8"></div>

        {/* Close Button ("Peel-off") */}
        <button
          onClick={handleClose}
          className="absolute top-1 right-1 p-0.5 rounded-full text-[#4a3728]/45 hover:text-[#4a3728] hover:bg-[#4a3728]/5 transition-colors z-20"
          title="Peel off"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {isThankYou ? (
          // Thank You State (Cursive Sepia Ink)
          <div className="flex flex-col items-center justify-center text-center h-full pt-1">
            <h4 className="font-scrap text-2.5xl font-bold text-emerald-800 leading-none">
              Thank You! 💖
            </h4>
            <p className="font-scrap text-[17px] text-[#322519] mt-1.5 leading-tight">
              Passport active! Your adventure is saved.
            </p>
            <p className="font-heading text-[8px] font-bold uppercase text-emerald-700/60 mt-2 tracking-wider">
              @{user?.username?.split("@")[0] || "explorer"}
            </p>
          </div>
        ) : (
          // Sign Up Prompt State (Cursive Sepia Ink)
          <div className="flex flex-col justify-between h-full pt-0.5">
            <div className="text-center">
              <h4 className="font-scrap text-[27px] font-bold text-[#4a3728] leading-none">
                Save & Share! 📌
              </h4>
              <p className="font-scrap text-[16px] text-[#322519] mt-2 leading-tight">
                Sign up free to save custom routes and share plans.
              </p>
            </div>

            {/* Google Sign In CTA: Handwritten paper label sticker instead of generic red button */}
            <div className="mt-1.5">
              <button
                onClick={loginWithGoogle}
                className="w-full h-7.5 rounded bg-[#fffdf0] border border-dashed border-[#4a3728]/60 hover:border-[#4a3728] hover:bg-[#fffcda] active:scale-[0.98] text-[#4a3728] transition-all duration-300 font-scrap text-xl font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 fill-[#4a3728]" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.69 5.69 0 018.25 12.8a5.69 5.69 0 015.741-5.7 5.6 5.6 0 013.9 1.505l3.19-3.19A9.914 9.914 0 0013.99 2.25c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 10.02-4.06 10.02-10.18 0-.68-.061-1.33-.18-1.785H12.24z" />
                </svg>
                Stamp Passport 🎒
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
