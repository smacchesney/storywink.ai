"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedHeroTextProps {
  staticTextBefore?: string;
  rotatingWords?: string[];
  className?: string;
  interval?: number;
  showBottomText?: boolean;
}

function AnimatedHeroText({ 
  staticTextBefore = "Turn Memories Into a Picturebook Starring Your Little", 
  rotatingWords = ["Hero", "Princess", "Adventurer", "Explorer", "Firefighter"],
  className = "",
  interval = 2500,
  showBottomText = false
}: AnimatedHeroTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const words = useMemo(() => rotatingWords, [rotatingWords]);

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const timeoutId = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);
    
    return () => clearTimeout(timeoutId);
  }, [currentIndex, words.length, interval, isClient]);

  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 dark:text-white mb-2 font-sans leading-tight px-2">
        <span className="block sm:inline">Turn Memories Into a</span>{' '}
        <span className="block sm:inline">Picturebook Starring</span>{' '}
        <span className="whitespace-nowrap">Your Little</span>
      </h1>
      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 min-h-[1.2em] flex items-center justify-center">
        {isClient ? (
          <AnimatePresence mode="wait">
            <motion.span
              key={currentIndex}
              className="inline-block font-bold"
              style={{ color: '#F76C5E' }}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
              }}
            >
              {words[currentIndex]}
            </motion.span>
          </AnimatePresence>
        ) : (
          <span className="inline-block font-bold" style={{ color: '#F76C5E' }}>
            {words[0]}
          </span>
        )}
      </div>
      {showBottomText && (
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-sans">
          in Their Own Storybook
        </p>
      )}
    </div>
  );
}

export { AnimatedHeroText }; 