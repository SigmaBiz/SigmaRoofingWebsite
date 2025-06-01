import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Phone } from "lucide-react";
import sigmaLogo from "@assets/Untitled design.png";

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
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Company Logo and Name */}
          <div className="flex items-center space-x-3">
            <img 
              src={sigmaLogo} 
              alt="Sigma Roofing LLC Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="font-bold text-xl text-sigma-charcoal">Sigma Roofing LLC</h1>
              <p className="text-sm text-sigma-light-gray">LIC#80006734</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
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
          <div className="hidden lg:flex items-center space-x-6">
            <div className="text-right">
              <p className="font-semibold text-sigma-charcoal">(405) 902-1826</p>
              <p className="text-sm text-sigma-light-gray">Free Estimates</p>
            </div>
            <Button 
              onClick={() => scrollToSection("contact")}
              className="bg-sigma-emerald text-white hover:bg-emerald-600"
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
                <p className="font-semibold text-sigma-dark">(405) 902-1826</p>
                <Button 
                  onClick={() => scrollToSection("contact")}
                  className="bg-sigma-gold text-white mt-2 w-full hover:bg-yellow-600"
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
