import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(244,208,63,0.4)] bg-[rgba(255,250,242,0.76)] px-4 pb-8 pt-10 md:px-8 md:pb-10 md:pt-14">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="font-heading text-3xl font-extrabold text-[#111318] md:text-4xl">HangoutHero</p>
          <p className="font-scrap mt-1 text-2xl leading-none text-primary md:text-3xl">city plans that feel collected</p>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
            A brighter way to plan spontaneous outings: mood-led itineraries, practical pacing, and scrapbook energy from start to finish.
          </p>
          
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-semibold uppercase text-slate-500 sm:flex sm:flex-wrap sm:gap-6 sm:text-sm">
            <span>AI itineraries</span>
            <span>Indian cities</span>
            <span>Live weather</span>
            <span>Shareable routes</span>
          </div>

          <div className="mt-8">
            <a
              href="https://www.instagram.com/hangoutheroplanner/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 font-scrap text-3xl text-[#4a3728]/85 hover:text-primary transition-all duration-300"
            >
              <svg 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 shrink-0 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110"
              >
                <defs>
                  <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fdf497" />
                    <stop offset="5%" stopColor="#fdf497" />
                    <stop offset="45%" stopColor="#fd5949" />
                    <stop offset="60%" stopColor="#d6249f" />
                    <stop offset="90%" stopColor="#285AEB" />
                  </linearGradient>
                </defs>
                <path 
                  d="M12 0C8.74 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.26-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 3.518.16 5.054 1.704 5.215 5.214.055 1.265.069 1.648.069 4.849 0 3.202-.014 3.584-.069 4.849-.16 3.51-1.704 5.054-5.215 5.214-1.265.055-1.648.069-4.85.069-3.202 0-3.585-.014-4.849-.069-3.508-.16-5.055-1.704-5.214-5.214-.055-1.265-.069-1.648-.069-4.849 0-3.202.014-3.584.069-4.849.159-3.508 1.704-5.055 5.214-5.214 1.265-.055 1.648-.069 4.849-.069zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" 
                  fill="url(#instagram-gradient)"
                />
              </svg>
              <span>
                PS: follow our journey on instagram for weekly city guides!{" "}
                <span className="underline decoration-dashed decoration-primary/40 group-hover:decoration-primary font-bold">
                  @hangoutheroplanner
                </span>
              </span>
            </a>
          </div>
        </div>

        <div className="rounded-[20px] border border-[rgba(244,208,63,0.4)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(255,56,92,0.06)] md:rounded-3xl md:p-6 flex flex-col justify-between">
          <div>
            <p className="label-chip">Postcard list</p>
            <h3 className="mt-5 font-heading text-2xl font-extrabold leading-none text-[#111318] md:text-3xl">
              Get new itinerary ideas first.
            </h3>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Fresh destination edits, visual route ideas, and product updates without the noise.
            </p>
          </div>
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

      <div className="mx-auto mt-10 max-w-7xl border-t border-dashed border-[rgba(244,208,63,0.3)] pt-6 text-sm text-slate-500">
        {new Date().getFullYear()} HangoutHero. All rights reserved.
      </div>
    </footer>
  );
}
