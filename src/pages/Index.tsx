import React from 'react';
import UserExperienceLanding from '@/components/UserExperienceLanding';
import CombinedAnnotationInterface from '@/components/CombinedAnnotationInterface';
import FlushInputExplanation from '@/components/FlushInputExplanation';

const Index = () => {
  const handleStartAnnotating = () => {
    // Scroll to the annotation interface section
    const annotationSection = document.querySelector('[data-section="annotation"]');
    if (annotationSection) {
      annotationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <UserExperienceLanding onStartAnnotating={handleStartAnnotating} />
      
      <div data-section="annotation" className="container mx-auto px-4 py-16 space-y-12">
        <FlushInputExplanation />

        <CombinedAnnotationInterface 
          content={`Artificial Intelligence has revolutionized the way we interact with technology. From voice assistants to recommendation systems, AI is now an integral part of our daily lives.

Machine learning algorithms power search engines, social media feeds, and even the apps on our phones. The technology has advanced rapidly in recent years, with breakthroughs in neural networks and deep learning.

However, there are important considerations around ethics, privacy, and the future impact of AI on employment and society. As we continue to develop these systems, we must balance innovation with responsibility.

The next decade will likely bring even more sophisticated AI capabilities, including better natural language processing and more human-like interactions.`}
          onContentChange={() => {}}
        />
      </div>
    </div>
  );
};

export default Index;
