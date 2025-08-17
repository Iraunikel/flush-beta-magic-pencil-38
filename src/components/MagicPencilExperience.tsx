import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
// Using Framer Motion and GSAP for cutting-edge animations
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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
  wordIndex?: number;
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

// Split text into individual words for granular animation
const demoWords = demoText.split(/(\s+|[.,:;!?])/).filter(word => word.trim().length > 0);

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
      // Remove all inline styles/marks on words to fully reset visuals
      requestAnimationFrame(() => {
        const nodes = document.querySelectorAll('[class^="word-"]');
        nodes.forEach(node => {
          const el = node as HTMLElement;
          el.style.background = 'transparent';
          el.style.border = '1px solid transparent';
          el.style.boxShadow = 'none';
        });
      });
      playSound('complete');
    }
  }, [annotations, playSound]);

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

  // Handle text area entry/exit for cursor scoping
  useEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    const handleMouseEnter = () => {
      setIsInTextArea(true);
      if (hasStarted && !showBanner) {
        document.body.style.cursor = 'none';
        setAutoSelectEnabled(true);
      }
    };

    const handleMouseLeave = () => {
      setIsInTextArea(false);
      document.body.style.cursor = 'auto';
      setAutoSelectEnabled(false);
      setHoveredWordIndex(null);
    };

    textElement.addEventListener('mouseenter', handleMouseEnter);
    textElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      textElement.removeEventListener('mouseenter', handleMouseEnter);
      textElement.removeEventListener('mouseleave', handleMouseLeave);
      document.body.style.cursor = 'auto';
    };
  }, [hasStarted, showBanner]);

  // Handle text selection for annotation
  const handleTextSelection = () => {
    if (!hasStarted || selectedMode === 'eraser') return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const text = range.toString().trim();
    
    if (text.length === 0) return;
    
    // Find the word index
    const fullText = textRef.current?.textContent || '';
    const start = range.startOffset;
    const end = range.endOffset;
    
    // Create annotation for selected text
    const newAnnotation: AnnotationData = {
      id: Math.random().toString(36).substr(2, 9),
      start,
      end,
      type: selectedMode as 'hot' | 'neutral' | 'flush',
      timestamp: Date.now()
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    playSound('paint');
    
    // Clear selection
    selection.removeAllRanges();
  };

  // Revolutionary word-by-word rendering with individual hover states
  const renderText = () => {
    return (
      <div className="relative">
        {demoWords.map((word, index) => {
          const annotation = annotations.find(a => a.wordIndex === index);
          const ModeIcon = annotation ? modeStyles[annotation.type].icon : null;
          
          return (
            <motion.span
              key={`word-${index}`}
              className={`word-${index} relative inline-block cursor-pointer transition-all duration-300 mx-0.5 my-1 px-1 py-0.5 rounded-md`}
                style={{
                  background: annotation ? modeStyles[annotation.type].bg : 'rgba(0, 0, 0, 0)',
                  border: annotation ? `1px solid ${modeStyles[annotation.type].border}` : '1px solid rgba(0, 0, 0, 0)',
                  boxShadow: annotation ? modeStyles[annotation.type].glow : 'none'
                }}
               onMouseEnter={() => {
                 setHoveredWordIndex(index);
                 if (hasStarted && autoSelectEnabled) {
                   playSound('hover');
                 }
               }}
               onMouseLeave={() => setHoveredWordIndex(null)}
               onClick={() => {
                 if (!hasStarted || !autoSelectEnabled) return;
                 
                 if (selectedMode === 'eraser' && annotation) {
                   // Remove annotation
                   setAnnotations(prev => prev.filter(a => a.wordIndex !== index));
                   playSound('complete');
                 } else if (selectedMode !== 'eraser') {
                   // Add or update annotation
                   const newAnnotation: AnnotationData = {
                     id: annotation?.id || Math.random().toString(36).substr(2, 9),
                     start: index,
                     end: index + 1,
                     type: selectedMode as 'hot' | 'neutral' | 'flush',
                     timestamp: Date.now(),
                     wordIndex: index
                   };
                   
                   setAnnotations(prev => 
                     annotation 
                       ? prev.map(a => a.wordIndex === index ? newAnnotation : a)
                       : [...prev, newAnnotation]
                   );
                   
                   playSound('paint');
                   setStreakCount(prev => prev + 1);
                 }
               }}
               whileHover={{ 
                 scale: hasStarted && autoSelectEnabled ? 1.05 : 1,
                 y: hasStarted && autoSelectEnabled ? -1 : 0
               }}
               whileTap={{ scale: 0.95 }}
            >
              {word}
              
              {/* Individual word icon overlay */}
              {annotation && ModeIcon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-background border border-primary/20 flex items-center justify-center"
                >
                  <ModeIcon className="w-2 h-2" style={{ color: modeStyles[annotation.type].border }} />
                </motion.div>
              )}
              
              {/* Hover effect indicator */}
              {hoveredWordIndex === index && hasStarted && autoSelectEnabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-md border-2 border-primary/50"
                  style={{
                    background: `linear-gradient(135deg, ${modeStyles[selectedMode].bg})`
                  }}
                />
              )}
            </motion.span>
          );
        })}
      </div>
    );
  };

  const currentStats = analytics();
  const refinedPrompt = generateRefinedPrompt();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          {/* Brand */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Magic Pencil</h1>
                <p className="text-sm text-muted-foreground">Paint your thoughts, shape AI responses</p>
              </div>
            </div>
            
            {annotations.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              className="h-auto p-3 flex-col gap-1 min-w-24 bg-primary text-primary-foreground shadow-sm"
            >
              <Wand2 className="w-4 h-4" />
              <span className="text-xs font-medium">Magic Pencil</span>
            </Button>
          </nav>
        </div>
      </header>

      <section ref={containerRef} className="py-8 px-6 relative">
        {/* Enhanced Magic Pencil Cursor */}
        <AnimatePresence>
          {isInTextArea && hasStarted && !showBanner && (
            <motion.div
              ref={pencilRef}
              className="magic-cursor fixed z-50 pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                rotate: pencilRotation,
                left: cursorPosition.x - 16,
                top: cursorPosition.y - 16,
              }}
            >
              {/* Main cursor body */}
              <div className="relative">
                {/* Cursor tip */}
                <div 
                  className="w-8 h-8 rounded-full border-2 transition-all duration-200"
                  style={{
                    background: modeStyles[selectedMode].bg,
                    borderColor: modeStyles[selectedMode].border,
                    boxShadow: modeStyles[selectedMode].glow,
                    filter: modeStyles[selectedMode].sparkle
                  }}
                >
                  <div className="absolute inset-0 rounded-full animate-pulse"
                       style={{ 
                         background: modeStyles[selectedMode].bg,
                         opacity: 0.6 
                       }} 
                  />
                </div>
                
                {/* Mode indicator */}
                <div className="absolute -right-2 -top-2 w-4 h-4 rounded-full bg-background border border-primary/20 flex items-center justify-center">
                  {React.createElement(modeStyles[selectedMode].icon, { 
                    className: "w-2 h-2",
                    style: { color: modeStyles[selectedMode].border }
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-6 py-20 space-y-16">
          {/* Header Section */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Magic Pencil Experience</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
              Transform AI feedback from tedious typing to intuitive painting. Select text ranges and annotate with natural gestures.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center justify-center gap-8">
            <span className="text-sm font-medium text-foreground">Mode:</span>
            
            {[
              { type: 'hot' as const, label: 'Hot', icon: '🔥', key: '1' },
              { type: 'neutral' as const, label: 'Neutral', icon: '⚖️', key: '2' },
              { type: 'flush' as const, label: 'Flush', icon: '💧', key: '3' },
              { type: 'eraser' as const, label: 'Eraser', icon: '✖️', key: '4/E' }
            ].map((mode) => (
              <Button
                key={mode.type}
                variant={selectedMode === mode.type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMode(mode.type)}
                className={`flex items-center gap-2 min-w-24 ${
                  selectedMode === mode.type 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">{mode.key}</kbd>
              </Button>
            ))}
            
            <span className="text-xs text-muted-foreground">Select text to annotate</span>
          </div>

          {/* Start Annotating Button */}
          {showBanner && (
            <div className="text-center">
              <Button
                onClick={() => {
                  setShowBanner(false);
                  setHasStarted(true);
                  setAutoSelectEnabled(true);
                  document.body.style.cursor = 'none';
                }}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Annotating
              </Button>
            </div>
          )}

          {/* AI Response Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">AI Response</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Coverage:</span>
                <span className="text-sm font-medium">{currentStats.coverage}%</span>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${currentStats.coverage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div 
              ref={textRef}
              className="text-area-border p-8 border rounded-xl bg-background min-h-[200px] relative transition-all duration-300"
              style={{
                borderColor: isInTextArea && hasStarted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                boxShadow: isInTextArea && hasStarted ? '0 0 20px rgba(var(--primary), 0.2)' : 'none'
              }}
              onMouseUp={handleTextSelection}
            >
              <div className="text-lg leading-relaxed text-foreground selectable-text">
                {renderText()}
              </div>
            </div>
          </div>

          {/* Results Section */}
          {annotations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Analytics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{currentStats.hotPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Hot</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-slate-500">{currentStats.neutralPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Neutral</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">{currentStats.flushPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Flush</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{currentStats.coverage}%</div>
                  <div className="text-sm text-muted-foreground">Coverage</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowRefinedPrompt(true)}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Flush It!
                </Button>
                <Button
                  variant="outline"
                  onClick={clearAnnotations}
                >
                  Clear All
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Refined Prompt Modal */}
        <AnimatePresence>
          {showRefinedPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card p-8 rounded-2xl border shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Refined Prompt</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRefinedPrompt(false)}
                    className="p-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap text-foreground font-mono">
                      {refinedPrompt}
                    </pre>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => navigator.clipboard.writeText(refinedPrompt)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Prompt
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRefinedPrompt(false);
                        onStartAnnotating();
                      }}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Apply & Continue
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default MagicPencilExperience;