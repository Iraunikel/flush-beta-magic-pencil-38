import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, MessageSquare } from 'lucide-react';

interface AnnotationData {
  id: string;
  start: number;
  end: number;
  type: 'hot' | 'neutral' | 'flush';
  comment?: string;
  timestamp: number;
}

interface MagicPencilAnalyticsProps {
  annotations: AnnotationData[];
  originalText: string;
}

const MagicPencilAnalytics: React.FC<MagicPencilAnalyticsProps> = ({
  annotations,
  originalText
}) => {
  const analytics = React.useMemo(() => {
    const hotCount = annotations.filter(a => a.type === 'hot').length;
    const neutralCount = annotations.filter(a => a.type === 'neutral').length;
    const flushCount = annotations.filter(a => a.type === 'flush').length;
    const totalAnnotations = annotations.length;
    const commentCount = annotations.filter(a => a.comment).length;
    
    const words = originalText.split(' ');
    const annotatedWords = new Set();
    annotations.forEach(a => {
      for (let i = a.start; i <= a.end; i++) {
        annotatedWords.add(i);
      }
    });
    const coverage = totalAnnotations > 0 ? (annotatedWords.size / words.length) * 100 : 0;
    
    return {
      hotCount,
      neutralCount,
      flushCount,
      totalAnnotations,
      commentCount,
      coverage
    };
  }, [annotations, originalText]);

  if (analytics.totalAnnotations === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Start annotating to see analytics</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Analytics</h3>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">Hot</span>
            <Badge variant="secondary">{analytics.hotCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-sm font-medium">Neutral</span>
            <Badge variant="secondary">{analytics.neutralCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">Flush</span>
            <Badge variant="secondary">{analytics.flushCount}</Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Comments</span>
            <Badge variant="secondary">{analytics.commentCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Coverage</span>
            <Badge variant="secondary">{analytics.coverage.toFixed(1)}%</Badge>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Hot (Expand)</span>
            <span>{((analytics.hotCount / analytics.totalAnnotations) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(analytics.hotCount / analytics.totalAnnotations) * 100} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Neutral (Keep Same)</span>
            <span>{((analytics.neutralCount / analytics.totalAnnotations) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(analytics.neutralCount / analytics.totalAnnotations) * 100} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Flush (Remove/Minimize)</span>
            <span>{((analytics.flushCount / analytics.totalAnnotations) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(analytics.flushCount / analytics.totalAnnotations) * 100} className="h-2" />
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Insights:</span>
        </div>
        
        {analytics.hotCount > analytics.flushCount && (
          <p>• You're focusing on expanding content rather than reducing it</p>
        )}
        
        {analytics.coverage > 50 && (
          <p>• High coverage indicates thorough analysis</p>
        )}
        
        {analytics.commentCount > 0 && (
          <p>• {analytics.commentCount} detailed comments will improve prompt quality</p>
        )}
        
        {analytics.neutralCount > analytics.totalAnnotations * 0.6 && (
          <p>• Most content marked as neutral - response may already be well-balanced</p>
        )}
      </div>
    </Card>
  );
};

export default MagicPencilAnalytics;