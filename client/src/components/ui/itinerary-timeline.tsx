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
      <div className="absolute bottom-0 left-8 top-0 w-px bg-gray-200"></div>
      
      {/* Morning activities */}
      {morningActivities.length > 0 && (
        <div className="mb-8 relative">
          <div className="flex">
            <div className="timeline-dot z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-accent shadow-md">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <div className="ml-6 pt-2">
              <h3 className="text-2xl font-heading font-bold mb-6">Morning</h3>
              
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
            <div className="timeline-dot z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-md">
              <CloudSun className="h-6 w-6 text-white" />
            </div>
            <div className="ml-6 pt-2">
              <h3 className="text-2xl font-heading font-bold mb-6">Afternoon</h3>
              
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
            <div className="timeline-dot z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#111318] shadow-md">
              <Moon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-6 pt-2">
              <h3 className="text-2xl font-heading font-bold mb-6">Evening</h3>
              
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
