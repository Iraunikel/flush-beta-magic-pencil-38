import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Text3D, Float, MeshWobbleMaterial, Sparkles as ThreeSparkles, Text, Html, shaderMaterial } from '@react-three/drei';
import { useSpring as useRSpring, animated, config } from 'react-spring';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Copy, Wand2, Sparkles, Target, Trash2, Eye, Zap, Heart, Snowflake, Volume2, VolumeX, Award, Flame, Droplets } from 'lucide-react';
import * as THREE from 'three';

// Custom shader material for liquid effects
const LiquidMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('#3b82f6'),
    intensity: 1.0,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float intensity;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vec2 uv = vUv;
      float wave = sin(uv.x * 10.0 + time) * 0.1;
      float ripple = sin(distance(uv, vec2(0.5)) * 20.0 - time * 3.0) * 0.05;
      
      vec3 finalColor = color + vec3(wave + ripple) * intensity;
      float alpha = 0.8 + wave * 0.2;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ LiquidMaterial });

// 3D Floating Pencil Component
function FloatingPencil({ mode, position, rotation }: { mode: string, position: [number, number, number], rotation: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const modeColors = {
    hot: '#ff5733',
    neutral: '#94a3b8',
    flush: '#3b82f6'
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh 
        ref={meshRef}
        position={position}
        rotation={rotation}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <cylinderGeometry args={[0.05, 0.02, 2, 8]} />
        <MeshWobbleMaterial
          color={modeColors[mode as keyof typeof modeColors]}
          speed={2}
          factor={0.3}
          roughness={0.1}
          metalness={0.8}
        />
        
        {/* Pencil tip */}
        <mesh position={[0, -1.2, 0]}>
          <coneGeometry args={[0.02, 0.3, 8]} />
          <meshStandardMaterial color="#2d1810" />
        </mesh>
        
        {/* Magical aura */}
        <ThreeSparkles
          count={20}
          scale={hovered ? 2 : 1}
          size={3}
          speed={0.5}
          color={modeColors[mode as keyof typeof modeColors]}
        />
      </mesh>
    </Float>
  );
}

// Particle system component
function ParticleSystem({ trigger, mode }: { trigger: boolean, mode: string }) {
  const particlesRef = useRef<THREE.Points>(null);
  const [particles] = useState(() => {
    const positions = new Float32Array(300 * 3);
    const colors = new Float32Array(300 * 3);
    
    for (let i = 0; i < 300; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      const color = new THREE.Color(mode === 'hot' ? '#ff5733' : mode === 'flush' ? '#3b82f6' : '#94a3b8');
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  });

  useFrame((state) => {
    if (particlesRef.current && trigger) {
      particlesRef.current.rotation.y += 0.005;
      particlesRef.current.rotation.x += 0.002;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} vertexColors transparent opacity={0.8} />
    </points>
  );
}

// Main Magic Pencil Experience
interface AnnotationData {
  id: string;
  start: number;
  end: number;
  type: 'hot' | 'neutral' | 'flush';
  comment?: string;
  timestamp: number;
  intensity?: number;
  wordIndex?: number;
}

interface PremiumMagicPencilProps {
  onStartAnnotating?: () => void;
}

const demoText = `The future of AI interaction isn't about crafting perfect prompts. It's about creating a dialogue where your intuition guides the machine's understanding. Magic Pencil transforms this vision into reality by letting you paint your intentions directly onto AI responses. Draw your thoughts, highlight insights, cross out noise. Every gesture becomes structured feedback that trains smarter conversations.`;

const demoWords = demoText.split(/(\s+|[.,:;!?])/).filter(word => word.trim().length > 0);

const PremiumMagicPencil: React.FC<PremiumMagicPencilProps> = ({ onStartAnnotating }) => {
  const [selectedMode, setSelectedMode] = useState<'hot' | 'neutral' | 'flush'>('neutral');
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [focusAchieved, setFocusAchieved] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isInTextArea, setIsInTextArea] = useState(false);
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(false);
  const [gestureDetection, setGestureDetection] = useState({ 
    velocityY: 0, 
    direction: 'none' as 'up' | 'down' | 'none',
    swingCount: 0,
    lastSwingTime: 0 
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const pencilRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Advanced physics spring for interactions
  const springConfig = { tension: 300, friction: 30 };
  const [{ scale, rotate }, setSpring] = useRSpring(() => ({
    scale: 1,
    rotate: 0,
    config: springConfig
  }));

  // Motion values for fluid interactions
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const pencilX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const pencilY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  // Enhanced mode styles with premium gradients
  const modeStyles = {
    hot: {
      bg: 'linear-gradient(135deg, rgba(255, 87, 51, 0.2), rgba(255, 120, 90, 0.1))',
      border: 'rgba(255, 87, 51, 0.6)',
      glow: '0 0 40px rgba(255, 87, 51, 0.4), inset 0 0 20px rgba(255, 87, 51, 0.1)',
      sparkle: 'drop-shadow(0 0 8px rgba(255, 87, 51, 1)) drop-shadow(0 0 16px rgba(255, 87, 51, 0.7))',
      icon: Flame,
      color: '#ff5733'
    },
    neutral: {
      bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(203, 213, 225, 0.08))',
      border: 'rgba(148, 163, 184, 0.4)',
      glow: '0 0 30px rgba(148, 163, 184, 0.25), inset 0 0 15px rgba(148, 163, 184, 0.08)',
      sparkle: 'drop-shadow(0 0 5px rgba(148, 163, 184, 0.9))',
      icon: Target,
      color: '#94a3b8'
    },
    flush: {
      bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.1))',
      border: 'rgba(59, 130, 246, 0.6)',
      glow: '0 0 40px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)',
      sparkle: 'drop-shadow(0 0 8px rgba(59, 130, 246, 1)) drop-shadow(0 0 16px rgba(59, 130, 246, 0.7))',
      icon: Droplets,
      color: '#3b82f6'
    }
  };

  // Premium sound system with spatial audio
  const playSound = useCallback((type: 'select' | 'paint' | 'complete' | 'hover', position?: { x: number, y: number }) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      
      oscillator.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
      
      // Spatial positioning based on cursor
      if (position) {
        const panValue = (position.x / window.innerWidth - 0.5) * 2;
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), ctx.currentTime);
      }
      
      const frequencies = {
        select: 800 + Math.random() * 200,
        paint: 1200 + Math.random() * 300,
        complete: 1600 + Math.random() * 400,
        hover: 400 + Math.random() * 100
      };
      
      oscillator.frequency.setValueAtTime(frequencies[type], ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [soundEnabled]);

  // Analytics with advanced metrics
  const analytics = useCallback(() => {
    const total = demoText.length;
    const annotatedChars = annotations.reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const coverage = total > 0 ? (annotatedChars / total) * 100 : 0;
    
    const hotChars = annotations.filter(a => a.type === 'hot').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const neutralChars = annotations.filter(a => a.type === 'neutral').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    const flushChars = annotations.filter(a => a.type === 'flush').reduce((sum, ann) => sum + (ann.end - ann.start), 0);
    
    return {
      coverage: Math.round(coverage),
      hotPercentage: total > 0 ? Math.round((hotChars / total) * 100) : 0,
      neutralPercentage: total > 0 ? Math.round((neutralChars / total) * 100) : 0,
      flushPercentage: total > 0 ? Math.round((flushChars / total) * 100) : 0,
      annotationCount: annotations.length,
      entropy: annotations.length > 0 ? annotations.map(a => a.type).filter((type, i, arr) => arr.indexOf(type) === i).length : 0
    };
  }, [annotations]);

  // Auto-annotation for smooth UX
  const handleWordAnnotation = useCallback((wordIndex: number, word: string, isClick = false) => {
    // Check if word is already annotated
    if (annotations.some(a => a.wordIndex === wordIndex)) return;
    
    if (!hasStarted && isClick) {
      setHasStarted(true);
      setShowBanner(false);
      onStartAnnotating?.();
    }

    playSound(isClick ? 'paint' : 'hover', cursorPosition);
    
    // Calculate text position
    let charStart = 0;
    for (let i = 0; i < wordIndex; i++) {
      charStart += demoWords[i].length;
    }
    
    const newAnnotation: AnnotationData = {
      id: `${Date.now()}-${wordIndex}`,
      start: charStart,
      end: charStart + word.length,
      type: selectedMode,
      timestamp: Date.now(),
      intensity: Math.random() * 0.5 + 0.5,
      wordIndex
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);

    // Spring physics for interaction feedback
    setSpring({ 
      scale: 1.2, 
      rotate: selectedMode === 'hot' ? 15 : selectedMode === 'flush' ? -15 : 0 
    });
    
    setTimeout(() => {
      setSpring({ scale: 1, rotate: 0 });
    }, 300);

    // Advanced GSAP animation with liquid morphing
    gsap.timeline()
      .to(`.word-${wordIndex}`, {
        scale: 1.3,
        rotateY: 10,
        transformOrigin: "center center",
        duration: 0.3,
        ease: "elastic.out(1, 0.5)"
      })
      .to(`.word-${wordIndex}`, {
        scale: 1,
        rotateY: 0,
        background: modeStyles[selectedMode].bg,
        color: modeStyles[selectedMode].color,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.1");

    // Ripple effect on adjacent words
    const adjacentWords = [wordIndex - 1, wordIndex + 1].filter(
      i => i >= 0 && i < demoWords.length && !annotations.some(a => a.wordIndex === i)
    );

    adjacentWords.forEach((adjIndex, delay) => {
      setTimeout(() => {
        gsap.to(`.word-${adjIndex}`, {
          scale: 1.1,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: "power2.out"
        });
        playSound('hover');
      }, delay * 150);
    });

  }, [selectedMode, hasStarted, annotations, cursorPosition, playSound, setSpring, onStartAnnotating]);

  // Gesture-based mode switching
  const detectGesture = useCallback((velocityY: number) => {
    const now = Date.now();
    const threshold = 15; // Velocity threshold for gesture detection
    
    if (Math.abs(velocityY) > threshold) {
      const newDirection = velocityY < 0 ? 'up' : 'down';
      
      setGestureDetection(prev => {
        // Reset if direction changed or too much time passed
        if (prev.direction !== newDirection || now - prev.lastSwingTime > 800) {
          return {
            velocityY,
            direction: newDirection,
            swingCount: 1,
            lastSwingTime: now
          };
        }
        
        const newSwingCount = prev.swingCount + 1;
        
        // Double swing detection
        if (newSwingCount === 2 && now - prev.lastSwingTime < 600) {
          // Double swing up = Hot mode
          if (newDirection === 'up') {
            setSelectedMode('hot');
            playSound('complete', cursorPosition);
          }
          // Double swing down = Flush mode  
          else if (newDirection === 'down') {
            setSelectedMode('flush');
            playSound('complete', cursorPosition);
          }
          
          // Reset after successful gesture
          return {
            velocityY: 0,
            direction: 'none',
            swingCount: 0,
            lastSwingTime: 0
          };
        }
        
        return {
          velocityY,
          direction: newDirection,
          swingCount: newSwingCount,
          lastSwingTime: now
        };
      });
    }
  }, [cursorPosition, playSound]);

  // Enhanced cursor tracking with gesture detection and text area scope
  useEffect(() => {
    let lastY = 0;
    let lastTime = Date.now();
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const now = Date.now();
      
      // Calculate velocity for gesture detection
      if (isInTextArea && hasStarted) {
        const deltaY = y - lastY;
        const deltaTime = now - lastTime;
        const velocityY = deltaTime > 0 ? deltaY / deltaTime * 16.67 : 0; // Normalize to 60fps
        
        detectGesture(velocityY);
      }
      
      setCursorPosition({ x, y });
      mouseX.set(x);
      mouseY.set(y);
      
      lastY = y;
      lastTime = now;
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isInTextArea, hasStarted, mouseX, mouseY, detectGesture]);

  // Handle text area entry/exit for cursor scoping
  useEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    const handleMouseEnter = () => {
      setIsInTextArea(true);
      if (hasStarted && !showBanner) {
        document.body.style.cursor = 'none';
        setAutoSelectEnabled(true);
      }
    };

    const handleMouseLeave = () => {
      setIsInTextArea(false);
      document.body.style.cursor = 'auto';
      setAutoSelectEnabled(false);
    };

    const handleClick = () => {
      if (showBanner) {
        setShowBanner(false);
        setHasStarted(true);
        setAutoSelectEnabled(true);
        document.body.style.cursor = 'none';
        onStartAnnotating?.();
      }
    };

    textElement.addEventListener('mouseenter', handleMouseEnter);
    textElement.addEventListener('mouseleave', handleMouseLeave);
    textElement.addEventListener('click', handleClick);

    return () => {
      textElement.removeEventListener('mouseenter', handleMouseEnter);
      textElement.removeEventListener('mouseleave', handleMouseLeave);
      textElement.removeEventListener('click', handleClick);
      document.body.style.cursor = 'auto';
    };
  }, [hasStarted, showBanner, onStartAnnotating]);

  // Achievement system
  useEffect(() => {
    const stats = analytics();
    if (stats.coverage >= 80 && !focusAchieved && annotations.length > 0) {
      setFocusAchieved(true);
      setShowCelebration(true);
      playSound('complete');
      
      // Epic celebration with particle burst
      gsap.timeline()
        .to('.celebration-burst', {
          scale: 2,
          rotation: 360,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          stagger: 0.1
        })
        .to('.celebration-burst', {
          scale: 0,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in"
        }, "-=0.3");
    }
  }, [annotations, focusAchieved, analytics, playSound]);

  // Enhanced text rendering with physics
  const renderText = () => {
    return (
      <div className="relative">
        {demoWords.map((word, index) => {
          const annotation = annotations.find(a => a.wordIndex === index);
          const ModeIcon = annotation ? modeStyles[annotation.type].icon : null;
          
          return (
            <motion.span
              key={`word-${index}`}
              className={`word-${index} relative inline-block cursor-pointer transition-all duration-500 mx-1 my-1 px-2 py-1 rounded-lg`}
              style={{
                background: annotation ? modeStyles[annotation.type].bg : 'transparent',
                border: annotation ? `2px solid ${modeStyles[annotation.type].border}` : '2px solid transparent',
                boxShadow: annotation ? modeStyles[annotation.type].glow : 'none',
                backdropFilter: annotation ? 'blur(10px)' : 'none'
              }}
              onMouseEnter={() => {
                setHoveredWordIndex(index);
                
                if (!annotation) {
                  playSound('hover', cursorPosition);
                  
                  // Auto-select after brief delay when in auto mode
                  if (autoSelectEnabled && hasStarted && !showBanner) {
                    setTimeout(() => {
                      if (hoveredWordIndex === index && !annotations.some(a => a.wordIndex === index)) {
                        handleWordAnnotation(index, word);
                      }
                    }, 200);
                  }
                }
                
                // Magnetic hover effect
                gsap.to(`.word-${index}`, {
                  y: -3,
                  scale: 1.05,
                  duration: 0.3,
                  ease: "elastic.out(1, 0.7)"
                });
              }}
              onMouseLeave={() => {
                setHoveredWordIndex(null);
                gsap.to(`.word-${index}`, {
                  y: 0,
                  scale: 1,
                  duration: 0.3,
                  ease: "power2.out"
                });
              }}
              onClick={() => {
                if (showBanner) {
                  setShowBanner(false);
                  setHasStarted(true);
                  setAutoSelectEnabled(true);
                  onStartAnnotating?.();
                }
                handleWordAnnotation(index, word, true);
                // Click toggles auto-select off temporarily
                setAutoSelectEnabled(false);
                setTimeout(() => setAutoSelectEnabled(true), 1000);
              }}
              whileHover={{
                rotateX: 5,
                transition: { duration: 0.2 }
              }}
              whileTap={{
                scale: 0.95,
                rotateX: -5,
                transition: { duration: 0.1 }
              }}
            >
              {word}
              
              {/* Holographic tooltip */}
              <AnimatePresence>
                {hoveredWordIndex === index && !annotation && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.8, rotateX: -15 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                    exit={{ opacity: 0, y: 15, scale: 0.8, rotateX: -15 }}
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-30"
                  >
                    <div className="bg-background/95 backdrop-blur-lg border-2 border-primary/30 rounded-xl px-4 py-3 text-sm font-medium whitespace-nowrap shadow-2xl">
                      <div className="flex items-center gap-2">
                        {React.createElement(modeStyles[selectedMode].icon, { 
                          className: "w-4 h-4",
                          style: { filter: modeStyles[selectedMode].sparkle }
                        })}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          Paint as {selectedMode}
                        </span>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-primary/30" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 3D annotation indicator */}
              {annotation && ModeIcon && (
                <motion.div
                  className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background shadow-lg flex items-center justify-center"
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
                  style={{
                    boxShadow: modeStyles[annotation.type].glow
                  }}
                >
                  <ModeIcon className="w-3 h-3 text-white" />
                </motion.div>
              )}

              {/* Liquid intensity bar */}
              {annotation && (
                <motion.div
                  className="absolute -bottom-2 left-0 h-1 rounded-full overflow-hidden"
                  style={{ 
                    width: '100%',
                    background: 'rgba(255,255,255,0.1)'
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${(annotation.intensity || 1) * 100}%`,
                      background: `linear-gradient(90deg, ${modeStyles[annotation.type].color}, transparent)`
                    }}
                    animate={{
                      background: [
                        `linear-gradient(90deg, ${modeStyles[annotation.type].color}, transparent)`,
                        `linear-gradient(90deg, transparent, ${modeStyles[annotation.type].color})`,
                        `linear-gradient(90deg, ${modeStyles[annotation.type].color}, transparent)`
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              )}
            </motion.span>
          );
        })}
      </div>
    );
  };

  const currentStats = analytics();

  return (
    <section ref={containerRef} className="py-12 px-6 relative min-h-screen bg-gradient-to-br from-background via-primary/3 to-accent/3">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <FloatingPencil 
              mode={selectedMode} 
              position={[2, 0, 0]} 
              rotation={[0, 0, Math.PI / 6]} 
            />
            <ParticleSystem trigger={hasStarted} mode={selectedMode} />
          </Suspense>
        </Canvas>
      </div>

      {/* Premium Magic Cursor - Only in text area */}
      {hasStarted && isInTextArea && (
        <motion.div 
          className="fixed pointer-events-none z-50"
          style={{
            x: pencilX,
            y: pencilY,
            marginLeft: -24,
            marginTop: -24
          }}
        >
          <animated.div
            style={{
              scale,
              rotate: rotate.to(r => `${r}deg`)
            }}
            className="relative"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <Wand2 
                className="w-8 h-8 text-primary" 
                style={{ 
                  filter: modeStyles[selectedMode].sparkle,
                  transform: 'rotate(-45deg)'
                }}
              />
              
              {/* Holographic mode indicator with gesture feedback */}
              <div className="absolute -top-8 -left-4 flex gap-1 opacity-90">
                {Object.entries(modeStyles).map(([mode, style]) => (
                  <motion.div
                    key={mode}
                    className="w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: selectedMode === mode ? style.color : `${style.color}30`,
                      borderColor: selectedMode === mode ? style.color : `${style.color}50`,
                      boxShadow: selectedMode === mode ? `0 0 10px ${style.color}` : 'none'
                    }}
                    animate={{
                      scale: selectedMode === mode ? [1, 1.2, 1] : 1,
                      y: gestureDetection.direction === 'up' && mode === 'hot' ? [-2, 0] : 
                         gestureDetection.direction === 'down' && mode === 'flush' ? [2, 0] : 0
                    }}
                    transition={{
                      duration: 1,
                      repeat: selectedMode === mode ? Infinity : 0
                    }}
                  />
                ))}
              </div>
              
              {/* Gesture hint */}
              {gestureDetection.swingCount > 0 && (
                <motion.div
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-xs bg-background/90 px-2 py-1 rounded-full border"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {gestureDetection.direction === 'up' ? '↑ Hot' : '↓ Flush'}
                </motion.div>
              )}
              
              {/* Trail effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${modeStyles[selectedMode].color}40, transparent)`
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0.2, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </animated.div>
        </motion.div>
      )}

      {/* Celebration Effects */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none z-40">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="celebration-burst absolute top-1/2 left-1/2"
                initial={{ scale: 0, opacity: 0 }}
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: Object.values(modeStyles)[i % 3].color,
                  borderRadius: '50%'
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Interface */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Premium Mode Palette */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-primary-glow/10 border-2 border-primary/30 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Magic Pencil Studio
                </h3>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <Wand2 className="w-6 h-6 text-primary" />
                </motion.div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                {[
                  { type: 'hot' as const, emoji: '🔥', label: 'Amplify', desc: 'Enhance & expand', gradient: 'from-red-500 to-orange-500' },
                  { type: 'neutral' as const, emoji: '⚡', label: 'Maintain', desc: 'Keep balanced', gradient: 'from-slate-400 to-slate-600' },
                  { type: 'flush' as const, emoji: '💧', label: 'Reduce', desc: 'Minimize impact', gradient: 'from-blue-500 to-cyan-500' }
                ].map(mode => (
                  <motion.button
                    key={mode.type}
                    className={`relative p-6 rounded-2xl border-3 transition-all duration-500 overflow-hidden ${
                      selectedMode === mode.type 
                        ? 'border-primary bg-gradient-to-br from-primary/20 to-accent/20 shadow-2xl' 
                        : 'border-muted hover:border-primary/50 bg-gradient-to-br from-background/80 to-muted/50 backdrop-blur-sm'
                    }`}
                    onClick={() => setSelectedMode(mode.type)}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      boxShadow: selectedMode === mode.type ? modeStyles[mode.type].glow : 'none',
                      transform: selectedMode === mode.type ? 'translateY(-2px)' : 'translateY(0)'
                    }}
                  >
                    <div className="text-center relative z-10">
                      <motion.div 
                        className="text-4xl mb-3"
                        animate={{
                          scale: selectedMode === mode.type ? [1, 1.2, 1] : 1
                        }}
                        transition={{
                          duration: 2,
                          repeat: selectedMode === mode.type ? Infinity : 0
                        }}
                      >
                        {mode.emoji}
                      </motion.div>
                      <div className="text-lg font-bold text-foreground mb-1">{mode.label}</div>
                      <div className="text-sm text-muted-foreground">{mode.desc}</div>
                    </div>
                    
                    {/* Animated background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0`}
                      animate={{
                        opacity: selectedMode === mode.type ? [0, 0.1, 0] : 0
                      }}
                      transition={{
                        duration: 3,
                        repeat: selectedMode === mode.type ? Infinity : 0
                      }}
                    />
                    
                    {selectedMode === mode.type && (
                      <motion.div
                        layoutId="selected-mode-premium"
                        className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary-glow/30 rounded-2xl"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </Card>

            {/* Interactive Text Canvas */}
            <Card className="p-8 bg-gradient-to-br from-background/95 via-primary/5 to-accent/5 border-2 border-primary/30 backdrop-blur-xl min-h-[500px] relative overflow-hidden">
              {/* Ambient particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-primary/30 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>

              {/* Enhanced CTA Banner */}
              <AnimatePresence>
                {showBanner && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center z-20 rounded-lg"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                  >
                    {/* Blur background text */}
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md rounded-lg" />
                    
                    <div className="relative text-center p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-primary-glow/10 border-2 border-primary/30 rounded-2xl backdrop-blur-xl">
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                          rotateY: [0, 5, 0]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Wand2 className="w-12 h-12 text-primary mx-auto mb-4" style={{ filter: modeStyles[selectedMode].sparkle }} />
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                          Start highlighting
                        </h3>
                        <p className="text-base text-muted-foreground mb-4">
                          Click to begin annotation
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70">
                          <span>💡 Pro tip: Double swipe ↑ for Hot, ↓ for Flush</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-foreground">AI Response Canvas</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Annotation Coverage: {currentStats.coverage}%</span>
                  <Progress value={currentStats.coverage} className="w-32 h-3" />
                </div>
              </div>
              
              <div
                ref={textRef}
                className="text-xl leading-relaxed text-foreground select-text relative z-10 p-4 rounded-lg"
                style={{ 
                  userSelect: hasStarted ? 'text' : 'none',
                  lineHeight: '2.2',
                  cursor: isInTextArea && hasStarted ? 'none' : 'default',
                  background: isInTextArea ? 'rgba(var(--primary) / 0.02)' : 'transparent',
                  border: isInTextArea ? '1px solid rgba(var(--primary) / 0.1)' : '1px solid transparent'
                }}
              >
                {renderText()}
              </div>
            </Card>

            {/* Achievement Display */}
            <AnimatePresence>
              {focusAchieved && (
                <motion.div
                  className="text-center p-8 bg-gradient-to-br from-primary/30 via-accent/30 to-primary-glow/30 rounded-2xl border-2 border-primary/50 backdrop-blur-xl"
                  initial={{ scale: 0, opacity: 0, rotateX: 90 }}
                  animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                  exit={{ scale: 0, opacity: 0, rotateX: -90 }}
                  transition={{ duration: 1.5, type: "spring" }}
                >
                  <motion.div
                    className="flex items-center justify-center gap-4 text-primary mb-6"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity
                    }}
                  >
                    <Award className="w-12 h-12" />
                    <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Mastery Achieved!
                    </span>
                    <Award className="w-12 h-12" />
                  </motion.div>
                  <p className="text-xl text-muted-foreground mb-6">
                    You've successfully annotated {currentStats.coverage}% of the content with precision and intent.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-4 text-lg rounded-xl shadow-2xl"
                    onClick={() => console.log('Export functionality')}
                  >
                    <Zap className="w-6 h-6 mr-3" />
                    Export Your Masterpiece
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Analytics Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Live Analytics</h3>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Target className="w-6 h-6 text-primary" />
                </motion.div>
              </div>
              
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl border border-primary/30">
                  <motion.div 
                    className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    {currentStats.coverage}%
                  </motion.div>
                  <div className="text-sm text-muted-foreground font-medium">Coverage Achieved</div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: '🔥 Amplified', value: currentStats.hotPercentage, color: '#ff5733' },
                    { label: '⚡ Maintained', value: currentStats.neutralPercentage, color: '#94a3b8' },
                    { label: '💧 Reduced', value: currentStats.flushPercentage, color: '#3b82f6' }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">{stat.label}</span>
                        <span className="font-bold text-foreground">{stat.value}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: stat.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.value}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-muted/30 text-center">
                  <div className="text-2xl font-bold text-foreground">{currentStats.annotationCount}</div>
                  <div className="text-xs text-muted-foreground">Total Interactions</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Entropy: {currentStats.entropy}/3
                  </div>
                </div>
              </div>
            </Card>

            {/* Sound Control */}
            <Card className="p-4 bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-accent/30 backdrop-blur-xl">
              <Button
                variant="ghost"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-full flex items-center justify-center gap-3"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span className="font-medium">
                  {soundEnabled ? 'Spatial Audio On' : 'Audio Off'}
                </span>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumMagicPencil;