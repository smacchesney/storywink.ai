"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react'; // Or a custom doodle SVG
import { toast } from 'sonner';
import { BookStatus } from '@prisma/client';

interface WritingProgressScreenProps {
  bookId: string;
  onComplete: (bookId: string) => void;
  onError: (bookId: string, errorMsg?: string) => void;
}

const POLLING_INTERVAL = 5000; // Check status every 5 seconds

export function WritingProgressScreen({
  bookId,
  onComplete,
  onError,
}: WritingProgressScreenProps) {
  const [currentStatus, setCurrentStatus] = useState<BookStatus | string>("GENERATING");
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 24; // Timeout after 2 minutes (24 * 5 seconds)

  useEffect(() => {
    if (!bookId) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/book-status?bookId=${bookId}`);
        if (!response.ok) {
          // Handle non-OK responses during polling
          console.error(`Polling error: ${response.status}`);
          // Optionally stop polling after several errors
          if (pollCount > MAX_POLLS / 2) { // Stop if errors persist
              throw new Error("Failed to get book status repeatedly.");
          }
          return; // Continue polling for a while
        }
        
        const data = await response.json();
        const status = data.status as BookStatus;
        setCurrentStatus(status);
        setPollCount(prev => prev + 1);

        if (status === BookStatus.COMPLETED) {
          clearInterval(intervalId);
          toast.success("Story generation complete!");
          onComplete(bookId);
        } else if (status === BookStatus.FAILED) {
          clearInterval(intervalId);
          toast.error("Story generation failed. Please try again.");
          onError(bookId, "Generation process failed.");
        } else if (pollCount >= MAX_POLLS) {
            clearInterval(intervalId);
            toast.error("Story generation is taking longer than expected. Please check back later.");
            onError(bookId, "Generation timed out.");
        }
        // Continue polling if still GENERATING or ILLUSTRATING (if applicable later)
      } catch (err) {
        console.error("Error polling book status:", err);
        clearInterval(intervalId);
        const message = err instanceof Error ? err.message : "Could not check status."
        toast.error(`Error checking status: ${message}`);
        onError(bookId, message);
      }
    }, POLLING_INTERVAL);

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);

  }, [bookId, onComplete, onError, pollCount]); // Include pollCount in dependencies

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* Placeholder for Pink Doodle - using Loader for now */}
      <Loader2 className="w-20 h-20 md:w-28 md:h-28 text-[#F76C5E] animate-spin mb-8" />
      {/* // TODO: Replace with actual doodle SVG/component */}

      {/* Progress Text */}
      <p className="text-lg md:text-xl text-gray-700 font-medium mb-4 animate-pulse">
        Winking your story... ✨
      </p>
      <p className="text-sm text-gray-500">(Status: {currentStatus})</p>
    </div>
  );
}

export default WritingProgressScreen; 