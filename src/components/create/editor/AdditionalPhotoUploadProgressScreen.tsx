"use client";

import React from 'react';
// import { Loader2 } from 'lucide-react'; // Remove Loader2
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave'; // Import TextShimmerWave

// Remove the empty interface
// interface AdditionalPhotoUploadProgressScreenProps {
//   // This component is simple and doesn't need props for now
//   // It could be extended later if needed (e.g., for custom messages)
// }

// Adjust component definition to not use React.FC with an empty interface
const AdditionalPhotoUploadProgressScreen = () => {
  return (
    // Change background to white, match layout of UploadProgressScreen
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* <Loader2 className="h-16 w-16 animate-spin text-[#F76C5E] mb-6" /> */}
      {/* <h2 className="text-3xl font-semibold text-white mb-3">Adding Your Photos...</h2> */}
      {/* <p className="text-lg text-gray-300">
        Please wait a moment while we upload your new images.
      </p> */}
      
      {/* Use TextShimmerWave with appropriate message */}
      <TextShimmerWave
        className="text-lg md:text-xl font-medium [--base-color:#374151] [--base-gradient-color:#F76C5E] dark:[--base-color:#D1D5DB] dark:[--base-gradient-color:#F76C5E]"
        duration={1}
        spread={1}
        zDistance={1}
        scaleDistance={1.1}
        rotateYDistance={20}       
      >
        Adding your photos...
      </TextShimmerWave>
    </div>
  );
};

export default AdditionalPhotoUploadProgressScreen; 