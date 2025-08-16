import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Sparkles, 
  MessageCircle, 
  Target, 
  Download,
  BarChart3,
  Wand2,
  Heart,
  Zap
} from 'lucide-react';

interface AnnotationData {
  id: string;
  start: number;
  end: number;
  type: 'hot' | 'neutral' | 'flush';
  comment?: string;
}

interface MagicPencilDemoProps {
  onComplete?: () => void;
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
  
  const textRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const pencilRef = useRef<HTMLDivElement>(null);

  // Mode colors
  const modeColors = {
    hot: 'hsl(var(--annotation-high))',
    neutral: 'hsl(var(--annotation-neutral))',
    flush: 'hsl(var(--annotation-low))'
  };

  // Track mouse/touch position for pencil cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // GSAP animations for pencil glow
  useEffect(() => {
    if (pencilRef.current) {
      gsap.to(pencilRef.current, {
        boxShadow: `0 0 20px ${modeColors[selectedMode]}`,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [selectedMode]);

  // Check for focus achievement
  useEffect(() => {
    if (annotations.length > 0) {
      const coverage = calculateCoverage();
      if (coverage >= 100 && !focusAchieved) {
        setFocusAchieved(true);
        triggerCelebration();
      }
    }
  }, [annotations, focusAchieved]);

  const calculateCoverage = () => {
    const totalLength = demoText.length;
    const annotatedLength = annotations.reduce((sum, annotation) => {
      return sum + (annotation.end - annotation.start);
    }, 0);
    return Math.min((annotatedLength / totalLength) * 100, 100);
  };

  const triggerCelebration = () => {
    // GSAP particle celebration
    gsap.fromTo('.celebration-particle', 
      { 
        scale: 0,
        opacity: 0,
        x: 0,
        y: 0
      },
      { 
        scale: 1,
        opacity: 1,
        x: () => gsap.utils.random(-100, 100),
        y: -100,
        duration: 2,
        stagger: 0.1,
        ease: "power2.out",
        onComplete: () => {
          gsap.to('.celebration-particle', {
            scale: 0,
            opacity: 0,
            duration: 0.5
          });
        }
      }
    );

    // GSAP text celebration
    gsap.fromTo('.focus-message', 
      { scale: 0, rotation: -10 },
      { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.7)" }
    );
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const textContent = textRef.current?.textContent || '';
      const start = range.startOffset;
      const end = range.endOffset;
      
      setSelectedText({ start, end });
      
      // Create annotation
      const newAnnotation: AnnotationData = {
        id: Date.now().toString(),
        start,
        end,
        type: selectedMode,
        comment: undefined
      };
      
      setAnnotations(prev => [...prev, newAnnotation]);
      
      // Clear selection
      selection.removeAllRanges();
      
      // GSAP stroke effect
      gsap.fromTo(`.annotation-${newAnnotation.id}`, 
        { scale: 0.8, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  };

  const handleAddComment = (annotationId: string) => {
    if (commentText.trim()) {
      setAnnotations(prev => 
        prev.map(annotation => 
          annotation.id === annotationId 
            ? { ...annotation, comment: commentText.trim() }
            : annotation
        )
      );
      setCommentText('');
      setShowComment(false);
    }
  };

  const getAnnotationStyle = (annotation: AnnotationData) => {
    const baseStyle = {
      backgroundColor: `${modeColors[annotation.type]}20`,
      borderBottom: `2px solid ${modeColors[annotation.type]}`,
    };
    
    if (annotation.type === 'flush') {
      return {
        ...baseStyle,
        textDecoration: 'line-through',
        opacity: 0.6
      };
    }
    
    return baseStyle;
  };

  const renderAnnotatedText = () => {
    if (annotations.length === 0) {
      return <span>{demoText}</span>;
    }

    const parts: Array<{text: string, annotation?: AnnotationData}> = [];
    let currentIndex = 0;

    // Sort annotations by start position
    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);

    sortedAnnotations.forEach(annotation => {
      // Add text before annotation
      if (currentIndex < annotation.start) {
        parts.push({
          text: demoText.slice(currentIndex, annotation.start)
        });
      }
      
      // Add annotated text
      parts.push({
        text: demoText.slice(annotation.start, annotation.end),
        annotation
      });
      
      currentIndex = annotation.end;
    });

    // Add remaining text
    if (currentIndex < demoText.length) {
      parts.push({
        text: demoText.slice(currentIndex)
      });
    }

    return parts.map((part, index) => (
      part.annotation ? (
        <motion.span
          key={`${part.annotation.id}-${index}`}
          className={`annotation-highlight annotation-${part.annotation.id} cursor-pointer relative group`}
          style={getAnnotationStyle(part.annotation)}
          onClick={() => {
            setSelectedText({start: part.annotation!.start, end: part.annotation!.end});
            setShowComment(true);
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {part.text}
          {part.annotation.comment && (
            <motion.div
              className="comment-bubble absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white/95 px-3 py-2 rounded-lg shadow-lg text-xs text-black whitespace-nowrap z-10 opacity-0 group-hover:opacity-100"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {part.annotation.comment}
            </motion.div>
          )}
        </motion.span>
      ) : (
        <span key={index}>{part.text}</span>
      )
    ));
  };

  const analytics = {
    hot: annotations.filter(a => a.type === 'hot').length,
    neutral: annotations.filter(a => a.type === 'neutral').length,
    flush: annotations.filter(a => a.type === 'flush').length,
    coverage: calculateCoverage()
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Magic Pencil Cursor */}
      <motion.div
        ref={pencilRef}
        className="brush-preview fixed w-6 h-6 rounded-full pointer-events-none z-50"
        style={{
          left: cursorPosition.x - 12,
          top: cursorPosition.y - 12,
          backgroundColor: modeColors[selectedMode],
          opacity: 0.8
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Header */}
      <div className="text-center py-12 px-4">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Wand2 className="w-4 h-4 mr-2" />
            Live Demo
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Magic Pencil in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select text and watch the magic happen. Use the palette to switch modes.
          </p>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="mt-6"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <p className="text-sm text-primary animate-pulse">
            ✨ Start by highlighting any text below
          </p>
        </motion.div>
      </div>

      {/* Mini Palette */}
      <motion.div
        ref={paletteRef}
        className="fixed top-1/2 right-8 transform -translate-y-1/2 z-40"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="p-3 bg-white/95 backdrop-blur-lg border-white/20 shadow-2xl">
          <div className="flex flex-col gap-3">
            <div className="text-xs font-medium text-center mb-2">Magic Palette</div>
            {(['hot', 'neutral', 'flush'] as const).map((mode) => (
              <motion.button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedMode === mode ? 'scale-125 border-white shadow-lg' : 'border-white/30'
                }`}
                style={{
                  backgroundColor: modeColors[mode],
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {mode === 'hot' && <Heart className="w-4 h-4 text-white mx-auto" />}
                {mode === 'neutral' && <Target className="w-4 h-4 text-white mx-auto" />}
                {mode === 'flush' && <Zap className="w-4 h-4 text-white mx-auto" />}
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Main Demo Area */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <Card className="p-8 bg-white/50 backdrop-blur-sm border-white/20 shadow-xl">
          <div
            ref={textRef}
            className="text-lg leading-relaxed text-foreground cursor-crosshair selectable-text"
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
          >
            {renderAnnotatedText()}
          </div>

          {/* Progress Bar */}
          <motion.div
            className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-annotation-high to-annotation-low"
              initial={{ width: "0%" }}
              animate={{ width: `${analytics.coverage}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
          <div className="text-sm text-muted-foreground mt-2 text-center">
            Coverage: {Math.round(analytics.coverage)}%
          </div>
        </Card>

        {/* Focus Achievement */}
        <AnimatePresence>
          {focusAchieved && (
            <motion.div
              className="focus-message fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-lg border-primary/30 text-center">
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Focus Achieved! ✨</h3>
                <p className="text-muted-foreground">You've annotated the entire text!</p>
              </Card>
              {/* Celebration Particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="celebration-particle absolute w-2 h-2 bg-primary rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics Panel */}
        <motion.div
          className="mt-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Button
            onClick={() => setShowAnalytics(!showAnalytics)}
            variant="outline"
            className="w-full mb-4"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </Button>

          <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 bg-white/30 backdrop-blur-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-annotation-high">{analytics.hot}</div>
                      <div className="text-sm text-muted-foreground">Hot</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-annotation-neutral">{analytics.neutral}</div>
                      <div className="text-sm text-muted-foreground">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-annotation-low">{analytics.flush}</div>
                      <div className="text-sm text-muted-foreground">Flush</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{Math.round(analytics.coverage)}%</div>
                      <div className="text-sm text-muted-foreground">Coverage</div>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Refined Prompt
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Complete Button */}
        {focusAchieved && (
          <motion.div
            className="text-center mt-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5, type: "spring" }}
          >
            <Button
              onClick={onComplete}
              size="lg"
              className="group relative overflow-hidden bg-gradient-primary text-white px-8 py-4 text-lg rounded-xl shadow-elegant hover:shadow-glow transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Experience the Full Magic
              <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </motion.div>
        )}
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
              className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add Comment</h3>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your thoughts..."
                className="w-full p-3 border rounded-lg resize-none h-24"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    const annotation = annotations.find(a => 
                      a.start === selectedText.start && a.end === selectedText.end
                    );
                    if (annotation) {
                      handleAddComment(annotation.id);
                    }
                  }}
                  className="flex-1"
                >
                  Add Comment
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