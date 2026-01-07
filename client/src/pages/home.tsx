import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ScrapbookImage } from "@/components/ui/scrapbook-image";
import { InteractiveCalendar } from "@/components/ui/interactive-calendar";

// Places data for carousel
const places = [
  { name: "Delhi", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", tagline: "Historic Capital" },
  { name: "Noida", image: "https://images.unsplash.com/photo-1601961405399-801fb1936fc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", tagline: "Modern Hub" },
  { name: "Jaipur", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", tagline: "Pink City" },
  { name: "Mussoorie", image: "https://images.unsplash.com/photo-1591017683656-4322564dde48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", tagline: "Queen of Hills" },
  { name: "Mumbai", image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", tagline: "City of Dreams" },
  { name: "Goa", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", tagline: "Beach Paradise" },
];

// Bento box items
const bentoItems = [
  {
    id: 1,
    title: "City Adventures",
    description: "Explore hidden gems",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    size: "large",
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: 2,
    title: "Cafe Hopping",
    description: "Perfect spots to relax",
    image: "https://images.unsplash.com/photo-1517231925375-bf2cb42917a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
    size: "tall",
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: 3,
    title: "Cultural Experiences",
    description: "Immerse in history",
    image: "https://images.unsplash.com/photo-1547710272-f0cd2545f838?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    size: "medium",
    color: "from-purple-500/20 to-indigo-500/20",
  },
  {
    id: 4,
    title: "Food Adventures",
    description: "Taste local flavors",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    size: "medium",
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: 5,
    title: "Nightlife",
    description: "Evening vibes",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    size: "wide",
    color: "from-blue-500/20 to-cyan-500/20",
  },
];

export default function Home() {
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceIndex((prev) => (prev + 1) % places.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartPlanning = () => {
    window.location.href = "/questionnaire";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-rose-50 relative overflow-hidden">
      {/* Scrapbook decorative elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-amber-300 rotate-12"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border-2 border-pink-300 -rotate-6"></div>
        <div className="absolute bottom-32 left-1/4 w-28 h-28 border-2 border-rose-300 rotate-45"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 border-2 border-yellow-300 -rotate-12"></div>
      </div>

      <section className="relative z-10 py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 grid md:grid-cols-2 items-center gap-8"
        >
          <div className="text-center md:text-left">
            <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl md:text-7xl font-heading font-bold mb-6 relative inline-block"
          >
            <span className="relative z-10">Discover your perfect</span>
            <br />
            <span className="text-primary relative z-10 inline-block mt-2">
              hangout itinerary
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-3 bg-yellow-200/60 -z-0"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                style={{ transformOrigin: "left" }}
              />
            </span>
            </motion.h1>
            
            <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl leading-relaxed"
          >
            Let our AI create a personalized day plan based on your preferences and location. 
            <span className="block mt-2 text-lg text-gray-600">No more endless searching or decision fatigue.</span>
          </motion.p>
          
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row justify-start items-center gap-4 mb-12"
          >
            <Button
              onClick={handleStartPlanning}
              className="bg-primary hover:bg-[#FF6B85] text-white text-lg font-medium py-6 px-10 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10">Start Planning</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-gray-300 hover:border-primary text-text text-lg font-medium py-6 px-10 rounded-full bg-white/80 backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
            >
              Browse Examples
            </Button>
            </motion.div>
          </div>

          {/* Polaroid image stack */}
          <div className="hidden md:flex justify-center items-center">
            <div className="relative w-80 h-56">
              {(() => {
                const prev = (currentPlaceIndex - 1 + places.length) % places.length;
                const next = (currentPlaceIndex + 1) % places.length;
                return (
                  <div className="relative w-full h-full">
                    <div className="absolute -left-6 top-2 transform">
                      <ScrapbookImage
                        polaroid
                        rotation={-8}
                        caption={`${places[prev].name} · ${places[prev].tagline}`}
                        src={places[prev].image}
                        alt={places[prev].name}
                      />
                    </div>
                    <div className="absolute left-6 top-0 transform">
                      <button
                        aria-label="Shuffle images"
                        onClick={() => setCurrentPlaceIndex((Math.random() * places.length) | 0)}
                        className="focus:outline-none"
                      >
                        <ScrapbookImage
                          polaroid
                          rotation={2}
                          caption={`${places[currentPlaceIndex].name} · ${places[currentPlaceIndex].tagline}`}
                          src={places[currentPlaceIndex].image}
                          alt={places[currentPlaceIndex].name}
                        />
                      </button>
                    </div>
                    <div className="absolute right-0 top-6 transform">
                      <ScrapbookImage
                        polaroid
                        rotation={8}
                        caption={`${places[next].name} · ${places[next].tagline}`}
                        src={places[next].image}
                        alt={places[next].name}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>

        {/* Interactive Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-16 max-w-4xl mx-auto"
        >
          <InteractiveCalendar />
        </motion.div>

        {/* Moving Places Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-8">
            Popular <span className="text-primary">Destinations</span>
          </h2>
          <div className="max-w-6xl mx-auto">
            <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {places.map((place, index) => (
                  <CarouselItem key={place.name} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, rotate: 1 }}
                      className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg group cursor-pointer border-4 border-white"
                      style={{
                        boxShadow: "0 8px 32px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.2)",
                      }}
                    >
                      <ScrapbookImage
                        src={place.image}
                        alt={place.name}
                        className="w-full h-full"
                        fallback={`https://via.placeholder.com/800x600/f0f0f0/666666?text=${encodeURIComponent(place.name)}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl md:text-3xl font-heading font-bold mb-1">{place.name}</h3>
                        <p className="text-sm md:text-base text-white/90">{place.tagline}</p>
                      </div>
                      {/* Scrapbook corner decoration */}
                      <div className="absolute top-2 right-2 w-8 h-8 bg-yellow-200/80 rotate-45 transform origin-center"></div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 md:left-4" />
              <CarouselNext className="right-2 md:right-4" />
            </Carousel>
          </div>
        </motion.div>

        {/* Bento Box Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            Explore <span className="text-primary">Experiences</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {bentoItems.map((item, index) => {
              const colSpan = item.size === "large" ? "md:col-span-2" : item.size === "wide" ? "md:col-span-2" : "";
              const rowSpan = item.size === "tall" ? "md:row-span-2" : "";
              
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, rotate: item.size === "tall" ? -1 : 1 }}
                  className={`${colSpan} ${rowSpan} relative group cursor-pointer`}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div
                    className="relative h-64 md:h-full rounded-2xl overflow-hidden shadow-xl border-4 border-white"
                    style={{
                      boxShadow: "0 12px 40px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.3)",
                      transform: "perspective(1000px)",
                    }}
                  >
                    <ScrapbookImage
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full"
                      fallback={`https://via.placeholder.com/800x600/f0f0f0/666666?text=${encodeURIComponent(item.title)}`}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl md:text-2xl font-heading font-bold mb-2">{item.title}</h3>
                      <p className="text-sm md:text-base text-white/90">{item.description}</p>
                    </div>
                    {/* Scrapbook tape decoration */}
                    <div className="absolute top-4 left-4 w-12 h-6 bg-yellow-200/90 rotate-[-15deg] shadow-md opacity-80"></div>
                    <div className="absolute top-6 right-6 w-10 h-5 bg-pink-200/90 rotate-12 shadow-md opacity-80"></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center bg-white/60 backdrop-blur-md rounded-3xl p-8 md:p-12 border-4 border-amber-200/50 shadow-2xl"
          style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Ready to plan your perfect day?
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have discovered amazing hangout spots with HangoutHero
          </p>
          <Button
            onClick={handleStartPlanning}
            className="bg-primary hover:bg-[#FF6B85] text-white text-lg font-medium py-6 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Get Started Now
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
