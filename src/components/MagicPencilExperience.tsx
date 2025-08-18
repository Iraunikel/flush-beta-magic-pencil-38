import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
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
  const lineRectsRef = useRef<Array<{ top: number; bottom: number; firstIndex: number; firstRect: DOMRect }>>([]);
  const lastLineIndexRef = useRef<number>(-1);
  const snapUntilRef = useRef<number>(0);

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

  // Simplified gesture detection - disabled for reliable interaction
  const detectGesture = useCallback((velocityY: number) => {
    // Gesture detection disabled in favor of keyboard shortcuts
    return;
  }, []);

  // Enhanced word annotation for auto-selection with improved eraser
  const handleWordAnnotation = useCallback((wordIndex: number, word: string, isClick = false) => {
    console.log(`Annotation attempt: word=${word}, index=${wordIndex}, mode=${selectedMode}, isClick=${isClick}`);
    
    // Handle eraser mode - remove existing annotation
    if (selectedMode === 'eraser') {
      const existingAnnotation = annotations.find(a => a.wordIndex === wordIndex);
      console.log('Eraser mode - existing annotation:', existingAnnotation);
      
      if (existingAnnotation) {
        setUndoStack(prev => [...prev, annotations]);
        setAnnotations(prev => {
          const filtered = prev.filter(a => a.wordIndex !== wordIndex);
          console.log('After erasing:', filtered.length, 'annotations remain');
          return filtered;
        });
        playSound('select');
        
        // Force clear all styles immediately - both inline and CSS classes
        const wordElement = document.querySelector(`.word-${wordIndex}`) as HTMLElement;
        if (wordElement) {
          // Clear all inline styles that might have been applied
          wordElement.style.background = '';
          wordElement.style.border = '';
          wordElement.style.boxShadow = '';
          wordElement.style.color = '';
          wordElement.style.transform = '';
          wordElement.style.scale = '';
          wordElement.style.opacity = '';
          
          // Kill any ongoing GSAP animations on this element
          gsap.killTweensOf(wordElement);
          
          // Force reset to default state
          gsap.set(wordElement, {
            background: 'transparent',
            border: '1px solid transparent', 
            boxShadow: 'none',
            color: 'inherit',
            scale: 1,
            rotation: 0,
            clearProps: "all"
          });
        }
        
        // Enhanced visual feedback for erasing
        gsap.timeline()
          .to(`.word-${wordIndex}`, {
            scale: 0.6,
            opacity: 0.3,
            rotateZ: -10,
            duration: 0.3,
            ease: "power2.out"
          })
          .to(`.word-${wordIndex}`, {
            scale: 1,
            opacity: 1,
            rotateZ: 0,
            duration: 0.4,
            ease: "elastic.out(1, 0.8)"
          });
      }
      return;
    }
    
    // Prevent duplicate annotations for the same word
    if (annotations.some(a => a.wordIndex === wordIndex)) {
      console.log('Word already annotated, skipping');
      return;
    }
    
    // Create new annotation
    const wordEl = document.querySelector(`.word-${wordIndex}`) as HTMLElement;
    if (!wordEl) return;
    
    const rect = wordEl.getBoundingClientRect();
    const textStart = demoText.indexOf(word, wordIndex > 0 ? demoText.indexOf(demoWords[wordIndex - 1]) + demoWords[wordIndex - 1].length : 0);
    
    const newAnnotation: AnnotationData = {
      id: `${Date.now()}-${wordIndex}`,
      start: textStart,
      end: textStart + word.length,
      type: selectedMode as 'hot' | 'neutral' | 'flush',
      timestamp: Date.now(),
      wordIndex
    };
    
    console.log('Creating annotation:', newAnnotation);
    
    setAnnotations(prev => {
      // Ensure no duplicates by checking wordIndex
      const filtered = prev.filter(a => a.wordIndex !== wordIndex);
      return [...filtered, newAnnotation];
    });
    
    // Enhanced visual feedback with mode-specific effects
    const style = modeStyles[selectedMode];
    
    gsap.timeline()
      .set(wordEl, {
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: style.glow,
        filter: style.sparkle
      })
      .from(wordEl, {
        scale: 0.8,
        opacity: 0.5,
        duration: 0.4,
        ease: "elastic.out(1, 0.6)"
      })
      .to(wordEl, {
        scale: 1.05,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    
    // Create particles for enhanced feedback
    const particleCount = selectedMode === 'hot' ? 8 : selectedMode === 'flush' ? 5 : 3;
    const newParticles: ParticleEffect[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: `${Date.now()}-${i}`,
        x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 30,
        y: rect.top + rect.height / 2 + (Math.random() - 0.5) * 20,
        type: selectedMode === 'hot' ? 'sparkle' : selectedMode === 'flush' ? 'paint' : 'confetti',
        color: selectedMode === 'hot' ? '#ff5733' : selectedMode === 'flush' ? '#3b82f6' : '#94a3b8'
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    setStreakCount(prev => prev + 1);
    
    // Sound feedback
    playSound(isClick ? 'select' : 'paint');
    
    // Achievement feedback
    if (streakCount > 0 && streakCount % 5 === 0) {
      playSound('complete');
    }
  }, [selectedMode, annotations, playSound, streakCount, undoStack]);

  const recomputeLineRects = useCallback(() => {
    if (!textRef.current) return;
    const lines: Array<{ top: number; bottom: number; firstIndex: number; firstRect: DOMRect }> = [];
    const isPunct = (w: string) => /^[.,:;!?]+$/.test(w);

    let currentTop: number | null = null;
    let currentBottom: number | null = null;
    let firstIndex: number | null = null;

    for (let i = 0; i < demoWords.length; i++) {
      const el = document.querySelector(`.word-${i}`) as HTMLElement | null;
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const top = Math.round(r.top);

      // Start a new line bucket if y has changed significantly
      if (currentTop === null || Math.abs(top - currentTop) > 8) {
        if (currentTop !== null && firstIndex !== null) {
          const firstEl = document.querySelector(`.word-${firstIndex}`) as HTMLElement;
          const fr = firstEl.getBoundingClientRect();
          lines.push({ top: currentTop, bottom: currentBottom || fr.bottom, firstIndex, firstRect: fr });
        }
        currentTop = top;
        currentBottom = r.bottom;
        // choose first non-punctuation token for a line
        let j = i;
        while (j < demoWords.length) {
          const w = demoWords[j];
          if (!isPunct(w)) break;
          j += 1;
        }
        firstIndex = j;
      } else {
        if (r.bottom > (currentBottom || r.bottom)) currentBottom = r.bottom;
      }
    }

    if (currentTop !== null && firstIndex !== null) {
      const firstEl = document.querySelector(`.word-${firstIndex}`) as HTMLElement;
      const fr = firstEl.getBoundingClientRect();
      lines.push({ top: currentTop, bottom: currentBottom || fr.bottom, firstIndex, firstRect: fr });
    }

    lineRectsRef.current = lines;
  }, []);

  useLayoutEffect(() => {
    recomputeLineRects();
    const onResize = () => recomputeLineRects();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recomputeLineRects, annotations]);

  // Advanced GSAP animations with particle system
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Ambient background animation
      gsap.to(containerRef.current, {
        backgroundPosition: '200% 200%',
        duration: 20,
        ease: "none",
        repeat: -1
      });

      // Floating particles in background
      gsap.to(".ambient-particle", {
        y: () => gsap.utils.random(-50, 50),
        x: () => gsap.utils.random(-30, 30),
        rotation: () => gsap.utils.random(0, 360),
        scale: () => gsap.utils.random(0.5, 1.5),
        duration: () => gsap.utils.random(8, 15),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          amount: 5,
          from: "random"
        }
      });

      // Magic pencil glow animation
      gsap.to(".pencil-glow", {
        opacity: 0.8,
        scale: 1.2,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Temperature scale animation
      gsap.to(".temperature-bar", {
        scaleY: () => gsap.utils.random(0.7, 1.3),
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2
      });

    }, containerRef);

    // Enhanced GSAP particle system
    gsap.to('.floating-particle', {
      y: "+=40",
      x: "+=20", 
      rotation: 360,
      opacity: 0.8,
      scale: 1.2,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      stagger: {
        amount: 1,
        from: "random"
      }
    });

    return () => {
      ctx.revert();
    };
  }, [hasStarted]);

  // Enhanced cursor tracking with gesture detection and text area scope
  useEffect(() => {
    let lastY = 0;
    let lastTime = Date.now();
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const now = Date.now();
      
      // Gesture detection disabled - using reliable keyboard shortcuts instead
      
      setCursorPosition({ x, y });
      mouseX.set(x);
      mouseY.set(y);
      
      // Dynamic brush size based on velocity
      const velocity = Math.sqrt(
        Math.pow(x - cursorPosition.x, 2) + Math.pow(y - cursorPosition.y, 2)
      );
      setBrushSize(Math.max(15, Math.min(40, 20 + velocity * 0.5)));
      
      if (pencilRef.current && isInTextArea) {
        const tilt = selectedMode === 'hot' ? 25 : selectedMode === 'flush' ? -25 : velocity * 0.3;

        // respect snap window
        if (Date.now() > snapUntilRef.current) {
          gsap.to(pencilRef.current, {
            x: x - 16,
            y: y - 16,
            rotation: tilt,
            scale: isDragging ? 1.2 : 1,
            duration: 0.15,
            ease: 'power3.out'
          });
        }

        if (isDragging) {
          setPaintTrail(prev => [
            ...prev.slice(-20),
            { x, y, timestamp: Date.now() }
          ]);
        }

        // line-aware snapping
        const lines = lineRectsRef.current;
        if (lines.length > 0) {
          const idx = lines.findIndex(l => y >= l.top && y <= l.bottom);
          if (idx !== -1 && idx !== lastLineIndexRef.current) {
            lastLineIndexRef.current = idx;
            const target = lines[idx];
            const cx = target.firstRect.left + target.firstRect.width / 2;
            const cy = target.firstRect.top + target.firstRect.height / 2;
            snapUntilRef.current = Date.now() + 160;
            gsap.to(pencilRef.current, { x: cx - 16, y: cy - 16, duration: 0.15, ease: 'power3.out' });
            if (autoSelectEnabled && hasStarted && selectedMode !== 'eraser') {
              const wi = target.firstIndex;
              if (!annotations.some(a => a.wordIndex === wi)) {
                handleWordAnnotation(wi, demoWords[wi]);
              }
            }
          }
        }
      }
      
      lastY = y;
      lastTime = now;
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
  }, [selectedMode, hasStarted, isDragging, cursorPosition, mouseX, mouseY, isInTextArea, detectGesture, autoSelectEnabled, annotations, handleWordAnnotation]);

  // Handle text area entry/exit for cursor scoping
  useEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    const handleMouseEnter = () => {
      setIsInTextArea(true);
      if (hasStarted && !showBanner) {
        document.body.style.cursor = 'none';
        setAutoSelectEnabled(true);
        // Visual feedback for entering auto-select mode
        gsap.to('.text-area-border', { 
          borderColor: 'rgba(var(--primary), 0.4)', 
          boxShadow: '0 0 20px rgba(var(--primary), 0.2)',
          duration: 0.3 
        });
      }
    };

    const handleMouseLeave = () => {
      setIsInTextArea(false);
      document.body.style.cursor = 'auto';
      setAutoSelectEnabled(false);
      setHoveredWordIndex(null);
      // Reset border
      gsap.to('.text-area-border', { 
        borderColor: 'rgba(var(--primary), 0.2)', 
        boxShadow: 'none',
        duration: 0.3 
      });
    };

    const handleClick = () => {
      if (showBanner) {
        setShowBanner(false);
        setHasStarted(true);
        setAutoSelectEnabled(true);
        document.body.style.cursor = 'none';
      } else if (hasStarted) {
        // Toggle between Magic Pencil mode and standard cursor mode
        setAutoSelectEnabled(prev => {
          const newEnabled = !prev;
          document.body.style.cursor = newEnabled ? 'none' : 'auto';
          
          // Visual feedback
          gsap.to('.text-area-border', { 
            borderColor: newEnabled ? 'rgba(var(--primary), 0.4)' : 'rgba(var(--primary), 0.2)', 
            boxShadow: newEnabled ? '0 0 20px rgba(var(--primary), 0.2)' : 'none',
            duration: 0.3 
          });
          
          return newEnabled;
        });
      }
    };

    textElement.addEventListener('mouseenter', handleMouseEnter);
    textElement.addEventListener('mouseleave', handleMouseLeave);
    textElement.addEventListener('click', handleClick);

    return () => {
      textElement.removeEventListener('mouseenter', handleMouseEnter);
      textElement.removeEventListener('mouseleave', handleMouseLeave);
      textElement.removeEventListener('click', handleClick);
      document.body.style.cursor = 'auto';
    };
  }, [hasStarted, showBanner]);

  // Epic multi-stage celebration with physics
  const triggerCelebration = () => {
    playSound('complete');
    
    // Stage 1: GSAP confetti explosion with physics
    gsap.timeline()
      .fromTo('.celebration-particle', 
        {
          scale: 0,
          opacity: 0
        },
        {
          scale: 1,
          opacity: 1,
          x: () => gsap.utils.random(-300, 300),
          y: () => gsap.utils.random(-200, -400),
          rotation: 720,
          duration: 2,
          ease: "power2.out",
          stagger: 0.05
        }
      )
      .to('.celebration-particle', {
        scale: 0,
        opacity: 0,
        duration: 1,
        ease: "power2.in"
      }, "-=0.5");

    // Stage 3: Achievement badge animation
    gsap.timeline()
      .fromTo('.achievement-badge', 
        { 
          scale: 0, 
          rotation: -180,
          opacity: 0,
          filter: 'blur(10px)'
        },
        { 
          scale: 1, 
          rotation: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.5, 
          ease: "elastic.out(1, 0.5)" 
        }
      )
      .to('.achievement-badge', {
        boxShadow: '0 0 50px rgba(255, 215, 0, 0.8)',
        duration: 0.5,
        yoyo: true,
        repeat: 3
      });

    // Stage 4: Screen flash effect
    gsap.fromTo('.flash-overlay',
      { opacity: 0 },
      { 
        opacity: 0.3, 
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      }
    );
  };


  // Check for focus achievement
  useEffect(() => {
    const stats = analytics();
    if (stats.coverage >= 95 && !focusAchieved && annotations.length > 0) {
      setFocusAchieved(true);
      triggerCelebration();
    }
  }, [annotations, focusAchieved, analytics]);

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
                
                // Only auto-annotate on hover for non-eraser modes
                if (selectedMode !== 'eraser' && !annotation && autoSelectEnabled && hasStarted && !showBanner) {
                  playSound('hover');
                  handleWordAnnotation(index, word);
                }
                
                // Breathing effect on hover using GSAP
                gsap.timeline()
                  .to(`.word-${index}`, {
                    scale: 1.08,
                    duration: 0.3,
                    ease: "elastic.out(1, 0.6)"
                  })
                  .to(`.word-${index}`, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                  });
              }}
              onMouseLeave={() => {
                setHoveredWordIndex(null);
              }}
              onClick={() => {
                if (showBanner) {
                  setShowBanner(false);
                  setHasStarted(true);
                  setAutoSelectEnabled(true);
                  return;
                }
                
                // Handle eraser mode - erase on click
                if (selectedMode === 'eraser') {
                  if (annotation) {
                    handleWordAnnotation(index, word, true);
                  }
                  return;
                }

                // Handle annotation modes
                if (!annotation) {
                  handleWordAnnotation(index, word, true);
                }
              }}
              whileHover={{
                y: -2,
                transition: { duration: 0.2, ease: "easeOut" }
              }}
              whileTap={{
                scale: 0.95,
                transition: { duration: 0.1 }
              }}
            >
              {word}
              
              {/* Dynamic hover tooltip */}
              <AnimatePresence>
                {hoveredWordIndex === index && !annotation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20"
                  >
                    <div className="bg-background/90 backdrop-blur-sm border border-primary/20 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap shadow-lg">
                      <div className="flex items-center gap-1">
                        {React.createElement(modeStyles[selectedMode].icon, { className: "w-3 h-3" })}
                        {selectedMode === 'eraser' ? 'Erase annotation' : `Paint as ${selectedMode}`}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary/20" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Annotation indicator */}
              {annotation && ModeIcon && (
                <motion.div
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-background border border-primary/30 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <ModeIcon className="w-2.5 h-2.5 text-primary" />
                </motion.div>
              )}

              {/* Intensity indicator for annotations */}
              {annotation && (
                <motion.div
                  className="absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full"
                  style={{ 
                    width: `${(annotation.intensity || 1) * 100}%`,
                    background: `linear-gradient(90deg, ${modeStyles[annotation.type].border}, transparent)`
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}

              {/* Sparkle animation for annotated words */}
              {annotation && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    background: [
                      'rgba(0, 0, 0, 0)',
                      `rgba(${selectedMode === 'hot' ? '255, 87, 51' : selectedMode === 'flush' ? '59, 130, 246' : '148, 163, 184'}, 0.1)`,
                      'rgba(0, 0, 0, 0)'
                    ]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.span>
          );
        })}

        {/* Paint particles overlay */}
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute pointer-events-none z-10"
            style={{
              left: particle.x,
              top: particle.y,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: particle.color
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [1, 0.7, 0],
              y: [0, -30, -60],
              x: [0, Math.random() * 20 - 10, Math.random() * 40 - 20]
            }}
            transition={{
              duration: 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    );
  };

  const currentStats = analytics();
  const refinedPrompt = generateRefinedPrompt();

  return (
    <section ref={containerRef} className="py-8 px-6 relative">
      {/* Magic Pencil Cursor - Only in text area */}
      {hasStarted && isInTextArea && (
        <div 
          ref={pencilRef}
          className="fixed pointer-events-none z-50"
          style={{ left: 0, top: 0 }}
        >
          <div className="relative">
            <Wand2 
              className="w-6 h-6 text-primary" 
              style={{ filter: modeStyles[selectedMode].sparkle }}
            />
            
            {/* Enhanced palette with gesture feedback - Priority order display */}
            <div className="absolute -top-8 -left-4 flex gap-1 opacity-80">
              <div 
                className={`mode-indicator-hot w-2 h-2 rounded-full border transition-all duration-200 ${selectedMode === 'hot' ? 'bg-red-400 border-red-400 shadow-lg' : 'bg-red-400/30 border-red-400/50'}`}
                title="Hot (Priority 3)"
              />
              <div 
                className={`mode-indicator-neutral w-2 h-2 rounded-full border transition-all duration-200 ${selectedMode === 'neutral' ? 'bg-slate-400 border-slate-400 shadow-lg' : 'bg-slate-400/30 border-slate-400/50'}`}
                title="Neutral (Priority 2)"
              />
              <div 
                className={`mode-indicator-flush w-2 h-2 rounded-full border transition-all duration-200 ${selectedMode === 'flush' ? 'bg-blue-400 border-blue-400 shadow-lg' : 'bg-blue-400/30 border-blue-400/50'}`}
                title="Flush (Priority 1)"
              />
              <div 
                className={`mode-indicator-eraser w-2 h-2 rounded-full border transition-all duration-200 ${selectedMode === 'eraser' ? 'bg-red-600 border-red-600 shadow-lg' : 'bg-red-600/30 border-red-600/50'}`}
                title="Eraser (Priority 0)"
              />
            </div>
            
            {/* Updated gesture hint showing priority */}
            {gestureDetection.swingCount > 0 && (
              <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 text-xs bg-background/90 px-2 py-1 rounded-full border whitespace-nowrap">
                {gestureDetection.direction === 'up' ? '↑ Higher Priority' : '↓ Lower Priority'}
              </div>
            )}
            
            {/* Floating sparkles around pencil */}
            <Sparkles className="magic-sparkle absolute -top-2 -right-2 w-3 h-3 text-primary-glow opacity-60" />
            <Sparkles className="magic-sparkle absolute -bottom-1 -left-3 w-2 h-2 text-accent opacity-50" />
          </div>
        </div>
      )}

      {/* Celebration particles */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="celebration-particle absolute top-1/2 left-1/2 scale-0 opacity-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Magic Pencil Interface - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Mode Palette */}
            <Card className="p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-primary-glow/5 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Magic Pencil</h3>
                <Palette className="w-5 h-5 text-primary" />
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {[
                  { type: 'hot' as const, emoji: '🔴', label: 'Hot', desc: 'Enhance & expand' },
                  { type: 'neutral' as const, emoji: '⚪', label: 'Neutral', desc: 'Keep as-is' },
                  { type: 'flush' as const, emoji: '🔵', label: 'Flush', desc: 'Remove/reduce' },
                  { type: 'eraser' as const, emoji: '🗑️', label: 'Eraser', desc: 'Remove existing' }
                ].map(mode => (
                  <motion.button
                    key={mode.type}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                      selectedMode === mode.type 
                        ? 'border-primary bg-primary/10 shadow-lg' 
                        : 'border-muted hover:border-primary/50 bg-background/50'
                    }`}
                    onClick={() => setSelectedMode(mode.type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      boxShadow: selectedMode === mode.type ? modeStyles[mode.type].glow : 'none'
                    }}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{mode.emoji}</div>
                      <div className="text-sm font-medium text-foreground">{mode.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{mode.desc}</div>
                    </div>
                    
                    {selectedMode === mode.type && (
                      <motion.div
                        layoutId="selected-mode"
                        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary-glow/20 rounded-xl"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Keyboard shortcuts hint */}
              {hasStarted && (
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  <div className="flex items-center justify-center gap-4">
                    <span>Use keys: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">1</kbd>Hot <kbd className="px-1 py-0.5 bg-muted rounded text-xs">2</kbd>Neutral <kbd className="px-1 py-0.5 bg-muted rounded text-xs">3</kbd>Flush <kbd className="px-1 py-0.5 bg-muted rounded text-xs">E</kbd>Eraser</span>
                    <span>or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd> to cycle modes</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Interactive Text Area */}
            <Card className="text-area-border p-6 bg-gradient-to-br from-background via-primary/3 to-accent/3 border-primary/20 min-h-[400px] relative transition-all duration-300">
              {/* Enhanced Banner with blur background */}
              <AnimatePresence>
                {showBanner && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center z-10 rounded-lg"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                  >
                    {/* Blur background text */}
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md rounded-lg" />
                    
                    <div className="relative text-center p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-primary-glow/10 border-2 border-primary/30 rounded-2xl backdrop-blur-xl">
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Wand2 className="w-12 h-12 text-primary mx-auto mb-4" style={{ filter: modeStyles[selectedMode].sparkle }} />
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                          Start highlighting
                        </h3>
                        <p className="text-base text-muted-foreground mb-4">
                          Click to begin annotation
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70">
                          <span>💡 Pro tip: Double swipe ↑ higher priority, ↓ lower priority</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">AI Response</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Coverage: {currentStats.coverage}%</span>
                  <Progress value={currentStats.coverage} className="w-20 h-2" />
                </div>
              </div>
              
              <div
                ref={textRef}
                className="text-lg leading-relaxed text-foreground select-text relative z-20 p-4 rounded-lg transition-all duration-300"
                style={{ 
                  userSelect: hasStarted ? 'text' : 'none',
                  cursor: isInTextArea && hasStarted ? 'none' : 'default',
                  background: isInTextArea ? 'rgba(var(--primary) / 0.02)' : 'transparent',
                  border: isInTextArea ? '1px solid rgba(var(--primary) / 0.1)' : '1px solid transparent'
                }}
              >
                {renderText()}
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
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Flush It!
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analytics Sidebar - 1 column */}
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              
              <div className="space-y-3">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-primary">{currentStats.coverage}%</div>
                  <div className="text-sm text-muted-foreground">Annotated</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">🔴 Enhanced</span>
                    <span className="font-medium">{currentStats.hotPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">⚪ Neutral</span>
                    <span className="font-medium">{currentStats.neutralPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">🔵 Flushed</span>
                    <span className="font-medium">{currentStats.flushPercentage}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-muted text-center">
                  <div className="text-lg font-semibold text-foreground">{currentStats.annotationCount}</div>
                  <div className="text-xs text-muted-foreground">Total Annotations</div>
                </div>
              </div>
            </Card>

            {/* Controls */}
            <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary-glow/5 border-accent/20">
              <h3 className="text-lg font-semibold text-foreground mb-4">Controls</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undoLastAnnotation}
                  disabled={annotations.length === 0 && undoStack.length === 0}
                  className="w-full flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAnnotations}
                  disabled={annotations.length === 0}
                  className="w-full flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </Button>
              </div>
            </Card>

            {/* Export Options */}
            {annotations.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary-glow/5 border-accent/20">
                <h3 className="text-lg font-semibold text-foreground mb-4">Export</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const exportData = {
                        annotations,
                        analytics: currentStats,
                        refinedPrompt,
                        timestamp: new Date().toISOString()
                      };
                      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
                    }}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    JSON Data
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(refinedPrompt)}
                    className="w-full"
                    disabled={!refinedPrompt}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Refined Prompt
                  </Button>
                </div>
              </Card>
            )}

            {/* Continue to Full Experience */}
            <Card className="p-6 bg-gradient-to-br from-primary-glow/5 to-primary/5 border-primary-glow/20">
              <h3 className="text-lg font-semibold text-foreground mb-3">Ready for More?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Experience the full Magic Pencil interface with advanced features.
              </p>
              <Button 
                onClick={onStartAnnotating}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Full Experience
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <AnimatePresence>
        {showComment && selectedText && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowComment(false)}
          >
            <motion.div
              ref={commentModalRef}
              className="bg-background p-6 rounded-2xl border border-primary/20 max-w-md w-full mx-4 shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Add Comment</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComment(false)}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mb-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                "{demoText.slice(selectedText.start, selectedText.end)}"
              </div>
              
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="mb-4"
                rows={3}
                placeholder="Add your thoughts about this selection..."
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (selectedText) {
                      setAnnotations(prev => prev.map(ann => 
                        ann.start === selectedText.start && ann.end === selectedText.end
                          ? { ...ann, comment: commentText }
                          : ann
                      ));
                    }
                    setCommentText('');
                    setShowComment(false);
                  }}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Save Comment
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowComment(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refined Prompt Modal */}
      <AnimatePresence>
        {showRefinedPrompt && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRefinedPrompt(false)}
          >
            <motion.div
              className="bg-background p-8 rounded-2xl border border-primary/20 max-w-2xl w-full mx-4 shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, rotateY: 15 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: -15 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground">✨ Refined Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRefinedPrompt(false)}
                  className="p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 via-accent/5 to-primary-glow/10 rounded-lg border border-primary/20">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MagicPencilExperience;