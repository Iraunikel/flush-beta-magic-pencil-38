import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
// Using Framer Motion and GSAP for cutting-edge animations
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Palette, 
  Sparkles, 
  MessageCircle, 
  Download,
  BarChart3,
  Wand2,
  Zap,
  X,
  Copy,
  RefreshCw,
  Target,
  Flame,
  Droplets,
  Award,
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

interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  type: 'sparkle' | 'paint' | 'confetti';
  color: string;
}

const demoText = `The future of AI interaction isn't about crafting perfect prompts. It's about creating a dialogue where your intuition guides the machine's understanding. Magic Pencil transforms this vision into reality by letting you paint your intentions directly onto AI responses. Draw your thoughts, highlight insights, cross out noise. Every gesture becomes structured feedback that trains smarter conversations.`;

const MagicPencilExperience: React.FC<MagicPencilExperienceProps> = ({ onStartAnnotating }) => {
  const [selectedMode, setSelectedMode] = useState<'hot' | 'neutral' | 'flush' | 'eraser'>('neutral');
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [selectedText, setSelectedText] = useState<{start: number, end: number} | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [focusAchieved, setFocusAchieved] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showRefinedPrompt, setShowRefinedPrompt] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [paintTrail, setPaintTrail] = useState<Array<{x: number, y: number, timestamp: number}>>([]);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [brushSize, setBrushSize] = useState(20);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [isInTextArea, setIsInTextArea] = useState(false);
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(false);
  const [gestureDetection, setGestureDetection] = useState({ 
    velocityY: 0, 
    direction: 'none' as 'up' | 'down' | 'none',
    swingCount: 0,
    lastSwingTime: 0 
  });
  const [undoStack, setUndoStack] = useState<AnnotationData[][]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activeAnnotationForComment, setActiveAnnotationForComment] = useState<string | null>(null);
  const [commentInputText, setCommentInputText] = useState('');
  
  // Motion values for advanced interactions
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const pencilRotation = useTransform(mouseX, [0, window.innerWidth], [-15, 15]);
  
  const textRef = useRef<HTMLDivElement>(null);
  const pencilRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const commentModalRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Enhanced mode styles with temperature scale
  const modeStyles = {
    hot: {
      bg: 'linear-gradient(135deg, rgba(255, 87, 51, 0.15), rgba(255, 120, 90, 0.08))',
      border: 'rgba(255, 87, 51, 0.4)',
      glow: '0 0 30px rgba(255, 87, 51, 0.25), inset 0 0 15px rgba(255, 87, 51, 0.1)',
      sparkle: 'drop-shadow(0 0 5px rgba(255, 87, 51, 1)) drop-shadow(0 0 10px rgba(255, 87, 51, 0.5))',
      icon: Flame,
      temperature: 100
    },
    neutral: {
      bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(203, 213, 225, 0.05))',
      border: 'rgba(148, 163, 184, 0.3)',
      glow: '0 0 20px rgba(148, 163, 184, 0.15), inset 0 0 10px rgba(148, 163, 184, 0.05)',
      sparkle: 'drop-shadow(0 0 3px rgba(148, 163, 184, 0.8))',
      icon: Target,
      temperature: 50
    },
    flush: {
      bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.08))',
      border: 'rgba(59, 130, 246, 0.4)',
      glow: '0 0 30px rgba(59, 130, 246, 0.25), inset 0 0 15px rgba(59, 130, 246, 0.1)',
      sparkle: 'drop-shadow(0 0 5px rgba(59, 130, 246, 1)) drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
      icon: Droplets,
      temperature: 0
    },
    eraser: {
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(248, 113, 113, 0.08))',
      border: 'rgba(239, 68, 68, 0.4)',
      glow: '0 0 20px rgba(239, 68, 68, 0.25), inset 0 0 10px rgba(239, 68, 68, 0.1)',
      sparkle: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.8))',
      icon: X,
      temperature: 25
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
    
    const hotChars = annotations.filter(a => a.type === 'hot').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const neutralChars = annotations.filter(a => a.type === 'neutral').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const flushChars = annotations.filter(a => a.type === 'flush').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    
    return {
      coverage: Math.round(coverage),
      hotPercentage: total > 0 ? Math.round((hotChars / total) * 100) : 0,
      neutralPercentage: total > 0 ? Math.round((neutralChars / total) * 100) : 0,
      flushPercentage: total > 0 ? Math.round((flushChars / total) * 100) : 0,
      annotationCount: annotations.length
    };
  }, [annotations]);

  // Generate refined prompt
  const generateRefinedPrompt = useCallback(() => {
    if (annotations.length === 0) return '';
    
    const hotAnnotations = annotations.filter(a => a.type === 'hot');
    const neutralAnnotations = annotations.filter(a => a.type === 'neutral');
    const flushAnnotations = annotations.filter(a => a.type === 'flush');
    
    let prompt = 'Please analyze this AI response and improve it based on my feedback:\n\n';
    
    if (hotAnnotations.length > 0) {
      prompt += '🔥 EXPAND AND ENHANCE these parts (marked as HOT):\n';
      hotAnnotations.forEach(annotation => {
        const text = demoText.slice(annotation.start, annotation.end).trim();
        prompt += `- "${text}"${annotation.comment ? ` (${annotation.comment})` : ''}\n`;
      });
      prompt += '\n';
    }
    
    if (neutralAnnotations.length > 0) {
      prompt += '👍 KEEP THE SAME these parts (marked as NEUTRAL):\n';
      neutralAnnotations.forEach(annotation => {
        const text = demoText.slice(annotation.start, annotation.end).trim();
        prompt += `- "${text}"${annotation.comment ? ` (${annotation.comment})` : ''}\n`;
      });
      prompt += '\n';
    }
    
    if (flushAnnotations.length > 0) {
      prompt += '🚽 REMOVE OR MINIMIZE these parts (marked as FLUSH):\n';
      flushAnnotations.forEach(annotation => {
        const text = demoText.slice(annotation.start, annotation.end).trim();
        prompt += `- "${text}"${annotation.comment ? ` (${annotation.comment})` : ''}\n`;
      });
      prompt += '\n';
    }
    
    prompt += 'Please provide an improved version of the response that incorporates this feedback.';
    
    return prompt;
  }, [annotations]);

  // Convert annotations to unified format for analytics
  const unifiedAnnotations = React.useMemo(() => {
    return annotations.map(annotation => ({
      id: annotation.id,
      type: 'magic-pencil' as const,
      relevanceLevel: annotation.type as 'hot' | 'neutral' | 'flush',
      text: demoText.slice(annotation.start, annotation.end),
      comment: annotation.comment || '',
      timestamp: annotation.timestamp,
      startIndex: annotation.start,
      endIndex: annotation.end
    }));
  }, [annotations]);

  // Enhanced text selection handler for range selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || isDragging) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText || !textRef.current) return;

    // Calculate text indices for the selected range
    const fullText = textRef.current.textContent || '';
    const selectionStart = fullText.indexOf(selectedText);
    const selectionEnd = selectionStart + selectedText.length;

    if (selectionStart === -1) return;

    // For eraser mode, remove any overlapping annotations
    if (selectedMode === 'eraser') {
      setAnnotations(prev => prev.filter(annotation => {
        return !(annotation.start <= selectionStart && annotation.end >= selectionEnd) &&
               !(selectionStart <= annotation.start && selectionEnd >= annotation.end) &&
               !(selectionStart < annotation.end && selectionEnd > annotation.start);
      }));
      
      // Clear selection
      selection.removeAllRanges();
      playSound('select');
      return;
    }

    // Create new annotation for the selected range
    const newAnnotation: AnnotationData = {
      id: `annotation-${Date.now()}-${Math.random()}`,
      start: selectionStart,
      end: selectionEnd,
      type: selectedMode as 'hot' | 'neutral' | 'flush',
      timestamp: Date.now(),
      intensity: selectedMode === 'hot' ? 100 : selectedMode === 'flush' ? 0 : 50
    };

    // Add the annotation
    setAnnotations(prev => [...prev, newAnnotation]);
    
    // Show comment modal for this range
    setActiveAnnotationForComment(newAnnotation.id);
    setCommentInputText('');
    setShowCommentModal(true);
    
    // Clear selection
    selection.removeAllRanges();
    playSound('select');
  }, [selectedMode, isDragging, playSound]);

  // Handle annotation click for adding comments
  const handleAnnotationClick = useCallback((annotation: AnnotationData) => {
    if (!isDragging) {
      setActiveAnnotationForComment(annotation.id);
      setCommentInputText(annotation.comment || '');
      setShowCommentModal(true);
    }
  }, [isDragging]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(() => {
    if (activeAnnotationForComment === null) return;
    
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === activeAnnotationForComment
        ? { ...annotation, comment: commentInputText }
        : annotation
    ));
    
    setShowCommentModal(false);
    setActiveAnnotationForComment(null);
    setCommentInputText('');
  }, [activeAnnotationForComment, commentInputText]);

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

  // Keyboard mode switching for reliable desktop interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate when in text area and started
      if (!isInTextArea || !hasStarted) return;
      
      let newMode = selectedMode;
      
      switch (e.key) {
        case '1':
          newMode = 'hot';
          break;
        case '2':
          newMode = 'neutral';
          break;
        case '3':
          newMode = 'flush';
          break;
        case '4':
        case 'e':
        case 'E':
          newMode = 'eraser';
          break;
        case 'ArrowUp':
          // Cycle up: flush → neutral → hot → eraser → flush
          newMode = selectedMode === 'flush' ? 'neutral' : 
                   selectedMode === 'neutral' ? 'hot' : 
                   selectedMode === 'hot' ? 'eraser' : 'flush';
          break;
        case 'ArrowDown':
          // Cycle down: hot → neutral → flush → eraser → hot
          newMode = selectedMode === 'hot' ? 'neutral' : 
                   selectedMode === 'neutral' ? 'flush' : 
                   selectedMode === 'flush' ? 'eraser' : 'hot';
          break;
        default:
          return;
      }
      
      if (newMode !== selectedMode) {
        console.log(`Mode switch: ${selectedMode} → ${newMode} via keyboard`);
        setSelectedMode(newMode);
        playSound('select');
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMode, isInTextArea, hasStarted, playSound]);

  // Enhanced cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      
      setCursorPosition({ x, y });
      mouseX.set(x);
      mouseY.set(y);
      
      // Dynamic brush size based on velocity
      const velocity = Math.sqrt(
        Math.pow(x - cursorPosition.x, 2) + Math.pow(y - cursorPosition.y, 2)
      );
      setBrushSize(Math.max(15, Math.min(40, 20 + velocity * 0.5)));
      
      if (pencilRef.current && isInTextArea) {
        // Advanced pencil physics with tilt based on mode
        const tilt = selectedMode === 'hot' ? 25 : selectedMode === 'flush' ? -25 : velocity * 0.3;
        
        gsap.to(pencilRef.current, {
          x: x - 16,
          y: y - 16,
          rotation: tilt,
          scale: isDragging ? 1.2 : 1,
          duration: 0.15,
          ease: "power3.out"
        });

        // Paint trail effect during interaction
        if (isDragging) {
          setPaintTrail(prev => [
            ...prev.slice(-20), // Keep last 20 points
            { x, y, timestamp: Date.now() }
          ]);
        }
      }
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => {
      setIsDragging(false);
      setPaintTrail([]);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedMode, hasStarted, isDragging, cursorPosition, mouseX, mouseY, isInTextArea]);

  // Enhanced function to render text with range-based annotations
  const renderAnnotatedText = () => {
    if (annotations.length === 0) {
      return <span className="select-text">{demoText}</span>;
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

    for (let i = 0; i < demoText.length; i++) {
      const charAnnotations = charMap[i] || [];
      
      // Check if annotations changed
      const annotationsChanged = !arraysEqual(currentAnnotations, charAnnotations);
      
      if (annotationsChanged) {
        // Push current segment if it has content
        if (currentText) {
          if (currentAnnotations.length > 0) {
            // Find the primary annotation (most recent for overlaps)
            const primaryAnnotation = currentAnnotations[currentAnnotations.length - 1];
            const style = modeStyles[primaryAnnotation.type];
            
            result.push(
              <motion.span
                key={`annotation-${result.length}`}
                className="inline-block px-1.5 py-0.5 mx-0.5 rounded-sm cursor-pointer transition-all duration-200 ease-out hover:scale-[1.01] relative select-text"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  boxShadow: style.glow
                }}
                onClick={() => handleAnnotationClick(primaryAnnotation)}
                title={primaryAnnotation.comment || `${primaryAnnotation.type.toUpperCase()} annotation`}
              >
                {currentText}
                {primaryAnnotation.comment && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-background"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </motion.span>
            );
          } else {
            result.push(<span key={`text-${result.length}`} className="select-text">{currentText}</span>);
          }
        }
        
        // Reset for new segment
        currentAnnotations = charAnnotations;
        currentText = demoText[i];
      } else {
        currentText += demoText[i];
      }
    }

    // Handle final segment
    if (currentText) {
      if (currentAnnotations.length > 0) {
        const primaryAnnotation = currentAnnotations[currentAnnotations.length - 1];
        const style = modeStyles[primaryAnnotation.type];
        
        result.push(
          <motion.span
            key={`annotation-${result.length}`}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded-sm cursor-pointer transition-all duration-200 ease-out hover:scale-[1.01] relative select-text"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              boxShadow: style.glow
            }}
            onClick={() => handleAnnotationClick(primaryAnnotation)}
            title={primaryAnnotation.comment || `${primaryAnnotation.type.toUpperCase()} annotation`}
          >
            {currentText}
            {primaryAnnotation.comment && (
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-background"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              />
            )}
          </motion.span>
        );
      } else {
        result.push(<span key={`text-${result.length}`} className="select-text">{currentText}</span>);
      }
    }

    return result;
  };

  // Check for focus achievement
  useEffect(() => {
    const stats = analytics();
    if (stats.coverage >= 95 && !focusAchieved && annotations.length > 0) {
      setFocusAchieved(true);
    }
  }, [annotations, focusAchieved, analytics]);

  const currentStats = analytics();

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 relative overflow-hidden"
    >
      {/* Magic Pencil Cursor */}
      <AnimatePresence>
        {hasStarted && isInTextArea && (
          <motion.div
            ref={pencilRef}
            className="fixed top-0 left-0 pointer-events-none z-50 pencil-glow"
            style={{
              rotate: pencilRotation,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <div 
              className="w-8 h-8 rounded-full border-2 transition-all duration-200"
              style={{
                background: modeStyles[selectedMode].bg,
                borderColor: modeStyles[selectedMode].border,
                boxShadow: modeStyles[selectedMode].glow,
                filter: modeStyles[selectedMode].sparkle
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommentModal(false)}
          >
            <motion.div
              ref={commentModalRef}
              className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-foreground">Add Comment</h3>
              <Input
                value={commentInputText}
                onChange={(e) => setCommentInputText(e.target.value)}
                placeholder="Add a comment (optional)"
                className="mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCommentSubmit();
                  } else if (e.key === 'Escape') {
                    setShowCommentModal(false);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button onClick={handleCommentSubmit} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setShowCommentModal(false)}>
                  Skip
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Wand2 className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
              Magic Pencil Experience
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transform AI feedback from tedious typing to intuitive painting. Select text ranges and annotate with natural gestures.
          </p>

          {/* Mode Selector with Temperature Scale */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-3 bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-foreground">Mode:</div>
              <div className="text-xs text-muted-foreground">Select text to annotate</div>
            </div>
            
            {Object.entries(modeStyles).map(([mode, style]) => {
              const Icon = style.icon;
              const isSelected = selectedMode === mode;
              const modeKey = mode === 'hot' ? '1' : mode === 'neutral' ? '2' : mode === 'flush' ? '3' : '4/E';
              
              return (
                <motion.button
                  key={mode}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300
                    ${isSelected 
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                      : 'border-border/30 bg-background/50 text-foreground hover:border-primary/50'
                    }
                  `}
                  onClick={() => setSelectedMode(mode as any)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium capitalize">{mode}</span>
                  <Badge variant="outline" className="text-xs">
                    {modeKey}
                  </Badge>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Start Button */}
            {!hasStarted && (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  size="lg"
                  onClick={() => {
                    setHasStarted(true);
                    setShowBanner(false);
                  }}
                  className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Annotating
                </Button>
              </motion.div>
            )}

            {/* Keyboard Shortcuts Guide */}
            {hasStarted && (
              <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>Use keys: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">1</kbd>Hot <kbd className="px-1 py-0.5 bg-muted rounded text-xs">2</kbd>Neutral <kbd className="px-1 py-0.5 bg-muted rounded text-xs">3</kbd>Flush <kbd className="px-1 py-0.5 bg-muted rounded text-xs">4/E</kbd>Eraser</span>
                  <span>or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd> to cycle modes</span>
                </div>
              </Card>
            )}

            {/* Interactive Text Area */}
            <Card className="text-area-border p-6 bg-gradient-to-br from-background via-primary/3 to-accent/3 border-primary/20 min-h-[400px] relative transition-all duration-300">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">AI Response</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Coverage: {currentStats.coverage}%</span>
                  <Progress value={currentStats.coverage} className="w-20 h-2" />
                </div>
              </div>
              
              <div 
                ref={textRef}
                className={`
                  relative text-base leading-relaxed text-foreground
                  transition-all duration-500 ease-out p-6 rounded-xl
                  ${isInTextArea ? 'bg-gradient-to-br from-card/50 to-background/30 border-2 border-primary/20' : 'bg-card/30 border border-border/30'}
                  ${hasStarted ? 'cursor-none' : 'cursor-text'}
                  backdrop-blur-sm select-text
                `}
                onMouseEnter={() => setIsInTextArea(true)}
                onMouseLeave={() => setIsInTextArea(false)}
                onMouseUp={handleTextSelection}
              >
                {renderAnnotatedText()}
              </div>
            </Card>

            {/* Focus Achievement */}
            <AnimatePresence>
              {focusAchieved && (
                <motion.div
                  className="focus-message text-center p-6 bg-gradient-to-r from-primary/20 via-accent/20 to-primary-glow/20 rounded-xl border border-primary/30"
                  initial={{ scale: 0, opacity: 0, rotateY: 180 }}
                  animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 1.2, ease: "backOut" }}
                >
                  <div className="flex items-center justify-center gap-3 text-primary mb-3">
                    <Sparkles className="w-8 h-8" />
                    <span className="text-2xl font-bold">Focus Achieved!</span>
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Complete attention achieved. Ready to refine your prompt.
                  </p>
                  <Button 
                    onClick={() => setShowRefinedPrompt(true)}
                    className="bg-gradient-to-r from-primary to-primary-glow"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Refined Prompt
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar with Analytics */}
          <div className="space-y-6">
            {/* Stats Panel */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">{currentStats.coverage}%</span>
                  </div>
                  <Progress value={currentStats.coverage} className="h-2" />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
                    <div className="font-bold text-red-500">{currentStats.hotPercentage}%</div>
                    <div className="text-muted-foreground">Hot</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gradient-to-br from-slate-500/10 to-gray-500/10 border border-slate-500/20">
                    <div className="font-bold text-slate-500">{currentStats.neutralPercentage}%</div>
                    <div className="text-muted-foreground">Neutral</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <div className="font-bold text-blue-500">{currentStats.flushPercentage}%</div>
                    <div className="text-muted-foreground">Flush</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="text-sm text-muted-foreground">
                    Annotations: <span className="font-medium text-foreground">{currentStats.annotationCount}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <Card className="p-6 space-y-3">
              <Button 
                onClick={() => setShowRefinedPrompt(true)}
                disabled={annotations.length === 0}
                className="w-full bg-gradient-to-r from-primary to-primary-glow"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Refined Prompt
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={undoLastAnnotation} disabled={annotations.length === 0 && undoStack.length === 0}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Undo
                </Button>
                <Button variant="outline" onClick={clearAnnotations} disabled={annotations.length === 0}>
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              
              <Button variant="outline" onClick={() => setSoundEnabled(!soundEnabled)} className="w-full">
                <Volume2 className={`w-4 h-4 mr-2 ${!soundEnabled ? 'opacity-50' : ''}`} />
                Sound {soundEnabled ? 'On' : 'Off'}
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Refined Prompt Modal */}
      <AnimatePresence>
        {showRefinedPrompt && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRefinedPrompt(false)}
          >
            <motion.div
              className="bg-card rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-auto border shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Refined Prompt
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRefinedPrompt(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="bg-background rounded-lg p-4 border">
                <Textarea
                  value={generateRefinedPrompt()}
                  readOnly
                  className="min-h-80 resize-none border-0 p-0 focus:ring-0 text-sm leading-relaxed"
                />
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(generateRefinedPrompt());
                    setShowRefinedPrompt(false);
                  }}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy & Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MagicPencilExperience;