import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { ItineraryTimeline } from "@/components/ui/itinerary-timeline";
import { RecommendationCard } from "@/components/ui/recommendation-card";
import { useToast } from "@/hooks/use-toast";
import { ItineraryResponse, saveItinerary } from "@/lib/openai";
import { ScrapbookImage } from "@/components/ui/scrapbook-image";
import { motion } from "framer-motion";

export default function Results() {
  const { toast } = useToast();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Retrieve itinerary data from session storage
    const itineraryData = sessionStorage.getItem('itineraryData');
    
    if (itineraryData) {
      const parsed = JSON.parse(itineraryData);
      setItinerary(parsed);
      // Check if itinerary already has an ID (was saved)
      if (parsed.id) {
        setIsSaved(true);
      }
    } else {
      toast({
        title: "Missing itinerary data",
        description: "We couldn't find your itinerary. Please start over.",
        variant: "destructive"
      });
      window.location.href = "/";
    }
  }, [toast]);

  const handlePlanAnother = () => {
    // Clear session storage and start over
    sessionStorage.clear();
    window.location.href = "/";
  };

  const handleShare = () => {
    toast({
      title: "Share feature",
      description: "This feature is coming soon!",
    });
  };

  const handleSave = async () => {
    if (!itinerary || isSaved) {
      return;
    }

    setIsSaving(true);
    try {
      console.log("Attempting to save itinerary:", itinerary);
      const result = await saveItinerary(itinerary);
      console.log("Save result:", result);
      
      // Update itinerary with the saved ID
      const updatedItinerary = { ...itinerary, id: result.id };
      setItinerary(updatedItinerary);
      setIsSaved(true);
      
      // Update session storage
      sessionStorage.setItem('itineraryData', JSON.stringify(updatedItinerary));
      
      toast({
        title: "Itinerary saved!",
        description: "Your itinerary has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving itinerary:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Failed to save",
        description: errorMessage.includes("400") 
          ? "Invalid itinerary data. Please try generating a new itinerary."
          : errorMessage.includes("500")
          ? "Server error. Please try again later."
          : `Could not save your itinerary: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomize = () => {
    toast({
      title: "Customize feature",
      description: "This feature is coming soon!",
    });
  };

  if (!itinerary) {
    return (
      <div className="py-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-pink-50 to-rose-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <ProgressSteps currentStep={3} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 mt-8"
        >
          <Card className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-amber-200/50 relative overflow-hidden">
            {/* Scrapbook decorations */}
            <div className="absolute top-4 right-4 w-16 h-8 bg-yellow-200/80 rotate-12 shadow-md opacity-70 z-10"></div>
            <div className="absolute bottom-4 left-4 w-12 h-6 bg-pink-200/80 rotate-[-15deg] shadow-md opacity-70 z-10"></div>
            
            <div className="p-6 md:p-8 relative z-0">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6"
              >
                <div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2 bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                    {itinerary.title}
                  </h2>
                  <p className="text-gray-700 text-lg">{itinerary.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      className="border-2 border-gray-300 hover:border-primary text-text bg-white/80 backdrop-blur-sm"
                      onClick={handleShare}
                    >
                      <i className="fas fa-share-nodes mr-2"></i> Share
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      className={`border-2 ${
                        isSaved 
                          ? "border-green-500 bg-green-50 text-green-700 hover:border-green-600" 
                          : "border-gray-300 hover:border-primary"
                      } text-text bg-white/80 backdrop-blur-sm`}
                      onClick={handleSave}
                      disabled={isSaving || isSaved}
                    >
                      {isSaving ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i> Saving...
                        </>
                      ) : isSaved ? (
                        <>
                          <i className="fas fa-check mr-2"></i> Saved
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download mr-2"></i> Save
                        </>
                      )}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      className="bg-primary hover:bg-[#FF6B85] text-white shadow-lg"
                      onClick={handleCustomize}
                    >
                      <i className="fas fa-pen-to-square mr-2"></i> Customize
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Map preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="h-72 md:h-96 w-full rounded-xl overflow-hidden mb-8 bg-gray-100 relative border-4 border-white shadow-xl"
                style={{
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                <ScrapbookImage
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+FF385C(${itinerary.location})/${itinerary.location},13,0,0/800x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                  alt={`Map of ${itinerary.location} with itinerary points`}
                  className="w-full h-full"
                  fallback="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm py-3 px-5 rounded-xl shadow-lg border-2 border-amber-200/50"
                >
                  <div className="flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-primary text-xl"></i>
                    <p className="font-heading font-bold text-lg">{itinerary.location}</p>
                  </div>
                </motion.div>
                {/* Scrapbook decoration */}
                <div className="absolute top-4 right-4 w-10 h-6 bg-yellow-200/90 rotate-12 shadow-md opacity-80"></div>
              </motion.div>
              
              {/* Timeline view */}
              <ItineraryTimeline activities={itinerary.activities} />
            </div>
          </Card>
        </motion.div>
        
        {/* Recommendations section */}
        {itinerary.recommendations && itinerary.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h3 className="text-2xl md:text-3xl font-heading font-bold mb-6 text-center">
              Similar <span className="text-primary">Adventures</span> You Might Like
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {itinerary.recommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <RecommendationCard recommendation={recommendation} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="bg-primary hover:bg-[#FF6B85] text-white font-medium py-4 px-10 rounded-xl shadow-lg text-lg relative overflow-hidden group"
              onClick={handlePlanAnother}
            >
              <span className="relative z-10">
                Plan Another Adventure <i className="fas fa-arrow-right ml-2"></i>
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
      </div>
    </section>
  );
}
