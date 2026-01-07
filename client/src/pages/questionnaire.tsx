import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { PreferenceCard } from "@/components/ui/preference-card";
import { PreferenceFormData } from "@/lib/openai";
import { motion } from "framer-motion";

export default function Questionnaire() {
  const [formData, setFormData] = useState<PreferenceFormData>({
    hangoutTypes: [],
    duration: "Full day",
    budget: "Mid-range"
  });

  const handleNext = () => {
    // Save form data to session storage
    sessionStorage.setItem('preferenceData', JSON.stringify(formData));
    window.location.href = "/location";
  };

  const toggleHangoutType = (type: string) => {
    setFormData(prev => {
      const types = [...prev.hangoutTypes];
      const index = types.indexOf(type);
      
      if (index >= 0) {
        types.splice(index, 1);
      } else {
        types.push(type);
      }
      
      return { ...prev, hangoutTypes: types };
    });
  };

  const setDuration = (duration: string) => {
    setFormData(prev => ({ ...prev, duration }));
  };

  const setBudget = (budget: string) => {
    setFormData(prev => ({ ...prev, budget }));
  };

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-pink-50 to-rose-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <ProgressSteps currentStep={1} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-amber-200/50 mt-8 relative overflow-hidden">
            {/* Scrapbook decorations */}
            <div className="absolute top-4 right-4 w-16 h-8 bg-yellow-200/80 rotate-12 shadow-md opacity-70"></div>
            <div className="absolute bottom-4 left-4 w-12 h-6 bg-pink-200/80 rotate-[-15deg] shadow-md opacity-70"></div>
            
            <CardContent className="p-8 md:p-10 relative z-10">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-heading font-bold mb-3 text-gray-800"
              >
                What kind of hangout are you looking for?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mb-8 text-lg"
              >
                Select all options that interest you. We'll create the perfect blend.
              </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <PreferenceCard
                title="Exploring"
                description="Discover hidden gems, viewpoints, and local spots off the beaten path"
                icon="compass"
                color="primary-light"
                selected={formData.hangoutTypes.includes("Exploring")}
                onClick={() => toggleHangoutType("Exploring")}
              />
              
              <PreferenceCard
                title="Eating"
                description="Sample delicious local cuisine from trendy restaurants to authentic street food"
                icon="utensils"
                color="accent"
                selected={formData.hangoutTypes.includes("Eating")}
                onClick={() => toggleHangoutType("Eating")}
              />
              
              <PreferenceCard
                title="Historical"
                description="Visit museums, landmarks, and significant cultural and historical sites"
                icon="landmark"
                color="decorative"
                selected={formData.hangoutTypes.includes("Historical")}
                onClick={() => toggleHangoutType("Historical")}
              />
              
              <PreferenceCard
                title="Cafe Hopping"
                description="Relax in cozy cafes with great ambiance, coffee, and sweet treats"
                icon="coffee"
                color="secondary"
                selected={formData.hangoutTypes.includes("Cafe Hopping")}
                onClick={() => toggleHangoutType("Cafe Hopping")}
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <h3 className="font-heading font-medium text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-clock text-primary"></i>
                How much time do you have?
              </h3>
              <div className="flex flex-wrap gap-3">
                {["2-3 hours", "Half day", "Full day", "Evening"].map((duration) => (
                  <motion.div
                    key={duration}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={formData.duration === duration ? "default" : "outline"}
                      className={`rounded-xl font-medium transition-all duration-200 ${
                        formData.duration === duration
                          ? "bg-primary text-white shadow-lg"
                          : "border-2 border-gray-300 hover:border-primary bg-white"
                      }`}
                      onClick={() => setDuration(duration)}
                    >
                      {duration}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h3 className="font-heading font-medium text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-wallet text-primary"></i>
                What's your budget level?
              </h3>
              <div className="flex flex-wrap gap-3">
                {["Budget-friendly", "Mid-range", "Luxury"].map((budget) => (
                  <motion.div
                    key={budget}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={formData.budget === budget ? "default" : "outline"}
                      className={`rounded-xl font-medium transition-all duration-200 ${
                        formData.budget === budget
                          ? "bg-primary text-white shadow-lg"
                          : "border-2 border-gray-300 hover:border-primary bg-white"
                      }`}
                      onClick={() => setBudget(budget)}
                    >
                      {budget}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-end"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleNext}
                  className="bg-primary hover:bg-[#FF6B85] text-white font-medium py-4 px-10 rounded-xl shadow-lg text-lg relative overflow-hidden group"
                  disabled={formData.hangoutTypes.length === 0}
                >
                  <span className="relative z-10">
                    Next <i className="fas fa-arrow-right ml-2"></i>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </Button>
              </motion.div>
            </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
