"use client"; // Mark this as a Client Component

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Removed
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RoughButton from "@/components/ui/rough-button";
// import { Textarea } from "@/components/ui/textarea"; // Removed
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import AssetLibrary, { DraggableAsset } from './asset-library';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
  UniqueIdentifier
} from '@dnd-kit/core';
import Image from 'next/image';
import { X, ArrowLeft, Loader2, Upload } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import {
  Panel,
  PanelGroup,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import RoughBorder from '@/components/ui/rough-border';
import RoughInputWrapper from "@/components/ui/rough-input-wrapper";
import StyleSelector from './style-selector';
import type { StyleDefinition } from '@/lib/ai/styleLibrary';

// --- Style Library Type (Mirroring structure from styleLibrary.ts) ---
// type StyleOption = {
//   label: string;
// }; // No longer needed here
type StyleLibrary = Record<string, StyleDefinition>; // Use the detailed type
// ---

// --- Type Definitions (Simplified) ---
type Asset = {
  id: string;
  thumbnailUrl: string;
};
type DroppedAssets = Record<number | string, string | null>;
type PageCount = 8 | 12 | 16;
// Simplified local EditorSettings type
type EditorSettings = {
  bookTitle: string;
  childName: string;
  artStyle: string;
  // storyTone removed
  // theme removed
  // people removed
  // objects removed
  // excitementElement removed
  isDoubleSpread: boolean;
  isWinkifyEnabled: boolean;
};
// --- End Type Definitions ---

// Remove storyToneOptions
// const storyToneOptions = [...];

// --- Constants --- 
const TITLE_PAGE_ID = 'title-page'; // Unique ID for the title slot

// Droppable Grid Cell Component
interface DroppableCellProps {
  id: number | string; 
  droppedAssetId: string | null;
  assets: Asset[];
  onRemove: (id: number | string) => void;
  isTitle?: boolean; 
}

const DroppableCell: React.FC<DroppableCellProps> = ({ id, droppedAssetId, assets, onRemove, isTitle = false }) => {
  const cellRef = useRef<HTMLDivElement>(null); 
  const [dimensions, setDimensions] = useState({ width: 150, height: 150 }); 

  useEffect(() => {
    if (cellRef.current) {
      const { offsetWidth, offsetHeight } = cellRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
    }
  }, []); 

  const droppedAsset = droppedAssetId ? assets.find(a => a.id === droppedAssetId) : null;
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: id });
  const draggableId = droppedAsset ? `cell-${id}-${droppedAsset.id}` : `placeholder-${id}`;
  const { 
    attributes: draggableAttributes,
    listeners: draggableListeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: draggableId,
    data: { origin: 'grid', asset: droppedAsset, sourceId: id },
    disabled: !droppedAsset,
  });

  const combinedStyle = {
    ...(transform ? { transform: CSS.Translate.toString(transform) } : {}),
    zIndex: isDragging ? 100 : 'auto',
    cursor: isDragging ? 'grabbing' : (droppedAsset ? 'grab' : 'default'),
  };

  const handleRemoveMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    onRemove(id);
  };

  const combinedRef = (node: HTMLElement | null) => {
    setDroppableNodeRef(node);
    if (droppedAsset) {
      setDraggableNodeRef(node);
    }
    cellRef.current = node as HTMLDivElement;
  };

  return (
    <div
      ref={combinedRef}
      key={id}
      style={combinedStyle} 
      className={cn(
        `rounded-md w-[150px] aspect-square flex items-center justify-center p-1 relative overflow-hidden flex-shrink-0`,
        isOver ? 'bg-primary/10' : 'bg-background',
        isDragging ? 'opacity-30' : ''
      )}
      {...(droppedAsset ? draggableListeners : {})} 
      {...(droppedAsset ? draggableAttributes : {})} 
    >
      <RoughBorder 
        width={dimensions.width} 
        height={dimensions.height} 
        options={{ 
          stroke: isOver ? 'hsl(var(--primary))' : '#333333',
          strokeWidth: isOver ? 3 : 2.5,
        }}
      />
      
      {droppedAsset ? (
        <>
          <Image 
            src={droppedAsset.thumbnailUrl}
            alt={`Dropped asset ${droppedAsset.id}`}
            fill
            style={{ objectFit: 'cover' }}
            draggable={false}
            className="rounded-sm p-1"
          />
          <Button 
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 transition-opacity z-50"
            onMouseDown={handleRemoveMouseDown}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <span className="text-sm text-muted-foreground z-10"> 
          {/* This text is hidden when an image is dropped */}
          {/* {isTitle ? 'Title Page' : `Page ${Number(id) + 1}`} */}
        </span>
      )}

      {/* Persistent Page Label at the bottom */}
      <div className="absolute bottom-1 left-1 z-20 bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded-sm pointer-events-none">
        {isTitle ? 'Front Cover' : `Page ${Number(id) + 1}`}
      </div>
    </div>
  );
}

// --- Updated Props Interface --- 
interface StoryboardEditorProps {
  initialAssets?: Asset[];
  onTriggerUpload?: () => void;
  isUploading?: boolean;
  droppedAssets: DroppedAssets;
  onDroppedAssetsChange: (newDroppedAssets: DroppedAssets) => void;
  editorSettings: Partial<EditorSettings>; // Uses simplified type
  onEditorSettingsChange: (newSettings: Partial<EditorSettings>) => void;
  pageCount: PageCount;
  onPageCountChange: (count: PageCount) => void;
  styleLibrary: StyleLibrary;
  onGenerateStory: () => Promise<void>;
  isGenerating: boolean;
}
// --- End Props Interface --- 

const StoryboardEditor: React.FC<StoryboardEditorProps> = ({
  initialAssets = [],
  onTriggerUpload,
  isUploading = false,
  droppedAssets,
  onDroppedAssetsChange,
  editorSettings, // Receives simplified settings
  onEditorSettingsChange,
  pageCount,
  onPageCountChange,
  styleLibrary,
  onGenerateStory,
  isGenerating
}) => {
  const panelGroupRef = useRef<HTMLDivElement>(null); 
  const [panelGroupDimensions, setPanelGroupDimensions] = useState({ width: 0, height: 0 }); 

  // --- Internal State --- 
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);

  // --- Derived State --- 
  const gridItemsCount = pageCount;
  const gridItems = Array.from({ length: gridItemsCount }, (_, i) => i);
  const usedAssetIds = useMemo(() => 
    Object.values(droppedAssets).filter(id => id !== null) as string[]
  , [droppedAssets]);
  const activeAsset = useMemo(() => {
      if (!activeId) return null;
      if (activeDragData?.origin === 'grid') return activeDragData.asset as Asset | null;
      return assets.find(a => a.id === activeId);
  }, [assets, activeId, activeDragData]);

  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);

  // Effect for PanelGroup dimensions
  useEffect(() => {
    if (panelGroupRef.current) {
      const { offsetWidth, offsetHeight } = panelGroupRef.current;
      setPanelGroupDimensions({ width: offsetWidth, height: offsetHeight });

      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setPanelGroupDimensions({ 
            width: entry.contentRect.width, 
            height: entry.contentRect.height 
          });
        }
      });
      resizeObserver.observe(panelGroupRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // --- Event Handlers --- 
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setActiveDragData(event.active.data.current); 
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    const activeData = active.data.current;
    setActiveId(null); 
    setActiveDragData(null);

    if (!over || !active || !activeData) return; 

    const targetId = over.id as (number | string);
    const sourceId = activeData?.sourceId as (number | string | null);
    const origin = activeData?.origin as (string | null);

    if (sourceId === targetId) return;

    const newDroppedAssets = { ...droppedAssets };

    if (origin !== 'grid') {
      const assetIdToDrop = typeof active.id === 'string' ? active.id : null;
      if (assetIdToDrop) {
          const displacedAssetId = newDroppedAssets[targetId] || null;
          newDroppedAssets[targetId] = assetIdToDrop;
      }
    } 
    else if (origin === 'grid' && sourceId !== null) {
        const draggedAssetId = activeData.asset?.id || null;
        const assetIdInTarget = newDroppedAssets[targetId] || null;

        if (draggedAssetId) {
            newDroppedAssets[targetId] = draggedAssetId;
            newDroppedAssets[sourceId] = assetIdInTarget;
        }
    }

    onDroppedAssetsChange(newDroppedAssets);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveDragData(null);
  };

  const handleRemoveAssetLocal = (idToRemove: number | string) => {
     onDroppedAssetsChange({ 
         ...droppedAssets, 
         [idToRemove]: null 
     });
  };
  const finalRemoveHandler = handleRemoveAssetLocal;

  // Helper for settings changes
  const handleSettingChange = (key: keyof EditorSettings, value: any) => {
    onEditorSettingsChange({
      ...editorSettings,
      [key]: value,
    });
  };

  // --- Render Logic --- 
  return (
    <div className="flex flex-col h-[calc(100vh-var(--site-header-height)-var(--site-footer-height)-100px)] w-full">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <div ref={panelGroupRef} className="relative flex-grow w-full">
          <PanelGroup 
            direction="horizontal" 
            className="flex-grow w-full h-full bg-muted/20" 
            autoSaveId="storyboardEditorLayout-v2" 
          >
            {/* Center Area Panel */}
            <Panel id="center-area" defaultSize={75} minSize={50}> 
              <PanelGroup direction="vertical"> 
                {/* Main Canvas Panel */}
                <Panel 
                  id="main-canvas" 
                  defaultSize={80} 
                  minSize={20} 
                  className="flex items-center justify-center p-4 overflow-auto bg-background"
                >
                  <div className="flex flex-wrap justify-center items-start gap-4 w-full p-4">
                    {/* --- Title Cell --- */}
                    <DroppableCell
                      id={TITLE_PAGE_ID}
                      droppedAssetId={droppedAssets[TITLE_PAGE_ID] || null}
                      assets={assets}
                      onRemove={finalRemoveHandler}
                      isTitle={true}
                    />
                    {/* --- Story Page Cells --- */}
                    {gridItems.map((_, index) => (
                      <DroppableCell
                        key={index} 
                        id={index} 
                        droppedAssetId={droppedAssets[index] || null}
                        assets={assets}
                        onRemove={finalRemoveHandler}
                      />
                    ))}
                  </div>
                </Panel>
                {/* Bottom Tray Panel (Asset Library) */}
                <Panel id="bottom-tray" defaultSize={15} minSize={10} maxSize={20} className="flex-shrink-0 border-t bg-muted/40 overflow-hidden p-2">
                  <AssetLibrary 
                    assets={assets} 
                    usedAssetIds={usedAssetIds} 
                    onTriggerUpload={onTriggerUpload} 
                    isUploading={isUploading}
                  />
                </Panel>
              </PanelGroup>
            </Panel>

            {/* Right Panel - Simplified Controls */}
            <Panel 
              id="right-controls" 
              className="!overflow-y-auto p-4 bg-muted/40 border-l hidden md:block" 
            >
              <div className="space-y-6 flex flex-col h-full">
                <div className="flex-grow space-y-6">
                   {/* Book Title Input */}
                   <div className="space-y-2">
                     <h4 className="text-sm font-semibold text-foreground mb-1">Book Title</h4>
                     <RoughInputWrapper>
                       <Input 
                         id="bookTitle" 
                         placeholder="e.g., The Magical Adventure" 
                         value={editorSettings.bookTitle || ''} 
                         onChange={(e) => handleSettingChange('bookTitle', e.target.value)} 
                         className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                       />
                     </RoughInputWrapper>
                   </div>
                   {/* Child's Name Input */}
                   <div className="space-y-2">
                     <h4 className="text-sm font-semibold text-foreground mb-1">Child's Name</h4>
                     <RoughInputWrapper>
                       <Input 
                         id="childName" 
                         placeholder="e.g., Alex" 
                         value={editorSettings.childName || ''} 
                         onChange={(e) => handleSettingChange('childName', e.target.value)} 
                         className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                       />
                     </RoughInputWrapper>
                   </div>

                   {/* Winkify Toggle - MOVED HERE */}
                   <div className="space-y-2 border-t pt-4 flex items-center justify-between"> 
                     <Label htmlFor="winkify-toggle" className="text-sm font-medium cursor-pointer pr-2">
                         ✨ Winkify: add creative flair to illustrations
                     </Label>
                     <Switch
                         id="winkify-toggle"
                         checked={!!editorSettings.isWinkifyEnabled} 
                         onCheckedChange={(checked) => handleSettingChange('isWinkifyEnabled', checked)} 
                     />
                   </div>

                   {/* Page Count Buttons */}
                   <div className="space-y-2">
                     <TooltipProvider><Tooltip><TooltipTrigger asChild>
                        <h4 className="text-sm font-semibold text-foreground mb-1">Page Count</h4>
                     </TooltipTrigger><TooltipContent><p>Total story pages (8, 12, or 16).</p></TooltipContent></Tooltip></TooltipProvider>
                     <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))' }}>
                       {[8, 12, 16].map(count => (
                          <RoughButton 
                            key={count} 
                            variant={pageCount === count ? "default" : "outline"} 
                            size="sm"
                            onClick={() => onPageCountChange(count as PageCount)} 
                            type="button"
                            isSelected={pageCount === count}
                          >
                            {count}
                          </RoughButton>
                        ))}
                     </div>
                   </div>
                   {/* Art Style Selector */}
                   <div className="space-y-2 pt-4 border-t mt-4">
                     <TooltipProvider><Tooltip><TooltipTrigger asChild>
                        <h4 className="text-sm font-semibold text-foreground mb-1">Art Style</h4>
                     </TooltipTrigger><TooltipContent><p>Visual style for illustrations.</p></TooltipContent></Tooltip></TooltipProvider>
                     <StyleSelector 
                       styleLibrary={styleLibrary}
                       selectedStyle={editorSettings.artStyle}
                       onSelectStyle={(styleKey) => handleSettingChange('artStyle', styleKey)}
                     />
                   </div>
                </div>
                <div className="mt-auto pt-4 border-t">
                  <Button 
                    onClick={onGenerateStory} 
                    disabled={isGenerating || isUploading} 
                    className="w-full bg-[#F76C5E] text-white hover:bg-[#F76C5E]/90"
                  >
                    {isGenerating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      'Generate & Review Story'
                    )}
                  </Button>
                </div>
              </div>
            </Panel>
          </PanelGroup>
          {/* Adjust PanelGroup RoughBorder style */}
          {panelGroupDimensions.width > 0 && panelGroupDimensions.height > 0 && (
              <RoughBorder
                  width={panelGroupDimensions.width}
                  height={panelGroupDimensions.height}
                  options={{ 
                      stroke: '#000000', // Black color
                      strokeWidth: 1.5, // Thinner
                      roughness: 1, // Less rough
                  }}
              />
          )}
        </div>

        <DragOverlay>
          {activeAsset ? (
            <div className="rounded-md shadow-lg w-[100px] h-[100px]">
              <Image 
                src={activeAsset.thumbnailUrl} 
                alt="Dragged asset" 
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-sm"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default StoryboardEditor; 