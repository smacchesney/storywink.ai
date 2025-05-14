"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BookStatus } from '@prisma/client';

interface IllustrationProgressScreenProps {
  bookId: string;
  onComplete: (bookId: string, finalStatus: BookStatus) => void;
  onError: (bookId: string, errorMsg?: string) => void;
}

const POLLING_INTERVAL = 5000; // Check status every 5 seconds
const MAX_POLLS = 36; // Timeout after 3 minutes (36 * 5 seconds) for illustration

export function IllustrationProgressScreen({
  bookId,
  onComplete,
  onError,
}: IllustrationProgressScreenProps) {
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!bookId) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/book-status?bookId=${bookId}`);
        if (!response.ok) {
          console.error(`Polling error (Illustration): ${response.status}`);
          if (pollCount > MAX_POLLS / 2) {
            throw new Error("Failed to get book status repeatedly during illustration.");
          }
          setPollCount(prev => prev + 1);
          return;
        }
        
        const data = await response.json();
        const status = data.status as BookStatus;
        setPollCount(prev => prev + 1);

        if (status === BookStatus.COMPLETED || status === BookStatus.PARTIAL || status === BookStatus.FAILED) {
          clearInterval(intervalId);
          if (status === BookStatus.COMPLETED) {
            toast.success("Illustrations complete! Your story is ready.");
          } else if (status === BookStatus.PARTIAL) {
            toast.info("Illustrations partially complete. Some images might need review.");
          } else { // FAILED
            toast.error("Illustration generation failed. Please try again or contact support.");
          }
          onComplete(bookId, status);
        } else if (pollCount >= MAX_POLLS) {
          clearInterval(intervalId);
          toast.error("Illustration generation is taking longer than expected. Please check your library later.");
          onError(bookId, "Illustration timed out.");
        }
        // Continue polling if still ILLUSTRATING or another intermediate status
      } catch (err) {
        console.error("Error polling illustration status:", err);
        clearInterval(intervalId);
        const message = err instanceof Error ? err.message : "Could not check illustration status."
        toast.error(`Error checking status: ${message}`);
        onError(bookId, message);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [bookId, onComplete, onError, pollCount]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4 text-center">
      <Loader2 className="w-20 h-20 md:w-28 md:h-28 text-[#F76C5E] animate-spin mb-8" />
      <p className="text-lg md:text-xl text-gray-700 font-medium mb-4">
        Coloring in Your Story, One Page at a Time… 🎨
      </p>
      <p className="text-sm text-gray-500">
        Psst... if you get antsy, you can always tiptoe to &apos;My Library&apos; later to peek at the progress!
      </p>
    </div>
  );
}

export default IllustrationProgressScreen; 