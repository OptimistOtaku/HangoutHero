import { motion } from "framer-motion";

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
  // Map color string to actual Tailwind class
  const colorMap: Record<string, string> = {
    'primary': 'bg-primary',
    'primary-light': 'bg-[#FF6B85]',
    'secondary': 'bg-secondary',
    'accent': 'bg-accent',
    'decorative': 'bg-[#A78BFA]'
  };

  const bgColorClass = colorMap[color] || 'bg-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`preference-card cursor-pointer border-4 ${
        selected 
          ? 'border-primary bg-primary/5 shadow-lg ring-4 ring-primary/20' 
          : 'border-gray-200 hover:border-primary/50 bg-white'
      } rounded-2xl p-6 flex items-start space-x-4 transition-all duration-300 relative overflow-hidden group`}
      onClick={onClick}
      style={{
        boxShadow: selected 
          ? "0 8px 32px rgba(255, 56, 92, 0.2), inset 0 0 0 1px rgba(255,255,255,0.3)"
          : "0 4px 16px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.5)",
      }}
    >
      {/* Selected indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
        >
          <i className="fas fa-check text-white text-xs"></i>
        </motion.div>
      )}
      
      {/* Scrapbook tape decoration */}
      <div className="absolute top-2 left-2 w-8 h-4 bg-yellow-200/70 rotate-[-12deg] shadow-sm opacity-60"></div>
      
      <motion.div
        className={`w-14 h-14 ${bgColorClass} rounded-xl flex items-center justify-center shadow-md`}
        animate={{ 
          scale: selected ? 1.1 : 1,
          rotate: selected ? [0, -5, 5, -5, 0] : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <i className={`fas fa-${icon} text-white text-2xl`}></i>
      </motion.div>
      <div className="flex-1">
        <h3 className="font-heading font-bold text-xl mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
      
      {/* Hover effect overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColorClass}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}></div>
    </motion.div>
  );
}
