"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React, { useRef, useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import RoughBorder from "@/components/ui/rough-border";
import RoughButton from "@/components/ui/rough-button";
import ImageCarousel from "@/components/landing-page/image-carousel";
import StatsCounter from "@/components/landing-page/stats-counter";

// Placeholder data for the first carousel (expanded to 9)
const carouselImages = [
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287470/lwyxy1knvyqvvgch2aor_us7fdd.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287481/page_0_ub5h7f.png", alt: "Anime, Title" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287475/euly0y2fcctrcnnmjcq2_qognmp.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287482/page_1_cwhtjo.png", alt: "Anime, Pg 1" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287474/wjz3h46y2mt06vnq47n9_mzpmoy.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287483/page_2_vp0r7f.png", alt: "Anime, Pg 1" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287473/rnzlfk7hl7qoor13siih_pvuwig.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287483/page_3_ihxtgf.png", alt: "Anime, Pg 2" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287475/dxuqirveorbwjyypwi5n_gocxbz.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287484/page_4_pmihfp.png", alt: "Anime, Pg 3" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287472/t7gszrtmfddbbrvdiw3p_x5te4h.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287478/page_5_jxrqpe.png", alt: "Anime, Pg 4" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287473/aqtarck42i07jtr8tt4q_hu0brf.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287480/page_6_rrvvok.png", alt: "Anime, Pg 6" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287472/h3mszcojycfb1kpeg4ht_n5juw3.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287478/page_7_nnoslf.png", alt: "Anime, Pg 7" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746287472/litnlu8ljcqsoczzafwt_tgjbhp.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746287479/page_8_huwpxz.png", alt: "Anime, Pg 8" },
];

// Placeholder data for the second carousel (expanded to 9)
const carouselImagesStyle2 = [
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288814/x8oks0akdtyukbltfbyw_snzc3q.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288830/page_0_hchiwz.png", alt: "Title" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288815/yp1gixdr0dy1e9j91h9d_xvfb56.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288831/page_1_tce8np.png", alt: "pg 1" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288816/veqfxfgb4z0nxk9bjiuu_umdhjk.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288819/page_2_xieetj.png", alt: "pg 2" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288827/dpxhg5ytb0dcrwqqh7kf_xc3kza.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288817/page_3_sxdihc.png", alt: "pg 3" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288821/bravdmocudgh89gfhi8h_angxxt.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288822/page_4_nvkxto.png", alt: "pg 4" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288823/ft7til9vd6bcjvquqxtp_ea7nbj.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288820/page_5_njzuf3.png", alt: "pg 5" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288816/qpjrqcllzpz5lfafozne_ntzj0q.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288815/page_6_ggri4w.png", alt: "pg 6" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288829/nubttbibmltnhmloekrz_ecjczq.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288824/page_7_gnspxz.png", alt: "pg 7" },
  { original: "https://res.cloudinary.com/storywink/image/upload/v1746288826/upvszupq3yd5deq5qazq_kzxqzx.jpg", illustrated: "https://res.cloudinary.com/storywink/image/upload/v1746288825/page_8_orthre.png", alt: "pg 8" },
];

// Helper component for bordered sections
const BorderedSection: React.FC<{ children: React.ReactNode; className?: string; roughOptions?: any }> = ({ children, className, roughOptions }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (sectionRef.current) {
      const updateDimensions = () => {
        if (sectionRef.current) {
           setDimensions({ 
             width: sectionRef.current.offsetWidth, 
             height: sectionRef.current.offsetHeight 
           });
        }
      };
      updateDimensions();
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(sectionRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Define combined options for a thick border with coral stroke, no fill
  const combinedRoughOptions = {
    stroke: '#F76C5E', // Step 5: Coral for border stroke
    strokeWidth: 3.5, // Make border thicker
    roughness: 2.5, // Keep it rough
    // Remove fill options
    // fill: '...', 
    ...roughOptions 
  };

  return (
    <div ref={sectionRef} className={cn("relative p-4", className)}> 
      {dimensions.width > 0 && dimensions.height > 0 && (
        <RoughBorder 
          width={dimensions.width} 
          height={dimensions.height} 
          options={combinedRoughOptions} 
          // className="text-border/60" // Remove class setting color
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFF5EC] dark:bg-gray-900">
      {/* Optional Header/Nav - Placeholder */}
      {/* <header className="container mx-auto py-4 px-4">
        <nav>
          {/* Navigation items here */}
      {/*   </nav>
      </header> */}

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-12 md:space-y-20">
        {/* Hero Section - Removed section styling for seamless flow */}
        <section 
          className="text-center" /* Removed background, padding, rounded, shadow */
        >
          {/* <BorderedSection className="bg-[#FFFFFF] dark:bg-slate-900 py-12 md:py-20 rounded-lg overflow-hidden"> */}
            <div className="relative inline-block mb-4">
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white">
                Turn Your Photos into Magical Stories
              </h1>
            </div>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Storywink uses AI to transform your cherished photos into personalized, beautifully illustrated storybooks your kids will adore.
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <Link href="/create" passHref>
                <Button 
                  size="lg"
                  variant="default"
                  className="px-10 py-5 text-xl font-semibold cursor-pointer bg-[#F76C5E] text-white hover:bg-[#F76C5E]/90"
                >
                  Create Your Storybook
                </Button>
              </Link>
            </div>
            <StatsCounter count={1234} text="books created" className="mt-6" />
          {/* </BorderedSection> */}
        </section>

        {/* Image Carousel Section 1 */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-slate-900 dark:text-white mt-12 md:mt-16">
           See the Magic
        </h2>
        <ImageCarousel imagePairs={carouselImages} showMascot={true} />

        {/* Image Carousel Section 2 - Removed Heading and margin */}
        {/* <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-slate-900 dark:text-white mt-12 md:mt-16">
           Explore Another Style!
        </h2> */}
        <ImageCarousel imagePairs={carouselImagesStyle2} showMascot={false} />

      </main>

      {/* Optional Footer - Placeholder */}
      {/* <footer className="py-8 bg-slate-100 dark:bg-slate-900">
         <div className="container mx-auto px-4 text-center text-slate-500 dark:text-slate-400">
           {/* Footer content here */}
      {/*   </div>
      </footer> */}
    </div>
  );
}
