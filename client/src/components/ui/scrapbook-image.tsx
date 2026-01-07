import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ScrapbookImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onLoad?: () => void;
  priority?: boolean;
  polaroid?: boolean;
  caption?: string;
  rotation?: number;
}

// Generate a better placeholder image
function generatePlaceholder(width: number, height: number, text: string): string {
  const colors = [
    "FFE5B4", "FFD1DC", "E0BBE4", "DDA0DD", "B19CD9",
    "FFB6C1", "FFA07A", "98D8C8", "F7DC6F", "AED6F1"
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://via.placeholder.com/${width}x${height}/${color}/FFFFFF?text=${encodeURIComponent(text)}`;
}

export function ScrapbookImage({ 
  src, 
  alt, 
  className = "", 
  fallback,
  onLoad,
  priority = false,
  polaroid = false,
  caption,
  rotation = 0,
}: ScrapbookImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Update image source when src prop changes
  useEffect(() => {
    if (src && src !== imageSrc) {
      setImageSrc(src);
      setIsLoaded(false);
      setHasError(false);
      setRetryCount(0);
    }
  }, [src]);

  const handleError = () => {
    if (retryCount < 2 && imageSrc) {
      // Retry with different image parameters
      setRetryCount(prev => prev + 1);
      const retrySrc = imageSrc.includes('?') 
        ? `${imageSrc}&retry=${retryCount + 1}`
        : `${imageSrc}?retry=${retryCount + 1}`;
      setImageSrc(retrySrc);
      return;
    }

    if (!hasError) {
      setHasError(true);
      if (fallback) {
        setImageSrc(fallback);
      } else {
        // Generate a colorful placeholder
        const placeholder = generatePlaceholder(800, 600, alt || "Image");
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

  // Preload image if priority
  useEffect(() => {
    if (priority && src) {
      const img = new Image();
      img.src = src;
    }
  }, [priority, src]);

  // Polaroid / scrapbook style wrapper
  const imgElement = (
    <motion.img
      src={imageSrc}
      alt={alt}
      className={`w-full h-full object-cover transition-opacity duration-500 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
      onError={handleError}
      onLoad={handleLoad}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: isLoaded ? 1 : 1.02, opacity: isLoaded ? 1 : 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ 
        imageRendering: "auto",
        backfaceVisibility: "hidden",
        transform: "translateZ(0)"
      }}
    />
  );

  if (polaroid) {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="bg-white p-3 rounded-sm shadow-2xl border-2 border-gray-100" style={{ width: 260 }}>
          <div className="w-full h-40 overflow-hidden rounded-sm">
            {imgElement}
          </div>
          <div className="pt-3 pb-1 text-center">
            <div className="text-sm font-heading font-semibold text-gray-800 truncate">
              {caption || alt}
            </div>
          </div>
        </div>
        {!isLoaded && !hasError && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-amber-100 via-pink-100 to-rose-100 flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {imgElement}
      {!isLoaded && !hasError && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-amber-100 via-pink-100 to-rose-100 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <div className="text-gray-500 text-xs">Loading image...</div>
          </div>
        </motion.div>
      )}
      {hasError && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center p-4">
            <i className="fas fa-image text-gray-400 text-2xl mb-2"></i>
            <div className="text-gray-500 text-xs">{alt || "Image"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
