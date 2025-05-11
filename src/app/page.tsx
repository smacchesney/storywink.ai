"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React, { useRef, useEffect, useState, useContext, createContext } from 'react';
import { cn } from "@/lib/utils";
import StatsCounter from "@/components/landing-page/stats-counter";
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Placeholder data for the first carousel (first 3 images for top display)
const carouselImages = [
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287470/lwyxy1knvyqvvgch2aor_us7fdd.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287481/page_0_ub5h7f.png", alt: "Anime, Title" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287475/euly0y2fcctrcnnmjcq2_qognmp.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287482/page_1_cwhtjo.png", alt: "Anime, Pg 1" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287474/wjz3h46y2mt06vnq47n9_mzpmoy.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287483/page_2_vp0r7f.png", alt: "Anime, Pg 1" },
  // Keep remaining images if needed for other parts, or trim if only first 3 are used for these carousels
];

// Placeholder data for the second carousel (first 3 images for top display)
const carouselImagesStyle2 = [
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288814/x8oks0akdtyukbltfbyw_snzc3q.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288830/page_0_hchiwz.png", alt: "Title" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288815/yp1gixdr0dy1e9j91h9d_xvfb56.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288831/page_1_tce8np.png", alt: "pg 1" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288816/veqfxfgb4z0nxk9bjiuu_umdhjk.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288819/page_2_xieetj.png", alt: "pg 2" },
  // Keep remaining images if needed for other parts, or trim if only first 3 are used for these carousels
];

interface CarouselImage {
  original: string;
  illustrated: string;
  alt: string;
}

interface CarouselSyncContextType {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isTransitioning: boolean;
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  totalImages: number;
}

const CarouselSyncContext = createContext<CarouselSyncContextType | undefined>(undefined);

const useCarouselSync = () => {
  const context = useContext(CarouselSyncContext);
  if (!context) {
    throw new Error("useCarouselSync must be used within a SynchronizedCarousels provider");
  }
  return context;
};

interface SynchronizedCarouselsProps {
  children: React.ReactNode;
  imageSets: CarouselImage[][]; // Array of image sets for each carousel
  interval?: number;
}

const SynchronizedCarousels: React.FC<SynchronizedCarouselsProps> = ({ children, imageSets, interval = 4000 }) => {
  const totalImages = Math.min(...imageSets.map(set => set.length)); // Sync based on the smallest set
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalImages);
        setIsTransitioning(false);
      }, 500); // Transition duration
    }, interval);
  };

  useEffect(() => {
    if (totalImages > 0) {
     resetTimer();
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, totalImages, interval]);

  const handleSetCurrentIndex = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
      resetTimer();
    }, 500);
  };
  
  if (totalImages === 0) {
    // Handle case with no images to prevent errors
    return <>{children}</>; 
  }

  return (
    <CarouselSyncContext.Provider value={{ currentIndex, setCurrentIndex: handleSetCurrentIndex, isTransitioning, setIsTransitioning, totalImages }}>
      {children}
    </CarouselSyncContext.Provider>
  );
};

interface SynchronizedBeforeAfterPairProps {
  images: CarouselImage[];
  showControls?: boolean;
  carouselId: string; // Unique ID for this carousel instance for keying
}

const SynchronizedBeforeAfterPair: React.FC<SynchronizedBeforeAfterPairProps> = ({ images, showControls = false, carouselId }) => {
  const { currentIndex, setCurrentIndex, isTransitioning, totalImages } = useCarouselSync();

  if (!images || images.length === 0) return null;

  const currentImagePair = images[currentIndex % images.length]; // Use modulo for safety if lengths differ despite totalImages

  const handlePrev = () => {
    setCurrentIndex((currentIndex - 1 + totalImages) % totalImages);
  };

  const handleNext = () => {
    setCurrentIndex((currentIndex + 1) % totalImages);
  };

  return (
    <div className={cn("relative w-full max-w-xs mx-auto flex flex-col items-center")}>
      <div className={cn(
          "grid grid-cols-2 gap-2 w-full transition-opacity duration-500 ease-in-out",
          isTransitioning ? "opacity-50" : "opacity-100"
        )}
        key={`${carouselId}-${currentIndex}`} // Force re-render on index change for transition
      >
        <div className="image-container flex flex-col items-center w-full">
          <div className="aspect-square w-full relative rounded-lg overflow-hidden shadow-md bg-muted">
            <Image
              src={currentImagePair.original}
              alt={`${currentImagePair.alt} - Original`}
              fill
              className="object-cover"
              priority={true}
            />
          </div>
        </div>
        <div className="image-container flex flex-col items-center w-full">
          <div className="aspect-square w-full relative rounded-lg overflow-hidden shadow-md bg-muted">
            <Image
              src={currentImagePair.illustrated}
              alt={`${currentImagePair.alt} - Illustrated`}
              fill
              className="object-cover"
              priority={true}
            />
          </div>
        </div>
      </div>

      {showControls && totalImages > 1 && (
        <div className="flex items-center justify-center mt-2 space-x-1">
          {Array.from({ length: totalImages }).map((_, idx) => (
            <button
              key={idx}
              className={cn(
                "h-1 w-1 rounded-full",
                currentIndex === idx ? "bg-[#F76C5E]" : "bg-gray-300 dark:bg-gray-600"
              )}
              aria-label={`Image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const firstCarouselImages = carouselImages.slice(0, 3);
  const secondCarouselImages = carouselImagesStyle2.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF5EC] dark:bg-gray-900">
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8 space-y-4 md:space-y-6">
        <section className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3">
            Turn Your Photos into Magical Stories
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-3 max-w-2xl mx-auto">
            Storywink uses AI to transform your photos into personalized, beautifully illustrated storybooks.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-4">
            <Link href="/create" passHref className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="default"
                className="w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 text-lg font-semibold bg-[#F76C5E] text-white hover:bg-[#F76C5E]/90 transition-colors"
              >
                Create Your Storybook
              </Button>
            </Link>
          </div>
          
          <SynchronizedCarousels imageSets={[firstCarouselImages, secondCarouselImages]} interval={4000}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <SynchronizedBeforeAfterPair images={firstCarouselImages} showControls={true} carouselId="carousel1" />
              <SynchronizedBeforeAfterPair images={secondCarouselImages} carouselId="carousel2" />
            </div>
          </SynchronizedCarousels>
          
          <StatsCounter count={1234} text="stories created" className="mt-3 text-sm" />
        </section>
      </main>
    </div>
  );
}
