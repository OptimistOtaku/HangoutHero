import { Link, useLocation } from "wouter";
import { useState } from "react";
import { MapPin, Menu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Mood boards", href: "/#journey-styles" },
  { label: "Why it works", href: "/#why-hangouthero" },
];

export default function Header() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
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

        <div className="hidden items-center gap-3 md:flex">
          {location === "/" ? (
            <>
              <Button asChild variant="ghost" className="rounded-full px-4 text-base font-semibold text-slate-700 hover:bg-white/60 hover:text-primary">
                <button type="button" onClick={() => handleAnchorNav("/#journey-styles")}>Browse Cities</button>
              </Button>
              <Button asChild className="rounded-full bg-primary px-7 py-6 text-base font-bold text-white hover:bg-[#ff5977]">
                <Link href="/questionnaire">Start Planning</Link>
              </Button>
            </>
          ) : (
            <Button asChild className="rounded-full bg-primary px-6 py-5 text-sm font-bold text-white hover:bg-[#ff5977]">
              <Link href="/">Back Home</Link>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          aria-label="Open navigation"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
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
          </nav>
        </div>
      )}
    </header>
  );
}
