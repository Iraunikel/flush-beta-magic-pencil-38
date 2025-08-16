import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText, 
  Bot, 
  Wand2, 
  MessageSquare,
  ArrowRight,
  Camera,
  Mic
} from 'lucide-react';

const FlushInputExplanation: React.FC = () => {
  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Wand2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">How Flush Works</h2>
          </div>
          <p className="text-muted-foreground">
            Transform AI responses into refined, personalized outputs using our Magic Pencil annotation system
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Demo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Camera className="w-5 h-5" />
              <h3 className="font-semibold">Current Demo</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="text-sm text-foreground">
                <strong>What you're seeing:</strong> Static AI text about artificial intelligence for demo purposes
              </div>
              <div className="text-sm text-muted-foreground">
                This demonstrates the Magic Pencil annotation features without requiring real AI integration
              </div>
            </div>
          </div>

          {/* Full App Flow */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">Full App Flow</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">1</div>
                <div className="text-sm">
                  <strong>Input:</strong> Upload documents, paste text, or speak your prompt
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">2</div>
                <div className="text-sm">
                  <strong>AI Response:</strong> Get initial AI-generated content
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">3</div>
                <div className="text-sm">
                  <strong>Magic Pencil:</strong> Annotate relevance levels with gestures
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">4</div>
                <div className="text-sm">
                  <strong>Refined Output:</strong> Get personalized, improved content
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Methods */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Planned Input Methods
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Bot className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xs font-medium">AI Integration</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xs font-medium">Text Input</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Upload className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xs font-medium">File Upload</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Mic className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xs font-medium">Voice Input</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xs font-medium">Image OCR</div>
            </div>
          </div>
        </div>

        {/* Magic Pencil Features */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-accent" />
            Magic Pencil Features
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-annotation-high font-semibold mb-2">⭕ Circle = High</div>
              <div className="text-sm text-muted-foreground">Draw circles around highly relevant content</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-annotation-medium font-semibold mb-2">⬜ Square = Medium</div>
              <div className="text-sm text-muted-foreground">Draw squares around moderately relevant content</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-annotation-low font-semibold mb-2">⚡ Zigzag = Low</div>
              <div className="text-sm text-muted-foreground">Draw zigzags over less relevant content</div>
            </div>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Try the Magic Pencil now with the demo content above to experience the annotation workflow!
          </p>
        </div>
      </div>
    </Card>
  );
};

export default FlushInputExplanation;