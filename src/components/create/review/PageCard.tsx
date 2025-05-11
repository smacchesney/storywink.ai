import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PageCardProps {
  id: string | undefined;
  imageUrl: string | null;
  text: string | null;
  pageNumber: number;
  isTitlePage: boolean;
  isConfirmed: boolean;
  moderationStatus?: string;
  moderationReason?: string | null;
  isSaving: boolean;
  bookId: string;
  onTextChange: (newText: string) => void;
  onConfirm: () => void;
}

/**
 * PageCard displays a single page with its image and text
 * Provides editing and confirmation functionality
 */
const PageCard = ({
  id,
  imageUrl,
  text,
  pageNumber,
  isTitlePage,
  isConfirmed,
  moderationStatus,
  moderationReason,
  isSaving,
  bookId,
  onTextChange,
  onConfirm
}: PageCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text || '');
  
  // Update edited text when text prop changes
  useEffect(() => {
    setEditedText(text || '');
  }, [text]);

  const handleSaveText = () => {
    if (editedText.trim().length === 0) {
      toast.error("Text cannot be empty");
      return;
    }
    
    onTextChange(editedText);
    setIsEditing(false);
  };

  return (
    <div className="page-card flex-1 flex flex-col p-4 bg-white rounded-md shadow-sm overflow-hidden">
      {/* Page Label and Edit Button */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-500">
          {isTitlePage ? 'Title Page' : `Page ${pageNumber}`}
        </h3>
        {!isEditing && !isSaving && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsEditing(true)}
            disabled={isSaving || isEditing}
            className="h-8 px-2"
          >
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        )}
      </div>

      {/* Image Container - Reduced height */}
      <div className="image-container h-[35vh] relative bg-muted rounded-md mb-2">
        {imageUrl ? (
          <Image 
            src={imageUrl}
            alt={isTitlePage ? 'Title Page' : `Page ${pageNumber}`}
            fill
            className="object-contain"
            priority={pageNumber < 3}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-muted-foreground">
              {isTitlePage ? 'Title Page' : `Page ${pageNumber}`}
            </span>
          </div>
        )}
        
        {/* Moderation Warning */}
        {moderationStatus === 'FLAGGED' && (
          <div className="absolute bottom-2 left-2 bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            <span>Content flagged</span>
          </div>
        )}
      </div>
      
      {/* Confirm Button - Moved above text area */}
      {!isEditing && (
        <div className="sticky top-[60px] z-10 py-1 bg-white mb-2">
          <Button
            className="w-full"
            variant={isConfirmed ? "outline" : "default"}
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isConfirmed ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmed
              </>
            ) : (
              "Confirm Text"
            )}
          </Button>
        </div>
      )}
      
      {/* Text Area - Now below confirm button */}
      <div className="text-editor flex-1">
        {isEditing ? (
          <>
            {isTitlePage ? (
              // Title page input (shorter, larger text)
              <Input
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full text-center font-semibold text-lg p-3"
                placeholder="Enter a title for your book..."
              />
            ) : (
              // Regular page textarea
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full min-h-[100px] p-3"
                placeholder={`Enter text for page ${pageNumber}...`}
              />
            )}
            
            {/* Edit mode buttons */}
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setEditedText(text || "");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveText}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </>
        ) : isTitlePage ? (
          <div className={`text-content p-3 min-h-[40px] border rounded-md text-center font-semibold text-lg ${isConfirmed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
            {text || "Enter a title for your book"}
          </div>
        ) : (
          <div className={`text-content p-3 max-h-[35vh] overflow-y-auto border rounded-md ${isConfirmed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
            {text || "No text yet."}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageCard; 