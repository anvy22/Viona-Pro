import React from "react";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  quote: string;
}

const TestimonialsSection: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      name: "Sarah Johnson",
      role: "CEO",
      company: "TechFlow Solutions",
      avatar: "SJ",
      rating: 5,
      quote:
        "Viona Pro transformed how we analyze our business data. The AI insights helped us increase revenue by 40% in just six months.",
    },
    {
      name: "Michael Chen",
      role: "Operations Director",
      company: "GrowthCorp",
      avatar: "MC",
      rating: 5,
      quote:
        "The real-time analytics and automated workflows have streamlined our operations significantly. We couldn't imagine running our business without it.",
    },
    {
      name: "Emily Rodriguez",
      role: "Data Manager",
      company: "InsightTech",
      avatar: "ER",
      rating: 5,
      quote:
        "The platform's intuitive interface and powerful features make complex data analysis accessible to our entire team. Highly recommended!",
    },
    {
      name: "David Kumar",
      role: "Founder",
      company: "StartupLab",
      avatar: "DK",
      rating: 5,
      quote:
        "As a startup, we needed affordable yet powerful analytics. Viona Pro delivered exactly what we needed to scale efficiently.",
    },
    {
      name: "Lisa Thompson",
      role: "VP of Analytics",
      company: "DataDriven Inc",
      avatar: "LT",
      rating: 5,
      quote:
        "The customer support is exceptional, and the platform keeps evolving with new features. It's been a game-changer for our analytics workflow.",
    },
    {
      name: "Robert Wilson",
      role: "COO",
      company: "ScaleUp Ventures",
      avatar: "RW",
      rating: 5,
      quote:
        "Viona Pro's integration capabilities allowed us to connect all our tools seamlessly. The unified dashboard gives us the complete picture.",
    },
  ];

  const companies: string[] = [
    "Microsoft",
    "Google",
    "Amazon",
    "Apple",
    "Meta",
    "Tesla",
    "Netflix",
    "Spotify",
  ];

  return (
    <section id="testimonials" className="py-20 relative overflow-hidden">
      {/* Background with subtle pattern */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 183, 77, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
            linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.3) 100%)
          `
        }}
      />
      

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">Customer Stories</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Trusted by Industry Leaders
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            See what our customers are saying about their experience with Viona Pro.
          </p>
        </div>

        {/* Company Logos */}
        <div className="mb-20">
          <p className="text-center text-sm text-muted-foreground mb-8 font-medium">
            Trusted by 10,000+ companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {companies.map((company, index) => (
              <div
                key={company}
                className="text-muted-foreground font-semibold text-lg lg:text-xl hover:text-foreground transition-all duration-300 cursor-pointer"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                  opacity: 0.6,
                }}
              >
                {company}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name} 
              className="group"
              style={{
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl h-full relative overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                
                {/* Quote Icon with enhanced styling */}
                <div className="mb-6 relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Quote className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* Golden Shining Stars */}
                <div className="flex items-center mb-6 relative z-10">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <div key={i} className="relative">
                      <Star
                        className="h-5 w-5 text-yellow-500 fill-yellow-400 mr-1 group-hover:scale-110 transition-all duration-300"
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.4))',
                          animation: `starShine 2s ease-in-out ${i * 0.2}s infinite`
                        }}
                      />
                      {/* Shine effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-0 group-hover:opacity-100"
                        style={{
                          clipPath: 'polygon(0% 50%, 100% 50%, 100% 51%, 0% 51%)',
                          animation: `shine 2s ease-in-out ${i * 0.3}s infinite`
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Quote with enhanced typography */}
                <blockquote className="text-foreground/90 mb-8 text-base leading-relaxed relative z-10 group-hover:text-foreground transition-colors duration-300">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author with enhanced styling */}
                <div className="flex items-center relative z-10">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center border-2 border-primary/10 group-hover:border-primary/30 transition-all duration-300 group-hover:scale-105">
                      <span className="text-sm font-bold text-primary">
                        {testimonial.avatar}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at <span className="font-medium">{testimonial.company}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Stats Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-3xl blur-xl opacity-50" />
          <div className="relative bg-card/90 backdrop-blur-sm rounded-3xl p-10 border border-border/50 shadow-2xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="group">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  10,000+
                </div>
                <div className="text-sm text-muted-foreground font-medium">Active Users</div>
              </div>
              <div className="group">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  99.9%
                </div>
                <div className="text-sm text-muted-foreground font-medium">Uptime</div>
              </div>
              <div className="group">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  40%
                </div>
                <div className="text-sm text-muted-foreground font-medium">Avg Growth</div>
              </div>
              <div className="group">
                <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground font-medium">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes starShine {
          0%, 100% { 
            filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.4));
          }
          50% { 
            filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.8)) drop-shadow(0 0 12px rgba(250, 204, 21, 0.4));
          }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 0.6;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;