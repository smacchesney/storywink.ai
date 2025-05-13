'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book, Page, BookStatus } from '@prisma/client'; // Assuming prisma client types are available
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, Library, Download, Home, ArrowLeft } from 'lucide-react'; // Removed CheckCircle as it wasn't used
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import BookPageGallery from '@/components/book/BookPageGallery'; // Import the new component
import FlipbookViewer, { FlipbookActions } from '@/components/book/FlipbookViewer'; // Import FlipbookViewer and FlipbookActions type
import { toast } from 'sonner'; // Import toast for feedback

// Define a type for the book data we expect, including pages
type BookWithPages = Book & { pages: Page[] };

// Placeholder for a server action or API route call
async function fetchBookData(bookId: string): Promise<BookWithPages | null> {
  // In a real app, this would fetch from your backend
  // Replace with your actual data fetching logic (e.g., call a server action)
  // console.log(`Fetching data for bookId: ${bookId}`); // Keep console.log for debugging if needed
  try {
    // Use the actual API endpoint we just created
    const response = await fetch(`/api/book/${bookId}`); 
    if (!response.ok) {
      // Handle specific errors based on status code if needed
      if (response.status === 404) {
        throw new Error('Book not found or you do not have permission.');
      } else if (response.status === 401) {
         throw new Error('Unauthorized. Please log in.');
      }
      throw new Error(`Failed to fetch book data: ${response.statusText} (Status: ${response.status})`);
    }
    const data = await response.json();
    return data as BookWithPages;
  } catch (error) {
    console.error('Error in fetchBookData:', error);
    // Re-throw the error so the component's catch block can handle it
    throw error; 
  }
}

export default function BookPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string; // Get bookId from URL

  const [book, setBook] = useState<BookWithPages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // Example progress state
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1); // State for selected page
  const flipbookRef = useRef<FlipbookActions>(null); // Use FlipbookActions type for ref
  // Add state for PDF export loading
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const loadBook = useCallback(async () => {
    if (!bookId) return;
    setError(null);
    try {
      const data = await fetchBookData(bookId);
      if (data) {
        setBook(data);
        // Set initial page to 1 or the first available page number
        const firstPageNum = data.pages[0]?.pageNumber ?? 1;
        // Only set initial page if the book is loaded for the first time or page number is default
        if (isLoading || currentPageNumber === 1) {
             setCurrentPageNumber(firstPageNum);
        }

        const illustratedPages = data.pages.filter(p => p.generatedImageUrl).length;
        const totalPages = data.pages.length;
        setProgress(totalPages > 0 ? (illustratedPages / totalPages) * 100 : 0);

      } else {
         setError('Book not found or failed to load.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
       if (isLoading) {
           setIsLoading(false);
       }
    }
  // Update dependencies for useCallback
  }, [bookId, isLoading, currentPageNumber]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (book?.status === BookStatus.ILLUSTRATING) {
      intervalId = setInterval(() => {
        console.log('Polling for book status...');
        loadBook();
      }, 5000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [book?.status, loadBook]);

  // Handler for selecting a page from the gallery
  const handlePageSelect = (pageNumber: number) => {
    setCurrentPageNumber(pageNumber);
    // Tell Flipbook instance to turn to the selected page
    // Need to access the pageFlip API via the ref passed to FlipbookViewer
    // This assumes FlipbookViewer exposes its internal ref or a method to control it.
    // We will need to forward the ref in FlipbookViewer.
    // For now, we assume flipbookRef.current points to the pageFlip instance.
    if (flipbookRef.current?.pageFlip) { 
       // Adjust index if library is 0-based
       const pageIndex = Math.max(0, Math.min(pageNumber - 1, (book?.pages?.length ?? 1) - 1));
       flipbookRef.current.pageFlip().turnToPage(pageIndex); 
    }
  };

  // Handler for when the page changes within the Flipbook component
  const handleFlipbookPageChange = (pageNumber: number) => {
     // Update the state to keep gallery and other potential components in sync
     setCurrentPageNumber(pageNumber); 
  };

  // --- Flipbook Control Handlers --- 

  const handlePrevPage = () => {
    if (flipbookRef.current?.pageFlip) {
      flipbookRef.current.pageFlip().flipPrev();
      // onFlip event in FlipbookViewer will update currentPageNumber state
    }
  };

  const handleNextPage = () => {
    if (flipbookRef.current?.pageFlip) {
      flipbookRef.current.pageFlip().flipNext();
      // onFlip event in FlipbookViewer will update currentPageNumber state
    }
  };

  // --- PDF Export Handler ---
  const handleExportPdf = async () => {
    if (!bookId) return;
    setIsExportingPdf(true);
    toast.info("Preparing your PDF download...");

    try {
      // Trigger download by navigating to the API endpoint
      // The browser will handle the download based on Content-Disposition header
      window.location.href = `/api/book/${bookId}/export/pdf`;
      
      // It's hard to know exactly when the download starts/finishes from here.
      // We'll reset the loading state after a short delay.
      setTimeout(() => {
         if (isMountedRef.current) { // Check if component is still mounted
            setIsExportingPdf(false);
         }
      }, 3000); // Reset after 3 seconds (adjust as needed)

    } catch (error) {
      console.error("Error triggering PDF export:", error);
      toast.error("Failed to start PDF export.");
      if (isMountedRef.current) {
          setIsExportingPdf(false);
      }
    }
  };
  
  // Add isMountedRef for cleanup safety
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // --- Render Logic --- //

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#F76C5E]" />
        <p className="ml-2 text-muted-foreground">Loading your amazing book...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-destructive p-4">
        <AlertTriangle className="h-10 w-10 mb-2" />
        <p className="font-semibold">Error loading book</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!book) {
    return <div className="flex justify-center items-center min-h-screen">Book not found.</div>;
  }

  // --- Status-Based Rendering --- //

  if (book.status === BookStatus.ILLUSTRATING) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
         <Card className="w-full max-w-md text-center">
           <CardHeader>
             <CardTitle>Generating Illustrations...</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="mb-4 text-muted-foreground">
               Our digital artists are hard at work illustrating your story! This might take a few minutes.
             </p>
             <Progress value={progress} className="w-full mb-4 bg-muted [&>div]:bg-[#F76C5E]" />
             <Loader2 className="h-6 w-6 animate-spin text-[#F76C5E] mx-auto" />
             <p className="text-sm text-muted-foreground mt-2">Checking for updates...</p>
           </CardContent>
         </Card>
      </div>
    );
  }

  if (book.status === BookStatus.FAILED) {
     return (
      <div className="flex flex-col justify-center items-center min-h-screen text-destructive p-4">
        <Card className="w-full max-w-md text-center border-destructive">
          <CardHeader>
             <CardTitle className="text-destructive">Illustration Failed</CardTitle>
           </CardHeader>
           <CardContent>
              <AlertTriangle className="h-8 w-8 mb-2 mx-auto" />
              <p className="mb-4">
                Something went wrong during illustration generation. Please try again later or contact support.
              </p>
           </CardContent>
         </Card>
      </div>
    );
  }

  if (book.status === BookStatus.COMPLETED) {
    const totalPages = book.pages.length;
    // Disable prev/next based on current page (adjust if library is 0-indexed)
    const canFlipPrev = currentPageNumber > 1;
    const canFlipNext = currentPageNumber < totalPages;

    return (
      <div className="flex flex-col h-[100dvh] bg-background">
        {/* Mobile-optimized header */}
        <div className="flex items-center justify-between p-3 border-b bg-white">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/library" aria-label="Return to Library">
              <ArrowLeft className="h-5 w-5 text-[#F76C5E]" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold truncate max-w-[60%]">{book.title}</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Book Options">
                <svg width="18" height="4" viewBox="0 0 18 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 0C0.9 0 0 0.9 0 2C0 3.1 0.9 4 2 4C3.1 4 4 3.1 4 2C4 0.9 3.1 0 2 0ZM16 0C14.9 0 14 0.9 14 2C14 3.1 14.9 4 16 4C17.1 4 18 3.1 18 2C18 0.9 17.1 0 16 0ZM9 0C7.9 0 7 0.9 7 2C7 3.1 7.9 4 9 4C10.1 4 11 3.1 11 2C11 0.9 10.1 0 9 0Z" fill="currentColor"/>
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl h-auto">
              <SheetTitle className="sr-only">Book Options</SheetTitle>
              <div className="py-4 space-y-4">
                <Link href="/library" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md w-full">
                  <Library className="h-5 w-5 text-[#F76C5E]" />
                  <span>Return to Library</span>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleExportPdf} 
                  disabled={isExportingPdf}
                  className="flex items-center gap-2 p-2 w-full justify-start"
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#F76C5E]" />
                  ) : (
                    <Download className="h-5 w-5 text-[#F76C5E]" />
                  )}
                  Export PDF
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Gallery View - Optimized for mobile */}
        <div className="px-2 pt-2 pb-1 bg-muted/20 border-b">
          <BookPageGallery
            pages={book.pages}
            bookStatus={book.status}
            currentPageNumber={currentPageNumber}
            onPageSelect={handlePageSelect}
          />
        </div>

        {/* Flipbook View - Takes most of the screen */}
        <div className="flex-grow relative overflow-hidden">
          <FlipbookViewer
            ref={flipbookRef}
            pages={book.pages}
            initialPageNumber={currentPageNumber}
            onPageChange={handleFlipbookPageChange}
            className="w-full h-full" 
          />
          
          {/* Floating Navigation Buttons */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handlePrevPage} 
              disabled={!canFlipPrev}
              aria-label="Previous Page"
              className="h-10 w-10 bg-background/70 rounded-r-full shadow"
            >
              <ChevronLeft className="h-6 w-6 text-[#F76C5E]" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextPage} 
              disabled={!canFlipNext}
              aria-label="Next Page"
              className="h-10 w-10 bg-background/70 rounded-l-full shadow"
            >
              <ChevronRight className="h-6 w-6 text-[#F76C5E]" />
            </Button>
          </div>
        </div>

        {/* Footer with Page Number */}
        <div className="flex justify-center items-center py-2 bg-white border-t">
          <div className="flex items-center bg-muted/20 rounded-full px-4 py-1">
            <span className="text-sm font-medium">
              Page {currentPageNumber} of {totalPages}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for any other status
  return (
     <div className="flex justify-center items-center min-h-screen">
       Book status is {book.status}. Preview is not available yet.
     </div>
   );
} 