import { ActivityCard } from "./activity-card";
import { ItineraryActivity } from "@/lib/openai";
import { CloudSun, Moon, Sun } from "lucide-react";

interface ItineraryTimelineProps {
  activities: ItineraryActivity[];
}

export function ItineraryTimeline({ activities }: ItineraryTimelineProps) {
  // Group activities by time of day
  const morningActivities = activities.filter(activity => activity.timeOfDay === "morning");
  const afternoonActivities = activities.filter(activity => activity.timeOfDay === "afternoon");
  const eveningActivities = activities.filter(activity => activity.timeOfDay === "evening");

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-5 top-0 w-px bg-gray-200 md:left-8"></div>
      
      {/* Morning activities */}
      {morningActivities.length > 0 && (
        <div className="mb-8 relative">
          <div className="flex">
            <div className="timeline-dot z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent shadow-md md:h-16 md:w-16">
              <Sun className="h-5 w-5 text-white md:h-6 md:w-6" />
            </div>
            <div className="ml-3 min-w-0 flex-1 pt-1 md:ml-6 md:pt-2">
              <h3 className="mb-4 font-heading text-2xl font-bold md:mb-6">Morning</h3>
              
              {morningActivities.map((activity, index) => (
                <ActivityCard 
                  key={activity.id}
                  activity={activity}
                  timeOfDay="morning"
                  isLast={index === morningActivities.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Afternoon activities */}
      {afternoonActivities.length > 0 && (
        <div className="mb-8 relative">
          <div className="flex">
            <div className="timeline-dot z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-md md:h-16 md:w-16">
              <CloudSun className="h-5 w-5 text-white md:h-6 md:w-6" />
            </div>
            <div className="ml-3 min-w-0 flex-1 pt-1 md:ml-6 md:pt-2">
              <h3 className="mb-4 font-heading text-2xl font-bold md:mb-6">Afternoon</h3>
              
              {afternoonActivities.map((activity, index) => (
                <ActivityCard 
                  key={activity.id}
                  activity={activity}
                  timeOfDay="afternoon"
                  isLast={index === afternoonActivities.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Evening activities */}
      {eveningActivities.length > 0 && (
        <div className="relative">
          <div className="flex">
            <div className="timeline-dot z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#111318] shadow-md md:h-16 md:w-16">
              <Moon className="h-5 w-5 text-white md:h-6 md:w-6" />
            </div>
            <div className="ml-3 min-w-0 flex-1 pt-1 md:ml-6 md:pt-2">
              <h3 className="mb-4 font-heading text-2xl font-bold md:mb-6">Evening</h3>
              
              {eveningActivities.map((activity, index) => (
                <ActivityCard 
                  key={activity.id}
                  activity={activity}
                  timeOfDay="evening"
                  isLast={index === eveningActivities.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
