"use client";

import React from 'react';
import { Loader2 } from 'lucide-react'; // Or a custom doodle SVG

interface UploadProgressScreenProps {
  progress?: number; // Optional now since we're not showing progress
  currentFile?: number; // Made optional
  totalFiles?: number; // Made optional
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

      {/* Updated Text */}
      <p className="text-lg md:text-xl text-gray-700 font-medium">
        Hatching a story egg...
      </p>
    </div>
  );
}

export default UploadProgressScreen; 