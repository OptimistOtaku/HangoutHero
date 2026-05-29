import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, HeartHandshake, MapPinned, Sparkles, Ticket, TrainFront } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrapbookImage } from "@/components/ui/scrapbook-image";
import { CITY_CARDS } from "@/lib/city-data";

const highlights = [
  {
    title: "Mood-first planning",
    text: "Start with the feeling you want from the day, not a list of random venues.",
    icon: Sparkles,
  },
  {
    title: "Routes with personality",
    text: "Every itinerary reads like a hand-picked city page, not a generated spreadsheet.",
    icon: Ticket,
  },
  {
    title: "Real-world pacing",
    text: "Distance, weather, and travel style all shape the final route so it stays believable.",
    icon: TrainFront,
  },
];

const heroStats = [
  { label: "Inputs", value: "Mood, budget, group, transport" },
  { label: "Pacing", value: "Distance-aware route order" },
  { label: "Output", value: "Map, weather, share link" },
];

export default function Home() {
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceIndex((prev) => (prev + 1) % CITY_CARDS.length);
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  const activePlace = CITY_CARDS[currentPlaceIndex];
  const previousPlace = CITY_CARDS[(currentPlaceIndex - 1 + CITY_CARDS.length) % CITY_CARDS.length];
  const nextPlace = CITY_CARDS[(currentPlaceIndex + 1) % CITY_CARDS.length];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[2%] top-36 h-48 w-48 rotate-[12deg] border border-[rgba(255,203,69,0.14)]" />
        <div className="absolute right-[7%] top-28 h-24 w-24 rounded-full bg-[rgba(255,56,92,0.09)] blur-2xl" />
        <div className="absolute bottom-24 right-[11%] h-36 w-36 rotate-[-8deg] border border-[rgba(86,207,184,0.16)]" />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-86px)] max-w-7xl items-center gap-12 px-4 py-10 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <div className="label-chip">
            <HeartHandshake className="mr-2 h-4 w-4" />
            itinerary planning with personality
          </div>

          <h1 className="mt-8 font-heading text-[3.2rem] font-extrabold leading-[0.98] text-[#111318] md:text-[5rem] xl:text-[6.1rem]">
            AI itineraries for your
            <br />
            next hangout, wrapped in
            <br />
            scrapbook energy.
          </h1>

          <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-600 md:text-2xl">
            HangoutHero turns your mood, city, budget, and travel style into a realistic day plan with weather, pacing, and shareable stops.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[rgba(244,208,63,0.38)] bg-white/82 px-4 py-3"
              >
                <p className="text-[0.65rem] font-bold uppercase text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#111318]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-16 rounded-full bg-primary px-10 text-lg font-bold text-white shadow-[0_18px_40px_rgba(255,56,92,0.24)] hover:bg-[#ff5977]"
            >
              <Link href="/questionnaire">
                Start Planning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <a href="#journey-styles">
              <Button
                variant="outline"
                className="h-16 rounded-full border-[1.5px] border-slate-300 bg-white/70 px-10 text-lg font-semibold text-slate-700 hover:border-primary hover:bg-white"
              >
                Browse Examples
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative mx-auto min-h-[560px] w-full max-w-[760px]"
        >
          <div className="absolute left-[5%] top-[22%] z-0">
            <ScrapbookImage
              polaroid
              rotation={-9}
              src={previousPlace.image}
              alt={`${previousPlace.name} destination`}
              caption={`${previousPlace.name}`}
            />
          </div>
          <div className="absolute left-[25%] top-[2%] z-10">
            <ScrapbookImage
              polaroid
              priority
              rotation={2}
              src={activePlace.image}
              alt={`${activePlace.name} destination`}
              caption={`${activePlace.name}`}
            />
          </div>
          <div className="absolute left-[49%] top-[24%] z-0">
            <ScrapbookImage
              polaroid
              rotation={9}
              src={nextPlace.image}
              alt={`${nextPlace.name} destination`}
              caption={`${nextPlace.name}`}
            />
          </div>

          <div className="scrapbook-card absolute bottom-6 left-0 max-w-sm p-6">
            <div className="label-chip inline-flex">
              <MapPinned className="mr-2 h-4 w-4" />
              Current postcard
            </div>
            <h2 className="mt-4 font-heading text-4xl font-extrabold leading-none text-[#111318]">
              {activePlace.name}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{activePlace.tagline}</p>
          </div>
        </motion.div>
      </section>

      <section id="how-it-works" className="page-shell">
        <div className="editorial-card p-6 md:p-10">
          <div className="max-w-3xl">
            <div className="label-chip">How it works</div>
            <h2 className="mt-6 font-heading text-4xl font-extrabold leading-none text-[#111318] md:text-6xl">
              One mood in.
              <br />
              One polished route out.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Pick the kind of day you want, lock your city and travel range, and let the app build a route that feels curated, not generic.
            </p>
          </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {highlights.map((item, index) => {
                const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="rounded-3xl border border-[rgba(244,208,63,0.4)] bg-[rgba(255,255,255,0.8)] p-6"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_10px_24px_rgba(255,56,92,0.18)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-2xl font-extrabold leading-none text-[#111318]">{item.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{item.text}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="journey-styles" className="page-shell pt-2">
        <div className="mb-6">
          <div className="label-chip">Mood boards</div>
          <h2 className="mt-6 font-heading text-4xl font-extrabold leading-none text-[#111318] md:text-6xl">
            Browse city examples
            <br />
            before you generate.
          </h2>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {CITY_CARDS.map((place) => (
              <CarouselItem key={place.name} className="pl-4 md:basis-1/2 xl:basis-1/3">
                <article className="overflow-hidden rounded-3xl border border-[rgba(244,208,63,0.4)] bg-white/82 shadow-[0_18px_40px_rgba(255,56,92,0.07)]">
                  <div className="relative h-80">
                    <ScrapbookImage src={place.image} alt={`${place.name} destination`} className="h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,22,29,0.8)] via-[rgba(18,22,29,0.15)] to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <p className="font-scrap text-3xl leading-none text-[#fff2a8]">destination edit</p>
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
        <div className="rounded-3xl bg-[#111318] px-8 py-10 text-white shadow-[0_28px_60px_rgba(17,19,24,0.22)] md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-scrap text-4xl leading-none text-[#fff09b]">why it works</p>
              <h2 className="mt-4 font-heading text-4xl font-extrabold leading-none md:text-6xl">
                Built for spontaneous,
                <br />
                bright city days.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/74">
                HangoutHero is meant to feel like a visual travel notebook with the logic of a real planner: mood-led, practical, and fun to use.
              </p>
            </div>
            <Button
              asChild
              className="h-16 rounded-full bg-primary px-10 text-lg font-bold text-white hover:bg-[#ff5977]"
            >
              <Link href="/questionnaire">Build My Route</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
