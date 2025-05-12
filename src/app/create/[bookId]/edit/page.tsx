"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { StoryboardPage, BookWithStoryboardPages } from '@/types'; // <-- Import shared types
import BottomToolbar, { EditorTab } from '@/components/create/editor/BottomToolbar'; // <-- Import Toolbar
import PhotoSourceSheet from '@/components/create/PhotoSourceSheet'; // <-- Import Sheet for Add Photo
import logger from '@/lib/logger';
import Canvas from '@/components/create/editor/Canvas'; // <-- Import Canvas
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import StoryboardGrid from '@/components/create/editor/StoryboardGrid';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ArtStylePicker from '@/components/create/editor/ArtStylePicker';
import CoverEditorPanel from '@/components/create/editor/CoverEditorPanel';
import { Asset } from '@prisma/client'; // Import Asset for filtering
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip
import WritingProgressScreen from '@/components/create/editor/WritingProgressScreen'; // Import Progress Screen
import useMediaQuery from '@/hooks/useMediaQuery'; // Import the hook

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string; // Get bookId from dynamic route
  const isDesktop = useMediaQuery('(min-width: 768px)'); // Tailwind md breakpoint

  const [bookData, setBookData] = useState<BookWithStoryboardPages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('cover'); // <-- State for active tab
  const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false); // <-- State for Add Photo sheet
  const fileInputRef = useRef<HTMLInputElement>(null); // <-- Need file input ref for adding photos
  const [isPagesPanelOpen, setIsPagesPanelOpen] = useState(false); // Unified state for Sheet/Drawer
  const [storyboardOrder, setStoryboardOrder] = useState<StoryboardPage[]>([]); // Use StoryboardPage type
  const [isSavingOrder, setIsSavingOrder] = useState(false); // <-- Add loading state for saving
  const [isArtStylePanelOpen, setIsArtStylePanelOpen] = useState(false); // <-- State for Art Style panel
  // State for pending Art Style changes
  const [pendingArtStyle, setPendingArtStyle] = useState<string | null | undefined>(undefined);
  const [pendingWinkifyEnabled, setPendingWinkifyEnabled] = useState<boolean>(false);
  const [isSavingArtStyle, setIsSavingArtStyle] = useState(false); // <-- Loading state for saving style
  const [isCoverPanelOpen, setIsCoverPanelOpen] = useState(false); // <-- State for Cover panel
  // State for pending Cover changes
  const [pendingTitle, setPendingTitle] = useState('');
  const [pendingChildName, setPendingChildName] = useState('');
  const [pendingCoverAssetId, setPendingCoverAssetId] = useState<string | null | undefined>(undefined);
  const [isSavingCover, setIsSavingCover] = useState(false); // <-- Loading state for saving cover
  const [isGeneratingStory, setIsGeneratingStory] = useState(false); // <-- State for generation loading
  const [showGenerationProgress, setShowGenerationProgress] = useState(false); // <-- Add state for progress screen visibility
  // Add saved state trackers
  const [isAddingPhoto, setIsAddingPhoto] = useState(false); // Loading state for adding photos

  const isMountedRef = useRef(true);

  // --- Fetch Book Data (Defined earlier with useCallback) ---
  const fetchBookData = useCallback(async () => {
    if (!bookId) {
      toast.error("Book ID is missing.");
      setError("Book ID is missing from the URL.");
      setIsLoading(false);
      return;
    }
    console.log(`Fetching/Refetching book data for ${bookId}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/book/${bookId}`);
      if (!isMountedRef.current) return; // Check mount status
      if (!response.ok) {
        let errorMsg = `Failed to fetch book data: ${response.statusText}`;
        try {
           const errData = await response.json();
           errorMsg = errData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      const data: BookWithStoryboardPages = await response.json();
      if (!isMountedRef.current) return; 
      setBookData(data);
    } catch (err) {
      console.error("Error fetching book:", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(`Error loading book: ${message}`);
      setError(message);
      // Optionally redirect if book not found (e.g., status 404)
      // if (err instanceof Error && err.message.includes('404')) { 
      //   router.push('/create'); // Or a dedicated not-found page
      // }
    } finally {
      if (isMountedRef.current) { setIsLoading(false); }
    }
  }, [bookId, router]);

  // Initial fetch
  useEffect(() => {
    fetchBookData();
  }, [fetchBookData]);
  
  // Mount/unmount ref effect
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Update storyboardOrder state when the underlying bookData changes OR cover changes
  useEffect(() => {
    if (bookData?.pages) {
        const filteredPages = bookData.pages
            .filter(page => page.assetId !== bookData.coverAssetId)
            // Sort stably first (e.g., by original pageNumber or createdAt if index isn't reliable yet)
            .sort((a, b) => a.pageNumber - b.pageNumber); // Or sort by a.createdAt.getTime() - b.createdAt.getTime()
            
        // Re-assign sequential indices FOR DISPLAY in the storyboard context
        const reIndexedFilteredPages = filteredPages.map((page, idx) => ({
            ...page,
            // NOTE: We are modifying the index/pageNumber in the local state copy 
            // for immediate visual consistency in the grid. 
            // The final correct indices are assigned during save.
            index: idx,       // Temporary visual index (0-based)
            pageNumber: idx + 1 // Temporary visual page number (1-based)
        }));

        setStoryboardOrder(reIndexedFilteredPages);
    }
  }, [bookData?.pages, bookData?.coverAssetId]);

  // Add useEffect to close panels if screen size changes to mobile
  useEffect(() => {
    if (!isDesktop) {
      // Close all panels if we switch to a mobile view and a panel is open
      setIsCoverPanelOpen(false);
      setIsPagesPanelOpen(false);
      setIsArtStylePanelOpen(false);
    }
  }, [isDesktop]);

  const handleTabChange = (tab: EditorTab) => {
    setActiveTab(tab);
    // Control panel visibility
    setIsPagesPanelOpen(tab === 'pages');
    setIsArtStylePanelOpen(tab === 'artStyle');
    setIsCoverPanelOpen(tab === 'cover');
    
    // No need to specifically set storyboardOrder here, useEffect handles it

    if (tab === 'artStyle') {
      setPendingArtStyle(bookData?.artStyle);
      setPendingWinkifyEnabled(bookData?.isWinkifyEnabled || false);
    } else if (tab === 'cover') {
      setPendingTitle(bookData?.title || '');
      setPendingChildName(bookData?.childName || '');
      setPendingCoverAssetId(bookData?.coverAssetId);
    }
    logger.info({ bookId, newTab: tab }, "Editor tab changed");
  };
  
  // Handler for changes within StoryboardGrid - Updates local storyboardOrder state
  const handleStoryboardOrderChange = (newPages: StoryboardPage[]) => {
    setTimeout(() => {
        setStoryboardOrder(newPages);
        logger.debug({ bookId }, "Storyboard order state updated (deferred)");
    }, 0);
  };
  
  // Handler for saving the new REORDERED state
  const handleSaveStoryboardOrder = async () => {
    if (!bookData || isSavingOrder) return;
    setIsSavingOrder(true);
    logger.info({ bookId }, "Saving storyboard order...");

    // 1. Find the actual cover page from the main bookData
    const coverPage = bookData.pages.find(p => p.assetId === bookData.coverAssetId);
    
    // 2. Create the final, full ordered list for the API
    const finalOrderedPages = [
        // Ensure cover page (if found) is first with index 0
        ...(coverPage ? [{ ...coverPage, index: 0 }] : []),
        // Map the locally reordered storyboard pages to indices 1, 2, 3...
        ...storyboardOrder.map((page, idx) => ({ ...page, index: idx + 1 }))
    ];

    // 3. Prepare API payload with pageId and NEW index for ALL pages
    const pagesToSave = finalOrderedPages.map(page => ({
      pageId: page.id,
      index: page.index, 
    }));

    try {
      // 4. Call API to save the new indices for all pages
      const response = await fetch(`/api/book/${bookId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: pagesToSave }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Failed to save page order: ${response.statusText}`);
       
       // 5. Update main bookData state with the correctly indexed full page list
       setBookData(prevData => prevData ? { 
           ...prevData, 
           pages: finalOrderedPages // Update with the full list that includes cover at index 0
         } : null);
         
       toast.success("Page order saved successfully!");
       setIsPagesPanelOpen(false); // Close panel
    } catch (error) {
        logger.error({ bookId, error }, "Failed to save storyboard order");
        toast.error(`Failed to save page order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsSavingOrder(false);
    }
  };

  // Handlers for pending Art Style changes
  const handlePendingStyleChange = (styleKey: string) => {
    setPendingArtStyle(styleKey);
  };
  const handlePendingWinkifyChange = (enabled: boolean) => {
    setPendingWinkifyEnabled(enabled);
  };

  // Handler for saving the selected Art Style and Winkify setting
  const handleSaveArtStyle = async () => {
    if (!bookData || isSavingArtStyle) return;
    setIsSavingArtStyle(true);
    logger.info({ bookId, style: pendingArtStyle, winkify: pendingWinkifyEnabled }, "Saving art style...");

    // Prepare only the fields that changed or are defined
    const updatePayload: { artStyle?: string | null; isWinkifyEnabled?: boolean } = {};
    if (pendingArtStyle !== undefined) {
      updatePayload.artStyle = pendingArtStyle;
    }
    if (pendingWinkifyEnabled !== undefined) { // Check boolean specifically
        updatePayload.isWinkifyEnabled = pendingWinkifyEnabled;
    }
    
    // Only call API if there's something to update
    if (Object.keys(updatePayload).length === 0) {
        logger.info({ bookId }, "No changes detected in art style or winkify settings.");
        setIsSavingArtStyle(false);
        setIsArtStylePanelOpen(false);
        return; // Exit early if no changes
    }

    try {
      const response = await fetch(`/api/book/${bookId}`, { // Call PATCH on the book ID route
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to save art style: ${response.statusText}`);
      }

      // Update main bookData state ONLY after successful save
      setBookData(prevData => {
        if (!prevData) return null;
        return { 
            ...prevData, 
            // Only update fields that were actually sent
            ...(updatePayload.artStyle !== undefined && { artStyle: updatePayload.artStyle }),
            ...(updatePayload.isWinkifyEnabled !== undefined && { isWinkifyEnabled: updatePayload.isWinkifyEnabled })
        };
      });
         
       toast.success("Art style saved successfully!");
       setIsArtStylePanelOpen(false); // Close panel on success

    } catch (error) {
      logger.error({ bookId, error }, "Failed to save art style");
      toast.error(`Failed to save art style: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingArtStyle(false);
    }
  };

  // Handlers for pending Cover changes
  const handlePendingTitleChange = (title: string) => {
    setPendingTitle(title);
  };
  const handlePendingChildNameChange = (name: string) => {
    setPendingChildName(name);
  };
  const handlePendingCoverAssetSelect = (assetId: string | null) => {
    setPendingCoverAssetId(assetId);
  };

  // Handler for saving the Cover changes
  const handleSaveCover = async () => {
    if (!bookData || isSavingCover) return;
    setIsSavingCover(true);
    logger.info({ bookId, title: pendingTitle, childName: pendingChildName, coverId: pendingCoverAssetId }, "Saving cover details...");

    const updatePayload: { title?: string; childName?: string; coverAssetId?: string | null } = {};
    if (pendingTitle !== bookData.title) updatePayload.title = pendingTitle;
    if (pendingChildName !== bookData.childName) updatePayload.childName = pendingChildName;
    if (pendingCoverAssetId !== bookData.coverAssetId) updatePayload.coverAssetId = pendingCoverAssetId;

    if (Object.keys(updatePayload).length === 0) {
      logger.info({ bookId }, "No changes detected in cover details.");
      setIsSavingCover(false);
      setIsCoverPanelOpen(false);
      return; 
    }

    try {
      // Call PATCH /api/book/[bookId]
      const response = await fetch(`/api/book/${bookId}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Failed to save cover: ${response.statusText}`);

      // Update main bookData state
      setBookData(prevData => {
        if (!prevData) return null;
        return { 
            ...prevData, 
            ...(updatePayload.title !== undefined && { title: updatePayload.title }),
            ...(updatePayload.childName !== undefined && { childName: updatePayload.childName }),
            ...(updatePayload.coverAssetId !== undefined && { coverAssetId: updatePayload.coverAssetId })
        };
      });
         
       toast.success("Cover details saved successfully!");
       setIsCoverPanelOpen(false); // Close panel on success
    } catch (error) {
      logger.error({ bookId, error }, "Failed to save cover details");
      toast.error(`Failed to save cover: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingCover(false);
    }
  };

  const triggerAddPhotoUpload = () => fileInputRef.current?.click();

  const handleAddPhotoClick = () => {
    logger.info({ bookId }, "Add photo clicked");
    setIsPhotoSheetOpen(true);
  };

  const handleAddPhotoUploadComplete = () => {
     logger.info({ bookId }, "Additional photos uploaded, refetching book data.");
     toast.success("New photos added successfully!");
     fetchBookData(); // <-- Now defined above
  };

  const handleAddPhotoFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
       const files = Array.from(event.target.files);
       setIsPhotoSheetOpen(false); 
       setIsAddingPhoto(true); 
       toast.info(`Uploading ${files.length} additional photo(s)...`);
       logger.info({ bookId, fileCount: files.length }, "Additional photo upload initiated");
       
       const formData = new FormData();
       files.forEach((file) => formData.append('files', file));
       // Add bookId to the form data
       if (bookId) {
           formData.append('bookId', bookId);
       } else {
           logger.error("Cannot add photo: bookId is missing in editor page state.");
           toast.error("Cannot add photo: Book ID is missing.");
           setIsAddingPhoto(false);
           if (fileInputRef.current) fileInputRef.current.value = ''; 
           return;
       }
       
       try {
          const response = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
          }
          const result = await response.json();
          if (result.assets && result.assets.length > 0) {
              // Call completion handler which triggers refetch
              handleAddPhotoUploadComplete(); 
          } else {
              toast.warning("Upload completed, but no new assets were processed.");
          }
       } catch (error) {
          console.error("Add Photo Upload Error:", error);
          toast.error(`Error adding photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
       } finally {
          setIsAddingPhoto(false); // Clear loading state
          if (fileInputRef.current) fileInputRef.current.value = ''; 
       }
    }
  };
  
  // Placeholder for Google Photos import
  const handleImportFromGooglePhotos = () => {
    toast.info("Import from Google Photos is coming soon!");
  };

  // --- Calculate Available Assets for Cover Picker ---
  const availableAssetsForCover = useMemo(() => {
    if (!bookData) return [];
    // Get IDs of assets used on NON-COVER pages
    const usedOnPagesIds = new Set(
        bookData.pages
            .filter(p => p.assetId !== bookData.coverAssetId && p.assetId !== null) // Exclude current cover page asset
            .map(p => p.assetId as string)
    );
    // Filter all fetched assets
    // TODO: This assumes ALL assets for the user are fetched with the book initially - refine if needed
    const allFetchedAssets = bookData.pages.map(p => p.asset).filter(Boolean) as Asset[]; // Extract assets from pages
    return allFetchedAssets.filter(asset => !usedOnPagesIds.has(asset.id));
  }, [bookData]);
  // -----------------------------------------------------

  // --- Calculate Derived Data for Panels --- 
  const allBookAssets = useMemo(() => {
    if (!bookData?.pages) return [];
    // Extract unique assets from all pages
    const assetsMap = new Map<string, Asset>();
    bookData.pages.forEach(page => {
        if (page.asset) {
            assetsMap.set(page.asset.id, page.asset as Asset); // Ensure full Asset type
        }
    });
    return Array.from(assetsMap.values());
  }, [bookData?.pages]);

  const storyboardPagesForGrid = storyboardOrder; 
  // ------------------------------------------

  // Check if required fields are filled to enable generation
  const canGenerate = useMemo(() => {
      return !!(
          bookData &&
          bookData.title?.trim() && 
          bookData.childName?.trim() && 
          bookData.artStyle
          // Add other required checks here if needed
      );
  }, [bookData]);
  // ----------------------------
  
  // Placeholder for triggering generation - Updated
  const handleGenerateStory = async () => {
      if (!canGenerate || isGeneratingStory) return;
      setIsGeneratingStory(true);
      logger.info({ bookId }, "Triggering story generation via API...");
      
      try {
        const response = await fetch(`/api/generate/story`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId }), // Send bookId
        });

        if (response.status === 202) {
            toast.info("Story generation started!");
            setShowGenerationProgress(true); // <-- Show the progress screen
        } else {
            const errorData = await response.json().catch(() => ({ error: "Unknown API error" }));
            throw new Error(errorData.error || `Failed to start generation: ${response.statusText}`);
        }

      } catch (error) {
          logger.error({ bookId, error }, "Failed to trigger story generation API");
          toast.error(`Error starting generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsGeneratingStory(false); // Reset loading state on error
      }
      // Loading state (isGeneratingStory) will remain true until progress screen calls back
  };
  
  // Callback from WritingProgressScreen on completion
  const handleGenerationComplete = (completedBookId: string) => {
      setShowGenerationProgress(false);
      setIsGeneratingStory(false); 
      router.push(`/create/review?bookId=${completedBookId}`); // Navigate to review page
  };

  // Callback from WritingProgressScreen on error/timeout
  const handleGenerationError = (failedBookId: string, errorMsg?: string) => {
      setShowGenerationProgress(false);
      setIsGeneratingStory(false); 
      // Optionally display the error message from the callback
      toast.error(errorMsg || "Story generation failed or timed out.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-[#F76C5E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600">
        <p className="mb-4">Error loading book:</p>
        <p className="mb-4">{error}</p>
        <button onClick={() => router.push('/create')} className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">
          Go Back
        </button>
      </div>
    );
  }

  if (!bookData) {
    // This state might be brief if loading finishes but data is null before error is set
    return (
      <div className="flex items-center justify-center min-h-screen">
        Book not found or failed to load.
      </div>
    );
  }

  // Function to render content based on active tab
  const renderContent = () => {
    if (!bookData) return null; // Guard against null bookData
    switch (activeTab) {
      case 'cover':
      case 'artStyle': 
        return <Canvas bookData={bookData} />; 
      case 'pages':
        return <Canvas bookData={bookData} />; // Keep showing canvas behind sheet/drawer
      default:
        // Ensure exhaustive check or handle default case appropriately
        const _exhaustiveCheck: never = activeTab;
        return <Canvas bookData={bookData} />; // Default to cover/canvas
    }
  };

  // ---- Helper to render Storyboard content + footer (reused by Sheet & Drawer) ---- 
  const StoryboardPanelContent = (
    <>
      <div className="flex-grow overflow-auto py-4 px-2">
        {bookData && (
          <StoryboardGrid 
            pages={storyboardPagesForGrid} // <-- Pass the state variable
            onOrderChange={handleStoryboardOrderChange} 
          />
        )}
      </div>
      <DrawerFooter className="pt-2 flex-row">
        <Button 
          onClick={handleSaveStoryboardOrder} 
          disabled={isSavingOrder}
          className="flex-grow"
        >
          {isSavingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Done
        </Button>
        <DrawerClose asChild>
          <Button variant="outline" className="flex-grow" disabled={isSavingOrder}>Cancel</Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
  // --------------------------------------------------------------------------------

  // ---- Helper to render Art Style content + footer ---- 
  const ArtStylePanelContent = (
    <>
      <div className="flex-grow overflow-auto py-4 px-2">
        {bookData && (
          <ArtStylePicker
            currentStyle={pendingArtStyle} // Use pending state
            isWinkifyEnabled={pendingWinkifyEnabled} // Use pending state
            onStyleChange={handlePendingStyleChange}
            onWinkifyChange={handlePendingWinkifyChange}
          />
        )}
      </div>
      <DrawerFooter className="pt-2 flex-row">
        <Button 
          onClick={handleSaveArtStyle} 
          disabled={isSavingArtStyle}
          className="flex-grow"
        >
          {isSavingArtStyle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Done
        </Button> 
        <DrawerClose asChild>
          <Button variant="outline" className="flex-grow" disabled={isSavingArtStyle}>Cancel</Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
  // ---------------------------------------------------

  // ---- Helper to render Cover Editor Panel Content + Footer ----
  const CoverPanelContent = (
    <>
      <div className="flex-grow overflow-auto py-4 px-2">
        {bookData && (
          <CoverEditorPanel
            allBookAssets={allBookAssets} // <-- Pass all assets
            currentCoverAssetId={pendingCoverAssetId} 
            currentTitle={pendingTitle} 
            currentChildName={pendingChildName} 
            onCoverAssetSelect={handlePendingCoverAssetSelect}
            onTitleChange={handlePendingTitleChange}
            onChildNameChange={handlePendingChildNameChange}
          />
        )}
      </div>
      <DrawerFooter className="pt-2 flex-row">
        <Button 
          onClick={handleSaveCover} 
          disabled={isSavingCover}
          className="flex-grow"
        >
          {isSavingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Done
        </Button> 
        <DrawerClose asChild>
          <Button variant="outline" className="flex-grow" disabled={isSavingCover}>Cancel</Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
  // -------------------------------------------------------------

  // Main Editor Layout
  return (
    <>
      {showGenerationProgress ? (
        <WritingProgressScreen 
          bookId={bookId}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
        />
      ) : (
        <div className="flex flex-col h-screen bg-gray-100">
          {/* Hidden file input for adding photos later */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAddPhotoFileInputChange} 
            className="hidden" 
            multiple 
            accept="image/jpeg,image/png,image/heic,image/heif" 
          />
          
          {/* 1. Top Bar - Updated with 3-column layout */}
          <div className="bg-white shadow-md h-16 flex items-center justify-between px-4 sticky top-0 z-30">
            {/* Left Section (Placeholder) */}
            <div className="flex-1 flex justify-start">
                 {/* TODO: Back button or Menu? */}
                 {/* Example: <Button variant=\"ghost\" size=\"icon\"><ArrowLeft /></Button> */}
            </div>
            {/* Center Section (Title) - REMOVED */}
            {/* 
            <div className=\"flex-1 flex justify-center min-w-0\"> 
                <h1 className=\"text-center font-semibold truncate px-2\">{bookData?.title || \'Untitled Storybook\'}</h1> 
            </div>
            */}
            {/* Ensure center column placeholder exists if needed for spacing, or adjust flex */}
            <div className="flex-1"></div> {/* Empty middle column for spacing */} 
            {/* Right Section (Generate Button) */}
            <div className="flex-1 flex justify-end">
              <TooltipProvider delayDuration={100}>
                 <Tooltip>
                    <TooltipTrigger asChild>
                       {/* Wrap button in span for Tooltip when disabled */}
                       <span tabIndex={canGenerate ? -1 : 0}>
                          <Button 
                            onClick={handleGenerateStory}
                            disabled={!canGenerate || isGeneratingStory}
                            size="sm" // Smaller button size
                            className="bg-[#F76C5E] text-white hover:bg-[#F76C5E]/90 disabled:opacity-50"
                          >
                            {isGeneratingStory ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            ) : null}
                            Generate Story
                          </Button>
                       </span>
                    </TooltipTrigger>
                    {!canGenerate && (
                        <TooltipContent>
                            <p>Please set Title, Child's Name, and Art Style first.</p>
                        </TooltipContent>
                    )}
                 </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* 2. Main Content Area - Removed flex-grow and items-center */}
          <div className="overflow-auto p-4"> 
             {renderContent()} 
          </div>

          {/* 3. Bottom Toolbar */}
          <BottomToolbar 
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onAddPhotoClick={handleAddPhotoClick}
          />
          
          {/* ---- Conditionally Render Panels based on activeTab AND isDesktop ---- */} 
          
          {/* Cover Panel */} 
          {activeTab === 'cover' && (
            isDesktop ? (
              <Drawer open={isCoverPanelOpen} onOpenChange={setIsCoverPanelOpen}>
                <DrawerContent className="h-full w-[380px] mt-0 fixed left-0 rounded-none border-r"> 
                  <DrawerHeader><DrawerTitle>Edit Cover</DrawerTitle></DrawerHeader>
                  {CoverPanelContent} 
                </DrawerContent>
              </Drawer>
            ) : (
              <Sheet open={isCoverPanelOpen} onOpenChange={setIsCoverPanelOpen}>
                 <SheetContent side="bottom" className="h-[85vh] flex flex-col"> 
                   <SheetHeader><SheetTitle>Edit Cover</SheetTitle></SheetHeader>
                   {CoverPanelContent} 
                 </SheetContent>
              </Sheet>
            )
          )}

          {/* Pages Panel */} 
          {activeTab === 'pages' && (
            isDesktop ? (
              <Drawer open={isPagesPanelOpen} onOpenChange={setIsPagesPanelOpen}>
                <DrawerContent className="h-full w-[380px] mt-0 fixed left-0 rounded-none border-r"> 
                  <DrawerHeader>
                      <DrawerTitle>Pages Overview</DrawerTitle>
                      <DrawerDescription>Drag photos to rearrange pages.</DrawerDescription>
                  </DrawerHeader>
                  {StoryboardPanelContent} 
                </DrawerContent>
              </Drawer>
            ) : (
              <Sheet open={isPagesPanelOpen} onOpenChange={setIsPagesPanelOpen}>
                 <SheetContent side="bottom" className="h-screen flex flex-col"> 
                   <SheetHeader>
                       <SheetTitle>Pages Overview</SheetTitle>
                       <DrawerDescription>Drag photos to rearrange pages.</DrawerDescription> 
                   </SheetHeader>
                   {StoryboardPanelContent} 
                 </SheetContent>
              </Sheet>
            )
          )}

          {/* Art Style Panel */} 
          {activeTab === 'artStyle' && (
            isDesktop ? (
              <Drawer open={isArtStylePanelOpen} onOpenChange={setIsArtStylePanelOpen}>
                <DrawerContent className="h-full w-[380px] mt-0 fixed left-0 rounded-none border-r"> 
                  <DrawerHeader><DrawerTitle>Choose Art Style</DrawerTitle></DrawerHeader>
                  {ArtStylePanelContent} 
                </DrawerContent>
              </Drawer>
            ) : (
              <Sheet open={isArtStylePanelOpen} onOpenChange={setIsArtStylePanelOpen}>
                 <SheetContent side="bottom" className="h-screen flex flex-col"> 
                   <SheetHeader><SheetTitle>Choose Art Style</SheetTitle></SheetHeader>
                   {ArtStylePanelContent} 
                 </SheetContent>
              </Sheet>
            )
          )}
          {/* -------------------------------------------------------- */}
          
          {/* PhotoSourceSheet for adding photos - Remains unchanged */}
          <PhotoSourceSheet
            isOpen={isPhotoSheetOpen}
            onOpenChange={setIsPhotoSheetOpen}
            onChooseFromPhone={triggerAddPhotoUpload}
            onImportFromGooglePhotos={handleImportFromGooglePhotos}
          />
        </div>
      )}
    </>
  );
} 