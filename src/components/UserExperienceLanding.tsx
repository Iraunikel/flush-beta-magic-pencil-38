import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wand2, 
  Sparkles, 
  Zap, 
  Target, 
  Brain, 
  Palette, 
  MousePointer, 
  Layers,
  Award,
  Rocket,
  Star,
  ChevronDown,
  Type
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface UserExperienceLandingProps {
  onStartAnnotating: () => void;
}

const UserExperienceLanding: React.FC<UserExperienceLandingProps> = ({ onStartAnnotating }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const magicRef = useRef<HTMLDivElement>(null);

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

      // Feature cards scroll animation
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          end: "bottom 20%",
          scrub: 1
        },
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power2.out"
      });

      // Magic section parallax
      gsap.to(".magic-bg", {
        scrollTrigger: {
          trigger: magicRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        },
        y: -50,
        ease: "none"
      });

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

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <Badge className="hero-badge mb-6 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-2">
            <Award className="w-4 h-4 mr-2" />
            Design Excellence Award Winner
          </Badge>
          
          <h1 className="hero-title text-6xl md:text-8xl font-bold text-foreground mb-6">
            <span className="bg-gradient-text bg-clip-text text-transparent">
              Magic
            </span>
            <br />
            <span className="text-4xl md:text-5xl text-muted-foreground">
              Pencil Experience
            </span>
          </h1>
          
          <p className="hero-subtitle text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform AI responses with intuitive annotations. 
            <br />
            <span className="text-primary">Design meets intelligence.</span>
          </p>
          
          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={onStartAnnotating}
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-elegant hover:shadow-glow transition-all duration-300"
            >
              <Rocket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Start Creating Magic
              <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary/30 text-primary hover:bg-primary/5 px-8 py-6 text-lg rounded-xl"
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

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Revolutionary Interface
            </h2>
            <p className="text-xl text-muted-foreground">
              Where creativity meets artificial intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-glow">
              <div className="absolute top-4 right-4">
                <Palette className="w-8 h-8 text-primary-glow" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Canvas Drawing</h3>
              <p className="text-muted-foreground mb-4">
                Express your thoughts with fluid gestures. Draw, annotate, and highlight with precision.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Gesture Recognition</Badge>
                <Badge variant="secondary" className="text-xs">Multi-touch</Badge>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-accent/5 to-transparent border-accent/20 hover:border-accent/40 transition-all duration-500 hover:shadow-glow">
              <div className="absolute top-4 right-4">
                <MousePointer className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Smart Selection</h3>
              <p className="text-muted-foreground mb-4">
                Intelligent text analysis with contextual understanding and semantic highlighting.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                <Badge variant="secondary" className="text-xs">Context-Aware</Badge>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-primary-glow/5 to-transparent border-primary-glow/20 hover:border-primary-glow/40 transition-all duration-500 hover:shadow-glow">
              <div className="absolute top-4 right-4">
                <Brain className="w-8 h-8 text-primary-glow" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Analytics Engine</h3>
              <p className="text-muted-foreground mb-4">
                Real-time insights and performance metrics to optimize your annotation workflow.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Real-time</Badge>
                <Badge variant="secondary" className="text-xs">KPI Tracking</Badge>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-annotation-high/5 to-transparent border-annotation-high/20 hover:border-annotation-high/40 transition-all duration-500 hover:shadow-glow">
              <div className="absolute top-4 right-4">
                <Target className="w-8 h-8 text-annotation-high" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Precision Tools</h3>
              <p className="text-muted-foreground mb-4">
                Fine-tuned controls for exact annotations with pixel-perfect accuracy.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Precision</Badge>
                <Badge variant="secondary" className="text-xs">Customizable</Badge>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-annotation-medium/5 to-transparent border-annotation-medium/20 hover:border-annotation-medium/40 transition-all duration-500 hover:shadow-glow">
              <div className="absolute top-4 right-4">
                <Layers className="w-8 h-8 text-annotation-medium" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Multi-Layer</h3>
              <p className="text-muted-foreground mb-4">
                Organize annotations in layers for complex projects with hierarchical structure.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Organized</Badge>
                <Badge variant="secondary" className="text-xs">Hierarchical</Badge>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-glow">
              <div className="absolute top-4 right-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Magic Mode</h3>
              <p className="text-muted-foreground mb-4">
                AI-assisted annotation suggestions that adapt to your workflow and preferences.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">AI-Assisted</Badge>
                <Badge variant="secondary" className="text-xs">Adaptive</Badge>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Magic Section */}
      <section ref={magicRef} className="relative py-32 overflow-hidden">
        <div className="magic-bg absolute inset-0 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-accent/10" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <div className="mb-8">
            <Wand2 className="w-16 h-16 text-primary mx-auto mb-6 magic-float" />
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Experience the
              <br />
              <span className="bg-gradient-text bg-clip-text text-transparent">
                Magic
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every interaction is crafted to feel natural, intuitive, and magical. 
              Transform your workflow with tools that understand your intentions.
            </p>
          </div>
          
          <Button 
            size="lg" 
            onClick={onStartAnnotating}
            className="group relative overflow-hidden bg-gradient-primary text-white px-12 py-8 text-xl rounded-2xl shadow-elegant hover:shadow-glow transition-all duration-500 transform hover:scale-105"
          >
            <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-180 transition-transform duration-500" />
            Begin Your Journey
            <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default UserExperienceLanding;