import { useToast } from "@/hooks/use-toast";
import { Recommendation } from "@/lib/openai";
import { ScrapbookImage } from "./scrapbook-image";
import { motion } from "framer-motion";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { toast } = useToast();
  
  const handleViewPlan = () => {
    toast({
      title: "Coming soon!",
      description: "This feature will be available in a future update.",
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -8 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-4 border-white relative group"
      style={{
        boxShadow: "0 8px 24px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.5)",
      }}
    >
      {/* Scrapbook tape */}
      <div className="absolute top-3 right-3 w-10 h-5 bg-yellow-200/80 rotate-12 shadow-sm opacity-80 z-10"></div>
      
      <div className="relative overflow-hidden">
        <ScrapbookImage
          src={recommendation.image}
          alt={recommendation.title}
          className="w-full h-48"
          fallback={recommendation.image}
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
          <span className="bg-secondary/20 text-secondary px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            <i className="fas fa-star text-yellow-500"></i> {recommendation.rating}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h4 className="font-heading font-bold text-xl mb-2 text-gray-800">{recommendation.title}</h4>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{recommendation.description}</p>
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <i className="fas fa-clock text-primary"></i>
            <span className="font-medium">{recommendation.duration}</span>
          </span>
          <motion.button
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary hover:text-[#FF6B85] transition-colors text-sm font-medium flex items-center gap-2 group"
            onClick={handleViewPlan}
          >
            View Plan
            <motion.i
              className="fas fa-arrow-right"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
