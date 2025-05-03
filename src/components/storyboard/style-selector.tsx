"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { StyleDefinition } from '@/lib/ai/styleLibrary'; // Import the detailed type

interface StyleSelectorProps {
  styleLibrary: Record<string, StyleDefinition>;
  selectedStyle: string | undefined;
  onSelectStyle: (styleKey: string) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ 
  styleLibrary, 
  selectedStyle, 
  onSelectStyle 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(styleLibrary).map(([styleKey, styleDef]) => {
        const isSelected = selectedStyle === styleKey;
        return (
          <button
            key={styleKey}
            type="button"
            onClick={() => onSelectStyle(styleKey)}
            className={cn(
              "relative aspect-square w-full rounded-md overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected ? "ring-2 ring-[#F76C5E] ring-offset-2" : "ring-1 ring-gray-300 hover:ring-gray-400"
            )}
            aria-label={`Select style: ${styleDef.label}`}
          >
            <Image
              src={styleDef.referenceImageUrl}
              alt={styleDef.label}
              fill
              sizes="(max-width: 768px) 50vw, 200px" // Basic sizes, adjust as needed
              className="object-cover transition-transform duration-200 ease-in-out group-hover:scale-105"
            />
            {/* Hover/Selected Label */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-semibold p-2 transition-opacity duration-200 ease-in-out",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              {styleDef.label}
            </div>
            {/* Optional: Add a checkmark for selected state if desired */}
            {/* {isSelected && <div className="absolute top-2 right-2 text-white bg-coral-red rounded-full p-1">✓</div>} */}
          </button>
        );
      })}
    </div>
  );
};

export default StyleSelector; 