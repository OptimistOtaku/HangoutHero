import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { PreferenceCard } from "@/components/ui/preference-card";
import { PreferenceFormData } from "@/lib/openai";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

const defaultFormData: PreferenceFormData = {
  hangoutTypes: [],
  duration: "Full day",
  budget: "Mid-range",
  groupSize: "Solo",
  mood: []
};

const moodColorMap: Record<string, string> = {
  Relaxed: "bg-emerald-600 border-emerald-600 hover:bg-emerald-500",
  Energetic: "bg-amber-500 border-amber-500 hover:bg-amber-400",
  Romantic: "bg-rose-500 border-rose-500 hover:bg-rose-400",
  Adventurous: "bg-orange-500 border-orange-500 hover:bg-orange-400",
  Cultural: "bg-stone-900 border-stone-900 hover:bg-stone-700",
  Foodie: "bg-[#47bfa3] border-[#47bfa3] hover:bg-[#39a88f]",
  Social: "bg-sky-600 border-sky-600 hover:bg-sky-500",
  Peaceful: "bg-cyan-600 border-cyan-600 hover:bg-cyan-500"
};

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<PreferenceFormData>(defaultFormData);

  useEffect(() => {
    const savedPreferenceData = sessionStorage.getItem("preferenceData");
    if (savedPreferenceData) {
      setFormData(JSON.parse(savedPreferenceData));
    }
  }, []);

  const handleNext = () => {
    sessionStorage.setItem("preferenceData", JSON.stringify(formData));
    setLocation("/location");
  };

  const toggleHangoutType = (type: string) => {
    setFormData((prev) => {
      const types = prev.hangoutTypes.includes(type)
        ? prev.hangoutTypes.filter((item) => item !== type)
        : [...prev.hangoutTypes, type];
      return { ...prev, hangoutTypes: types };
    });
  };

  const toggleMood = (mood: string) => {
    setFormData((prev) => {
      const moods = prev.mood.includes(mood)
        ? prev.mood.filter((item) => item !== mood)
        : [...prev.mood, mood];
      return { ...prev, mood: moods };
    });
  };

  return (
    <section className="relative mx-auto max-w-7xl px-3 py-5 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-4 top-10 h-28 w-28 rotate-12 border border-[rgba(255,180,0,0.14)]" />
        <div className="absolute right-10 top-24 h-24 w-24 rotate-[-10deg] border border-[rgba(255,56,92,0.12)]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <ProgressSteps currentStep={1} />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-5 md:mt-8"
        >
          <Card className="overflow-hidden rounded-[22px] border border-[rgba(244,208,63,0.45)] bg-white/85 shadow-[0_24px_60px_rgba(255,56,92,0.08)] md:rounded-3xl">
            <CardContent className="p-4 md:p-10">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase text-primary">Preferences</p>
                <h1 className="mt-3 font-heading text-[2.45rem] font-extrabold leading-[0.95] text-[#111318] md:mt-4 md:text-6xl">
                  What kind of hangout are you planning?
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg md:leading-8">
                  Pick the vibe first. The itinerary gets better when the app understands the kind of day you actually want.
                </p>
              </div>

              <div className="mt-7 grid gap-3 md:mt-10 md:grid-cols-2 md:gap-5">
                <PreferenceCard
                  title="Exploring"
                  description="Hidden gems, scenic routes, landmarks, and open-ended wandering."
                  icon="compass"
                  color="primary-light"
                  selected={formData.hangoutTypes.includes("Exploring")}
                  onClick={() => toggleHangoutType("Exploring")}
                />
                <PreferenceCard
                  title="Eating"
                  description="Restaurants, local specialties, food stops, and culinary detours."
                  icon="utensils"
                  color="accent"
                  selected={formData.hangoutTypes.includes("Eating")}
                  onClick={() => toggleHangoutType("Eating")}
                />
                <PreferenceCard
                  title="Historical"
                  description="Monuments, museums, city stories, and places with cultural weight."
                  icon="landmark"
                  color="decorative"
                  selected={formData.hangoutTypes.includes("Historical")}
                  onClick={() => toggleHangoutType("Historical")}
                />
                <PreferenceCard
                  title="Cafe Hopping"
                  description="Slow coffee, cozy corners, conversation spots, and aesthetic pauses."
                  icon="coffee"
                  color="secondary"
                  selected={formData.hangoutTypes.includes("Cafe Hopping")}
                  onClick={() => toggleHangoutType("Cafe Hopping")}
                />
              </div>

              <div className="mt-7 grid gap-4 md:mt-10 lg:grid-cols-2 lg:gap-8">
                <div className="rounded-[20px] border border-[rgba(244,208,63,0.4)] bg-[rgba(255,249,239,0.72)] p-4 md:rounded-3xl md:p-6">
                  <h2 className="font-heading text-2xl leading-none text-[#111318] md:text-3xl">Pacing and budget</h2>

                  <div className="mt-5 md:mt-6">
                    <p className="mb-3 text-sm font-semibold uppercase text-slate-500">Duration</p>
                    <div className="flex flex-wrap gap-3">
                      {["2-3 hours", "Half day", "Full day", "Evening"].map((duration) => (
                        <Button
                          key={duration}
                          type="button"
                          variant={formData.duration === duration ? "default" : "outline"}
                          className={`h-11 flex-1 rounded-full px-4 text-sm sm:flex-none md:px-5 ${
                            formData.duration === duration
                              ? "bg-primary text-white hover:bg-[#ff5977]"
                              : "border-slate-300 bg-white text-slate-700 hover:border-primary"
                          }`}
                          onClick={() => setFormData((prev) => ({ ...prev, duration }))}
                        >
                          {duration}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 md:mt-8">
                    <p className="mb-3 text-sm font-semibold uppercase text-slate-500">Budget</p>
                    <div className="flex flex-wrap gap-3">
                      {["Budget-friendly", "Mid-range", "Luxury"].map((budget) => (
                        <Button
                          key={budget}
                          type="button"
                          variant={formData.budget === budget ? "default" : "outline"}
                          className={`h-11 flex-1 rounded-full px-4 text-sm sm:flex-none md:px-5 ${
                            formData.budget === budget
                              ? "bg-primary text-white hover:bg-[#ff5977]"
                              : "border-slate-300 bg-white text-slate-700 hover:border-primary"
                          }`}
                          onClick={() => setFormData((prev) => ({ ...prev, budget }))}
                        >
                          {budget}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[rgba(244,208,63,0.4)] bg-white p-4 md:rounded-3xl md:p-6">
                  <h2 className="font-heading text-2xl leading-none text-[#111318] md:text-3xl">Group and mood</h2>

                  <div className="mt-5 md:mt-6">
                    <p className="mb-3 text-sm font-semibold uppercase text-slate-500">Who’s coming</p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: "Solo", label: "Just me" },
                        { value: "Couple", label: "Couple" },
                        { value: "Small Group", label: "Small Group (3-5)" },
                        { value: "Large Group", label: "Large Group (6+)" }
                      ].map((group) => (
                        <Button
                          key={group.value}
                          type="button"
                          variant={formData.groupSize === group.value ? "default" : "outline"}
                          className={`h-11 flex-1 rounded-full px-4 text-sm sm:flex-none md:px-5 ${
                            formData.groupSize === group.value
                              ? "bg-primary text-white hover:bg-[#ff5977]"
                              : "border-slate-300 bg-white text-slate-700 hover:border-primary"
                          }`}
                          onClick={() => setFormData((prev) => ({ ...prev, groupSize: group.value }))}
                        >
                          {group.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 md:mt-8">
                    <p className="mb-3 text-sm font-semibold uppercase text-slate-500">Mood</p>
                    <div className="flex flex-wrap gap-3">
                      {["Relaxed", "Energetic", "Romantic", "Adventurous", "Cultural", "Foodie", "Social", "Peaceful"].map((mood) => (
                        <Button
                          key={mood}
                          type="button"
                          variant={formData.mood.includes(mood) ? "default" : "outline"}
                          className={`h-11 flex-1 rounded-full px-4 text-sm sm:flex-none md:px-5 ${
                            formData.mood.includes(mood)
                              ? `${moodColorMap[mood]} text-white`
                              : "border-slate-300 bg-white text-slate-700 hover:border-primary"
                          }`}
                          onClick={() => toggleMood(mood)}
                        >
                          {mood}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex justify-end md:mt-10">
                <Button
                  onClick={handleNext}
                  className="h-14 w-full rounded-full bg-primary px-10 text-base font-bold text-white hover:bg-[#ff5977] sm:w-auto md:text-lg"
                  disabled={formData.hangoutTypes.length === 0 || formData.mood.length === 0 || !formData.groupSize}
                >
                  Continue to location
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
