import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(244,208,63,0.4)] bg-[rgba(255,250,242,0.76)] px-4 pb-10 pt-14 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <p className="font-heading text-4xl font-extrabold text-[#111318]">HangoutHero</p>
          <p className="font-scrap mt-1 text-3xl leading-none text-primary">city plans that feel collected</p>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            A brighter way to plan spontaneous outings: mood-led itineraries, practical pacing, and scrapbook energy from start to finish.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm font-semibold uppercase text-slate-500">
            <span>AI itineraries</span>
            <span>Indian cities</span>
            <span>Live weather</span>
            <span>Shareable routes</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[rgba(244,208,63,0.4)] bg-white/82 p-6 shadow-[0_18px_44px_rgba(255,56,92,0.06)]">
          <p className="label-chip">Postcard list</p>
          <h3 className="mt-5 font-heading text-3xl font-extrabold leading-none text-[#111318]">
            Get new itinerary ideas first.
          </h3>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Fresh destination edits, visual route ideas, and product updates without the noise.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="Your email"
              className="h-12 rounded-full border-slate-300 bg-white"
            />
            <Button className="h-12 rounded-full bg-primary px-6 text-base font-bold text-white hover:bg-[#ff5977]">
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl text-sm text-slate-500">
        {new Date().getFullYear()} HangoutHero. All rights reserved.
      </div>
    </footer>
  );
}
