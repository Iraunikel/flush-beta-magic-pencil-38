import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wand2,
  Flame,
  Target,
  Droplets,
  X,
  Copy,
  RefreshCw,
  Sparkles,
  Volume2
} from 'lucide-react';

interface AnnotationData {
  id: string;
  start: number;
  end: number;
  type: 'hot' | 'neutral' | 'flush';
  comment?: string;
  timestamp: number;
  intensity?: number;
}

interface MagicPencilExperienceProps {
  onStartAnnotating: () => void;
}

const demoText = `The future of AI interaction isn't about crafting perfect prompts. It's about creating a dialogue where your intuition guides the machine's understanding. Magic Pencil transforms this vision into reality by letting you paint your intentions directly onto AI responses. Draw your thoughts, highlight insights, cross out noise. Every gesture becomes structured feedback that trains smarter conversations.`;

const MagicPencilExperience: React.FC<MagicPencilExperienceProps> = ({ onStartAnnotating }) => {
  const [selectedMode, setSelectedMode] = useState<'hot' | 'neutral' | 'flush' | 'eraser'>('neutral');
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showRefinedPrompt, setShowRefinedPrompt] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [undoStack, setUndoStack] = useState<AnnotationData[][]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const textRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Enhanced mode styles with consistent button design
  const modeStyles = {
    hot: {
      icon: Flame,
      label: 'Hot',
      description: 'Emphasize'
    },
    neutral: {
      icon: Target,
      label: 'Neutral',
      description: 'Neutral'
    },
    flush: {
      icon: Droplets,
      label: 'Flush',
      description: 'Remove'
    },
    eraser: {
      icon: X,
      label: 'Eraser',
      description: 'Clear'
    }
  };

  // Sound generation for feedback
  const playSound = useCallback((type: 'select' | 'paint' | 'complete' | 'hover') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      const frequencies = {
        select: 800,
        paint: 1200,
        complete: 1600,
        hover: 400
      };
      
      oscillator.frequency.setValueAtTime(frequencies[type], ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [soundEnabled]);

  // Analytics calculation
  const analytics = useCallback(() => {
    const total = demoText.length;
    const annotatedChars = annotations.reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const coverage = total > 0 ? (annotatedChars / total) * 100 : 0;
    
    return {
      coverage: Math.round(coverage),
      annotationCount: annotations.length
    };
  }, [annotations]);

  // Generate refined prompt
  const generateRefinedPrompt = useCallback(() => {
    if (annotations.length === 0) return '';
    
    const hotTexts = annotations
      .filter(a => a.type === 'hot')
      .map(a => demoText.slice(a.start, a.end).trim())
      .filter(text => text.length > 0);
    
    const flushTexts = annotations
      .filter(a => a.type === 'flush')
      .map(a => demoText.slice(a.start, a.end).trim())
      .filter(text => text.length > 0);
    
    const comments = annotations
      .filter(a => a.comment && a.comment.trim())
      .map(a => a.comment?.trim())
      .filter(Boolean);
    
    let prompt = 'Refined AI instruction based on user feedback:\n\n';
    
    if (hotTexts.length > 0) {
      prompt += `✨ EMPHASIZE & EXPAND:\n${hotTexts.map(text => `• "${text}"`).join('\n')}\n\n`;
    }
    
    if (flushTexts.length > 0) {
      prompt += `🔥 REDUCE OR REMOVE:\n${flushTexts.map(text => `• "${text}"`).join('\n')}\n\n`;
    }
    
    if (comments.length > 0) {
      prompt += `💭 ADDITIONAL GUIDANCE:\n${comments.map(comment => `• ${comment}`).join('\n')}\n\n`;
    }
    
    prompt += 'Apply these changes to create a more targeted and effective response.';
    
    return prompt;
  }, [annotations]);

  // Clear all annotations
  const clearAnnotations = useCallback(() => {
    if (annotations.length > 0) {
      setUndoStack(prev => [...prev, annotations]);
      setAnnotations([]);
      playSound('complete');
    }
  }, [annotations, playSound]);

  // Undo last annotation
  const undoLastAnnotation = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setAnnotations(previousState);
      setUndoStack(prev => prev.slice(0, -1));
      playSound('hover');
    } else if (annotations.length > 0) {
      setUndoStack(prev => [...prev, annotations]);
      setAnnotations(prev => prev.slice(0, -1));
      playSound('hover');
    }
  }, [annotations, undoStack, playSound]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) return;

    const start = demoText.indexOf(selectedText);
    if (start === -1) return;
    
    const end = start + selectedText.length;

    // Remove overlapping annotations
    const updatedAnnotations = annotations.filter(annotation => {
      return !(annotation.start <= start && annotation.end >= end) &&
             !(start <= annotation.start && end >= annotation.end) &&
             !(start < annotation.end && end > annotation.start);
    });

    if (selectedMode !== 'eraser') {
      const newAnnotation: AnnotationData = {
        id: `annotation-${Date.now()}-${Math.random()}`,
        start,
        end,
        type: selectedMode as 'hot' | 'neutral' | 'flush',
        timestamp: Date.now()
      };
      updatedAnnotations.push(newAnnotation);
    }

    setAnnotations(updatedAnnotations);
    playSound('select');
    
    // Clear selection
    selection.removeAllRanges();
  }, [annotations, selectedMode, playSound]);

  // Render annotated text
  const renderAnnotatedText = () => {
    if (annotations.length === 0) {
      return demoText;
    }

    // Create character map
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

    for (let i = 0; i < demoText.length; i++) {
      const charAnnotations = charMap[i] || [];
      
      // Check if annotations changed
      const annotationsChanged = currentAnnotations.length !== charAnnotations.length ||
        !currentAnnotations.every(ann => charAnnotations.some(ca => ca.id === ann.id));
      
      if (annotationsChanged) {
        // Push current segment
        if (currentText) {
          if (currentAnnotations.length > 0) {
            const primaryAnnotation = currentAnnotations[0];
            const colorMap = {
              hot: 'rgba(239, 68, 68, 0.2)',
              neutral: 'rgba(148, 163, 184, 0.2)',
              flush: 'rgba(59, 130, 246, 0.2)'
            };
            
            result.push(
              `<span style="background-color: ${colorMap[primaryAnnotation.type]}; padding: 2px 4px; border-radius: 4px; margin: 0 1px;">${currentText}</span>`
            );
          } else {
            result.push(currentText);
          }
        }
        
        currentAnnotations = charAnnotations;
        currentText = demoText[i];
      } else {
        currentText += demoText[i];
      }
    }

    // Handle final segment
    if (currentText) {
      if (currentAnnotations.length > 0) {
        const primaryAnnotation = currentAnnotations[0];
        const colorMap = {
          hot: 'rgba(239, 68, 68, 0.2)',
          neutral: 'rgba(148, 163, 184, 0.2)',
          flush: 'rgba(59, 130, 246, 0.2)'
        };
        
        result.push(
          `<span style="background-color: ${colorMap[primaryAnnotation.type]}; padding: 2px 4px; border-radius: 4px; margin: 0 1px;">${currentText}</span>`
        );
      } else {
        result.push(currentText);
      }
    }

    return result.join('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Magic Pencil Experience</h3>
        <p className="text-sm text-muted-foreground">Paint your feedback directly onto AI responses</p>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Mode:</span>
        </div>
        
        <div className="flex gap-2">
          {(['hot', 'neutral', 'flush', 'eraser'] as const).map((mode) => {
            const style = modeStyles[mode];
            const isSelected = selectedMode === mode;
            
            return (
              <Button
                key={mode}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedMode(mode);
                  playSound('select');
                }}
                className="h-8 text-xs"
              >
                <style.icon className="w-3 h-3 mr-1" />
                {style.label}
              </Button>
            );
          })}
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(prev => !prev)}
            className="h-8"
          >
            <Volume2 className={`w-3 h-3 mr-1 ${!soundEnabled ? 'opacity-50' : ''}`} />
            Sound
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={undoLastAnnotation}
            className="h-8"
            disabled={annotations.length === 0 && undoStack.length === 0}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAnnotations}
            className="h-8"
            disabled={annotations.length === 0}
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Start Annotating Button */}
      {!hasStarted && (
        <div className="text-center">
          <Button
            onClick={() => {
              setHasStarted(true);
              playSound('complete');
            }}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Start Annotating
          </Button>
        </div>
      )}

      {/* AI Response Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              AI Response
              <span className="text-xs text-muted-foreground font-normal">(Select text to annotate)</span>
            </h4>
            {annotations.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {analytics().coverage}% covered
              </Badge>
            )}
          </div>
          
          <div className="relative">
            <div
              ref={textRef}
              className="min-h-32 text-sm select-text p-4 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed cursor-pointer"
              onMouseUp={hasStarted ? handleTextSelection : undefined}
              dangerouslySetInnerHTML={{ __html: renderAnnotatedText() }}
              style={{ 
                userSelect: hasStarted ? 'text' : 'none',
                minHeight: '120px'
              }}
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      {annotations.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (generateRefinedPrompt()) {
                navigator.clipboard?.writeText(generateRefinedPrompt());
                playSound('complete');
              }
            }}
            className="h-8"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Refined Prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRefinedPrompt(prev => !prev)}
            className="h-8"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {showRefinedPrompt ? 'Hide' : 'Show'} Refined Prompt
          </Button>
        </div>
      )}

      {/* Refined Prompt Display */}
      {showRefinedPrompt && annotations.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Refined Prompt
          </h4>
          <Textarea
            value={generateRefinedPrompt()}
            readOnly
            className="min-h-32 text-xs font-mono"
            placeholder="Your refined prompt will appear here..."
          />
        </Card>
      )}
    </div>
  );
};

export default MagicPencilExperience;