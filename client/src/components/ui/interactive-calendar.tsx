import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "./calendar";
import { Button } from "./button";
import { Card } from "./card";

interface InteractiveCalendarProps {
  onDateSelect?: (date: Date | undefined) => void;
}

export function InteractiveCalendar({ onDateSelect }: InteractiveCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Select a date";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getQuickDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const thisWeekend = new Date(today);
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = 6 - dayOfWeek;
    thisWeekend.setDate(today.getDate() + daysUntilSaturday);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
      { label: "Today", date: today },
      { label: "Tomorrow", date: tomorrow },
      { label: "This Weekend", date: thisWeekend },
      { label: "Next Week", date: nextWeek },
    ];
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border-4 border-amber-200/50 shadow-2xl overflow-hidden scrapbook-paper relative">
      {/* Scrapbook tape decorations */}
      <div className="absolute top-4 left-4 w-16 h-8 bg-yellow-200/90 rotate-[-15deg] shadow-md opacity-80 z-10"></div>
      <div className="absolute top-6 right-6 w-12 h-6 bg-pink-200/90 rotate-12 shadow-md opacity-80 z-10"></div>

      <div className="p-6 relative z-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-heading font-bold text-gray-800 mb-1">
              Plan Your Adventure
            </h3>
            <p className="text-sm text-gray-600">Choose your perfect date</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:text-[#FF6B85]"
          >
            <i className={`fas fa-${isExpanded ? "chevron-up" : "chevron-down"} mr-2`}></i>
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>

        {/* Selected date display */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-pink-500/10 rounded-xl border-2 border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Selected Date</p>
              <p className="text-lg font-heading font-bold text-gray-800">
                {formatDate(selectedDate)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <i className="fas fa-calendar-check text-primary text-xl"></i>
            </div>
          </div>
        </motion.div>

        {/* Quick date buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {getQuickDates().map((quickDate, index) => (
            <motion.button
              key={quickDate.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDateSelect(quickDate.date)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedDate?.toDateString() === quickDate.date.toDateString()
                  ? "bg-primary text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {quickDate.label}
            </motion.button>
          ))}
        </div>

        {/* Calendar */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t-2 border-amber-200/50 pt-4 mt-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-lg"
                  classNames={{
                    day_selected: "bg-primary text-white hover:bg-primary hover:text-white",
                    day_today: "bg-accent/30 text-accent-foreground font-bold",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Button
            onClick={() => {
              if (selectedDate) {
                window.location.href = "/questionnaire";
              }
            }}
            className="w-full bg-primary hover:bg-[#FF6B85] text-white font-medium py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
            disabled={!selectedDate}
          >
            <i className="fas fa-arrow-right mr-2"></i>
            Start Planning for {selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Selected Date"}
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}
