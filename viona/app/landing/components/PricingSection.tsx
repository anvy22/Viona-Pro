"use client";

import React, { useState } from "react";
import { Check, Star, ArrowRight } from "lucide-react";

interface PricingSectionProps {
  onGetStarted?: () => void;
}

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  popular: boolean;
  buttonText: string;
  buttonStyle: string;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans: Plan[] = [
    {
      name: "Starter",
      description: "Perfect for small businesses getting started",
      monthlyPrice: 29,
      annualPrice: 24,
      features: [
        "Up to 5 team members",
        "Basic analytics dashboard",
        "Real-time data sync",
        "Email support",
        "10GB storage",
        "Basic integrations",
      ],
      popular: false,
      buttonText: "Start Free Trial",
      buttonStyle:
        "border border-border text-foreground bg-background hover:bg-muted",
    },
    {
      name: "Professional",
      description: "For growing teams that need advanced features",
      monthlyPrice: 79,
      annualPrice: 65,
      features: [
        "Up to 25 team members",
        "Advanced analytics & AI insights",
        "Custom dashboards",
        "Priority support",
        "100GB storage",
        "Advanced integrations",
        "Workflow automation",
        "Custom reports",
      ],
      popular: true,
      buttonText: "Start Free Trial",
      buttonStyle:
        "text-primary-foreground bg-primary hover:bg-primary/90",
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      monthlyPrice: 199,
      annualPrice: 165,
      features: [
        "Unlimited team members",
        "Full AI-powered analytics suite",
        "White-label solution",
        "Dedicated account manager",
        "Unlimited storage",
        "All integrations",
        "Advanced workflow automation",
        "Custom development",
        "SLA guarantee",
      ],
      popular: false,
      buttonText: "Contact Sales",
      buttonStyle:
        "border border-border text-foreground bg-background hover:bg-muted",
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent <span className="text-primary">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the perfect plan for your business. All plans include a
            14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-smooth ${
                !isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-smooth ${
                isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="ml-1 text-xs bg-success text-success-foreground px-1.5 py-0.5 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative ${plan.popular ? "scale-105" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`bg-card rounded-2xl p-8 border transition-all duration-300 hover:shadow-modal h-full ${
                  plan.popular
                    ? "border-primary shadow-card"
                    : "border-border hover:-translate-y-1"
                }`}
              >
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">/month</span>
                  </div>

                  {isAnnual && (
                    <div className="text-xs text-success">
                      Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/year
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5 mr-3" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={plan.name === "Enterprise" ? undefined : onGetStarted}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md transition-smooth group ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                q: "Can I change plans anytime?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "Is there a free trial?",
                a: "All plans include a 14-day free trial with full access to features. No credit card required.",
              },
              {
                q: "What support do you offer?",
                a: "We provide email support for all plans, with priority support for Professional and Enterprise customers.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.",
              },
            ].map((faq, idx) => (
              <div className="text-left" key={idx}>
                <h4 className="font-semibold text-foreground mb-2">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
