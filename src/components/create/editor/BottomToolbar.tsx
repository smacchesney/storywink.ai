"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, LayoutGrid, Image as ImageIcon, Palette, Plus, FileText } from 'lucide-react';

export type EditorTab = 'details' | 'cover' | 'pages' | 'artStyle';

interface BottomToolbarProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onAddPhotoClick: () => void;
}

const tabs: { id: EditorTab; label: string; icon: React.ElementType, tourId?: string }[] = [
  { id: 'details', label: 'Details', icon: FileText, tourId: 'details-button' },
  { id: 'cover', label: 'Cover', icon: BookOpen, tourId: 'cover-button' },
  { id: 'pages', label: 'Pages', icon: LayoutGrid, tourId: 'pages-button' },
  { id: 'artStyle', label: 'Art Style', icon: Palette, tourId: 'art-style-button' },
];

export function BottomToolbar({
  activeTab,
  onTabChange,
  onAddPhotoClick,
}: BottomToolbarProps) {
  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-20 bg-white shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)]", // Mobile base styles: full width, shadow-up
        "md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:max-w-md md:rounded-lg md:shadow-xl" // Desktop overrides: centered, rounded, stronger shadow
      )}
    >
      <div 
        className={cn(
          "flex h-16 md:h-auto items-center justify-around", // Adjusted mobile height, align items center
          "md:p-2 md:gap-1 md:justify-center" // Desktop: smaller gap
        )}
      >
        {/* Tab Buttons */}
        {tabs.map((tab) => {
          return (
            <Button
              key={tab.id}
              variant="ghost" 
              data-tourid={tab.tourId}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-1 text-xs font-medium text-gray-500", // Adjusted padding/height slightly for mobile
                "md:flex-row md:flex-none md:h-10 md:px-3 md:py-2 md:gap-1 md:text-sm", // Desktop specific size/layout
                activeTab === tab.id && "text-[#F76C5E]" // Active state
              )}
              aria-selected={activeTab === tab.id}
            >
              <tab.icon className={cn("h-5 w-5 md:mr-1", activeTab === tab.id && "text-[#F76C5E]")} />
              <div className="flex items-center justify-center mt-0.5 md:mt-0">
                <span>{tab.label}</span>
              </div>
            </Button>
          );
        })}

        {/* Add Photo Button - Now styled similarly to tabs */}
        <Button
          variant="ghost" 
          data-tourid="add-photo-button"
          onClick={onAddPhotoClick}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full px-1 text-xs font-medium text-gray-500", // Match tab styling for consistency on mobile
            "md:flex-row md:flex-none md:h-10 md:w-10 md:rounded-full md:p-0 md:ml-2" // Keep specific desktop styling (round icon button)
          )}
          aria-label="Add Photo"
        >
          <Plus className="h-6 w-6 text-[#F76C5E] md:h-5 md:w-5" />
          <span className="md:hidden mt-0.5">Add</span> {/* Adjusted margin */}
        </Button>
      </div>
    </div>
  );
}

export default BottomToolbar; 