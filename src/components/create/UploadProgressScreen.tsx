"use client";

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Loader2 } from 'lucide-react'; // Or a custom doodle SVG

interface UploadProgressScreenProps {
  progress: number; // Value between 0 and 100
  currentFile: number;
  totalFiles: number;
}

export function UploadProgressScreen({
  progress,
  currentFile,
  totalFiles,
}: UploadProgressScreenProps) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* Placeholder for Pink Doodle - using Loader for now */}
      <Loader2 className="w-20 h-20 md:w-28 md:h-28 text-[#F76C5E] animate-spin mb-8" />
      {/* // TODO: Replace with actual doodle SVG/component */}

      {/* Progress Text */}
      <p className="text-lg md:text-xl text-gray-700 font-medium mb-4">
        {totalFiles > 0 
          ? `Uploading photo ${currentFile} of ${totalFiles}...` 
          : "Preparing upload..."}
      </p>

      {/* Progress Bar Container */}
      <div className="w-4/5 max-w-md">
        <Progress 
          value={progress} 
          className="h-2 [&>div]:bg-[#F76C5E]"
        />
      </div>
    </div>
  );
}

export default UploadProgressScreen; 