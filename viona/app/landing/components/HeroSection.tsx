import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, BarChart3, TrendingUp, Users } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const [isHovered, setIsHovered] = useState(false);
  const targetRevenue = 127000;
  const targetOrders = 1459;
  const targetUsers = 8234;
  const baseFactor = 0.5;
  const baseRevenue = targetRevenue * baseFactor;
  const baseOrders = targetOrders * baseFactor;
  const baseUsers = targetUsers * baseFactor;
  const [displayRevenue, setDisplayRevenue] = useState(baseRevenue);
  const [displayOrders, setDisplayOrders] = useState(baseOrders);
  const [displayUsers, setDisplayUsers] = useState(baseUsers);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const duration = 500;
    const steps = 50;

    const animate = (endRevenue: number, endOrders: number, endUsers: number) => {
      const startRevenue = displayRevenue;
      const startOrders = displayOrders;
      const startUsers = displayUsers;
      const revenueStep = (endRevenue - startRevenue) / steps;
      const ordersStep = (endOrders - startOrders) / steps;
      const usersStep = (endUsers - startUsers) / steps;
      let count = 0;

      interval = setInterval(() => {
        count++;
        const newRevenue = startRevenue + count * revenueStep;
        const newOrders = startOrders + count * ordersStep;
        const newUsers = startUsers + count * usersStep;

        setDisplayRevenue(revenueStep > 0 ? Math.min(newRevenue, endRevenue) : Math.max(newRevenue, endRevenue));
        setDisplayOrders(ordersStep > 0 ? Math.min(newOrders, endOrders) : Math.max(newOrders, endOrders));
        setDisplayUsers(usersStep > 0 ? Math.min(newUsers, endUsers) : Math.max(newUsers, endUsers));

        if (count >= steps) {
          if (interval) clearInterval(interval);
        }
      }, duration / steps);
    };

    if (isHovered) {
      animate(targetRevenue, targetOrders, targetUsers);
    } else {
      animate(baseRevenue, baseOrders, baseUsers);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovered, displayRevenue, displayOrders, displayUsers]);

  const barHeights = [40, 70, 50, 80, 60, 90, 75];

  return (
    <section className="relative overflow-hidden">
      {/* Background with green-yellow gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 1000px 600px at 20% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 800px 500px at 80% 80%, rgba(250, 204, 21, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 1200px 700px at 60% 10%, rgba(134, 239, 172, 0.04) 0%, transparent 70%),
            radial-gradient(ellipse 900px 400px at 10% 90%, rgba(252, 211, 77, 0.05) 0%, transparent 40%),
            linear-gradient(135deg, 
              hsl(var(--background)) 0%, 
              rgba(34, 197, 94, 0.02) 40%,
              rgba(250, 204, 21, 0.03) 70%,
              hsl(var(--background)) 100%
            )
          `
        }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                Trusted by 10,000+ businesses
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Transform Your Business with{' '}
                <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">AI-Powered</span> Analytics
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Streamline operations, gain real-time insights, and make data-driven decisions 
                that accelerate your business growth with our comprehensive analytics platform.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 group shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button className="inline-flex items-center justify-center px-6 py-3 border border-border text-base font-medium rounded-lg text-foreground bg-background/80 backdrop-blur-sm hover:bg-muted transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
              <div className="text-center group">
                <div className="flex items-center justify-center w-12 h-12 bg-transparent rounded-lg mb-2 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center w-12 h-12 bg-transparent rounded-lg mb-2 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">40%</div>
                <div className="text-sm text-muted-foreground">Avg Growth</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center w-12 h-12 bg-transparent rounded-lg mb-2 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">10k+</div>
                <div className="text-sm text-muted-foreground">Companies</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-border/50 hover:shadow-3xl transition-all duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Revenue Dashboard</h3>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
                  </div>
                </div>
                
                {/* Mock Chart */}
                <div 
                  className="space-y-3"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary/10 backdrop-blur-sm rounded-lg p-3 hover:bg-primary/15 transition-colors duration-300">
                      <div className="text-sm text-muted-foreground">Revenue</div>
                      <div className="text-xl font-bold text-primary">${Math.round(displayRevenue / 1000)}K</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +12%
                      </div>
                    </div>
                    <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-3 hover:bg-blue-500/15 transition-colors duration-300">
                      <div className="text-sm text-muted-foreground">Orders</div>
                      <div className="text-xl font-bold text-blue-500">{Math.round(displayOrders)}</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +8%
                      </div>
                    </div>
                    <div className="bg-purple-500/10 backdrop-blur-sm rounded-lg p-3 hover:bg-purple-500/15 transition-colors duration-300">
                      <div className="text-sm text-muted-foreground">Users</div>
                      <div className="text-xl font-bold text-purple-500">{Math.round(displayUsers)}</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +23%
                      </div>
                    </div>
                  </div>
                  
                  {/* Mock Chart Bars */}
                  <div className="flex items-end space-x-2 h-32 p-4 bg-gradient-to-t from-muted/20 to-transparent rounded-lg">
                    {barHeights.map((height, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-gradient-to-t from-primary/20 to-primary/10 rounded-t transition-all duration-500 ease-out shadow-sm"
                        style={{ height: `${isHovered ? height : height * baseFactor}%` }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-primary to-primary/80 rounded-t shadow-md"
                          style={{ height: '30%' }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Static Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg">
              Real-time updates
            </div>
            <div className="absolute -bottom-4 -left-4 bg-yellow-500 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg">
              AI Insights
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;