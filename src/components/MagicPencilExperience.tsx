import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Flame, Droplets, Zap, Eraser, RotateCcw, Sparkles, MessageSquare, Copy, Palette, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnnotationData {
  id: string;
  start: number;
  end: number;
  type: 'hot' | 'neutral' | 'flush' | 'eraser';
  timestamp: number;
  priority?: number;
  comment?: string;
}

// For analytics compatibility
export interface MagicPencilAnnotation {
  id: string;
  startIndex: number;
  endIndex: number;
  relevanceLevel: 'high' | 'medium' | 'neutral' | 'low';
  text: string;
  comment?: string;
}

interface MagicPencilExperienceProps {
  content: string;
  onContentChange: (content: string) => void;
  onAnnotationsChange?: (annotations: MagicPencilAnnotation[]) => void;
  onRefinePrompt?: () => void;
}

const MagicPencilExperience: React.FC<MagicPencilExperienceProps> = ({
  content,
  onContentChange,
  onAnnotationsChange,
  onRefinePrompt
}) => {
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [selectedMode, setSelectedMode] = useState<'hot' | 'neutral' | 'flush' | 'eraser'>('hot');
  const [gestureEnabled, setGestureEnabled] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentPressure, setCurrentPressure] = useState(0.5);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Magical selection state
  const [selectionMode, setSelectionMode] = useState<'idle' | 'selecting'>('idle');
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  
  // Comment flow state (from Feature 1)
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<AnnotationData | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  
  const textRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Convert to analytics format for external consumption
  const convertToAnalyticsFormat = useCallback((): MagicPencilAnnotation[] => {
    return annotations.map(ann => ({
      id: ann.id,
      startIndex: ann.start,
      endIndex: ann.end,
      relevanceLevel: ann.type === 'hot' ? 'high' as const :
                    ann.type === 'flush' ? 'medium' as const :
                    ann.type === 'neutral' ? 'neutral' as const : 'low' as const,
      text: content.slice(ann.start, ann.end),
      comment: ann.comment
    }));
  }, [annotations, content]);

  // Notify parent of annotation changes
  useEffect(() => {
    if (onAnnotationsChange) {
      onAnnotationsChange(convertToAnalyticsFormat());
    }
  }, [annotations, convertToAnalyticsFormat, onAnnotationsChange]);

  // Handle click outside to close comment input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commentInputRef.current && !commentInputRef.current.contains(event.target as Node)) {
        if (textRef.current && !textRef.current.contains(event.target as Node)) {
          setShowCommentInput(false);
          setPendingAnnotation(null);
          setCommentText('');
        }
      }
    };

    if (showCommentInput) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCommentInput]);

  // Helper function to get text position from click
  const getTextPositionFromClick = useCallback((event: React.MouseEvent): number => {
    if (!textRef.current) return 0;
    
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (!range || !textRef.current.contains(range.startContainer)) return 0;
    
    let position = 0;
    const walker = document.createTreeWalker(
      textRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node = walker.nextNode();
    while (node && node !== range.startContainer) {
      position += node.textContent?.length || 0;
      node = walker.nextNode();
    }
    
    return position + range.startOffset;
  }, []);

  // Magical click-to-select functionality
  const handleMagicalClick = useCallback((event: React.MouseEvent) => {
    if (!textRef.current) return;
    
    const clickPosition = getTextPositionFromClick(event);
    const rect = textRef.current.getBoundingClientRect();
    
    if (selectionMode === 'idle') {
      // Start selection
      setSelectionMode('selecting');
      setSelectionStart(clickPosition);
      setDebugInfo(`Selection started at position ${clickPosition}`);
      
      // Visual feedback
      textRef.current.style.cursor = 'crosshair';
      toast({
        title: "✨ Magic Selection Started",
        description: "Click anywhere to end selection",
      });
    } else if (selectionMode === 'selecting' && selectionStart !== null) {
      // End selection
      setSelectionMode('idle');
      textRef.current.style.cursor = 'text';
      
      const start = Math.min(selectionStart, clickPosition);
      const end = Math.max(selectionStart, clickPosition);
      
      if (start === end) {
        setSelectionStart(null);
        return;
      }
      
      const selectedText = content.slice(start, end);
      setDebugInfo(`Selected: "${selectedText}" (${start}-${end})`);
      
      // Handle annotation based on mode
      if (selectedMode === 'eraser') {
        setAnnotations(prev => prev.filter(a => !(a.start < end && a.end > start)));
        toast({
          title: "🗑️ Erased",
          description: "Annotations removed from selection",
        });
      } else {
        // Create annotation and show comment input (Feature 1 flow)
        const annotation: AnnotationData = {
          id: `${Date.now()}-${start}`,
          start,
          end,
          type: selectedMode,
          timestamp: Date.now()
        };
        
        setAnnotations(prev => [...prev, annotation]);
        
        // Show comment input
        setPendingAnnotation(annotation);
        setCommentPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top + 20
        });
        setShowCommentInput(true);
      }
      
      setSelectionStart(null);
    }
  }, [selectionMode, selectionStart, selectedMode, content, getTextPositionFromClick, toast]);

  const handleCommentSubmit = () => {
    if (!pendingAnnotation) return;

    // Update existing annotation with comment
    setAnnotations(prev => prev.map(ann => 
      ann.id === pendingAnnotation.id 
        ? { ...ann, comment: commentText.trim() || undefined }
        : ann
    ));

    // Reset state
    setShowCommentInput(false);
    setPendingAnnotation(null);
    setCommentText('');
    
    toast({
      title: "💫 Annotation Added",
      description: commentText.trim() ? "With comment" : "Ready for refinement",
    });
  };

  const handleCommentCancel = () => {
    setShowCommentInput(false);
    setPendingAnnotation(null);
    setCommentText('');
  };

  const clearAnnotations = () => {
    setAnnotations([]);
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const renderAnnotatedContent = () => {
    if (annotations.length === 0) {
      return content;
    }

    // Create a map of character positions to annotations
    const charMap: { [key: number]: AnnotationData[] } = {};
    annotations.forEach(annotation => {
      for (let i = annotation.start; i < annotation.end; i++) {
        if (!charMap[i]) charMap[i] = [];
        charMap[i].push(annotation);
      }
    });

    const result = [];
    let currentAnnotations: AnnotationData[] = [];
    let currentText = '';

    const arraysEqual = (a: AnnotationData[], b: AnnotationData[]): boolean => {
      if (a.length !== b.length) return false;
      const aIds = a.map(ann => ann.id).sort();
      const bIds = b.map(ann => ann.id).sort();
      return aIds.every((id, index) => id === bIds[index]);
    };

    for (let i = 0; i < content.length; i++) {
      const charAnnotations = charMap[i] || [];
      
      // Check if annotations changed
      const annotationsChanged = !arraysEqual(currentAnnotations, charAnnotations);
      
      if (annotationsChanged) {
        // Push current segment if it has content
        if (currentText) {
          if (currentAnnotations.length > 0) {
            // Find the highest priority annotation
            const primaryAnnotation = currentAnnotations.reduce((prev, curr) => {
              const priority = { hot: 4, flush: 3, neutral: 2, eraser: 1 };
              return priority[curr.type] > priority[prev.type] ? curr : prev;
            });
            
            const modeColors = {
              hot: 'annotation-high',
              flush: 'annotation-medium', 
              neutral: 'annotation-neutral',
              eraser: 'annotation-low'
            };
            
            result.push(
              `<span
                class="
                  px-1.5 py-0.5 mx-0.5 rounded-sm cursor-pointer
                  text-foreground font-medium
                  transition-all duration-200 ease-out
                  hover:scale-[1.01]
                  relative
                "
                style="
                  background-color: hsl(var(--${modeColors[primaryAnnotation.type]}-bg));
                  border-left: 3px solid hsl(var(--${modeColors[primaryAnnotation.type]}));
                "
                title="${primaryAnnotation.comment || primaryAnnotation.type}"
              >
                ${currentText}
              </span>`
            );
          } else {
            result.push(currentText);
          }
        }
        
        // Reset for new segment
        currentAnnotations = charAnnotations;
        currentText = content[i];
      } else {
        currentText += content[i];
      }
    }

    // Handle final segment
    if (currentText) {
      if (currentAnnotations.length > 0) {
        const primaryAnnotation = currentAnnotations.reduce((prev, curr) => {
          const priority = { hot: 4, flush: 3, neutral: 2, eraser: 1 };
          return priority[curr.type] > priority[prev.type] ? curr : prev;
        });
        
        const modeColors = {
          hot: 'annotation-high',
          flush: 'annotation-medium',
          neutral: 'annotation-neutral', 
          eraser: 'annotation-low'
        };
        
        result.push(
          `<span
            class="
              px-1.5 py-0.5 mx-0.5 rounded-sm cursor-pointer
              text-foreground font-medium
              transition-all duration-200 ease-out
              hover:scale-[1.01]
              relative
            "
            style="
              background-color: hsl(var(--${modeColors[primaryAnnotation.type]}-bg));
              border-left: 3px solid hsl(var(--${modeColors[primaryAnnotation.type]}));
            "
            title="${primaryAnnotation.comment || primaryAnnotation.type}"
          >
            ${currentText}
          </span>`
        );
      } else {
        result.push(currentText);
      }
    }

    return result.join('');
  };

  return (
    <div className="space-y-6">
      {/* Magic Pencil Controls */}
      <div className="flex flex-wrap items-center gap-4 p-5 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <Palette className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">Magic Mode:</span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedMode === 'hot' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMode('hot')}
            className={`h-9 text-xs font-medium transition-all duration-200 ${
              selectedMode === 'hot' 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' 
                : 'border-annotation-high/30 hover:bg-annotation-high-bg hover:border-annotation-high/50'
            }`}
          >
            <Flame className="w-3 h-3 mr-1.5" />
            🔥 Hot
          </Button>
          
          <Button
            variant={selectedMode === 'neutral' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMode('neutral')}
            className={`h-9 text-xs font-medium transition-all duration-200 ${
              selectedMode === 'neutral' 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' 
                : 'border-annotation-neutral/30 hover:bg-annotation-neutral-bg hover:border-annotation-neutral/50'
            }`}
          >
            <Zap className="w-3 h-3 mr-1.5" />
            ⚪ Neutral
          </Button>
          
          <Button
            variant={selectedMode === 'flush' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMode('flush')}
            className={`h-9 text-xs font-medium transition-all duration-200 ${
              selectedMode === 'flush' 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' 
                : 'border-annotation-medium/30 hover:bg-annotation-medium-bg hover:border-annotation-medium/50'
            }`}
          >
            <Droplets className="w-3 h-3 mr-1.5" />
            💧 Flush
          </Button>
          
          <Button
            variant={selectedMode === 'eraser' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMode('eraser')}
            className={`h-9 text-xs font-medium transition-all duration-200 ${
              selectedMode === 'eraser' 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' 
                : 'border-annotation-low/30 hover:bg-annotation-low-bg hover:border-annotation-low/50'
            }`}
          >
            <Eraser className="w-3 h-3 mr-1.5" />
            🗑️ Eraser
          </Button>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAnnotations}
            className="h-8"
            disabled={annotations.length === 0}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Magic Pencil Experience
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyContent}
                className="h-7"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div 
              ref={textRef}
              className={`text-lg leading-relaxed selectable-text relative transition-all duration-300 min-h-32 p-4 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                selectionMode === 'selecting' ? 'cursor-crosshair' : 'cursor-text'
              }`}
              onClick={handleMagicalClick}
              dangerouslySetInnerHTML={{ __html: renderAnnotatedContent() }}
              style={{ 
                userSelect: 'text',
                minHeight: '120px'
              }}
            />
            
            {/* Inline Comment Input (Feature 1 style) */}
            {showCommentInput && pendingAnnotation && (
              <div 
                ref={commentInputRef}
                className="absolute z-10 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 min-w-64"
                style={{
                  left: `${commentPosition.x}px`,
                  top: `${commentPosition.y}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <span className={`font-medium text-annotation-${
                      pendingAnnotation.type === 'hot' ? 'high' :
                      pendingAnnotation.type === 'flush' ? 'medium' :
                      pendingAnnotation.type === 'neutral' ? 'neutral' : 'low'
                    }`}>
                      {pendingAnnotation.type === 'hot' ? '🔥 Hot' :
                       pendingAnnotation.type === 'flush' ? '💧 Flush' :
                       pendingAnnotation.type === 'neutral' ? '⚪ Neutral' : '❄️ Low'} 
                    </span>
                    {" - Selection highlighted"}
                  </div>
                  <div className="relative">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add comment or press Enter"
                      className="text-xs h-8 border-primary/20 pr-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCommentSubmit();
                        } else if (e.key === 'Escape') {
                          handleCommentCancel();
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleCommentSubmit}
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Magic Selection Mode</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectionMode === 'idle' 
                ? "🪄 Click anywhere in the text to start magical selection"
                : "✨ Selection active! Click again to complete your selection"
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Debug Console */}
      {debugInfo && (
        <Card className="p-4 bg-muted/30">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Debug Info
          </h4>
          <p className="text-xs text-muted-foreground font-mono">{debugInfo}</p>
        </Card>
      )}

      {/* Refine Prompt Button (Feature 1 functionality) */}
      {annotations.length > 0 && onRefinePrompt && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onRefinePrompt}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-glow shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Refine Prompt with Magic Pencil
          </Button>
        </div>
      )}
    </div>
  );
};

export default MagicPencilExperience;