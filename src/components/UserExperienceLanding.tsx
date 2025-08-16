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
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              The Haptic Revolution
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              Training conversations, not just editing text
            </p>
            <div className="max-w-3xl mx-auto">
              <div className="relative p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-primary-glow/10 rounded-2xl border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Before
                  </Badge>
                  <Type className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-left mb-4">
                  "Please write a marketing email but make it more engaging and less corporate..."
                </p>
                <p className="text-xs text-muted-foreground text-left italic">
                  *Cross fingers and hope the AI understands what "engaging" means*
                </p>
              </div>
              
              <div className="flex justify-center my-8">
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-primary to-transparent" />
              </div>
              
              <div className="relative p-6 bg-gradient-to-br from-annotation-high/10 via-annotation-medium/5 to-annotation-low/10 rounded-2xl border border-annotation-high/20">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-annotation-high/20 text-annotation-high border-annotation-high/30">
                    After
                  </Badge>
                  <div className="flex gap-2">
                    <Palette className="w-6 h-6 text-annotation-high" />
                    <MousePointer className="w-6 h-6 text-annotation-medium" />
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-foreground text-left mb-4">
                  <span className="bg-annotation-high/20 px-1 rounded">Direct visual feedback</span> on AI output — 
                  <span className="bg-annotation-medium/20 px-1 rounded">highlight what works</span>, 
                  <span className="bg-annotation-low/20 px-1 rounded line-through">cross out what doesn't</span>
                </p>
                <p className="text-xs text-primary text-left italic">
                  *AI learns your preferences instantly through tactile interaction*
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-glow cursor-pointer">
              <div className="absolute top-4 right-4">
                <Palette className="w-8 h-8 text-primary-glow group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Intuitive Canvas</h3>
              <p className="text-muted-foreground mb-4">
                Like highlighting on paper — but your gestures become structured AI instructions.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Natural Gestures</Badge>
                <Badge variant="secondary" className="text-xs">Instant Translation</Badge>
              </div>
              <div className="absolute bottom-4 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs text-primary">✨ Draw your thoughts</div>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-accent/5 to-transparent border-accent/20 hover:border-accent/40 transition-all duration-500 hover:shadow-glow cursor-pointer">
              <div className="absolute top-4 right-4">
                <MousePointer className="w-8 h-8 text-accent group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Contextual Weighting</h3>
              <p className="text-muted-foreground mb-4">
                Point, click, weight. Your cursor becomes a precision tool for training AI understanding.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">In-Context</Badge>
                <Badge variant="secondary" className="text-xs">Visual Weighting</Badge>
              </div>
              <div className="absolute bottom-4 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs text-accent">⚡ Point & teach</div>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-primary-glow/5 to-transparent border-primary-glow/20 hover:border-primary-glow/40 transition-all duration-500 hover:shadow-glow cursor-pointer">
              <div className="absolute top-4 right-4">
                <Brain className="w-8 h-8 text-primary-glow group-hover:pulse transition-all duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Learning Loop</h3>
              <p className="text-muted-foreground mb-4">
                Every interaction trains the next response. Close the gap between intention and interpretation.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Adaptive Learning</Badge>
                <Badge variant="secondary" className="text-xs">Feedback Loop</Badge>
              </div>
              <div className="absolute bottom-4 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs text-primary-glow">🧠 Learns & adapts</div>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-annotation-high/5 to-transparent border-annotation-high/20 hover:border-annotation-high/40 transition-all duration-500 hover:shadow-glow cursor-pointer">
              <div className="absolute top-4 right-4">
                <Target className="w-8 h-8 text-annotation-high group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Precision Intent</h3>
              <p className="text-muted-foreground mb-4">
                From vague prompts to crystal-clear communication. Make machines understand nuance.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Nuanced Control</Badge>
                <Badge variant="secondary" className="text-xs">Clear Intent</Badge>
              </div>
              <div className="absolute bottom-4 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs text-annotation-high">🎯 Precise control</div>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-annotation-medium/5 to-transparent border-annotation-medium/20 hover:border-annotation-medium/40 transition-all duration-500 hover:shadow-glow cursor-pointer">
              <div className="absolute top-4 right-4">
                <Layers className="w-8 h-8 text-annotation-medium group-hover:translate-y-1 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Conversation Layers</h3>
              <p className="text-muted-foreground mb-4">
                Build complex understanding through layered interactions. Depth without complexity.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Multi-dimensional</Badge>
                <Badge variant="secondary" className="text-xs">Contextual Depth</Badge>
              </div>
              <div className="absolute bottom-4 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs text-annotation-medium">📚 Deep context</div>
              </div>
            </Card>

            <Card className="feature-card group relative overflow-hidden p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-glow cursor-pointer">
              <div className="absolute top-4 right-4">
                <Sparkles className="w-8 h-8 text-primary group-hover:animate-spin transition-all duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Paradigm Shift</h3>
              <p className="text-muted-foreground mb-4">
                The GUI moment for AI interaction. From command-line prompts to visual conversation training.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Revolutionary UX</Badge>
                <Badge variant="secondary" className="text-xs">Visual Interface</Badge>
              </div>
              <div className="absolute bottom-4 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs text-primary">🚀 Game changer</div>
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