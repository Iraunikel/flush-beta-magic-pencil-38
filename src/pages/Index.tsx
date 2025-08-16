import React, { useState } from 'react';
import CombinedAnnotationInterface from '@/components/CombinedAnnotationInterface';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import FlushInputExplanation from '@/components/FlushInputExplanation';

const Index = () => {
  const [content] = useState(`Artificial Intelligence has revolutionized the way we interact with technology. From voice assistants to recommendation systems, AI is now an integral part of our daily lives.

Machine learning algorithms power search engines, social media feeds, and even the apps on our phones. The technology has advanced rapidly in recent years, with breakthroughs in neural networks and deep learning.

However, there are important considerations around ethics, privacy, and the future impact of AI on employment and society. As we continue to develop these systems, we must balance innovation with responsibility.

The next decade will likely bring even more sophisticated AI capabilities, including better natural language processing and more human-like interactions.`);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Flush Beta - Magic Pencil
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use the Magic Pencil to annotate AI responses and refine prompts through visual feedback.
            Test the different annotation modes below.
          </p>
        </div>

        <FlushInputExplanation />

        <CombinedAnnotationInterface 
          content={content}
          onContentChange={() => {}}
        />

        <AnalyticsDashboard 
          annotations={[]}
          originalPrompt="Demo prompt for Magic Pencil annotation testing"
          originalResponse={content}
        />
      </div>
    </div>
  );
};

export default Index;
