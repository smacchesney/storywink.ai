"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
// Use require for CJS module
const { STYLE_LIBRARY } = require('@/lib/ai/styleLibrary');

interface StyleDefinition {
  label: string;
  referenceImageUrl: string;
}

interface ArtStylePickerProps {
  currentStyle: string | null | undefined;
  isWinkifyEnabled: boolean;
  onStyleChange: (styleKey: string) => void;
  onWinkifyChange: (enabled: boolean) => void;
}

export function ArtStylePicker({
  currentStyle,
  isWinkifyEnabled,
  onStyleChange,
  onWinkifyChange,
}: ArtStylePickerProps) {
  const styles = Object.entries(STYLE_LIBRARY) as [string, StyleDefinition][];

  return (
    <div className="p-2 space-y-4">
      {/* Style Selection Grid */}
      <div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {styles.map(([key, style]) => (
            <Card 
              key={key}
              onClick={() => onStyleChange(key)}
              className={cn(
                "cursor-pointer overflow-hidden transition-all hover:shadow-md",
                currentStyle === key ? "ring-2 ring-[#F76C5E] ring-offset-2" : "ring-0"
              )}
            >
              <CardContent className="p-0 aspect-square relative max-h-[120px]">
                <Image 
                  src={style.referenceImageUrl} 
                  alt={style.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw" // Provide sizes for optimization
                  style={{ objectFit: "cover" }}
                />
                <div 
                    className={cn(
                        // Base style: Black gradient for text visibility
                        "absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent text-white"
                    )}
                >
                    <p className="text-[10px] md:text-xs font-medium truncate">{style.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Winkify Toggle */}
      <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
         <div>
            <Label htmlFor="winkify-mode" className="text-base font-semibold">Winkify ✨</Label>
            <p className="text-sm text-muted-foreground mt-1">Add playful captions &amp; illustration notes?</p>
         </div>
        <Switch 
          id="winkify-mode" 
          checked={isWinkifyEnabled}
          onCheckedChange={onWinkifyChange}
          // Optional: Add coral color to checked state if desired via data attributes
          className="data-[state=checked]:bg-[#F76C5E]"
        />
      </div>
    </div>
  );
}

export default ArtStylePicker; 