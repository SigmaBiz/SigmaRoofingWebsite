import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#f4efe6] shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-x-4">
          {/* Company Logo and Name */}
          <div className="flex shrink-0 items-center space-x-3">
            <img
              src="/sigma-logo.png"
              alt="Sigma Roofing LLC Logo"
              className="w-20 h-20 object-contain"
            />
            <div>
              <h1 className="font-bold text-xl text-sigma-charcoal">Sigma Roofing LLC</h1>
              <p className="text-sm text-sigma-light-gray">LIC#80006734</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:space-x-4 lg:space-x-5">
            <button
              onClick={() => scrollToSection("home")}
              className="font-medium text-sigma-charcoal hover:text-sigma-emerald transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("services")}
              className="font-medium text-sigma-charcoal hover:text-sigma-emerald transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="font-medium text-sigma-charcoal hover:text-sigma-emerald transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("projects")}
              className="font-medium text-sigma-charcoal hover:text-sigma-emerald transition-colors"
            >
              Projects
            </button>
            {/* "Watch" / SocHub nav link — DISABLED until the SocHub page has videos (Antonio, 2026-06-16). Re-enable when ready:
            <Link
              href="/social"
              className="font-medium text-sigma-charcoal hover:text-sigma-emerald transition-colors flex items-center gap-1"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-sigma-emerald animate-pulse" />
              Watch
            </Link>
            */}
            <Link
              href="/estimate"
              className="font-semibold text-sigma-gold hover:text-sigma-charcoal transition-colors flex items-center gap-1"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-sigma-gold animate-pulse" />
              Instant Estimate
            </Link>
            <button
              onClick={() => scrollToSection("faq")}
              className="font-medium text-sigma-charcoal hover:text-sigma-emerald transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="font-medium text-sigma-charcoal hover:text-sigma-emerald transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Contact Info */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-sigma-charcoal">(405) 902-5266</p>
              <p className="text-sm text-sigma-light-gray">Free Estimates</p>
            </div>
            <Button
              onClick={() => scrollToSection("contact")}
              className="bg-sigma-emerald text-white hover:bg-primary/90"
            >
              Get Quote
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-sigma-charcoal"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="text-xl" /> : <Menu className="text-xl" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4">
            <nav className="flex flex-col space-y-3 pb-4">
              <button
                onClick={() => scrollToSection("home")}
                className="font-medium text-sigma-dark hover:text-sigma-gold transition-colors text-left"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="font-medium text-sigma-dark hover:text-sigma-gold transition-colors text-left"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="font-medium text-sigma-dark hover:text-sigma-gold transition-colors text-left"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("projects")}
                className="font-medium text-sigma-dark hover:text-sigma-gold transition-colors text-left"
              >
                Projects
              </button>
              {/* "Watch" / SocHub nav link — DISABLED until the SocHub page has videos (Antonio, 2026-06-16). Re-enable when ready:
              <Link
                href="/social"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium text-sigma-dark hover:text-sigma-gold transition-colors flex items-center gap-1"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-sigma-emerald animate-pulse" />
                Watch
              </Link>
              */}
              <Link
                href="/estimate"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-semibold text-sigma-gold hover:text-sigma-dark transition-colors flex items-center gap-1 text-left"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-sigma-gold animate-pulse" />
                Instant Estimate
              </Link>
              <button
                onClick={() => scrollToSection("faq")}
                className="font-medium text-sigma-dark hover:text-sigma-gold transition-colors text-left"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="font-medium text-sigma-dark hover:text-sigma-gold transition-colors text-left"
              >
                Contact
              </button>
              <div className="pt-4 border-t">
                <p className="font-semibold text-sigma-dark">(405) 902-5266</p>
                <Button 
                  onClick={() => scrollToSection("contact")}
                  className="bg-sigma-emerald text-white mt-2 w-full hover:bg-primary/90"
                >
                  Get Quote
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
