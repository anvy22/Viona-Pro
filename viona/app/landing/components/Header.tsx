// components/Header.tsx
"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  onLogin: () => void;
  onGetStarted: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin, onGetStarted }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">Viona Pro</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {[
                { label: "Features", id: "features" },
                { label: "Pricing", id: "pricing" },
                { label: "Testimonials", id: "testimonials" },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-smooth"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button
                onClick={onLogin}
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-smooth"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-smooth"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border border-border rounded-lg mt-2 shadow-card">
              {[
                { label: "Features", id: "features" },
                { label: "Pricing", id: "pricing" },
                { label: "Testimonials", id: "testimonials" },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-muted-foreground hover:text-foreground block px-3 py-2 text-base font-medium w-full text-left transition-smooth"
                >
                  {link.label}
                </button>
              ))}

              <div className="pt-4 pb-3 border-t border-border">
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={onLogin}
                    className="text-muted-foreground hover:text-foreground px-3 py-2 text-base font-medium w-full text-left transition-smooth"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onGetStarted}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-base font-medium transition-smooth"
                  >
                    Start Free Trial
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
