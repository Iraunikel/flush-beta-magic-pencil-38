import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenTool, Type, BarChart3, Sparkles, Wand2 } from 'lucide-react';
import EnhancedCanvasAnnotation, { type CanvasAnnotation } from './EnhancedCanvasAnnotation';
import AnnotationInterface, { type Annotation } from './AnnotationInterface';
import PromptRefinement from './PromptRefinement';
import AnalyticsDashboard from './AnalyticsDashboard';
import UserExperienceLanding from './UserExperienceLanding';

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
  const [activeMode, setActiveMode] = useState<'ux' | 'canvas' | 'text'>('ux');

  const handleCanvasAnnotationsChange = (newAnnotations: CanvasAnnotation[]) => {
    setCanvasAnnotations(newAnnotations);
  };

  const handleTextAnnotationsChange = (newAnnotations: Annotation[]) => {
    setTextAnnotations(newAnnotations);
  };

  const handleRefinePrompt = () => {
    const element = document.getElementById('prompt-refinement');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Combine both annotation types for total count and convert canvas to text format
  const totalAnnotations = canvasAnnotations.length + textAnnotations.length;
  
  // Convert canvas annotations to text annotations for the refined prompt
  const convertedCanvasAnnotations: Annotation[] = canvasAnnotations.map(canvasAnn => ({
    id: canvasAnn.id,
    text: `Canvas annotation (${canvasAnn.type})`, // Since we don't have actual text selection from canvas
    relevanceLevel: canvasAnn.type,
    comment: canvasAnn.comment || '',
    timestamp: canvasAnn.timestamp,
    startIndex: 0,
    endIndex: 0,
    startOffset: 0,
    endOffset: 0
  }));
  
  // Combine all annotations for the refined prompt
  const allAnnotations = [...textAnnotations, ...convertedCanvasAnnotations];

  const handleStartAnnotating = () => {
    setActiveMode('canvas');
  };

  return (
    <div className="space-y-8">
      {/* Mode Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Flush Beta - Magic Pencil</h2>
          {totalAnnotations > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {totalAnnotations} annotation{totalAnnotations !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'ux' | 'canvas' | 'text')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ux" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              User Experience
            </TabsTrigger>
            <TabsTrigger value="canvas" className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Canvas Drawing
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Text Selection
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ux" className="mt-6 p-0">
            <div className="-mx-6 -mb-6">
              <UserExperienceLanding onStartAnnotating={handleStartAnnotating} />
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

      {/* Analytics Dashboard */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5" />
          <h3 className="text-lg font-semibold text-foreground">Flush Analytics</h3>
        </div>
        
        <AnalyticsDashboard
          annotations={allAnnotations}
          originalPrompt="Please analyze this AI response and improve it based on my feedback:"
          originalResponse={content}
        />
      </Card>

      {/* Prompt Refinement */}
      {totalAnnotations > 0 && (
        <div id="prompt-refinement">
          <PromptRefinement
            originalPrompt="Please analyze this AI response and improve it based on my feedback:"
            originalResponse={content}
            annotations={allAnnotations}
          />
        </div>
      )}
    </div>
  );
};

export default CombinedAnnotationInterface;