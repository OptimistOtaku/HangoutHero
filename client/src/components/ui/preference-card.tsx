import { motion } from "framer-motion";
import { Check, Coffee, Compass, Landmark, Utensils } from "lucide-react";

interface PreferenceCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}

export function PreferenceCard({
  title,
  description,
  icon,
  color,
  selected,
  onClick
}: PreferenceCardProps) {
  const iconMap: Record<string, typeof Compass> = {
    coffee: Coffee,
    compass: Compass,
    landmark: Landmark,
    utensils: Utensils,
  };
  const colorMap: Record<string, string> = {
    primary: "bg-primary",
    "primary-light": "bg-[#ff6b85]",
    secondary: "bg-[#47bfa3]",
    accent: "bg-accent",
    decorative: "bg-[#8f7cff]"
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-[20px] border p-4 text-left transition-all md:rounded-3xl md:p-6 ${
        selected
          ? "border-primary bg-[rgba(255,56,92,0.06)] shadow-[0_18px_38px_rgba(255,56,92,0.12)]"
          : "border-[rgba(244,208,63,0.4)] bg-white shadow-[0_10px_24px_rgba(16,24,40,0.04)] hover:border-primary/40"
      }`}
    >
      <div className="absolute left-4 top-3 h-3 w-9 rotate-[-10deg] rounded-sm bg-[#fff09b] md:h-4 md:w-10" />
      {selected && (
        <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-white">
          <Check className="h-4 w-4" />
        </div>
      )}

      <div className="relative flex items-start gap-3 md:gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] text-white shadow-md md:h-14 md:w-14 md:rounded-2xl ${colorMap[color] || "bg-primary"}`}>
          {(() => {
            const Icon = iconMap[icon] || Compass;
            return <Icon className="h-5 w-5 md:h-6 md:w-6" />;
          })()}
        </div>
        <div>
          <h3 className="font-heading text-[1.35rem] leading-none text-[#111318] md:text-2xl">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 md:mt-3">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}
