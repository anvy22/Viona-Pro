import React from "react";
import { ArrowRight, CheckCircle } from "lucide-react";

interface CTASectionProps {
  onGetStarted: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onGetStarted }) => {
  const benefits: string[] = [
    "Start free 14-day trial",
    "No credit card required",
    "Full feature access",
    "Cancel anytime",
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of successful businesses using Viona Pro to drive growth,
                streamline operations, and make data-driven decisions.
              </p>
            </div>

            {/* Benefits List */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center text-sm text-muted-foreground"
                >
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  {benefit}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-smooth group shadow-lg hover:shadow-xl"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-foreground bg-background border border-border hover:bg-muted transition-smooth">
                Schedule a Demo
              </button>
            </div>

            {/* Trust Signals */}
            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by industry leaders
              </p>
              <div className="flex justify-center items-center space-x-2">
                <div className="flex text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground ml-2">
                  4.9/5 from 1,200+ reviews
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
