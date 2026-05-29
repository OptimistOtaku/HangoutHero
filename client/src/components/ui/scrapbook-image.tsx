import { useEffect, useMemo, useState } from "react";
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

function buildPlaceholder(alt: string) {
  const label = (alt || "Travel moment").slice(0, 28);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff4de" />
          <stop offset="100%" stop-color="#ffd7c7" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)" />
      <rect x="84" y="84" width="632" height="432" rx="28" fill="#fffaf3" stroke="#f0d79a" stroke-width="8" stroke-dasharray="14 10" />
      <circle cx="400" cy="248" r="58" fill="#ff385c" opacity="0.16" />
      <path d="M220 420l122-122 92 92 68-68 78 98H220z" fill="#56cfb8" opacity="0.92" />
      <text x="400" y="474" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="34" fill="#374151">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
  const placeholder = useMemo(() => buildPlaceholder(alt), [alt]);
  const [imageSrc, setImageSrc] = useState(src || fallback || placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setImageSrc(src || fallback || placeholder);
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);
  }, [src, fallback, placeholder]);

  const handleError = () => {
    if (retryCount < 1 && src && imageSrc === src) {
      const separator = src.includes("?") ? "&" : "?";
      setRetryCount(1);
      setImageSrc(`${src}${separator}retry=1`);
      return;
    }

    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
      return;
    }

    setHasError(true);
    setImageSrc(placeholder);
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const image = (
    <motion.img
      src={imageSrc}
      alt={alt}
      className={`h-full w-full object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"} ${className}`}
      onError={handleError}
      onLoad={handleLoad}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.02 }}
      whileHover={polaroid ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.35, ease: "easeOut" }}
    />
  );

  if (polaroid) {
    return (
      <div className="relative inline-block" style={{ transform: `rotate(${rotation}deg)` }}>
        <div className="w-64 rounded-3xl border border-[rgba(240,215,154,0.78)] bg-[rgba(255,252,247,0.98)] p-3 shadow-[0_24px_60px_rgba(94,71,45,0.16)]">
          <div className="relative h-40 overflow-hidden rounded-[1rem] bg-[linear-gradient(135deg,#fff0dc,#ffd9ca)]">
            {image}
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent animate-spin" />
              </div>
            )}
          </div>
          <div className="px-2 pb-1 pt-3 text-center">
            <p className="font-scrap text-3xl leading-none text-[#ff6b85]">{caption || alt}</p>
          </div>
        </div>
        <div className="absolute left-6 top-0 h-6 w-16 -translate-y-2 rotate-[-7deg] rounded-sm bg-[rgba(255,238,161,0.92)] shadow-sm" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {image}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#fff0dc,#ffd9ca)]">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="h-8 w-8 rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent animate-spin" />
            <span className="text-xs font-semibold">Loading image</span>
          </div>
        </div>
      )}
    </div>
  );
}
