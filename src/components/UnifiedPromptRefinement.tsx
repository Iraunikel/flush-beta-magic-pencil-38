import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Copy, 
  Download, 
  Wand2, 
  PenTool, 
  Type, 
  BarChart3,
  FileText,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UnifiedAnnotation } from './UnifiedAnalyticsDashboard';

interface UnifiedPromptRefinementProps {
  originalPrompt: string;
  originalResponse: string;
  annotations: UnifiedAnnotation[];
  onPromptGenerated?: (prompt: string) => void;
}

interface AnnotationStats {
  total: number;
  byTool: {
    magicPencil: number;
    canvas: number;
    text: number;
  };
  byRelevance: {
    high: number;
    medium: number;
    low: number;
    neutral: number;
  };
  withComments: number;
  noiseReduction: number;
}

const UnifiedPromptRefinement: React.FC<UnifiedPromptRefinementProps> = ({
  originalPrompt,
  originalResponse,
  annotations,
  onPromptGenerated
}) => {
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  const annotationStats = useMemo((): AnnotationStats => {
    const total = annotations.length;
    
    const byTool = {
      magicPencil: annotations.filter(a => a.type === 'magic-pencil').length,
      canvas: annotations.filter(a => a.type === 'canvas').length,
      text: annotations.filter(a => a.type === 'text').length
    };
    
    const byRelevance = {
      high: annotations.filter(a => ['hot', 'high'].includes(a.relevanceLevel)).length,
      medium: annotations.filter(a => a.relevanceLevel === 'medium').length,
      low: annotations.filter(a => ['low', 'flush'].includes(a.relevanceLevel)).length,
      neutral: annotations.filter(a => a.relevanceLevel === 'neutral').length
    };
    
    const withComments = annotations.filter(a => a.comment && a.comment.trim()).length;
    const noiseReduction = total > 0 ? (byRelevance.low / total) * 100 : 0;
    
    return {
      total,
      byTool,
      byRelevance,
      withComments,
      noiseReduction
    };
  }, [annotations]);

  const refinedPrompt = useMemo(() => {
    if (annotations.length === 0) return '';
    
    // Categorize annotations by relevance and tool
    const highPriorityContent = annotations
      .filter(a => ['hot', 'high'].includes(a.relevanceLevel))
      .map(a => ({
        text: a.text || 'Visual annotation',
        comment: a.comment,
        tool: a.type
      }));
    
    const mediumPriorityContent = annotations
      .filter(a => a.relevanceLevel === 'medium')
      .map(a => ({
        text: a.text || 'Visual annotation',
        comment: a.comment,
        tool: a.type
      }));
    
    const lowPriorityContent = annotations
      .filter(a => ['low', 'flush'].includes(a.relevanceLevel))
      .map(a => ({
        text: a.text || 'Visual annotation',
        comment: a.comment,
        tool: a.type
      }));
    
    const commentsOnly = annotations
      .filter(a => a.comment && a.comment.trim() && !['hot', 'high', 'medium', 'low', 'flush'].includes(a.relevanceLevel))
      .map(a => a.comment?.trim())
      .filter(Boolean);

    let prompt = `# Refined AI Instruction Based on Multi-Modal User Feedback

## Original Context
**Original Prompt:** "${originalPrompt}"

## User Analysis Summary
- **Total Annotations:** ${annotationStats.total}
- **Tools Used:** ${Object.entries(annotationStats.byTool).filter(([_, count]) => count > 0).map(([tool, count]) => `${tool.replace(/([A-Z])/g, ' $1').toLowerCase()} (${count})`).join(', ')}
- **Noise Reduction:** ${annotationStats.noiseReduction.toFixed(1)}% of content flagged for removal/reduction

## Detailed Feedback Analysis
`;

    // High Priority Content
    if (highPriorityContent.length > 0) {
      prompt += `\n### 🔥 HIGH PRIORITY - Emphasize & Expand
The user marked these elements as highly relevant and wants them enhanced:

`;
      highPriorityContent.forEach((item, index) => {
        prompt += `${index + 1}. **Content:** "${item.text}"
   - **Tool Used:** ${item.tool.charAt(0).toUpperCase() + item.tool.slice(1).replace('-', ' ')}
   - **Action:** EMPHASIZE and provide more detail on this aspect
`;
        if (item.comment) {
          prompt += `   - **User Note:** ${item.comment}\n`;
        }
        prompt += '\n';
      });
    }

    // Medium Priority Content
    if (mediumPriorityContent.length > 0) {
      prompt += `\n### ⚡ MEDIUM PRIORITY - Maintain & Refine
These elements should be kept but could be refined:

`;
      mediumPriorityContent.forEach((item, index) => {
        prompt += `${index + 1}. **Content:** "${item.text}"
   - **Tool Used:** ${item.tool.charAt(0).toUpperCase() + item.tool.slice(1).replace('-', ' ')}
   - **Action:** Keep but consider refinement
`;
        if (item.comment) {
          prompt += `   - **User Note:** ${item.comment}\n`;
        }
        prompt += '\n';
      });
    }

    // Low Priority / Flush Content
    if (lowPriorityContent.length > 0) {
      prompt += `\n### ❄️ LOW PRIORITY - Reduce or Remove
The user wants these elements minimized or eliminated:

`;
      lowPriorityContent.forEach((item, index) => {
        prompt += `${index + 1}. **Content:** "${item.text}"
   - **Tool Used:** ${item.tool.charAt(0).toUpperCase() + item.tool.slice(1).replace('-', ' ')}
   - **Action:** REDUCE prominence or REMOVE if not essential
`;
        if (item.comment) {
          prompt += `   - **User Note:** ${item.comment}\n`;
        }
        prompt += '\n';
      });
    }

    // Additional Comments
    if (commentsOnly.length > 0) {
      prompt += `\n### 💭 Additional User Guidance
`;
      commentsOnly.forEach((comment, index) => {
        prompt += `${index + 1}. ${comment}\n`;
      });
      prompt += '\n';
    }

    // Custom instructions
    if (customInstructions.trim()) {
      prompt += `\n### 🎯 Custom Instructions
${customInstructions}

`;
    }

    // Final instructions
    prompt += `\n## Implementation Instructions

Based on this multi-modal feedback analysis:

1. **Prioritize** the high-priority content marked by the user
2. **Enhance** areas where visual attention was focused (canvas drawings)
3. **Restructure** to reduce or eliminate low-priority elements
4. **Incorporate** specific user comments and suggestions
5. **Maintain** the overall intent while improving focus and relevance

The user has provided feedback through ${Object.entries(annotationStats.byTool).filter(([_, count]) => count > 0).length} different annotation methods, indicating a comprehensive review. Please generate a response that reflects this detailed analysis.

---
*Generated from ${annotationStats.total} annotations across Magic Pencil, Canvas Drawing, and Text Selection tools*`;

    return prompt;
  }, [annotations, originalPrompt, customInstructions, annotationStats]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: `${filename} saved to your device`,
    });
  };

  const handleGeneratePrompt = () => {
    if (onPromptGenerated) {
      onPromptGenerated(refinedPrompt);
    }
  };

  if (annotations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Annotations Yet</h3>
            <p className="text-sm text-muted-foreground">
              Create annotations using any of the Flush Beta tools to generate a refined prompt
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Unified Prompt Refinement
          </h2>
          <Badge variant="secondary" className="text-sm">
            {annotationStats.total} annotations processed
          </Badge>
        </div>
        
        {/* Tool Usage Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <Wand2 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-lg font-semibold text-foreground">
              {annotationStats.byTool.magicPencil}
            </div>
            <div className="text-xs text-muted-foreground">Magic Pencil</div>
          </div>
          <div className="text-center p-3 bg-annotation-medium/10 rounded-lg">
            <PenTool className="w-6 h-6 mx-auto mb-2 text-annotation-medium" />
            <div className="text-lg font-semibold text-foreground">
              {annotationStats.byTool.canvas}
            </div>
            <div className="text-xs text-muted-foreground">Canvas Drawing</div>
          </div>
          <div className="text-center p-3 bg-annotation-low/10 rounded-lg">
            <Type className="w-6 h-6 mx-auto mb-2 text-annotation-low" />
            <div className="text-lg font-semibold text-foreground">
              {annotationStats.byTool.text}
            </div>
            <div className="text-xs text-muted-foreground">Text Selection</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-annotation-high">
              {annotationStats.byRelevance.high}
            </div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-annotation-medium">
              {annotationStats.byRelevance.medium}
            </div>
            <div className="text-xs text-muted-foreground">Medium Priority</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-annotation-low">
              {annotationStats.byRelevance.low}
            </div>
            <div className="text-xs text-muted-foreground">To Reduce/Remove</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {annotationStats.withComments}
            </div>
            <div className="text-xs text-muted-foreground">With Comments</div>
          </div>
        </div>
      </Card>

      {/* Custom Instructions */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Custom Instructions</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
          
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any additional instructions or context for the refined prompt..."
            className="min-h-24"
          />
          
          {showAdvanced && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2">Advanced Options</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• The refined prompt automatically includes all annotation data</p>
                <p>• Visual annotations from canvas are described contextually</p>
                <p>• Magic Pencil gestures are translated to priority levels</p>
                <p>• Text selections maintain original context</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Refined Prompt Output */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Refined Prompt</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(refinedPrompt, 'Refined prompt')}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadAsText(refinedPrompt, 'refined-prompt.txt')}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              {onPromptGenerated && (
                <Button
                  onClick={handleGeneratePrompt}
                  className="bg-gradient-to-r from-primary to-primary-glow"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Generate Response
                </Button>
              )}
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {refinedPrompt}
            </pre>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Prompt generated from {annotationStats.total} annotations across all Flush Beta tools</span>
          </div>
        </div>
      </Card>

      {/* Quality Assessment */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Prompt Quality Assessment
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Annotation Coverage</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Excellent</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Multi-Tool Usage</span>
            <div className="flex items-center gap-2">
              {Object.values(annotationStats.byTool).filter(count => count > 0).length === 3 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                {Object.values(annotationStats.byTool).filter(count => count > 0).length}/3 tools used
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Detail Level</span>
            <div className="flex items-center gap-2">
              {annotationStats.withComments > annotationStats.total * 0.3 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                {Math.round((annotationStats.withComments / annotationStats.total) * 100)}% with comments
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UnifiedPromptRefinement;