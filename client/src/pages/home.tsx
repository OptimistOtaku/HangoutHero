import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, MapPinned, Sparkles, Stamp, TicketCheck, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ScrapbookImage } from "@/components/ui/scrapbook-image";
import { CITY_CARDS } from "@/lib/city-data";
import { ItineraryResponse } from "@/lib/openai";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const highlights = [
  {
    title: "Set the vibe",
    text: "Tell HangoutHero who is coming, what you are in the mood for, and how much energy the day should have.",
    icon: Sparkles,
  },
  {
    title: "Get a plan people will say yes to",
    text: "See a day that flows naturally, with stops that fit the mood instead of sending everyone back to the group chat.",
    icon: TicketCheck,
  },
  {
    title: "Head out with confidence",
    text: "Open the places, share the plan, and keep the day saved like a little scrapbook of where you went.",
    icon: MapPinned,
  },
];

const heroNotes = [
  "Built around your mood",
  "Real places, real photos",
  "Ready before the group chat spirals",
];

interface PrebuiltRouteSummary {
  slug: string;
  city: string;
  mood: string;
  stops: string;
  accent: string;
  image: string;
  tagline: string;
}

interface PrebuiltRouteDetail extends PrebuiltRouteSummary {
  itinerary: ItineraryResponse;
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  const [prebuiltRoutes, setPrebuiltRoutes] = useState<PrebuiltRouteSummary[]>([]);
  const [isLoadingPrebuiltRoutes, setIsLoadingPrebuiltRoutes] = useState(true);
  const [openingRouteSlug, setOpeningRouteSlug] = useState<string | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const howItWorksRef = useRef<HTMLElement | null>(null);
  const routesRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceIndex((prev) => (prev + 1) % CITY_CARDS.length);
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadPrebuiltRoutes = async () => {
      try {
        const response = await fetch("/api/prebuilt-itineraries");

        if (!response.ok) {
          throw new Error("Unable to load route ideas");
        }

        const routes = await response.json();
        setPrebuiltRoutes(Array.isArray(routes) ? routes : []);
      } catch (error) {
        console.error("Unable to load prebuilt route ideas:", error);
        setPrebuiltRoutes([]);
      } finally {
        setIsLoadingPrebuiltRoutes(false);
      }
    };

    loadPrebuiltRoutes();
  }, []);

  useGSAP(
    () => {
      if (prebuiltRoutes.length === 0) {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          desktop: "(min-width: 900px)",
        },
        (context) => {
          const { reduceMotion, desktop } = context.conditions || {};

          if (reduceMotion) {
            gsap.set(".gsap-reveal, .hero-polaroid, .hero-note", {
              autoAlpha: 1,
              clearProps: "transform",
            });
            return;
          }

          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

          tl.from(".gsap-reveal", {
            autoAlpha: 0,
            y: 26,
            duration: 0.78,
            stagger: 0.09,
          })
            .from(
              ".hero-polaroid",
              {
                autoAlpha: 0,
                y: desktop ? 48 : 26,
                rotation: (index) => [-13, 7, 15][index] || 0,
                scale: 0.92,
                duration: 0.9,
                stagger: 0.11,
              },
              "-=0.46"
            )
            .from(
              ".hero-note",
              {
                autoAlpha: 0,
                y: 18,
                rotation: -2,
                duration: 0.48,
                stagger: 0.07,
              },
              "-=0.28"
            );

          gsap.to(".hero-polaroid:nth-child(2)", {
            y: -8,
            rotation: 1,
            duration: 3.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
      );

      return () => mm.revert();
    },
    { scope: heroRef }
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          ".how-kicker, .how-title, .how-copy, .how-step-card, .how-route-line, .how-floating-note",
          { autoAlpha: 1, clearProps: "transform" }
        );
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "back.out(1.45)" },
          scrollTrigger: {
            trigger: howItWorksRef.current,
            start: "top 72%",
            end: "bottom 35%",
            toggleActions: "play none none reverse",
          },
        });

        tl.from(".how-kicker", { autoAlpha: 0, y: 18, scale: 0.92, duration: 0.5 })
          .from(".how-title", { autoAlpha: 0, y: 32, rotation: -1.5, duration: 0.72 }, "-=0.26")
          .from(".how-copy", { autoAlpha: 0, y: 20, duration: 0.54, ease: "power3.out" }, "-=0.42")
          .from(
            ".how-route-line",
            { scaleX: 0, transformOrigin: "left center", duration: 0.72, ease: "power3.inOut" },
            "-=0.22"
          )
          .from(
            ".how-step-card",
            {
              autoAlpha: 0,
              y: 46,
              scale: 0.86,
              rotation: (index) => [-2.5, 2, -1.5][index] || 0,
              duration: 0.72,
              stagger: 0.13,
            },
            "-=0.42"
          )
          .from(
            ".how-step-pop",
            {
              scale: 0,
              rotation: -22,
              duration: 0.42,
              stagger: 0.11,
            },
            "-=0.5"
          )
          .from(
            ".how-floating-note",
            {
              autoAlpha: 0,
              y: 22,
              scale: 0.88,
              rotation: (index) => [-4, 4][index] || 0,
              duration: 0.5,
              stagger: 0.08,
            },
            "-=0.22"
          );

        gsap.to(".how-floating-note", {
          y: (index) => (index % 2 ? 10 : -10),
          rotation: (index) => (index % 2 ? -2 : 2),
          duration: 2.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.24,
        });

      });

      return () => mm.revert();
    },
    { scope: howItWorksRef }
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".routes-kicker, .routes-title, .route-card, .routes-marquee-track", {
          autoAlpha: 1,
          clearProps: "transform",
        });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: routesRef.current,
              start: "top 72%",
              toggleActions: "play none none reverse",
            },
          })
          .from(".routes-kicker", { y: 18, scale: 0.94, duration: 0.45 })
          .from(".routes-title", { y: 34, rotation: 1.2, duration: 0.7 }, "-=0.22")
          .from(".routes-copy", { y: 18, duration: 0.48 }, "-=0.48")
          .from(
            ".route-card",
            {
              y: 38,
              scale: 0.94,
              rotation: (index) => [-1.2, 0.8, -0.6, 1][index % 4],
              duration: 0.78,
              stagger: { each: 0.08, from: "center" },
            },
            "-=0.2"
          );

        gsap.to(".routes-marquee-track", {
          xPercent: -50,
          duration: 34,
          ease: "none",
          repeat: -1,
        });
      });

      return () => mm.revert();
    },
    { dependencies: [prebuiltRoutes.length], scope: routesRef, revertOnUpdate: true }
  );

  const activePlace = CITY_CARDS[currentPlaceIndex];
  const previousPlace = CITY_CARDS[(currentPlaceIndex - 1 + CITY_CARDS.length) % CITY_CARDS.length];
  const nextPlace = CITY_CARDS[(currentPlaceIndex + 1) % CITY_CARDS.length];
  const loopingRouteCards = [...prebuiltRoutes, ...prebuiltRoutes];

  const openPrebuiltRoute = async (route: PrebuiltRouteSummary) => {
    try {
      setOpeningRouteSlug(route.slug);
      const response = await fetch(`/api/prebuilt-itineraries/${route.slug}`);

      if (!response.ok) {
        throw new Error("Unable to open this plan");
      }

      const routeDetail: PrebuiltRouteDetail = await response.json();
      sessionStorage.setItem("itineraryData", JSON.stringify(routeDetail.itinerary));
      sessionStorage.setItem(
        "locationData",
        JSON.stringify({
          location: routeDetail.itinerary.location,
          distance: "Nearby",
          transportation: ["Walk", "Cab"],
        })
      );
      setLocation("/results");
    } catch (error) {
      console.error("Unable to open prebuilt route:", error);
    } finally {
      setOpeningRouteSlug(null);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <section
        ref={heroRef}
        className="scrapbook-hero relative mx-auto grid max-w-7xl items-center gap-7 px-4 pb-10 pt-7 md:min-h-[calc(100vh-86px)] md:px-8 lg:grid-cols-[0.94fr_1.06fr] lg:gap-10 lg:py-12"
      >
        <div className="max-w-3xl">
          <div className="gsap-reveal label-chip w-fit">
            <Stamp className="mr-2 h-4 w-4" />
            HangoutHero
          </div>

          <h1 className="gsap-reveal mt-5 max-w-[12ch] font-heading text-[clamp(3.05rem,15vw,4.4rem)] font-extrabold leading-[0.9] text-[#111318] md:mt-7 md:text-[5.2rem] xl:text-[6.35rem]">
            Plan the day.
            <span className="block text-primary">Keep the story.</span>
          </h1>

          {user ? (
            <p className="gsap-reveal mt-5 max-w-2xl text-base leading-7 text-slate-600 md:mt-6 md:text-xl md:leading-8">
              Welcome back, <span className="font-bold text-primary font-heading">@{user.username}</span>! Your customized traveler passport is active. Build a new hangout route or view your past scrapbook pages.
            </p>
          ) : (
            <p className="gsap-reveal mt-5 max-w-2xl text-base leading-7 text-slate-600 md:mt-6 md:text-xl md:leading-8">
              HangoutHero turns a mood, a city, and a few quick choices into a day your friends can actually agree on.
            </p>
          )}

          <div className="gsap-reveal mt-6 flex flex-wrap gap-2 md:mt-7">
            {heroNotes.map((note) => (
              <span key={note} className="hero-note rounded-[10px] border border-[rgba(244,208,63,0.5)] bg-white/80 px-4 py-2 text-sm font-bold text-[#26303a] shadow-[0_10px_24px_rgba(94,71,45,0.07)]">
                {note}
              </span>
            ))}
          </div>

          <div className="gsap-reveal mt-7 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-9">
            <Button
              asChild
              className="h-14 w-full rounded-[12px] bg-primary px-8 text-base font-extrabold text-white shadow-[0_18px_34px_rgba(255,56,92,0.22)] hover:bg-[#ff5977] sm:w-auto"
            >
              <Link href="/questionnaire">
                Build My Hangout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            {user ? (
              <Button
                onClick={() => window.dispatchEvent(new Event("open-traveler-profile"))}
                variant="outline"
                className="h-14 w-full rounded-[12px] border-[1.5px] border-slate-300 bg-white/76 px-8 text-base font-bold text-slate-700 hover:border-primary hover:bg-white sm:w-auto flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Bookmark className="h-4 w-4 text-primary" />
                View Saved Scrapbooks
              </Button>
            ) : (
              <a href="#journey-styles">
                <Button
                  variant="outline"
                  className="h-14 w-full rounded-[12px] border-[1.5px] border-slate-300 bg-white/76 px-8 text-base font-bold text-slate-700 hover:border-primary hover:bg-white sm:w-auto"
                >
                  See Sample Routes
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="relative mx-auto min-h-[390px] w-full max-w-[760px] sm:min-h-[470px] lg:min-h-[560px]">
          <div className="hero-polaroid absolute -left-5 top-[25%] z-0 scale-[0.72] sm:left-[4%] sm:scale-90 lg:scale-100">
            <ScrapbookImage
              polaroid
              rotation={-8}
              src={previousPlace.image}
              alt={`${previousPlace.name} day out idea`}
              caption={`${previousPlace.name}`}
            />
          </div>
          <div className="hero-polaroid absolute left-1/2 top-0 z-10 -translate-x-1/2 scale-[0.88] sm:left-[25%] sm:translate-x-0 sm:scale-95 lg:scale-100">
            <ScrapbookImage
              polaroid
              priority
              rotation={2}
              src={activePlace.image}
              alt={`${activePlace.name} day out idea`}
              caption={`${activePlace.name}`}
            />
          </div>
          <div className="hero-polaroid absolute -right-7 top-[26%] z-0 scale-[0.72] sm:left-[50%] sm:right-auto sm:scale-90 lg:scale-100">
            <ScrapbookImage
              polaroid
              rotation={8}
              src={nextPlace.image}
              alt={`${nextPlace.name} day out idea`}
              caption={`${nextPlace.name}`}
            />
          </div>

          <div className="hero-note scrapbook-note absolute bottom-0 left-0 right-0 mx-auto max-w-[21rem] p-5 sm:left-0 sm:right-auto sm:max-w-sm sm:p-6 lg:bottom-6">
            <div className="label-chip inline-flex">
              <Camera className="mr-2 h-4 w-4" />
              your next day out
            </div>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-none text-[#111318] sm:text-4xl">
              {activePlace.name}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{activePlace.tagline}</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" ref={howItWorksRef} className="page-shell">
        <div className="editorial-card relative p-5 md:p-10">
          <div className="how-floating-note pointer-events-none absolute right-5 top-6 hidden rounded-[10px] bg-[#fff2a8] px-4 py-2 font-scrap text-2xl text-[#111318] shadow-[0_14px_24px_rgba(94,71,45,0.12)] lg:block">
            picked for you
          </div>
          <div className="how-floating-note pointer-events-none absolute bottom-7 left-8 hidden rotate-[-3deg] rounded-[10px] bg-[#d9fff7] px-4 py-2 font-scrap text-2xl text-[#111318] shadow-[0_14px_24px_rgba(94,71,45,0.1)] lg:block">
            easy to share
          </div>
          <div className="max-w-3xl">
            <div className="how-kicker label-chip">How it helps</div>
            <h2 className="how-title mt-5 font-heading text-[2.35rem] font-extrabold leading-[0.95] text-[#111318] md:mt-6 md:text-6xl">
              From group chat chaos
              <br />
              to one ready route.
            </h2>
            <p className="how-copy mt-4 max-w-2xl text-base leading-7 text-slate-600 md:mt-5 md:text-lg md:leading-8">
              Answer a few quick questions and get a plan that feels easy to send, easy to follow, and fun to remember later.
            </p>
          </div>

          <div className="relative mt-10 grid gap-5 md:grid-cols-3">
            <div className="how-route-line pointer-events-none absolute left-[12%] right-[12%] top-6 hidden h-[3px] rounded-full bg-gradient-to-r from-primary via-[#ffd55a] to-secondary md:block" />
            {highlights.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="how-step-card group relative rounded-[12px] border border-[rgba(244,208,63,0.42)] bg-[rgba(255,255,255,0.86)] p-5 shadow-[0_14px_28px_rgba(94,71,45,0.06)] transition-shadow duration-300 hover:shadow-[0_22px_44px_rgba(255,56,92,0.13)] md:p-6"
                >
                  <div className="how-step-pop absolute right-4 top-4 rounded-full bg-[#fff2a8] px-3 py-1 text-xs font-extrabold text-[#111318]">
                    0{index + 1}
                  </div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary text-white shadow-[0_10px_24px_rgba(255,56,92,0.18)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-2xl font-extrabold leading-none text-[#111318]">{item.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="journey-styles" ref={routesRef} className="page-shell overflow-x-clip pt-2">
        <div className="paper-grid max-w-full overflow-hidden rounded-[14px] border border-[rgba(244,208,63,0.45)] bg-[rgba(255,255,255,0.78)] py-5 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:py-6">
          <div className="mb-5 flex flex-col gap-5 px-5 md:mb-6 md:flex-row md:items-end md:justify-between md:px-8">
            <div>
              <div className="routes-kicker label-chip">Route Ideas</div>
              <h2 className="routes-title mt-5 font-heading text-[2.35rem] font-extrabold leading-[0.95] text-[#111318] md:mt-6 md:text-6xl">
                A few ways to spend the day.
                <br />
                Built around what you want to do.
              </h2>
            </div>
            <p className="routes-copy max-w-sm text-sm font-semibold leading-6 text-slate-600 md:text-base md:leading-7">
              See how HangoutHero turns a mood into a route your group can actually follow.
            </p>
          </div>

          {isLoadingPrebuiltRoutes ? (
            <div className="mx-5 rounded-[14px] border border-dashed border-[rgba(244,208,63,0.65)] bg-white/72 px-5 py-8 text-center text-sm font-bold text-slate-500 md:mx-8">
              Loading ready-made plans...
            </div>
          ) : prebuiltRoutes.length === 0 ? (
            <div className="mx-5 rounded-[14px] border border-dashed border-[rgba(244,208,63,0.65)] bg-white/72 px-5 py-8 text-center text-sm font-bold text-slate-500 md:mx-8">
              Route ideas are unavailable right now.
            </div>
          ) : (
            <div className="relative max-w-full overflow-hidden px-5 pb-2 [mask-image:linear-gradient(90deg,transparent,black_7%,black_93%,transparent)] md:px-8">
              <div className="routes-marquee-track flex w-max gap-4 will-change-transform md:gap-5">
                {loopingRouteCards.map((route, index) => {
                  const isDuplicate = index >= prebuiltRoutes.length;
                  const isOpening = openingRouteSlug === route.slug;

                  return (
                    <button
                      key={`${route.slug}-${index}`}
                      type="button"
                      className="route-card group relative h-[22rem] w-[74vw] max-w-[20rem] flex-none overflow-hidden rounded-[14px] border border-[rgba(244,208,63,0.42)] bg-white text-left text-[#111318] shadow-[0_16px_32px_rgba(255,56,92,0.08)] transition-transform duration-300 hover:-translate-y-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:h-[24rem] md:w-[22.5rem]"
                      onClick={() => openPrebuiltRoute(route)}
                      disabled={Boolean(openingRouteSlug)}
                      tabIndex={isDuplicate ? -1 : 0}
                      aria-label={`Open ${route.city} prebuilt itinerary`}
                    >
                      <ScrapbookImage src={route.image} alt={`${route.city} prebuilt itinerary`} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/16 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/42 to-transparent" />

                      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-[11px] font-extrabold text-[#111318] shadow-[0_12px_26px_rgba(0,0,0,0.18)] md:text-xs">
                          <span className={`h-2 w-2 rounded-full ${route.accent}`} />
                          {route.mood}
                        </div>
                        <div className="rounded-full bg-[#fff2a8] px-3 py-1 text-[11px] font-extrabold text-[#111318] shadow-[0_12px_26px_rgba(0,0,0,0.16)] md:text-xs">
                          {isOpening ? "Opening..." : "Quick access"}
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="font-scrap text-2xl leading-none text-[#fff2a8] md:text-3xl">{route.stops}</p>
                        <h3 className="mt-1 font-heading text-3xl font-extrabold leading-none text-white md:text-4xl">{route.city}</h3>
                        <p className="mt-2 max-w-[24ch] text-[13px] font-semibold leading-5 text-white/88 md:text-sm md:leading-6">{route.tagline}</p>
                        <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-extrabold text-primary shadow-[0_12px_26px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:translate-x-1">
                          Open prebuilt plan
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="why-hangouthero" className="page-shell pt-4">
        <div className="rounded-[14px] bg-[#111318] px-5 py-8 text-white shadow-[0_28px_60px_rgba(17,19,24,0.22)] md:px-10 md:py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-scrap text-3xl leading-none text-[#fff09b] md:text-4xl">built for actual plans</p>
              <h2 className="mt-4 font-heading text-[2.35rem] font-extrabold leading-[0.95] md:text-6xl">
                Less “where should we go?”
                <br />
                More “send the route.”
              </h2>
              <p className="mt-5 text-base leading-7 text-white/74 md:text-lg md:leading-8">
                Make the plan, send it to the group, and keep the best days saved for later.
              </p>
            </div>
            <Button
              asChild
              className="h-14 w-full rounded-[12px] bg-primary px-8 text-base font-extrabold text-white hover:bg-[#ff5977] md:w-auto"
            >
              <Link href="/questionnaire">Build My Route</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
