import { useState } from "react";
import { motion } from "framer-motion";

interface ScrapbookImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onLoad?: () => void;
}

export function ScrapbookImage({ 
  src, 
  alt, 
  className = "", 
  fallback,
  onLoad 
}: ScrapbookImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (fallback) {
        setImageSrc(fallback);
      } else {
        // Generate a placeholder with the alt text
        const placeholder = `https://via.placeholder.com/800x600/f0f0f0/666666?text=${encodeURIComponent(alt)}`;
        setImageSrc(placeholder);
      }
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-pink-100 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
    </div>
  );
}
