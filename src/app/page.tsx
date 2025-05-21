"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React, { useRef, useEffect, useState, useContext, createContext } from 'react';
import { cn } from "@/lib/utils";
import StatsCounter from "@/components/landing-page/stats-counter";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface CarouselImage {
  original: string;
  illustrated: string;
  alt: string;
  title?: string; // Optional title to display
}

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
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalImages);
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
    setCurrentIndex(index);
    resetTimer();
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

  return (
    <div className={cn("relative w-full max-w-md mx-auto flex flex-col items-center")}>
      <div className={cn(
          "w-full overflow-hidden rounded-2xl shadow-sm bg-[#FFF8E1] relative",
        )}
        key={`${carouselId}-${currentIndex}`}
      >
        <div className="flex flex-row w-full">
          <div className="w-1/2 relative">
            <div className="aspect-square w-full relative bg-muted">
              <Image
                src={currentImagePair.original}
                alt={`${currentImagePair.alt} - Original`}
                fill
                className="object-cover"
                priority={true}
              />
            </div>
          </div>
          <div className="w-1/2 relative">
            <div className="aspect-square w-full relative bg-muted">
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
      </div>

      {showControls && totalImages > 1 && (
        <div className="flex items-center justify-center mt-2 space-x-1.5">
          {Array.from({ length: totalImages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-[5px] w-[5px] rounded-full transition-colors",
                currentIndex === idx 
                  ? "bg-[#FF6B6B]" 
                  : "bg-[#D9D9D9]"
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
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [isButtonLoading, setIsButtonLoading] = useState(true);

  // Handle loading state for the button
  useEffect(() => {
    if (isLoaded) {
      setIsButtonLoading(false);
    }
  }, [isLoaded]);

  const handleCreateStorybookClick = () => {
    if (!isLoaded) {
      return;
    }

    if (isSignedIn) {
      router.push("/create");
    } else {
      router.push(`/sign-in?redirect_url=${encodeURIComponent('/create')}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        <section className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4 font-sans">
            Make Your Toddler the Hero of Their Own Picturebook
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-5 max-w-2xl mx-auto font-sans">
            Upload photos, and let <span style={{ fontFamily: 'Excalifont' }} className="font-bold">Storywin<span className="text-[#F76C5E]">k.ai</span></span> turn everyday adventures into charming stories.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
            <Button
              size="lg"
              variant="default"
              className="w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 text-lg md:text-xl bg-[#F76C5E] text-white hover:bg-[#F76C5E]/90 transition-colors rounded-full"
              onClick={handleCreateStorybookClick}
              disabled={!isLoaded}
              style={{ fontFamily: 'Excalifont' }}
            >
              {isButtonLoading ? "Loading..." : "✨ Create Your Storybook"}
            </Button>
          </div>
          
          <div className="mb-2 mt-3">
            <SynchronizedCarousels imageSets={[firstCarouselImages, secondCarouselImages]} interval={4000}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                <SynchronizedBeforeAfterPair images={firstCarouselImages} showControls={false} carouselId="carousel1" />
                <SynchronizedBeforeAfterPair images={secondCarouselImages} carouselId="carousel2" />
              </div>
            </SynchronizedCarousels>
          </div>
          
          <StatsCounter count={1234} text="stories created" className="mt-5 text-sm font-sans text-slate-500" />
        </section>
      </main>
    </div>
  );
}
