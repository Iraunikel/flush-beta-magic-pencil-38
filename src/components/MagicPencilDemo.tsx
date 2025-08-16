import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Palette, 
  Sparkles, 
  MessageCircle, 
  Target, 
  Download,
  BarChart3,
  Wand2,
  Heart,
  Zap,
  TrendingUp,
  Eye,
  Filter,
  Layers,
  RefreshCw
} from 'lucide-react';

interface AnnotationData {
  id: string;
  start: number;
  end: number;
  type: 'hot' | 'neutral' | 'flush';
  comment?: string;
  timestamp: number;
}

interface MagicPencilDemoProps {
  onComplete?: (annotations: AnnotationData[], refinedPrompt: string) => void;
}

const demoText = `Transform AI responses with intuitive annotations. The future of human-AI collaboration isn't about typing better prompts — it's about training conversations through direct, visual feedback. Like highlighting and crossing out on paper, but instantly translated into structured AI instructions. This paradigm shift closes the gap between human intuition and machine interpretation, making AI interaction as natural as drawing your thoughts.`;

const MagicPencilDemo: React.FC<MagicPencilDemoProps> = ({ onComplete }) => {
  const [selectedMode, setSelectedMode] = useState<'hot' | 'neutral' | 'flush'>('neutral');
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [selectedText, setSelectedText] = useState<{start: number, end: number} | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [focusAchieved, setFocusAchieved] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  
  const textRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const pencilRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sophisticated Endel-inspired color palette
  const modeColors = {
    hot: 'rgba(255, 87, 51, 0.25)',
    neutral: 'rgba(148, 163, 184, 0.15)',
    flush: 'rgba(59, 130, 246, 0.25)'
  };

  const modeGradients = {
    hot: 'linear-gradient(135deg, rgba(255, 87, 51, 0.4) 0%, rgba(255, 154, 0, 0.3) 100%)',
    neutral: 'linear-gradient(135deg, rgba(148, 163, 184, 0.3) 0%, rgba(203, 213, 225, 0.2) 100%)',
    flush: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(168, 85, 247, 0.3) 100%)'
  };

  // Enhanced analytics calculation
  const analytics = useCallback(() => {
    const total = demoText.length;
    const annotatedChars = annotations.reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const coverage = total > 0 ? (annotatedChars / total) * 100 : 0;
    
    const hotCount = annotations.filter(a => a.type === 'hot').length;
    const neutralCount = annotations.filter(a => a.type === 'neutral').length;
    const flushCount = annotations.filter(a => a.type === 'flush').length;
    
    const hotChars = annotations.filter(a => a.type === 'hot').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const neutralChars = annotations.filter(a => a.type === 'neutral').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const flushChars = annotations.filter(a => a.type === 'flush').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    
    return {
      coverage: Math.round(coverage),
      annotationCount: annotations.length,
      hotPercentage: total > 0 ? Math.round((hotChars / total) * 100) : 0,
      neutralPercentage: total > 0 ? Math.round((neutralChars / total) * 100) : 0,
      flushPercentage: total > 0 ? Math.round((flushChars / total) * 100) : 0,
      distributionScore: hotCount + neutralCount + flushCount > 0 ? Math.round(((hotCount + neutralCount + flushCount) / 3) * 100) / 100 : 0
    };
  }, [annotations]);

  // Generate refined prompt from annotations
  const generateRefinedPrompt = useCallback(() => {
    if (annotations.length === 0) return '';
    
    const hotTexts = annotations
      .filter(a => a.type === 'hot')
      .map(a => `"${demoText.slice(a.start, a.end).trim()}"`)
      .join(', ');
    
    const flushTexts = annotations
      .filter(a => a.type === 'flush')
      .map(a => `"${demoText.slice(a.start, a.end).trim()}"`)
      .join(', ');
    
    const comments = annotations
      .filter(a => a.comment)
      .map(a => a.comment)
      .join('. ');
    
    let prompt = 'Based on user feedback: ';
    if (hotTexts) prompt += `Emphasize and expand on: ${hotTexts}. `;
    if (flushTexts) prompt += `Reduce or remove: ${flushTexts}. `;
    if (comments) prompt += `Additional guidance: ${comments}. `;
    
    return prompt;
  }, [annotations]);

  // Sophisticated GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Ambient breathing animation for container
      gsap.to(containerRef.current, {
        scale: 1.005,
        duration: 4,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1
      });

      // Floating elements
      gsap.to(".magic-float", {
        y: -15,
        x: 5,
        rotation: 2,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.5
      });

      // Pulse effect for active mode
      gsap.to(".mode-pulse", {
        scale: 1.1,
        opacity: 0.8,
        duration: 1.5,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Enhanced cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
      
      // Smooth cursor following with GSAP
      gsap.to(pencilRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const triggerCelebration = () => {
    // Enhanced GSAP celebration
    gsap.timeline()
      .to('.celebration-particle', {
        scale: 1,
        opacity: 1,
        x: () => gsap.utils.random(-150, 150),
        y: () => gsap.utils.random(-100, -200),
        rotation: () => gsap.utils.random(0, 360),
        duration: 2,
        stagger: 0.05,
        ease: "power2.out"
      })
      .to('.celebration-particle', {
        scale: 0,
        opacity: 0,
        duration: 1,
        ease: "power2.in"
      }, "-=0.5")
      .fromTo('.focus-message', 
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2)" }
      , 0)
      .to('.focus-message', {
        scale: 0.95,
        opacity: 0.8,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: 2
      });

    // Ripple effect
    gsap.fromTo('.ripple-effect',
      { scale: 0, opacity: 0.8 },
      { scale: 3, opacity: 0, duration: 1.5, ease: "power2.out" }
    );
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!textRef.current?.contains(range.commonAncestorContainer)) return;

    const textContent = textRef.current.textContent || '';
    const selectedText = selection.toString();
    
    if (selectedText.trim()) {
      const start = textContent.indexOf(selectedText);
      const end = start + selectedText.length;
      
      if (start !== -1) {
        setSelectedText({ start, end });
        
        const newAnnotation: AnnotationData = {
          id: Date.now().toString(),
          start,
          end,
          type: selectedMode,
          timestamp: Date.now()
        };
        
        setAnnotations(prev => [...prev, newAnnotation]);
        
        // Enhanced stroke effect
        gsap.timeline()
          .fromTo(`.annotation-${newAnnotation.id}`, 
            { scale: 0.9, opacity: 0.3, filter: 'blur(2px)' },
            { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: "elastic.out(1, 0.8)" }
          )
          .to(`.annotation-${newAnnotation.id}`, {
            boxShadow: `0 0 20px ${modeColors[selectedMode]}`,
            duration: 0.5,
            ease: "power2.out"
          }, "-=0.3");
      }
      
      selection.removeAllRanges();
    }
  };

  // Check for focus achievement
  useEffect(() => {
    const stats = analytics();
    if (stats.coverage >= 100 && !focusAchieved) {
      setFocusAchieved(true);
      triggerCelebration();
    }
  }, [annotations, focusAchieved, analytics]);

  // Update refined prompt when annotations change
  useEffect(() => {
    setRefinedPrompt(generateRefinedPrompt());
  }, [annotations, generateRefinedPrompt]);

  const renderText = () => {
    if (annotations.length === 0) {
      return <span>{demoText}</span>;
    }

    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);
    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    sortedAnnotations.forEach((annotation, index) => {
      if (annotation.start > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{demoText.slice(lastIndex, annotation.start)}</span>);
      }

      parts.push(
        <motion.span
          key={annotation.id}
          className={`annotation-${annotation.id} relative inline-block px-1 rounded-md transition-all duration-500`}
          style={{ background: modeGradients[annotation.type] }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            setSelectedText({ start: annotation.start, end: annotation.end });
            setShowComment(true);
          }}
        >
          {demoText.slice(annotation.start, annotation.end)}
          {annotation.comment && (
            <MessageCircle className="inline w-3 h-3 ml-1 text-primary" />
          )}
        </motion.span>
      );

      lastIndex = annotation.end;
    });

    if (lastIndex < demoText.length) {
      parts.push(<span key={`text-${lastIndex}`}>{demoText.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const currentStats = analytics();

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto p-8">
      {/* Floating Magic Pencil Cursor */}
      <div 
        ref={pencilRef}
        className="fixed pointer-events-none z-50 mix-blend-difference"
        style={{ 
          left: 0, 
          top: 0,
          transform: `translate(${cursorPosition.x}px, ${cursorPosition.y}px)`
        }}
      >
        <motion.div
          animate={{ rotate: selectedMode === 'hot' ? 15 : selectedMode === 'flush' ? -15 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Wand2 className="w-6 h-6 text-primary drop-shadow-lg" />
        </motion.div>
      </div>

      {/* Celebration Effects */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="celebration-particle absolute top-1/2 left-1/2">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        ))}
        <div className="ripple-effect absolute top-1/2 left-1/2 w-4 h-4 bg-primary/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
          Magic Pencil Live Demo
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the paradigm shift: From typing prompts to training conversations
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Text Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode Palette */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-primary-glow/5 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Magic Pencil Modes</h3>
              <Palette className="w-5 h-5 text-primary magic-float" />
            </div>
            
            <div className="flex gap-4">
              {[
                { type: 'hot' as const, label: '🔴 Enhance', desc: 'Keep & amplify' },
                { type: 'neutral' as const, label: '⚪ Neutral', desc: 'Keep as-is' },
                { type: 'flush' as const, label: '🔵 Flush', desc: 'Remove/reduce' }
              ].map(mode => (
                <motion.button
                  key={mode.type}
                  className={`relative flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedMode === mode.type 
                      ? 'border-primary bg-primary/10 shadow-glow' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedMode(mode.type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={selectedMode === mode.type ? 'mode-pulse' : ''}>
                    <div className="text-sm font-medium text-foreground">{mode.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{mode.desc}</div>
                  </div>
                  {selectedMode === mode.type && (
                    <motion.div
                      layoutId="selected-mode"
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-xl"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </Card>

          {/* Interactive Text */}
          <Card className="p-8 bg-gradient-to-br from-background via-primary/5 to-accent/5 border-primary/20 min-h-[300px]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Select Text to Annotate</h3>
              <Target className="w-5 h-5 text-primary magic-float" />
            </div>
            
            <div
              ref={textRef}
              className="text-lg leading-relaxed text-foreground cursor-crosshair select-text"
              onMouseUp={handleTextSelection}
            >
              {renderText()}
            </div>

            {/* Progress Indicator */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Annotation Coverage</span>
                <span className="text-sm font-medium text-foreground">{currentStats.coverage}%</span>
              </div>
              <Progress value={currentStats.coverage} className="h-2" />
            </div>
          </Card>

          {/* Focus Achievement */}
          <AnimatePresence>
            {focusAchieved && (
              <motion.div
                className="focus-message text-center p-6 bg-gradient-to-r from-primary/20 via-accent/20 to-primary-glow/20 rounded-xl border border-primary/30"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <Heart className="w-6 h-6" />
                  <span className="text-xl font-bold">Focus Achieved!</span>
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-muted-foreground">
                  Complete attention achieved. Ready to generate refined prompt.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Live Analytics</h3>
              <BarChart3 className="w-5 h-5 text-primary magic-float" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Coverage</span>
                <span className="text-lg font-bold text-primary">{currentStats.coverage}%</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">🔴 Enhanced</span>
                  <span className="text-sm font-medium">{currentStats.hotPercentage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">⚪ Neutral</span>
                  <span className="text-sm font-medium">{currentStats.neutralPercentage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">🔵 Flushed</span>
                  <span className="text-sm font-medium">{currentStats.flushPercentage}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-muted">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Annotations</span>
                  <span className="text-sm font-medium">{currentStats.annotationCount}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Refined Prompt */}
          {refinedPrompt && (
            <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary-glow/5 border-accent/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Refined Prompt</h3>
                <RefreshCw className="w-5 h-5 text-accent magic-float" />
              </div>
              
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-lg">
                {refinedPrompt}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(refinedPrompt)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  size="sm"
                  onClick={() => onComplete?.(annotations, refinedPrompt)}
                  className="flex-1"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Apply
                </Button>
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card className="p-6 bg-gradient-to-br from-primary-glow/5 to-primary/5 border-primary-glow/20">
            <h3 className="text-lg font-semibold text-foreground mb-4">How to Use</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</div>
                <span>Select a mode (🔴 Enhanced, ⚪ Neutral, 🔵 Flush)</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</div>
                <span>Highlight text passages to annotate them</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</div>
                <span>Watch the analytics update in real-time</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">4</div>
                <span>Achieve 100% coverage for focus completion</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Comment Modal */}
      <AnimatePresence>
        {showComment && selectedText && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowComment(false)}
          >
            <motion.div
              className="bg-background p-6 rounded-xl border border-primary/20 max-w-md w-full mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add Comment</h3>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 border border-muted rounded-lg bg-background text-foreground"
                rows={3}
                placeholder="Add your thoughts..."
              />
              <div className="flex gap-2 mt-4">
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
                  Save Comment
                </Button>
                <Button variant="outline" onClick={() => setShowComment(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MagicPencilDemo;