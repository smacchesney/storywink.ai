"use client";

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Using Tabs for Photo/Title
import Image from 'next/image';
import { Asset } from '@prisma/client';
import { Check } from 'lucide-react'; // Import Check icon
import { cn } from '@/lib/utils'; // Import cn if not already there

interface CoverEditorPanelProps {
  allBookAssets: Asset[]; // Renamed from availableAssets
  currentCoverAssetId: string | null | undefined;
  currentTitle: string;
  currentChildName: string;
  onCoverAssetSelect: (assetId: string | null) => void;
  onTitleChange: (title: string) => void;
  onChildNameChange: (name: string) => void;
  // Add props for cropping later
}

export function CoverEditorPanel({
  allBookAssets, // Renamed
  currentCoverAssetId,
  currentTitle,
  currentChildName,
  onCoverAssetSelect,
  onTitleChange,
  onChildNameChange,
}: CoverEditorPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("photo"); // 'photo' or 'title'

  const currentCoverAsset = allBookAssets.find(a => a.id === currentCoverAssetId);

  return (
    <div className="p-2 space-y-4 h-full flex flex-col">
      <Tabs defaultValue="photo" onValueChange={setActiveSubTab} className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="photo">Photo</TabsTrigger>
          <TabsTrigger value="title">Title</TabsTrigger>
        </TabsList>
        
        {/* Photo Selection Tab */}
        <TabsContent value="photo" className="flex-grow overflow-auto pt-4 space-y-4">
          
          {/* REMOVED Current Cover Preview & Cropper Placeholder */}
          {/* 
          <div className="aspect-[3/4] bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-500 relative overflow-hidden">
            {currentCoverAsset?.url ? (
              <Image 
                 src={currentCoverAsset.url} 
                 alt="Current Cover" 
                 fill 
                 style={{objectFit: 'contain'}}
              />
            ) : (
                null 
            )}
          </div>
          */}
          
          {/* Available Assets Grid */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Select Cover Photo</Label>
            <div className="grid grid-cols-3 gap-2">
                {allBookAssets.map((asset) => {
                    const isSelected = asset.id === currentCoverAssetId;
                    return (
                        <button 
                            key={asset.id} 
                            onClick={() => onCoverAssetSelect(asset.id)}
                            className={cn(
                                "relative aspect-square rounded-md overflow-hidden border-2 border-transparent transition-all",
                                "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2", // Base focus ring styles
                                isSelected 
                                    ? "border-[#F76C5E] ring-[#F76C5E] ring-offset-1" // Selected: Coral border & ring (focus uses this ring too)
                                    : "border-gray-200 focus:ring-blue-500" // Not selected: Gray border, blue focus ring
                            )}
                            aria-pressed={isSelected}
                        >
                            <Image 
                                src={asset.thumbnailUrl || asset.url} 
                                alt={`Asset ${asset.id}`}
                                fill
                                style={{ objectFit: "cover" }}
                                className={cn(isSelected ? "opacity-80" : "opacity-100")} // Slightly dim selected image
                            />
                            {isSelected && (
                                <div className="absolute bottom-1 right-1 z-10 bg-[#F76C5E] rounded-full p-0.5">
                                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    )
                })}
                {allBookAssets.length === 0 && (
                    <p className="col-span-3 text-sm text-muted-foreground text-center py-4">No photos found for this book.</p>
                )}
            </div>
          </div>
        </TabsContent>

        {/* Title Editing Tab */}
        <TabsContent value="title" className="pt-4 space-y-4">
           <div className="space-y-1.5">
             <Label htmlFor="cover-title" className="text-sm font-semibold">Book Title</Label>
             <Input 
               id="cover-title" 
               placeholder="e.g., The Magical Adventure" 
               value={currentTitle}
               onChange={(e) => onTitleChange(e.target.value)} 
             />
           </div>
           <div className="space-y-1.5">
             <Label htmlFor="cover-child-name" className="text-sm font-semibold">Child's Name</Label>
             <Input 
               id="cover-child-name" 
               placeholder="e.g., Alex" 
               value={currentChildName}
               onChange={(e) => onChildNameChange(e.target.value)} 
             />
           </div>
           {/* Add Font/Style options here later if needed */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CoverEditorPanel; 