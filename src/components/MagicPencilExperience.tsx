import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
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

interface MagicPencilExperienceProps {
  onStartAnnotating: () => void;
}

const demoText = `The future of AI interaction isn't about crafting perfect prompts. It's about creating a dialogue where your intuition guides the machine's understanding. Magic Pencil transforms this vision into reality by letting you paint your intentions directly onto AI responses. Draw your thoughts, highlight insights, cross out noise. Every gesture becomes structured feedback that trains smarter conversations.`;

const MagicPencilExperience: React.FC<MagicPencilExperienceProps> = ({ onStartAnnotating }) => {
  const [selectedMode, setSelectedMode] = useState<'hot' | 'neutral' | 'flush'>('neutral');
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [selectedText, setSelectedText] = useState<{start: number, end: number} | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [focusAchieved, setFocusAchieved] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showRefinedPrompt, setShowRefinedPrompt] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const textRef = useRef<HTMLDivElement>(null);
  const pencilRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const commentModalRef = useRef<HTMLDivElement>(null);

  // Mode colors with sparkling effects
  const modeStyles = {
    hot: {
      bg: 'rgba(255, 87, 51, 0.12)',
      border: 'rgba(255, 87, 51, 0.3)',
      glow: '0 0 20px rgba(255, 87, 51, 0.15)',
      sparkle: 'drop-shadow(0 0 3px rgba(255, 87, 51, 0.8))'
    },
    neutral: {
      bg: 'rgba(148, 163, 184, 0.08)',
      border: 'rgba(148, 163, 184, 0.2)',
      glow: '0 0 15px rgba(148, 163, 184, 0.1)',
      sparkle: 'drop-shadow(0 0 2px rgba(148, 163, 184, 0.6))'
    },
    flush: {
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.3)',
      glow: '0 0 20px rgba(59, 130, 246, 0.15)',
      sparkle: 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.8))'
    }
  };

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

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Breathing animation for the entire experience
      gsap.to(containerRef.current, {
        scale: 1.002,
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Floating sparkles around the pencil
      gsap.to(".magic-sparkle", {
        y: -10,
        x: () => gsap.utils.random(-5, 5),
        rotation: () => gsap.utils.random(-15, 15),
        scale: () => gsap.utils.random(0.8, 1.2),
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3
      });

      // Call to action pulse
      if (!hasStarted) {
        gsap.to(".cta-pulse", {
          scale: 1.05,
          opacity: 0.8,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
      }

    }, containerRef);

    return () => ctx.revert();
  }, [hasStarted]);

  // Enhanced cursor tracking with pencil
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
      
      if (pencilRef.current) {
        gsap.to(pencilRef.current, {
          x: e.clientX - 12,
          y: e.clientY - 12,
          rotation: selectedMode === 'hot' ? 15 : selectedMode === 'flush' ? -15 : 0,
          duration: 0.2,
          ease: "power2.out"
        });
      }
    };

    if (hasStarted) {
      document.addEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'auto';
    };
  }, [selectedMode, hasStarted]);

  // Focus achievement celebration
  const triggerCelebration = () => {
    gsap.timeline()
      .to('.celebration-particle', {
        scale: 1,
        opacity: 1,
        x: () => gsap.utils.random(-200, 200),
        y: () => gsap.utils.random(-150, -250),
        rotation: () => gsap.utils.random(0, 360),
        duration: 3,
        stagger: 0.05,
        ease: "power2.out"
      })
      .to('.celebration-particle', {
        scale: 0,
        opacity: 0,
        duration: 1.5,
        ease: "power2.in"
      }, "-=1")
      .fromTo('.focus-message', 
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: "back.out(1.7)" }
      , 0.5);
  };

  // Text selection handler
  const handleTextSelection = () => {
    if (!hasStarted) {
      setHasStarted(true);
      gsap.killTweensOf(".cta-pulse");
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!textRef.current?.contains(range.commonAncestorContainer)) return;

    const textContent = textRef.current.textContent || '';
    const selectedTextContent = selection.toString();
    
    if (selectedTextContent.trim()) {
      const start = textContent.indexOf(selectedTextContent);
      const end = start + selectedTextContent.length;
      
      if (start !== -1) {
        const newAnnotation: AnnotationData = {
          id: Date.now().toString(),
          start,
          end,
          type: selectedMode,
          timestamp: Date.now()
        };
        
        setAnnotations(prev => [...prev, newAnnotation]);
        
        // Magical stroke animation
        gsap.timeline()
          .fromTo(`.annotation-${newAnnotation.id}`, 
            { 
              scale: 0.8, 
              opacity: 0, 
              filter: 'blur(3px)',
              boxShadow: `0 0 0px ${modeStyles[selectedMode].border}`
            },
            { 
              scale: 1, 
              opacity: 1, 
              filter: 'blur(0px)',
              boxShadow: modeStyles[selectedMode].glow,
              duration: 1.2, 
              ease: "elastic.out(1, 0.6)" 
            }
          )
          .to(`.annotation-${newAnnotation.id}`, {
            boxShadow: `0 0 5px ${modeStyles[selectedMode].border}`,
            duration: 0.8,
            ease: "power2.out"
          });
      }
      
      selection.removeAllRanges();
    }
  };

  // Check for focus achievement
  useEffect(() => {
    const stats = analytics();
    if (stats.coverage >= 95 && !focusAchieved && annotations.length > 0) {
      setFocusAchieved(true);
      triggerCelebration();
    }
  }, [annotations, focusAchieved, analytics]);

  // Render annotated text
  const renderText = () => {
    if (annotations.length === 0) {
      return <span>{demoText}</span>;
    }

    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);
    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    sortedAnnotations.forEach((annotation) => {
      if (annotation.start > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{demoText.slice(lastIndex, annotation.start)}</span>);
      }

      parts.push(
        <motion.span
          key={annotation.id}
          className={`annotation-${annotation.id} relative inline-block px-1 py-0.5 rounded-md cursor-pointer transition-all duration-300`}
          style={{ 
            background: modeStyles[annotation.type].bg,
            border: `1px solid ${modeStyles[annotation.type].border}`,
            filter: modeStyles[annotation.type].sparkle
          }}
          whileHover={{ 
            scale: 1.02,
            y: -1,
            transition: { duration: 0.2 }
          }}
          onClick={() => {
            setSelectedText({ start: annotation.start, end: annotation.end });
            setShowComment(true);
          }}
        >
          {demoText.slice(annotation.start, annotation.end)}
          {annotation.comment && (
            <MessageCircle className="inline w-3 h-3 ml-1 text-primary opacity-70" />
          )}
          
          {/* Subtle sparkle effect */}
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            <Sparkles className="w-2 h-2 text-primary" />
          </motion.div>
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
  const refinedPrompt = generateRefinedPrompt();

  return (
    <section ref={containerRef} className="py-24 px-4 relative">
      {/* Magic Pencil Cursor */}
      {hasStarted && (
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
            
            {/* Mini palette on tip */}
            <div className="absolute -top-8 -left-2 flex gap-1 opacity-80">
              <div 
                className={`w-2 h-2 rounded-full border ${selectedMode === 'hot' ? 'bg-red-400 border-red-400 shadow-lg' : 'bg-red-400/30 border-red-400/50'}`}
              />
              <div 
                className={`w-2 h-2 rounded-full border ${selectedMode === 'neutral' ? 'bg-slate-400 border-slate-400 shadow-lg' : 'bg-slate-400/30 border-slate-400/50'}`}
              />
              <div 
                className={`w-2 h-2 rounded-full border ${selectedMode === 'flush' ? 'bg-blue-400 border-blue-400 shadow-lg' : 'bg-blue-400/30 border-blue-400/50'}`}
              />
            </div>
            
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
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Magic Pencil Interface - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Mode Palette */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-primary-glow/5 border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Magic Pencil</h3>
                <Palette className="w-6 h-6 text-primary" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { type: 'hot' as const, emoji: '🔴', label: 'Hot', desc: 'Enhance & expand' },
                  { type: 'neutral' as const, emoji: '⚪', label: 'Neutral', desc: 'Keep as-is' },
                  { type: 'flush' as const, emoji: '🔵', label: 'Flush', desc: 'Remove/reduce' }
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
            </Card>

            {/* Interactive Text Area */}
            <Card className="p-8 bg-gradient-to-br from-background via-primary/3 to-accent/3 border-primary/20 min-h-[400px] relative">
              {/* Call to action overlay */}
              {!hasStarted && (
                <motion.div
                  className="cta-pulse absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg backdrop-blur-sm z-10"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center">
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
                      <Wand2 className="w-12 h-12 text-primary mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">
                        ✨ Start painting your thoughts
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Select text below to begin annotation
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
              
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">AI Response</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Coverage: {currentStats.coverage}%</span>
                  <Progress value={currentStats.coverage} className="w-20 h-2" />
                </div>
              </div>
              
              <div
                ref={textRef}
                className="text-lg leading-relaxed text-foreground cursor-crosshair select-text relative z-20"
                onMouseUp={handleTextSelection}
                style={{ userSelect: hasStarted ? 'text' : 'none' }}
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
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              
              <div className="space-y-4">
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