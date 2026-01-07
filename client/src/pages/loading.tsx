import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { generateItinerary, PreferenceFormData, LocationFormData, ItineraryResponse } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Loading() {
  const { toast } = useToast();

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        // Retrieve preference and location data from session storage
        const preferenceDataStr = sessionStorage.getItem('preferenceData');
        const locationDataStr = sessionStorage.getItem('locationData');

        if (!preferenceDataStr || !locationDataStr) {
          toast({
            title: "Missing information",
            description: "We couldn't find your preferences or location data. Please start over.",
            variant: "destructive"
          });
          window.location.href = "/";
          return;
        }

        const preferenceData: PreferenceFormData = JSON.parse(preferenceDataStr);
        const locationData: LocationFormData = JSON.parse(locationDataStr);

        // Generate itinerary
        const itinerary = await generateItinerary(preferenceData, locationData);
        
        // Save the generated itinerary to session storage
        sessionStorage.setItem('itineraryData', JSON.stringify(itinerary));
        
        // Allow loading animation to run for at least 2 seconds
        setTimeout(() => {
          window.location.href = "/results";
        }, 2000);
      } catch (error) {
        console.error("Error generating itinerary:", error);
        toast({
          title: "Error",
          description: "Failed to generate your itinerary. Please try again.",
          variant: "destructive"
        });
        window.location.href = "/questionnaire";
      }
    };

    fetchItinerary();
  }, [toast]);

  const [progress, setProgress] = useState(0);
  const funFacts = [
    "We consider over 200 factors when planning your perfect day, including weather, crowd levels, and transportation options.",
    "Our AI analyzes real-time data to suggest the best times to visit each location.",
    "Every itinerary is personalized based on your unique preferences and travel style.",
    "We use advanced algorithms to optimize your route and minimize travel time.",
  ];
  const [currentFact, setCurrentFact] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 100);

    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % funFacts.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(factInterval);
    };
  }, []);

  return (
    <section className="py-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-pink-50 to-rose-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 border-2 border-amber-300/30 rotate-12"
          animate={{ rotate: [12, 18, 12], y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-24 h-24 border-2 border-pink-300/30 -rotate-6"
          animate={{ rotate: [-6, -12, -6], y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/30 to-pink-500/30 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <motion.i
              className="fas fa-map-location-dot text-primary text-4xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent"
        >
          Creating your perfect itinerary
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-700 mb-10 max-w-md mx-auto text-lg"
        >
          Our AI is crafting a personalized day plan just for you. This usually takes about 15-20 seconds.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-md mx-auto h-4 bg-gray-200 rounded-full overflow-hidden mb-10 shadow-inner border-2 border-white"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-pink-500 to-rose-500 rounded-full relative overflow-hidden"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
          </motion.div>
        </motion.div>
        
        <motion.div
          key={currentFact}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto shadow-xl border-4 border-amber-200/50 relative overflow-hidden">
            {/* Scrapbook tape */}
            <div className="absolute top-3 left-3 w-12 h-6 bg-yellow-200/90 rotate-[-12deg] shadow-sm opacity-80"></div>
            
            <CardContent className="p-0 relative z-10">
              <div className="flex items-start space-x-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/30 to-yellow-500/30 flex items-center justify-center flex-shrink-0"
                >
                  <i className="fas fa-lightbulb text-accent text-xl"></i>
                </motion.div>
                <div className="text-left flex-1">
                  <h3 className="font-heading font-bold mb-2 text-gray-800">Did you know?</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{funFacts[currentFact]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
