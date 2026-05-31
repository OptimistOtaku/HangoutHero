import { useToast } from "@/hooks/use-toast";
import { ItineraryActivity } from "@/lib/openai";
import { ScrapbookImage } from "./scrapbook-image";
import { motion } from "framer-motion";
import { buildMapsSearchUrl, buildWebSearchUrl } from "@/lib/location-links";
import { Bookmark, ExternalLink, MapPin, Navigation, Star } from "lucide-react";

interface ActivityCardProps {
  activity: ItineraryActivity;
  timeOfDay: "morning" | "afternoon" | "evening";
  isLast: boolean;
}

export function ActivityCard({ activity, timeOfDay, isLast }: ActivityCardProps) {
  const { toast } = useToast();

  const handleDirection = () => {
    window.open(buildMapsSearchUrl(`${activity.title} ${activity.location}`), "_blank", "noopener,noreferrer");
    toast({
      title: "Directions",
      description: `Opened directions for ${activity.title}.`,
    });
  };

  const handleLink = () => {
    window.open(buildWebSearchUrl(`${activity.title} ${activity.location}`), "_blank", "noopener,noreferrer");
    toast({
      title: "Search opened",
      description: `Opened web results for ${activity.title}.`,
    });
  };

  const handleBookmark = () => {
    const savedBookmarks = JSON.parse(localStorage.getItem("hangoutHeroBookmarks") || "[]");
    const alreadySaved = savedBookmarks.some((item: ItineraryActivity) => item.id === activity.id);

    if (!alreadySaved) {
      localStorage.setItem(
        "hangoutHeroBookmarks",
        JSON.stringify([...savedBookmarks, activity])
      );
    }

    toast({
      title: "Bookmarked!",
      description: alreadySaved
        ? `${activity.title} is already in your bookmarks.`
        : `${activity.title} has been added to your bookmarks.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -4 }}
      className={`border bg-white/90 backdrop-blur-sm ${
        timeOfDay === "morning" ? "border-accent/30" :
        timeOfDay === "afternoon" ? "border-primary/30" :
        "border-stone-900/15"
      } rounded-[20px] p-3 md:rounded-3xl md:p-6 ${isLast ? '' : 'mb-5 md:mb-6'} transition-all duration-300 shadow-[0_14px_34px_rgba(16,24,40,0.06)] hover:shadow-[0_20px_44px_rgba(255,56,92,0.1)] relative overflow-hidden group`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:gap-5">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative h-44 w-full overflow-hidden rounded-2xl border border-white shadow-lg md:h-48 md:w-1/3"
        >
          <ScrapbookImage
            src={activity.image}
            alt={activity.title}
            className="w-full h-full"
            fallback={activity.image}
          />
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
            timeOfDay === "morning" ? "bg-accent" :
            timeOfDay === "afternoon" ? "bg-primary" :
            "bg-stone-900"
          }`}>
            {activity.time}
          </div>
        </motion.div>
        <div className="w-full min-w-0 md:w-2/3">
          <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="mb-2 font-heading text-xl font-bold leading-tight text-gray-800 md:text-2xl">{activity.title}</h4>
              <p className="mb-3 text-sm leading-6 text-gray-600 md:mb-4 md:text-base md:leading-relaxed">{activity.description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary"
              >
                {activity.price}
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="inline-flex items-center gap-1 rounded-full border border-stone-900/15 bg-stone-900/5 px-3 py-1 text-xs font-semibold text-stone-700"
              >
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                {activity.rating}
              </motion.span>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex min-w-0 items-start gap-2 text-sm text-gray-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium leading-5">{activity.location}</span>
            </span>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-11 w-full items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white sm:h-10 sm:w-10"
                onClick={handleDirection}
                title="Get directions"
                aria-label="Get directions"
              >
                <Navigation className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-11 w-full items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white sm:h-10 sm:w-10"
                onClick={handleLink}
                title="Search activity"
                aria-label="Search activity"
              >
                <ExternalLink className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-11 w-full items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white sm:h-10 sm:w-10"
                onClick={handleBookmark}
                title="Bookmark"
                aria-label="Bookmark"
              >
                <Bookmark className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
