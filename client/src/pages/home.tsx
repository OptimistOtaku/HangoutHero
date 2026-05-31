import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, MapPinned, Sparkles, Stamp, TicketCheck, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrapbookImage } from "@/components/ui/scrapbook-image";
import { CITY_CARDS } from "@/lib/city-data";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const highlights = [
  {
    title: "Tell it the day you want",
    text: "Choose the mood, budget, group size, and pace before a single stop is picked.",
    icon: Sparkles,
  },
  {
    title: "Get a route that feels usable",
    text: "Stops are sequenced around the city, weather, travel range, and the vibe you chose.",
    icon: TicketCheck,
  },
  {
    title: "Open the real places",
    text: "Each itinerary is built to be inspected, mapped, saved, and shared without cleanup.",
    icon: MapPinned,
  },
];

const heroNotes = [
  "Mood-led, not checklist-led",
  "Google-backed place imagery",
  "Weather and map ready",
];

export default function Home() {
  const { user } = useAuth();
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceIndex((prev) => (prev + 1) % CITY_CARDS.length);
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  useGSAP(
    () => {
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

  const activePlace = CITY_CARDS[currentPlaceIndex];
  const previousPlace = CITY_CARDS[(currentPlaceIndex - 1 + CITY_CARDS.length) % CITY_CARDS.length];
  const nextPlace = CITY_CARDS[(currentPlaceIndex + 1) % CITY_CARDS.length];

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
              HangoutHero turns a mood, a city, and a few practical choices into a real-world hangout route with mapped stops, live weather, and scrapbook-style place cards.
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
              alt={`${previousPlace.name} route preview`}
              caption={`${previousPlace.name}`}
            />
          </div>
          <div className="hero-polaroid absolute left-1/2 top-0 z-10 -translate-x-1/2 scale-[0.88] sm:left-[25%] sm:translate-x-0 sm:scale-95 lg:scale-100">
            <ScrapbookImage
              polaroid
              priority
              rotation={2}
              src={activePlace.image}
              alt={`${activePlace.name} route preview`}
              caption={`${activePlace.name}`}
            />
          </div>
          <div className="hero-polaroid absolute -right-7 top-[26%] z-0 scale-[0.72] sm:left-[50%] sm:right-auto sm:scale-90 lg:scale-100">
            <ScrapbookImage
              polaroid
              rotation={8}
              src={nextPlace.image}
              alt={`${nextPlace.name} route preview`}
              caption={`${nextPlace.name}`}
            />
          </div>

          <div className="hero-note scrapbook-note absolute bottom-0 left-0 right-0 mx-auto max-w-[21rem] p-5 sm:left-0 sm:right-auto sm:max-w-sm sm:p-6 lg:bottom-6">
            <div className="label-chip inline-flex">
              <Camera className="mr-2 h-4 w-4" />
              live route preview
            </div>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-none text-[#111318] sm:text-4xl">
              {activePlace.name}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{activePlace.tagline}</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="page-shell">
        <div className="editorial-card p-5 md:p-10">
          <div className="max-w-3xl">
            <div className="label-chip">How It Works</div>
            <h2 className="mt-5 font-heading text-[2.35rem] font-extrabold leading-[0.95] text-[#111318] md:mt-6 md:text-6xl">
              From group chat chaos
              <br />
              to one ready route.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:mt-5 md:text-lg md:leading-8">
              The product does the annoying planning work: it reads the vibe, builds a sequence, and gives you a day plan people can actually follow.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-[12px] border border-[rgba(244,208,63,0.42)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_14px_28px_rgba(94,71,45,0.06)] md:p-6"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary text-white shadow-[0_10px_24px_rgba(255,56,92,0.18)]">
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

      <section id="journey-styles" className="page-shell pt-2">
        <div className="mb-6">
          <div className="label-chip">Sample Routes</div>
          <h2 className="mt-5 font-heading text-[2.35rem] font-extrabold leading-[0.95] text-[#111318] md:mt-6 md:text-6xl">
            Pick a city.
            <br />
            Start with a mood.
          </h2>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {CITY_CARDS.map((place) => (
              <CarouselItem key={place.name} className="pl-4 basis-[86%] sm:basis-[68%] md:basis-1/2 xl:basis-1/3">
                <article className="overflow-hidden rounded-[14px] border border-[rgba(244,208,63,0.42)] bg-white/82 shadow-[0_18px_40px_rgba(255,56,92,0.07)]">
                  <div className="relative h-72 md:h-80">
                    <ScrapbookImage src={place.image} alt={`${place.name} route preview`} className="h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,22,29,0.82)] via-[rgba(18,22,29,0.12)] to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <p className="font-scrap text-3xl leading-none text-[#fff2a8]">sample route</p>
                      <h3 className="mt-2 font-heading text-3xl font-extrabold leading-none">{place.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/85">{place.tagline}</p>
                    </div>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-3 border-slate-300 bg-white/90 hover:bg-white" />
          <CarouselNext className="right-3 border-slate-300 bg-white/90 hover:bg-white" />
        </Carousel>
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
                HangoutHero is a planning product, not a demo page: generate, inspect, map, save, and share the day in one flow.
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
