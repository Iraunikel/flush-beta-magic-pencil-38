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
    <Card data-section="how-it-works" className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
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

          {/* Full App Flow */
          }
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">Full App Flow</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">1</div>
                <div className="text-sm">
                  <strong>Input:</strong> Upload documents, texts, or simply connect with your AI engine
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">2</div>
                <div className="text-sm">
                  <strong>AI Response:</strong> Connect to AI providers (ChatGPT, Ollama, etc.) for initial content
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">3</div>
                <div className="text-sm">
                  Use intuitive gestures to make editing an effortless flow:
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
          <div className="flex flex-wrap justify-center gap-2">
            <div className="text-center p-2 rounded-lg bg-muted/30 flex-1 min-w-[80px] max-w-[120px]">
              <Bot className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium">AI Integration</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30 flex-1 min-w-[80px] max-w-[120px]">
              <FileText className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium">Text Input</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30 flex-1 min-w-[80px] max-w-[120px]">
              <Upload className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium">File Upload</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30 flex-1 min-w-[80px] max-w-[120px]">
              <Mic className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium">Voice to Text</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30 flex-1 min-w-[80px] max-w-[120px]">
              <Camera className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium">Image OCR</div>
            </div>
          </div>
        </div>

        {/* Removed Magic Pencil Features block as requested */}
      </div>
    </Card>
  );
};

export default FlushInputExplanation;