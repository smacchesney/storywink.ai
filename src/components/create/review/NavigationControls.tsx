import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationControlsProps {
  currentPage: number;
  totalPages: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isProcessing: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * NavigationControls provides the sticky footer navigation between pages
 */
const NavigationControls = ({
  currentPage,
  totalPages,
  canGoNext,
  canGoPrevious,
  isProcessing,
  onPrevious,
  onNext
}: NavigationControlsProps) => {
  return (
    <div className="navigation-controls p-3 border-t flex justify-between items-center sticky bottom-0 bg-white z-10 shadow-md">
      <Button 
        variant="outline" 
        onClick={onPrevious}
        disabled={!canGoPrevious || isProcessing}
        size="sm"
        className="flex-1 max-w-[120px]"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
      </Button>
      
      <span className="text-sm text-gray-500 mx-2">
        {currentPage + 1} of {totalPages}
      </span>
      
      <Button 
        variant="outline"
        onClick={onNext}
        disabled={!canGoNext || isProcessing}
        size="sm"
        className="flex-1 max-w-[120px]"
      >
        Next <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default NavigationControls; 