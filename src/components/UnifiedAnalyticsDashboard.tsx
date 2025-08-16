import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  Sparkles, 
  PenTool, 
  Type, 
  Wand2,
  Activity,
  Users,
  Timer,
  CheckCircle
} from 'lucide-react';

// Unified annotation types from all three tools
export interface UnifiedAnnotation {
  id: string;
  type: 'magic-pencil' | 'canvas' | 'text';
  relevanceLevel: 'hot' | 'high' | 'medium' | 'neutral' | 'low' | 'flush';
  text?: string;
  comment?: string;
  timestamp: number;
  
  // Magic Pencil specific
  startIndex?: number;
  endIndex?: number;
  
  // Canvas specific
  bounds?: { x: number; y: number; width: number; height: number };
  paths?: { x: number; y: number; pressure: number }[];
  pressure?: number;
  
  // Text specific
  startOffset?: number;
  endOffset?: number;
}

interface UnifiedAnalyticsDashboardProps {
  annotations: UnifiedAnnotation[];
  originalPrompt?: string;
  originalResponse?: string;
  sessionStartTime?: number;
}

interface KPIMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  category: 'engagement' | 'quality' | 'efficiency' | 'insights';
}

const UnifiedAnalyticsDashboard: React.FC<UnifiedAnalyticsDashboardProps> = ({
  annotations,
  originalPrompt,
  originalResponse,
  sessionStartTime = Date.now()
}) => {
  const metrics = useMemo((): KPIMetric[] => {
    const totalAnnotations = annotations.length;
    const sessionDuration = Math.max(1, (Date.now() - sessionStartTime) / 1000 / 60); // in minutes
    
    // Tool usage breakdown
    const magicPencilCount = annotations.filter(a => a.type === 'magic-pencil').length;
    const canvasCount = annotations.filter(a => a.type === 'canvas').length;
    const textCount = annotations.filter(a => a.type === 'text').length;
    
    // Relevance analysis
    const highRelevance = annotations.filter(a => ['hot', 'high'].includes(a.relevanceLevel)).length;
    const mediumRelevance = annotations.filter(a => a.relevanceLevel === 'medium').length;
    const lowRelevance = annotations.filter(a => ['low', 'flush'].includes(a.relevanceLevel)).length;
    const neutralRelevance = annotations.filter(a => a.relevanceLevel === 'neutral').length;
    
    // Quality metrics
    const withComments = annotations.filter(a => a.comment && a.comment.trim()).length;
    const commentQuality = totalAnnotations > 0 ? (withComments / totalAnnotations) * 100 : 0;
    
    // Content analysis
    const totalCharacters = originalResponse?.length || 0;
    const annotatedChars = annotations.reduce((sum, ann) => {
      if (ann.startIndex !== undefined && ann.endIndex !== undefined) {
        return sum + (ann.endIndex - ann.startIndex);
      }
      return sum + (ann.text?.length || 50); // Estimate for canvas/magic pencil
    }, 0);
    const coverage = totalCharacters > 0 ? (annotatedChars / totalCharacters) * 100 : 0;
    
    // Efficiency metrics
    const annotationsPerMinute = sessionDuration > 0 ? totalAnnotations / sessionDuration : 0;
    const focusScore = (highRelevance * 3 + mediumRelevance * 2 - lowRelevance) / Math.max(1, totalAnnotations) * 100;
    
    // Noise reduction calculation
    const noiseReduction = totalAnnotations > 0 ? (lowRelevance / totalAnnotations) * 100 : 0;
    
    // Tool diversity score
    const usedTools = [magicPencilCount > 0, canvasCount > 0, textCount > 0].filter(Boolean).length;
    const toolDiversity = (usedTools / 3) * 100;
    
    return [
      {
        id: 'total-annotations',
        name: 'Total Annotations',
        value: totalAnnotations,
        description: 'All annotations across Magic Pencil, Canvas, and Text tools',
        icon: <Activity className="w-4 h-4" />,
        color: 'text-primary',
        category: 'engagement'
      },
      {
        id: 'focus-score',
        name: 'Focus Score',
        value: Math.round(focusScore),
        unit: '%',
        description: 'Quality of relevance judgments (high relevance boosts, low relevance reduces)',
        icon: <Target className="w-4 h-4" />,
        color: 'text-annotation-high',
        category: 'quality',
        trend: focusScore > 60 ? 'up' : focusScore > 30 ? 'stable' : 'down'
      },
      {
        id: 'coverage',
        name: 'Content Coverage',
        value: Math.round(coverage),
        unit: '%',
        description: 'Percentage of original content that has been annotated',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'text-annotation-medium',
        category: 'quality'
      },
      {
        id: 'noise-reduction',
        name: 'Noise Identified',
        value: Math.round(noiseReduction),
        unit: '%',
        description: 'Percentage of content marked as low relevance or to be flushed',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-annotation-low',
        category: 'insights'
      },
      {
        id: 'tool-diversity',
        name: 'Tool Diversity',
        value: Math.round(toolDiversity),
        unit: '%',
        description: 'Percentage of available annotation tools utilized',
        icon: <Sparkles className="w-4 h-4" />,
        color: 'text-accent',
        category: 'engagement'
      },
      {
        id: 'annotation-rate',
        name: 'Annotation Rate',
        value: annotationsPerMinute.toFixed(1),
        unit: '/min',
        description: 'Average annotations created per minute',
        icon: <Timer className="w-4 h-4" />,
        color: 'text-primary-glow',
        category: 'efficiency'
      },
      {
        id: 'comment-quality',
        name: 'Detail Level',
        value: Math.round(commentQuality),
        unit: '%',
        description: 'Percentage of annotations with detailed comments',
        icon: <Users className="w-4 h-4" />,
        color: 'text-annotation-neutral',
        category: 'quality'
      }
    ];
  }, [annotations, originalResponse, sessionStartTime]);

  const getToolBreakdown = useMemo(() => {
    const toolCounts = {
      'magic-pencil': annotations.filter(a => a.type === 'magic-pencil').length,
      'canvas': annotations.filter(a => a.type === 'canvas').length,
      'text': annotations.filter(a => a.type === 'text').length
    };
    
    const total = annotations.length;
    
    return {
      tools: [
        {
          name: 'Magic Pencil',
          count: toolCounts['magic-pencil'],
          percentage: total > 0 ? (toolCounts['magic-pencil'] / total) * 100 : 0,
          icon: <Wand2 className="w-4 h-4" />,
          color: 'from-primary to-primary-glow'
        },
        {
          name: 'Canvas Drawing',
          count: toolCounts['canvas'],
          percentage: total > 0 ? (toolCounts['canvas'] / total) * 100 : 0,
          icon: <PenTool className="w-4 h-4" />,
          color: 'from-annotation-medium to-annotation-high'
        },
        {
          name: 'Text Selection',
          count: toolCounts['text'],
          percentage: total > 0 ? (toolCounts['text'] / total) * 100 : 0,
          icon: <Type className="w-4 h-4" />,
          color: 'from-annotation-low to-annotation-neutral'
        }
      ],
      total
    };
  }, [annotations]);

  const getRelevanceBreakdown = useMemo(() => {
    const relevanceCounts = {
      high: annotations.filter(a => ['hot', 'high'].includes(a.relevanceLevel)).length,
      medium: annotations.filter(a => a.relevanceLevel === 'medium').length,
      low: annotations.filter(a => ['low', 'flush'].includes(a.relevanceLevel)).length,
      neutral: annotations.filter(a => a.relevanceLevel === 'neutral').length
    };
    
    const total = annotations.length;
    
    return {
      levels: [
        {
          name: 'High Priority',
          count: relevanceCounts.high,
          percentage: total > 0 ? (relevanceCounts.high / total) * 100 : 0,
          color: 'annotation-high',
          emoji: '🔥'
        },
        {
          name: 'Medium Priority', 
          count: relevanceCounts.medium,
          percentage: total > 0 ? (relevanceCounts.medium / total) * 100 : 0,
          color: 'annotation-medium',
          emoji: '⚡'
        },
        {
          name: 'Low Priority',
          count: relevanceCounts.low,
          percentage: total > 0 ? (relevanceCounts.low / total) * 100 : 0,
          color: 'annotation-low',
          emoji: '❄️'
        },
        {
          name: 'Neutral',
          count: relevanceCounts.neutral,
          percentage: total > 0 ? (relevanceCounts.neutral / total) * 100 : 0,
          color: 'annotation-neutral',
          emoji: '⚪'
        }
      ],
      total
    };
  }, [annotations]);

  const getKeyInsights = useMemo(() => {
    const insights = [];
    const totalAnnotations = annotations.length;
    
    if (totalAnnotations === 0) {
      return ['Start annotating to see insights and analytics'];
    }
    
    const focusScore = metrics.find(m => m.id === 'focus-score')?.value as number || 0;
    const coverage = metrics.find(m => m.id === 'coverage')?.value as number || 0;
    const toolDiversity = metrics.find(m => m.id === 'tool-diversity')?.value as number || 0;
    const noiseReduction = metrics.find(m => m.id === 'noise-reduction')?.value as number || 0;
    
    if (focusScore > 70) {
      insights.push('🎯 Excellent focus - high-value content identified');
    } else if (focusScore < 30) {
      insights.push('🔍 Consider focusing on high-relevance content');
    }
    
    if (coverage > 80) {
      insights.push('📊 Comprehensive coverage achieved');
    } else if (coverage < 30) {
      insights.push('📈 More content analysis recommended');
    }
    
    if (toolDiversity === 100) {
      insights.push('🛠️ Multi-modal approach - all tools utilized');
    } else if (toolDiversity < 50) {
      insights.push('🔧 Try different annotation tools for varied insights');
    }
    
    if (noiseReduction > 30) {
      insights.push('🧹 Significant noise reduction opportunities identified');
    }
    
    const withComments = annotations.filter(a => a.comment?.trim()).length;
    if (withComments > totalAnnotations * 0.6) {
      insights.push('💬 Rich contextual feedback provided');
    }
    
    return insights.length > 0 ? insights : ['Keep annotating to unlock deeper insights'];
  }, [annotations, metrics]);

  if (annotations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Analytics Available</h3>
            <p className="text-sm text-muted-foreground">
              Start using Magic Pencil, Canvas Drawing, or Text Selection to see unified analytics
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`${metric.color}`}>
                  {metric.icon}
                </div>
                {metric.trend && (
                  <TrendingUp className={`w-3 h-3 ${
                    metric.trend === 'up' ? 'text-green-500' : 
                    metric.trend === 'down' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {metric.value}{metric.unit}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  {metric.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1 leading-tight">
                  {metric.description}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tool Usage Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Tool Usage Analysis
        </h3>
        
        <div className="space-y-4">
          {getToolBreakdown.tools.map((tool) => (
            <div key={tool.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tool.icon}
                  <span className="text-sm font-medium text-foreground">{tool.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {tool.count} annotations
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {tool.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={tool.percentage} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Relevance Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Relevance Priority Breakdown
        </h3>
        
        <div className="space-y-4">
          {getRelevanceBreakdown.levels.map((level) => (
            <div key={level.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{level.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{level.name}</span>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{
                      backgroundColor: `hsl(var(--${level.color}-bg))`,
                      borderColor: `hsl(var(--${level.color}))`
                    }}
                  >
                    {level.count} annotations
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {level.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={level.percentage} 
                className="h-2"
                style={{
                  backgroundColor: `hsl(var(--${level.color}-bg))`,
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Key Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Key Insights
        </h3>
        
        <div className="space-y-2">
          {getKeyInsights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-sm text-foreground">{insight}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default UnifiedAnalyticsDashboard;