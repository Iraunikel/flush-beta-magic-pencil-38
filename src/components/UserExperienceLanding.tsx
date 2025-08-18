import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wand2, 
  Sparkles, 
  Zap, 
  MousePointer, 
  Award,
  Rocket,
  Star,
  ChevronDown
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface UserExperienceLandingProps {
  onStartAnnotating: () => void;
}

const UserExperienceLanding: React.FC<UserExperienceLandingProps> = ({ onStartAnnotating }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      const tl = gsap.timeline();
      
      tl.from(".hero-title", {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "back.out(1.7)"
      })
      .from(".hero-subtitle", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.6")
      .from(".hero-badge", {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "-=0.4")
      .from(".hero-cta", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.2");

      // Floating animation for magic elements
      gsap.to(".magic-float", {
        y: -20,
        duration: 2,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3
      });

      // Feature and magic sections removed; corresponding animations omitted

      // Sparkle animations
      gsap.to(".sparkle", {
        rotation: 360,
        duration: 4,
        ease: "none",
        repeat: -1,
        stagger: 0.5
      });

      gsap.to(".sparkle", {
        scale: 1.2,
        duration: 2,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary-glow/10 to-background">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        
        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="sparkle magic-float absolute top-20 left-1/4 w-8 h-8 text-primary-glow" />
          <Wand2 className="sparkle magic-float absolute top-1/3 right-1/4 w-6 h-6 text-primary" />
          <Zap className="sparkle magic-float absolute bottom-1/3 left-1/6 w-10 h-10 text-accent" />
          <Star className="sparkle magic-float absolute top-1/2 right-1/6 w-4 h-4 text-primary-glow" />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          <Badge className="hero-badge mb-6 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-2">
            <Award className="w-4 h-4 mr-2" />
            Built for MetaTrap Hackathon 2025
          </Badge>
          
          <h1 className="hero-title text-4xl md:text-6xl font-bold text-foreground mb-8 leading-tight">
            <span className="block">
              FlowControl — The Smart Highlighter for AI
            </span>
          </h1>
          
          <p className="hero-subtitle text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Effortless tool to mark, refine, and teach your AI to understand your requests. Less clutter, more clarity, faster results.
          </p>
          
          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={onStartAnnotating}
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-elegant hover:shadow-glow transition-all duration-300"
            >
              <Rocket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Try it yourself
              <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary/30 text-primary hover:bg-primary/5 px-8 py-6 text-lg rounded-xl"
              onClick={() => {
                const section = document.querySelector('[data-section="how-it-works"]');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <MousePointer className="w-5 h-5 mr-2" />
              Explore Features
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </section>

      {/* Interactive experience lives in the Flush Beta tabs */}
    </div>
  );
};

export default UserExperienceLanding;