import React, { useState } from "react";
import {
  Brain,
  BarChart3,
  Zap,
  Shield,
  Clock,
  Users,
  TrendingUp,
  Settings,
  Database,
} from "lucide-react";

interface Feature {
  icon: any;
  title: string;
  description: string;
  color: string;
}

const FeaturesSection: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const features: Feature[] = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description:
        "Advanced machine learning algorithms analyze your data to provide actionable business insights and predictions.",
      color: "text-green-600 bg-transparent",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Monitor your business performance with live dashboards and real-time data visualization.",
      color: "text-green-600 bg-transparent",
    },
    {
      icon: Zap,
      title: "Streamlined Operations",
      description:
        "Automate workflows and optimize processes to increase efficiency and reduce operational costs.",
      color: "text-green-600 bg-transparent",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Bank-level security with end-to-end encryption, ensuring your business data stays protected.",
      color: "text-green-600 bg-transparent",
    },
    {
      icon: Clock,
      title: "Time Tracking",
      description:
        "Track employee performance and project timelines with comprehensive time management tools.",
      color: "text-green-600 bg-transparent",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Enable seamless collaboration across teams with shared dashboards and communication tools.",
      color: "text-green-600 bg-transparent",
    },
    {
      icon: TrendingUp,
      title: "Growth Analytics",
      description:
        "Identify growth opportunities and track key performance indicators to scale your business.",
      color: "text-green-600 bg-transparent",
    },
    {
      icon: Settings,
      title: "Custom Workflows",
      description:
        "Create and customize workflows that match your unique business processes and requirements.",
      color: "text-green-600 bg-transparent",
    },
    {
      icon: Database,
      title: "Data Integration",
      description:
        "Connect with over 100+ tools and platforms to centralize your business data in one place.",
      color: "text-green-600 bg-transparent",
    },
  ];

  const getPuzzleEdges = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const knobSize = 25;
    
    // Define which edges have knobs (out) or slots (in) based on position
    const edges = {
      top: row === 0 ? 'flat' : (index % 2 === 0 ? 'knob' : 'slot'),
      right: col === 2 ? 'flat' : (index % 2 === 1 ? 'knob' : 'slot'),
      bottom: row === 2 ? 'flat' : (index % 2 === 1 ? 'knob' : 'slot'),
      left: col === 0 ? 'flat' : (index % 2 === 0 ? 'knob' : 'slot'),
    };
    
    return edges;
  };

  const generatePuzzlePath = (index: number) => {
    const width = 320;
    const height = 240;
    const knobSize = 25;
    const edges = getPuzzleEdges(index);
    
    let path = `M 0,0`;
    
    // Top edge
    if (edges.top === 'knob') {
      path += ` L ${width/2 - knobSize},0 
                C ${width/2 - knobSize},-${knobSize/2} ${width/2 + knobSize},-${knobSize/2} ${width/2 + knobSize},0 
                L ${width},0`;
    } else if (edges.top === 'slot') {
      path += ` L ${width/2 - knobSize},0 
                C ${width/2 - knobSize},${knobSize/2} ${width/2 + knobSize},${knobSize/2} ${width/2 + knobSize},0 
                L ${width},0`;
    } else {
      path += ` L ${width},0`;
    }
    
    // Right edge
    if (edges.right === 'knob') {
      path += ` L ${width},${height/2 - knobSize} 
                C ${width + knobSize/2},${height/2 - knobSize} ${width + knobSize/2},${height/2 + knobSize} ${width},${height/2 + knobSize} 
                L ${width},${height}`;
    } else if (edges.right === 'slot') {
      path += ` L ${width},${height/2 - knobSize} 
                C ${width - knobSize/2},${height/2 - knobSize} ${width - knobSize/2},${height/2 + knobSize} ${width},${height/2 + knobSize} 
                L ${width},${height}`;
    } else {
      path += ` L ${width},${height}`;
    }
    
    // Bottom edge
    if (edges.bottom === 'knob') {
      path += ` L ${width/2 + knobSize},${height} 
                C ${width/2 + knobSize},${height + knobSize/2} ${width/2 - knobSize},${height + knobSize/2} ${width/2 - knobSize},${height} 
                L 0,${height}`;
    } else if (edges.bottom === 'slot') {
      path += ` L ${width/2 + knobSize},${height} 
                C ${width/2 + knobSize},${height - knobSize/2} ${width/2 - knobSize},${height - knobSize/2} ${width/2 - knobSize},${height} 
                L 0,${height}`;
    } else {
      path += ` L 0,${height}`;
    }
    
    // Left edge
    if (edges.left === 'knob') {
      path += ` L 0,${height/2 + knobSize} 
                C -${knobSize/2},${height/2 + knobSize} -${knobSize/2},${height/2 - knobSize} 0,${height/2 - knobSize} 
                L 0,0`;
    } else if (edges.left === 'slot') {
      path += ` L 0,${height/2 + knobSize} 
                C ${knobSize/2},${height/2 + knobSize} ${knobSize/2},${height/2 - knobSize} 0,${height/2 - knobSize} 
                L 0,0`;
    } else {
      path += ` L 0,0`;
    }
    
    path += ` Z`;
    return path;
  };

  const getConnectedPieces = (index: number) => {
    const connections = [];
    const row = Math.floor(index / 3);
    const col = index % 3;
    
    if (col > 0) connections.push(index - 1);
    if (col < 2) connections.push(index + 1);
    if (row > 0) connections.push(index - 3);
    if (row < 2) connections.push(index + 3);
    
    return connections;
  };

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="text-primary">Grow Your Business</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to streamline your operations, provide
            actionable insights, and accelerate your business growth.
          </p>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const isHovered = hoveredIndex === index;
              const connectedPieces = getConnectedPieces(index);
              const isConnected = hoveredIndex !== null && connectedPieces.includes(hoveredIndex);
              
              return (
                <div
                  key={index}
                  className="relative flex items-center justify-center"
                  style={{ 
                    minHeight: '280px',
                    padding: '20px'
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className="relative w-full h-full"
                    style={{
                      transform: isHovered 
                        ? 'scale(1.02) translateZ(0)' 
                        : isConnected 
                          ? 'scale(1.01) translateZ(0)' 
                          : 'scale(1) translateZ(0)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: isHovered ? 20 : isConnected ? 15 : 10,
                    }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 320 240"
                      className="absolute inset-0"
                      preserveAspectRatio="none"
                      style={{ 
                        filter: isHovered 
                          ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' 
                          : isConnected 
                            ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' 
                            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.05))',
                        transition: 'filter 0.3s ease'
                      }}
                    >
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="1" />
                          <stop offset="100%" stopColor="hsl(var(--card))" stopOpacity="0.98" />
                        </linearGradient>
                        <filter id={`glow-${index}`}>
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <path
                        d={generatePuzzlePath(index)}
                        fill={`url(#gradient-${index})`}
                        stroke={
                          isHovered 
                            ? 'hsl(var(--primary))' 
                            : isConnected 
                              ? 'hsl(var(--primary) / 0.6)' 
                              : 'hsl(var(--border))'
                        }
                        strokeWidth={isHovered ? 3 : isConnected ? 2 : 1}
                        style={{
                          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                          filter: isHovered ? `url(#glow-${index})` : 'none'
                        }}
                      />
                    </svg>
                    
                    <div className="relative z-10 p-8 h-full flex flex-col justify-center">
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-lg ${feature.color} mb-6 transition-all duration-300`}
                        style={{
                          transform: isHovered ? 'scale(1.1) rotate(3deg)' : 'scale(1) rotate(0deg)'
                        }}
                      >
                        <IconComponent 
                          className="h-7 w-7 transition-all duration-300 text-green-600" 
                          style={{
                            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                            color: '#16a34a'
                          }}
                        />
                      </div>
                      <h3 
                        className="text-xl font-semibold text-foreground mb-4 transition-all duration-300"
                        style={{
                          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
                        }}
                      >
                        {feature.title}
                      </h3>
                      <p 
                        className="text-muted-foreground text-sm leading-relaxed transition-all duration-300"
                        style={{
                          opacity: isHovered ? 1 : 0.85,
                          transform: isHovered ? 'translateY(-1px)' : 'translateY(0)'
                        }}
                      >
                        {feature.description}
                      </p>
                    </div>
                    
                    {(isHovered || isConnected) && (
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-lg"
                        style={{
                          background: isHovered 
                            ? 'linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--primary) / 0.02) 100%)'
                            : 'linear-gradient(135deg, hsl(var(--primary) / 0.02) 0%, hsl(var(--primary) / 0.01) 100%)',
                          transition: 'background 0.3s ease'
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-card max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Transform Your Business?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of companies that trust Viona Pro to drive their
              success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-smooth">
                Start Free Trial
              </button>
              <button className="inline-flex items-center justify-center px-6 py-3 border border-border text-base font-medium rounded-md text-foreground bg-background hover:bg-muted transition-smooth">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;