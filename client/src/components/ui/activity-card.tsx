import { useToast } from "@/hooks/use-toast";
import { ItineraryActivity } from "@/lib/openai";
import { ScrapbookImage } from "./scrapbook-image";
import { motion } from "framer-motion";

interface ActivityCardProps {
  activity: ItineraryActivity;
  timeOfDay: "morning" | "afternoon" | "evening";
  isLast: boolean;
}

export function ActivityCard({ activity, timeOfDay, isLast }: ActivityCardProps) {
  const { toast } = useToast();
  
  const colorMap = {
    "morning": "accent",
    "afternoon": "primary",
    "evening": "decorative"
  };
  
  const timeColor = colorMap[timeOfDay];
  
  const handleDirection = () => {
    toast({
      title: "Directions",
      description: `Directions to ${activity.title} will be available soon!`,
    });
  };
  
  const handleLink = () => {
    toast({
      title: "External link",
      description: `Link to ${activity.title}'s website will be available soon!`,
    });
  };
  
  const handleBookmark = () => {
    toast({
      title: "Bookmarked!",
      description: `${activity.title} has been added to your bookmarks.`,
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -4 }}
      className={`bg-white/90 backdrop-blur-sm border-4 ${
        timeOfDay === "morning" ? "border-accent/30" :
        timeOfDay === "afternoon" ? "border-primary/30" :
        "border-[#A78BFA]/30"
      } rounded-2xl p-6 ${isLast ? '' : 'mb-6'} transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group`}
      style={{
        boxShadow: "0 8px 24px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)",
      }}
    >
      {/* Scrapbook tape decoration */}
      <div className="absolute top-3 left-3 w-10 h-5 bg-yellow-200/80 rotate-[-12deg] shadow-sm opacity-70"></div>
      
      <div className="flex flex-col md:flex-row">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-full md:w-1/3 h-48 rounded-xl overflow-hidden mb-4 md:mb-0 md:mr-6 shadow-lg border-4 border-white relative"
        >
          <ScrapbookImage
            src={activity.image}
            alt={activity.title}
            className="w-full h-full"
            fallback={activity.image}
          />
          {/* Time badge overlay */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
            timeOfDay === "morning" ? "bg-accent" :
            timeOfDay === "afternoon" ? "bg-primary" :
            "bg-[#A78BFA]"
          }`}>
            {activity.time}
          </div>
        </motion.div>
        <div className="w-full md:w-2/3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-xl md:text-2xl font-heading font-bold mb-2 text-gray-800">{activity.title}</h4>
              <p className="text-gray-600 mb-4 leading-relaxed">{activity.description}</p>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="bg-secondary/20 text-secondary px-3 py-1 rounded-lg text-xs font-medium border-2 border-secondary/30"
              >
                {activity.price}
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="bg-decorative/20 text-decorative px-3 py-1 rounded-lg text-xs font-medium border-2 border-decorative/30"
              >
                {activity.rating} ★
              </motion.span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-700 flex items-center gap-2">
              <i className="fas fa-location-dot text-primary"></i>
              <span className="font-medium">{activity.location}</span>
            </span>
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
                onClick={handleDirection}
                title="Get directions"
              >
                <i className="fas fa-directions"></i>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
                onClick={handleLink}
                title="Visit website"
              >
                <i className="fas fa-link"></i>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
                onClick={handleBookmark}
                title="Bookmark"
              >
                <i className="fas fa-bookmark"></i>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
