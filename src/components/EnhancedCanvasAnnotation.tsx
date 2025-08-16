import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Heart, ThumbsUp, ThumbsDown, Minus, Eraser, Hand, RotateCcw, 
  TrendingUp, Palette, MessageSquare, Sparkles, Zap, Trash2, Edit3 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type DrawingTool = 'magic' | 'high' | 'medium' | 'low' | 'neutral' | 'eraser' | 'pan';

export interface CanvasAnnotation {
  id: string;
  type: 'high' | 'medium' | 'low' | 'neutral';
  pressure: number;
  timestamp: number;
  bounds: { x: number; y: number; width: number; height: number };
  comment?: string;
  paths: { x: number; y: number; pressure: number }[];
}

interface Point {
  x: number;
  y: number;
  time: number;
  pressure?: number;
}

interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  annotationId: string;
  timestamp: number;
}

interface EnhancedCanvasAnnotationProps {
  text: string;
  onAnnotationsChange: (annotations: CanvasAnnotation[]) => void;
  className?: string;
}

const EnhancedCanvasAnnotation: React.FC<EnhancedCanvasAnnotationProps> = ({
  text,
  onAnnotationsChange,
  className = ''
}) => {
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const textContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const annotationContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const overlayContextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [activeTool, setActiveTool] = useState<DrawingTool>('magic');
  const [annotations, setAnnotations] = useState<CanvasAnnotation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [currentPressure, setCurrentPressure] = useState(0.5);
  const [gesturePoints, setGesturePoints] = useState<Point[]>([]);
  const [magicToolMode, setMagicToolMode] = useState<'idle' | 'medium' | 'high' | 'low'>('idle');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [brushPreview, setBrushPreview] = useState({ x: 0, y: 0, size: 0, visible: false });
  const [undoStack, setUndoStack] = useState<CanvasAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasAnnotation[][]>([]);
  
  const { toast } = useToast();

  // Initialize triple-layer canvas system
  useEffect(() => {
    console.log('EnhancedCanvasAnnotation: Initializing with text:', text.substring(0, 100) + '...');
    
    const textCanvas = textCanvasRef.current;
    const annotationCanvas = annotationCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!textCanvas || !annotationCanvas || !overlayCanvas) {
      console.error('Canvas refs not available');
      return;
    }

    const width = 1024;
    const height = 768;
    
    [textCanvas, annotationCanvas, overlayCanvas].forEach(canvas => {
      canvas.width = width;
      canvas.height = height;
    });
    
    const textContext = textCanvas.getContext('2d');
    const annotationContext = annotationCanvas.getContext('2d');
    const overlayContext = overlayCanvas.getContext('2d');
    
    if (!textContext || !annotationContext || !overlayContext) return;

    // Configure contexts
    [textContext, annotationContext, overlayContext].forEach(ctx => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = true;
    });
    
    textContextRef.current = textContext;
    annotationContextRef.current = annotationContext;
    overlayContextRef.current = overlayContext;

    drawTextContent(textContext, text);
  }, [text]);

  const drawTextContent = (ctx: CanvasRenderingContext2D, textContent: string) => {
    console.log('Drawing text content:', textContent.length + ' characters');
    
    // Clear canvas with premium white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Configure premium text style
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Split text into lines and render with better typography
    const lines = textContent.split('\n');
    let y = 80;
    const lineHeight = 28;
    const maxWidth = 880;

    lines.forEach((line, lineIndex) => {
      if (line.trim()) {
        // Word wrap for long lines with better spacing
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            ctx.fillText(currentLine, 80, y);
            currentLine = word + ' ';
            y += lineHeight;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          ctx.fillText(currentLine, 80, y);
          y += lineHeight;
        }
      } else {
        // Empty line spacing
        y += lineHeight * 0.6;
      }
    });
    
    console.log('Text rendered successfully. Final Y position:', y);
  };

  // Enhanced gesture recognition with tactile feedback
  const detectGesture = useCallback((points: Point[]): 'zigzag' | 'circle' | 'square' | 'none' => {
    if (points.length < 10) return 'none';
    
    // ZigZag detection for LOW relevance (blue)
    let directionChanges = 0;
    let previousDirection: 'up' | 'down' | null = null;
    
    for (let i = 1; i < points.length; i++) {
      const yDiff = points[i].y - points[i - 1].y;
      if (Math.abs(yDiff) > 5) {
        const currentDirection = yDiff > 0 ? 'down' : 'up';
        if (previousDirection && previousDirection !== currentDirection) {
          directionChanges++;
        }
        previousDirection = currentDirection;
      }
    }
    
    if (directionChanges >= 3) {
      // Haptic feedback simulation
      navigator.vibrate?.(100);
      return 'zigzag';
    }
    
    // Circle detection for HIGH relevance (red)
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    
    const width = maxX - minX;
    const height = maxY - minY;
    const aspectRatio = Math.min(width, height) / Math.max(width, height);
    
    const closure = Math.sqrt(
      Math.pow(points[0].x - points[points.length - 1].x, 2) +
      Math.pow(points[0].y - points[points.length - 1].y, 2)
    );
    const avgRadius = (width + height) / 4;
    const closureRatio = closure / avgRadius;
    
    if (aspectRatio >= 0.6 && closureRatio < 0.5 && points.length >= 15) {
      navigator.vibrate?.(150);
      return 'circle';
    }
    
    // Square detection for MEDIUM relevance (orange)
    if (aspectRatio >= 0.7 && closureRatio < 0.3 && points.length >= 20) {
      navigator.vibrate?.(200);
      return 'square';
    }
    
    return 'none';
  }, []);

  const getDrawingColor = (tool: DrawingTool, pressure: number = 1, magicMode?: string): string => {
    const intensity = Math.max(0.2, Math.min(1, pressure));
    const alpha = 0.3 + (intensity * 0.5);
    
    if (tool === 'magic') {
      switch (magicMode) {
        case 'idle': return `rgba(100, 116, 139, ${alpha * 0.7})`;
        case 'high': return `rgba(239, 68, 68, ${alpha})`;
        case 'low': return `rgba(59, 130, 246, ${alpha * 0.8})`;
        case 'medium':
        default: return `rgba(249, 115, 22, ${alpha * 0.9})`;
      }
    }
    
    switch (tool) {
      case 'high': return `rgba(239, 68, 68, ${alpha})`;
      case 'medium': return `rgba(249, 115, 22, ${alpha * 0.9})`;
      case 'low': return `rgba(59, 130, 246, ${alpha * 0.8})`;
      case 'neutral': return `rgba(234, 179, 8, ${alpha * 0.7})`;
      case 'eraser': return '#ffffff';
      default: return `rgba(239, 68, 68, ${alpha})`;
    }
  };

  const getStrokeWidth = (pressure: number, tool: DrawingTool): number => {
    const baseWidth = tool === 'eraser' ? 24 : 16;
    const pressureMultiplier = Math.max(0.6, Math.min(2.5, pressure));
    return Math.max(6, Math.min(40, baseWidth * pressureMultiplier));
  };

  const updateBrushPreview = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pressure = e.pressure || 0.5;
    const size = getStrokeWidth(pressure, activeTool);
    
    setBrushPreview({ x, y, size, visible: true });
    
    // Draw brush preview
    const ctx = overlayContextRef.current;
    if (ctx && !isDrawing) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
      ctx.strokeStyle = getDrawingColor(activeTool, pressure, magicToolMode);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [activeTool, magicToolMode, isDrawing]);

  const startDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'pan') return;

    const canvas = annotationCanvasRef.current;
    const ctx = annotationContextRef.current;
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pressure = e.pressure || 0.5;
    
    setLastPos({ x, y });
    setCurrentPressure(pressure);

    // Save state for undo
    setUndoStack(prev => [...prev, [...annotations]]);
    setRedoStack([]);

    if (activeTool === 'magic') {
      setMagicToolMode('idle');
    }
    
    setGesturePoints([{ x, y, time: Date.now(), pressure }]);
    
    const color = getDrawingColor(activeTool, pressure, magicToolMode);
    const strokeWidth = getStrokeWidth(pressure, activeTool);

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    
    // Enhanced glow effect
    if (activeTool !== 'eraser') {
      ctx.shadowColor = color;
      ctx.shadowBlur = strokeWidth * 1.2;
      ctx.filter = 'drop-shadow(0 0 8px currentColor)';
    } else {
      ctx.shadowBlur = 0;
      ctx.filter = 'none';
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [activeTool, magicToolMode, annotations]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'pan') return;

    const canvas = annotationCanvasRef.current;
    const ctx = annotationContextRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pressure = e.pressure || currentPressure;

    // Smooth drawing with pressure variation
    const strokeWidth = getStrokeWidth(pressure, activeTool);
    ctx.lineWidth = strokeWidth;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Add point to gesture tracking
    setGesturePoints(prev => [...prev, { x, y, time: Date.now(), pressure }]);
    
    // Magic Pencil gesture recognition
    if (activeTool === 'magic' && gesturePoints.length > 5) {
      const gesture = detectGesture(gesturePoints);
      if (gesture !== 'none') {
        let newMode: 'medium' | 'high' | 'low' = 'medium';
        switch (gesture) {
          case 'zigzag': newMode = 'low'; break;    // Zigzag = Low/Blue
          case 'circle': newMode = 'high'; break;   // Circle = High/Red
          case 'square': newMode = 'medium'; break; // Square = Medium/Orange
        }
        
        if (newMode !== magicToolMode) {
          setMagicToolMode(newMode);
          const newColor = getDrawingColor('magic', pressure, newMode);
          ctx.strokeStyle = newColor;
          ctx.shadowColor = newColor;
          
          // Visual feedback
          toast({
            title: `${newMode.charAt(0).toUpperCase() + newMode.slice(1)} Relevance`,
            description: `Gesture recognized: ${gesture}`,
            duration: 1500,
          });
        }
      }
    }
    
    setLastPos({ x, y });
    setCurrentPressure(pressure);
  }, [isDrawing, activeTool, currentPressure, gesturePoints, magicToolMode, detectGesture, toast]);

  const stopDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Create annotation from gesture
    if (gesturePoints.length > 3 && activeTool !== 'eraser') {
      const minX = Math.min(...gesturePoints.map(p => p.x));
      const maxX = Math.max(...gesturePoints.map(p => p.x));
      const minY = Math.min(...gesturePoints.map(p => p.y));
      const maxY = Math.max(...gesturePoints.map(p => p.y));
      
      const annotationType = activeTool === 'magic' ? magicToolMode : activeTool;
      
      const newAnnotation: CanvasAnnotation = {
        id: `annotation-${Date.now()}-${Math.random()}`,
        type: annotationType as 'high' | 'medium' | 'low' | 'neutral',
        pressure: currentPressure,
        timestamp: Date.now(),
        bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        paths: gesturePoints.map(p => ({ x: p.x, y: p.y, pressure: p.pressure || 0.5 }))
      };
      
      const updatedAnnotations = [...annotations, newAnnotation];
      setAnnotations(updatedAnnotations);
      onAnnotationsChange(updatedAnnotations);
      
      // Show comment input
      setActiveAnnotationId(newAnnotation.id);
      setCommentPosition({ x, y });
      setShowCommentInput(true);
    }
    
    setGesturePoints([]);
    if (activeTool === 'magic') {
      setMagicToolMode('idle');
    }
    
    // Clear overlay
    const overlayCtx = overlayContextRef.current;
    if (overlayCtx) {
      overlayCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [isDrawing, gesturePoints, activeTool, magicToolMode, currentPressure, annotations, onAnnotationsChange]);

  const handleCommentSubmit = () => {
    if (!activeAnnotationId || !commentText.trim()) {
      setShowCommentInput(false);
      setActiveAnnotationId(null);
      setCommentText('');
      return;
    }

    const updatedAnnotations = annotations.map(ann => 
      ann.id === activeAnnotationId 
        ? { ...ann, comment: commentText.trim() }
        : ann
    );
    
    setAnnotations(updatedAnnotations);
    onAnnotationsChange(updatedAnnotations);
    
    setShowCommentInput(false);
    setActiveAnnotationId(null);
    setCommentText('');
    
    toast({
      title: "Comment Added",
      description: "Your annotation comment has been saved",
      duration: 2000,
    });
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, [...annotations]]);
    setUndoStack(prev => prev.slice(0, -1));
    setAnnotations(previousState);
    onAnnotationsChange(previousState);
    
    // Redraw canvas
    const ctx = annotationContextRef.current;
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      // Redraw all annotations
      previousState.forEach(ann => {
        // Redraw annotation paths
        ctx.beginPath();
        ann.paths.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.strokeStyle = getDrawingColor(ann.type, ann.pressure);
        ctx.lineWidth = getStrokeWidth(ann.pressure, ann.type);
        ctx.stroke();
      });
    }
  };

  const clearCanvas = () => {
    const ctx = annotationContextRef.current;
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    setUndoStack(prev => [...prev, [...annotations]]);
    setAnnotations([]);
    onAnnotationsChange([]);
  };

  const tools = [
    { key: 'magic', icon: Sparkles, label: 'Magic Pencil', description: 'Gesture-based annotation' },
    { key: 'high', icon: Heart, label: 'High', description: 'High relevance' },
    { key: 'medium', icon: ThumbsUp, label: 'Medium', description: 'Medium relevance' },
    { key: 'low', icon: ThumbsDown, label: 'Low', description: 'Low relevance' },
    { key: 'neutral', icon: Minus, label: 'Neutral', description: 'Neutral/Remove' },
    { key: 'eraser', icon: Eraser, label: 'Eraser', description: 'Erase annotations' },
    { key: 'pan', icon: Hand, label: 'Pan', description: 'Pan canvas' }
  ] as const;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-annotation-high to-annotation-low flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Magic Pencil Tools</span>
          </div>
          
          <div className="flex gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.key}
                variant={activeTool === tool.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTool(tool.key as DrawingTool)}
                className={`
                  h-10 transition-all duration-200 hover-scale
                  ${activeTool === tool.key 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'hover:bg-accent'
                  }
                `}
                title={tool.description}
              >
                <tool.icon className="w-4 h-4 mr-2" />
                {tool.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={undoStack.length === 0}
              className="h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={annotations.length === 0}
              className="h-8"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Magic Mode Indicator */}
        {activeTool === 'magic' && (
          <div className="mt-3 p-3 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Magic Mode: </span>
              <Badge variant="secondary" className="magic-pencil-gesture">
                {magicToolMode === 'idle' ? 'Draw a gesture...' : `${magicToolMode.toUpperCase()} relevance`}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ⚡ Zigzag: Low • ⭕ Circle: High • ⬜ Square: Medium
            </div>
          </div>
        )}
      </Card>

      {/* Enhanced Canvas */}
      <Card className="p-6">
        <div className="relative w-full">
          <div className="relative border rounded-xl overflow-hidden shadow-canvas bg-white w-full" style={{ height: '600px' }}>
            {/* Text layer - shows the content */}
            <canvas
              ref={textCanvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ 
                zIndex: 1,
                width: '100%',
                height: '100%',
                display: 'block'
              }}
            />
            
            {/* Annotation layer - handles drawing */}
            <canvas
              ref={annotationCanvasRef}
              className="absolute inset-0 annotation-canvas cursor-crosshair"
              style={{ 
                zIndex: 2,
                width: '100%',
                height: '100%',
                display: 'block'
              }}
              onPointerDown={startDrawing}
              onPointerMove={(e) => {
                updateBrushPreview(e);
                draw(e);
              }}
              onPointerUp={stopDrawing}
              onPointerLeave={() => setBrushPreview(prev => ({ ...prev, visible: false }))}
            />
            
            {/* Overlay layer for brush preview */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ 
                zIndex: 3,
                width: '100%',
                height: '100%',
                display: 'block'
              }}
            />
          </div>

          {/* Floating Comment Input */}
          {showCommentInput && (
            <div 
              className="absolute z-10 comment-bubble bg-card/95 backdrop-blur-lg border rounded-xl shadow-xl p-4 min-w-72"
              style={{
                left: `${Math.min(commentPosition.x, 800)}px`,
                top: `${commentPosition.y + 20}px`,
              }}
            >
              <div className="space-y-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add comment (Enter to save, Esc to skip)"
                  className="text-sm border-none bg-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommentSubmit();
                    } else if (e.key === 'Escape') {
                      setShowCommentInput(false);
                      setActiveAnnotationId(null);
                      setCommentText('');
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Brush Preview */}
          {brushPreview.visible && !isDrawing && (
            <div
              className="brush-preview"
              style={{
                left: `${brushPreview.x}px`,
                top: `${brushPreview.y}px`,
                width: `${brushPreview.size}px`,
                height: `${brushPreview.size}px`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: getDrawingColor(activeTool, currentPressure, magicToolMode),
              }}
            />
          )}
        </div>
      </Card>

      {/* Annotation Summary */}
      {annotations.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-semibold">Annotation Summary</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {['high', 'medium', 'low', 'neutral'].map(type => {
              const count = annotations.filter(a => a.type === type).length;
              const withComments = annotations.filter(a => a.type === type && a.comment).length;
              return (
                <div key={type} className="text-center">
                  <div className={`text-2xl font-bold text-annotation-${type}`}>{count}</div>
                  <div className="text-xs text-muted-foreground">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                    {withComments > 0 && ` (${withComments} with comments)`}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancedCanvasAnnotation;