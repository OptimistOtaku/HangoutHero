import { useToast } from "@/hooks/use-toast";
import { Recommendation } from "@/lib/openai";
import { trackRecommendationEvent } from "@/lib/recommendation-events";
import { ScrapbookImage } from "./scrapbook-image";
import { motion } from "framer-motion";
import { buildWebSearchUrl } from "@/lib/location-links";
import { ArrowRight, Clock, ExternalLink, Route, Sparkles, Star } from "lucide-react";
import { useLocation } from "wouter";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const badges = [
    recommendation.noveltyLevel?.replace("-", " "),
    recommendation.trendScore && recommendation.trendScore >= 80 ? "Trending" : undefined,
    ...(recommendation.matchReasons || []),
  ].filter(Boolean).slice(0, 3);
  
  const handleViewPlan = () => {
    trackRecommendationEvent({
      eventType: "opened_recommendation",
      entityType: "recommendation",
      entityId: recommendation.id,
      recommendationId: recommendation.id,
      metadata: { title: recommendation.title, tags: recommendation.tags },
    });
    window.open(buildWebSearchUrl(recommendation.title), "_blank", "noopener,noreferrer");
    toast({
      title: "Opened inspiration",
      description: `Showing more details for ${recommendation.title}.`,
    });
  };

  const handleBuildRoute = () => {
    const seedRecommendation = recommendation.seedRecommendation || {
      title: recommendation.title,
      tags: recommendation.tags || [],
      duration: recommendation.duration,
      seedPlaces: [recommendation.title],
    };

    sessionStorage.setItem("seedRecommendation", JSON.stringify(seedRecommendation));
    trackRecommendationEvent({
      eventType: "build_from_recommendation",
      entityType: "recommendation",
      entityId: recommendation.id,
      recommendationId: recommendation.id,
      metadata: { title: recommendation.title, seedRecommendation },
    });
    setLocation("/loading");
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -6 }}
      className="group relative overflow-hidden rounded-3xl border border-[rgba(244,208,63,0.42)] bg-white/90 shadow-[0_14px_34px_rgba(16,24,40,0.06)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_20px_44px_rgba(255,56,92,0.1)]"
    >
      <div className="relative overflow-hidden">
        <ScrapbookImage
          src={recommendation.image}
          alt={recommendation.title}
          className="w-full h-48"
          fallback={recommendation.image}
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 shadow-lg backdrop-blur-sm">
          <span className="flex items-center gap-1 text-xs font-bold text-secondary">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {recommendation.rating}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h4 className="mb-2 font-heading text-xl font-bold text-gray-800">{recommendation.title}</h4>
        {badges.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-bold capitalize text-primary"
              >
                <Sparkles className="h-3 w-3" />
                {badge}
              </span>
            ))}
          </div>
        )}
        <p className="mb-4 text-sm leading-relaxed text-gray-600">{recommendation.description}</p>
        <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{recommendation.duration}</span>
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#ff5977]"
              onClick={handleBuildRoute}
            >
              <Route className="h-4 w-4" />
              Build Route
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-[#c94b66]"
              onClick={handleViewPlan}
            >
              <ExternalLink className="h-4 w-4" />
              Details
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
