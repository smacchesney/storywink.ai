'use client';

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Page } from '@prisma/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle } from 'lucide-react';

interface FlipbookViewerProps {
  pages: Page[];
  initialPageNumber?: number;
  onPageChange?: (pageNumber: number) => void;
  className?: string;
  // width and height props are removed as dimensions are now derived
}

// Define the type for the imperative handle
export interface FlipbookActions {
  pageFlip: () => any; // Expose the pageFlip API instance
}

// Use forwardRef to allow passing ref from parent
const FlipbookViewer = forwardRef<FlipbookActions, FlipbookViewerProps>((
  {
    pages,
    initialPageNumber = 1,
    onPageChange,
    className,
    // width and height props removed from destructuring
  },
  ref // Receive the forwarded ref
) => {
  const flipBookInternalRef = useRef<any>(null);
  const [spreadWidth, setSpreadWidth] = useState<number>(0); // Changed state for dimensions
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container div

  // Expose the pageFlip instance via the forwarded ref
  useImperativeHandle(ref, () => ({
    pageFlip: () => flipBookInternalRef.current?.pageFlip(),
  }));

  // Adjust size based on container for responsiveness
  useEffect(() => {
    const resizeObserver = new ResizeObserver(([entry]) => { // Simplified to use [entry]
      if (entry) {
        setSpreadWidth(entry.contentRect.width);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      // Disconnect the observer on cleanup
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array, containerRef is stable

  const pageSide = Math.floor(spreadWidth / 2);
  const isPortrait = spreadWidth < 640;

  // Handler for page flip event from the library
  const handleFlip = useCallback((e: any) => {
    // The event `e` usually contains the current page number (data)
    const currentPage = e.data; 
    console.log('Flipped to page:', currentPage);
    if (onPageChange) {
      onPageChange(currentPage + 1); // Library might be 0-indexed, adjust as needed
    }
  }, [onPageChange]);

  // Add onInit handler to turn to initial page once ready
  const handleInit = useCallback(() => {
     if (flipBookInternalRef.current && initialPageNumber) {
        // Ensure page number is within valid range (0 to pageCount - 1)
        const pageIndex = Math.max(0, Math.min(initialPageNumber - 1, pages.length - 1));
        console.log(`Flipbook initialized. Turning to initial page index: ${pageIndex}`);
            try {
               flipBookInternalRef.current?.pageFlip()?.turnToPage(pageIndex);
            } catch (e) {
               console.error("Error turning page on init:", e);
            }
     }
  }, [initialPageNumber, pages.length]);

  return (
    <div 
      ref={containerRef} 
      className={cn("w-full", className)} // Updated className
      style={{ height: pageSide > 0 ? pageSide : 'auto' }} // Set height to pageSide, with a fallback for initial 0
    > 
      {pageSide > 0 && ( // Conditionally render HTMLFlipBook when pageSide is valid
        <HTMLFlipBook
          ref={flipBookInternalRef}
          // Square geometry
          width={pageSide}
          height={pageSide}
          size="stretch"

          // Dummy "required" props to satisfy IProps (Option A)
          className=""
          style={{}}
          startPage={0}
          minWidth={1}
          minHeight={1}
          maxWidth={4096}
          maxHeight={4096}
          // Adding more dummy props based on linter feedback and original values
          startZIndex={0}          // Original: 0
          autoSize={true}          // Original: true
          showCover={false}        // Original: false
          useMouseEvents={true}    // Original: true
          // Adding the remaining missing props based on new linter feedback
          swipeDistance={30}       // Original: 30
          showPageCorners={true}   // Original: true
          disableFlipByClick={false} // Original: false

          // Real settings
          drawShadow
          maxShadowOpacity={0.7}
          flippingTime={700}
          usePortrait={isPortrait}
          mobileScrollSupport={false}
          clickEventForward

          // Event handlers
          onFlip={handleFlip}
          onInit={handleInit}
        >
          {pages.map((page, index) => ( // index can be used if page.pageNumber is not reliable for priority
            <div key={page.id || index} className="bg-white border border-gray-200 flex justify-center items-center overflow-hidden">
              {/* Page content - Render Image or loading/error state */}
              {page.generatedImageUrl ? (
                <div className="relative w-full h-full">
                   <Image
                     src={page.generatedImageUrl}
                     alt={`Page ${page.pageNumber}`}
                     fill
                     sizes={`(max-width: 768px) 90vw, ${pageSide}px`} // Updated to use pageSide
                     style={{ objectFit: 'cover' }} // Changed to 'cover'
                     priority={page.pageNumber <= 2} // Use page.pageNumber for priority
                   />
                </div>
              ) : (
                // Placeholder for loading or failed state
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading page {page.pageNumber}...</p>
                </div>
              )}
            </div>
          ))}
        </HTMLFlipBook>
      )}
    </div>
  );
});

FlipbookViewer.displayName = "FlipbookViewer"; // Add display name for DevTools

export default FlipbookViewer; 