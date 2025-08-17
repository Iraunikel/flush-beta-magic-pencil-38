import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenTool, Type, BarChart3, Sparkles } from 'lucide-react';
import EnhancedCanvasAnnotation, { type CanvasAnnotation } from './EnhancedCanvasAnnotation';
import AnnotationInterface, { type Annotation } from './AnnotationInterface';
import UnifiedPromptRefinement from './UnifiedPromptRefinement';
import UnifiedAnalyticsDashboard, { type UnifiedAnnotation } from './UnifiedAnalyticsDashboard';
import MagicPencilExperience from './MagicPencilExperience';

interface CombinedAnnotationInterfaceProps {
  content: string;
  onContentChange: (content: string) => void;
}

const CombinedAnnotationInterface: React.FC<CombinedAnnotationInterfaceProps> = ({
  content,
  onContentChange
}) => {
  const [canvasAnnotations, setCanvasAnnotations] = useState<CanvasAnnotation[]>([]);
  const [textAnnotations, setTextAnnotations] = useState<Annotation[]>([]);
  const [magicPencilAnnotations, setMagicPencilAnnotations] = useState<any[]>([]);
  const [activeMode, setActiveMode] = useState<'ux' | 'canvas' | 'text'>('text');
  const [sessionStartTime] = useState(Date.now());

  const handleCanvasAnnotationsChange = (newAnnotations: CanvasAnnotation[]) => {
    setCanvasAnnotations(newAnnotations);
  };

  const handleTextAnnotationsChange = (newAnnotations: Annotation[]) => {
    setTextAnnotations(newAnnotations);
  };

  const handleMagicPencilAnnotationsChange = (newAnnotations: any[]) => {
    setMagicPencilAnnotations(newAnnotations);
  };

  const handleRefinePrompt = () => {
    const element = document.getElementById('prompt-refinement');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Convert all annotation types to unified format
  const unifiedAnnotations: UnifiedAnnotation[] = [
    // Magic Pencil annotations
    ...magicPencilAnnotations.map(annotation => ({
      id: annotation.id,
      type: 'magic-pencil' as const,
      relevanceLevel: annotation.type || 'medium',
      text: annotation.text || '',
      comment: annotation.comment,
      timestamp: annotation.timestamp,
      startIndex: annotation.start,
      endIndex: annotation.end
    })),
    // Canvas annotations
    ...canvasAnnotations.map(canvasAnn => ({
      id: canvasAnn.id,
      type: 'canvas' as const,
      relevanceLevel: (canvasAnn.type === 'high' ? 'high' : 
                      canvasAnn.type === 'medium' ? 'medium' :
                      canvasAnn.type === 'low' ? 'low' : 'neutral') as 'high' | 'medium' | 'low' | 'neutral' | 'hot' | 'flush',
      text: `Canvas annotation (${canvasAnn.type})`,
      comment: canvasAnn.comment || '',
      timestamp: canvasAnn.timestamp,
      bounds: canvasAnn.bounds,
      paths: canvasAnn.paths,
      pressure: canvasAnn.pressure
    })),
    // Text annotations
    ...textAnnotations.map(textAnn => ({
      id: textAnn.id,
      type: 'text' as const,
      relevanceLevel: textAnn.relevanceLevel as 'high' | 'medium' | 'low' | 'neutral' | 'hot' | 'flush',
      text: textAnn.text,
      comment: textAnn.comment,
      timestamp: Date.now(),
      startIndex: textAnn.startIndex,
      endIndex: textAnn.endIndex
    }))
  ];
  
  const totalAnnotations = unifiedAnnotations.length;

  const handleStartAnnotating = () => {
    setActiveMode('canvas');
  };

  return (
    <div className="space-y-8">
      {/* Mode Selection */}
      <Card className="p-6">
        <div className="mb-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-foreground">Flush Beta</h2>
            <p className="text-sm text-muted-foreground">Features developed during the hackathon</p>
          </div>
        </div>
        {totalAnnotations > 0 && (
          <div className="flex justify-end mb-2">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {totalAnnotations} annotation{totalAnnotations !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
        
        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'ux' | 'canvas' | 'text')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Feature 1: Basic Text Annotation
            </TabsTrigger>
            <TabsTrigger value="canvas" className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Feature 2: Gesture Recognition
            </TabsTrigger>
            <TabsTrigger value="ux" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Feature 3: Animation Flow
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ux" className="mt-6 p-0">
            <div className="-mx-6 -mb-6">
            <MagicPencilExperience 
              content={content}
              onContentChange={onContentChange}
              onAnnotationsChange={handleMagicPencilAnnotationsChange}
              onRefinePrompt={() => console.log('Refine prompt triggered from Magic Pencil')}
            />
            </div>
          </TabsContent>
          
          <TabsContent value="canvas" className="mt-6">
            <EnhancedCanvasAnnotation
              text={content}
              onAnnotationsChange={handleCanvasAnnotationsChange}
            />
          </TabsContent>
          
          <TabsContent value="text" className="mt-6">
            <AnnotationInterface
              content={content}
              onContentChange={onContentChange}
              onAnnotationsChange={handleTextAnnotationsChange}
              onRefinePrompt={handleRefinePrompt}
              annotations={textAnnotations}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Unified Analytics Dashboard */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5" />
          <h3 className="text-lg font-semibold text-foreground">Unified Flush Analytics</h3>
        </div>
        
        <UnifiedAnalyticsDashboard
          annotations={unifiedAnnotations}
          originalPrompt="Please analyze this AI response and improve it based on my feedback:"
          originalResponse={content}
          sessionStartTime={sessionStartTime}
        />
      </Card>

      {/* Unified Prompt Refinement */}
      {totalAnnotations > 0 && (
        <div id="prompt-refinement">
          <UnifiedPromptRefinement
            originalPrompt="Please analyze this AI response and improve it based on my feedback:"
            originalResponse={content}
            annotations={unifiedAnnotations}
          />
        </div>
      )}
    </div>
  );
};

export default CombinedAnnotationInterface;