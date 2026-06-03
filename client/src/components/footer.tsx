import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { FaTiktok, FaInstagram, FaFacebook } from "react-icons/fa";
import { Link } from "wouter";
import TrademarkDisclaimer from "@/components/trademark-disclaimer";

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-sigma-charcoal text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src="/sigma-logo.png" 
                alt="Sigma Roofing LLC Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h3 className="font-bold text-xl">Sigma Roofing LLC</h3>
                <p className="text-sm text-gray-400">LIC#80006734</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Professional roofing and painting services in Edmond, Oklahoma. Licensed, insured, and committed to quality workmanship.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.tiktok.com/@sigmaroofing405" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="w-10 h-10 bg-sigma-gold hover:bg-sigma-gold/90 p-0">
                  <FaTiktok className="text-white" size={16} />
                </Button>
              </a>
              <a href="https://www.instagram.com/sigmaroofing405" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="w-10 h-10 bg-sigma-gold hover:bg-sigma-gold/90 p-0">
                  <FaInstagram className="text-white" size={16} />
                </Button>
              </a>
              <a href="https://www.facebook.com/search/top?q=Sigma%20Roofing%20LLC" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="w-10 h-10 bg-sigma-gold hover:bg-sigma-gold/90 p-0">
                  <FaFacebook className="text-white" size={16} />
                </Button>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-lg mb-6">Our Services</h3>
            <ul className="space-y-3 text-gray-300">
              <li><button onClick={() => scrollToSection("services")} className="hover:text-sigma-gold transition-colors text-left">Residential Roofing</button></li>
              <li><button onClick={() => scrollToSection("services")} className="hover:text-sigma-gold transition-colors text-left">Exterior Painting</button></li>
              <li><button onClick={() => scrollToSection("services")} className="hover:text-sigma-gold transition-colors text-left">Roof Repairs</button></li>
              <li><button onClick={() => scrollToSection("services")} className="hover:text-sigma-gold transition-colors text-left">Storm Damage</button></li>
              <li><button onClick={() => scrollToSection("services")} className="hover:text-sigma-gold transition-colors text-left">Roof Inspections</button></li>
              <li><button onClick={() => scrollToSection("services")} className="hover:text-sigma-gold transition-colors text-left">Gutter Services</button></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3 text-gray-300">
              <li><button onClick={() => scrollToSection("home")} className="hover:text-sigma-gold transition-colors text-left">Home</button></li>
              <li><button onClick={() => scrollToSection("about")} className="hover:text-sigma-gold transition-colors text-left">About Us</button></li>
              <li><button onClick={() => scrollToSection("services")} className="hover:text-sigma-gold transition-colors text-left">Services</button></li>
              <li><button onClick={() => scrollToSection("projects")} className="hover:text-sigma-gold transition-colors text-left">Projects</button></li>
              <li><button onClick={() => scrollToSection("contact")} className="hover:text-sigma-gold transition-colors text-left">Contact</button></li>
              <li><button onClick={() => scrollToSection("contact")} className="hover:text-sigma-gold transition-colors text-left">Free Estimate</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-6">Contact Info</h3>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-start space-x-3">
                <div>
                  <p className="font-semibold">(405) 902-5266</p>
                  <p className="text-sm">24/7 Emergency Service</p>
                </div>
              </div>
              <div>
                <p>ok.sigmaroofs@gmail.com</p>
              </div>
              <div>
                <p>16612 N Western Avenue</p>
                <p>Edmond, OK 73012</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Sigma Roofing LLC. All rights reserved. Licensed Contractor LIC#80006734
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="/privacy-policy" className="hover:text-sigma-gold transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-sigma-gold transition-colors">Terms of Service</Link>
              <Link href="/sitemap" className="hover:text-sigma-gold transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
      <TrademarkDisclaimer />
    </footer>
  );
}
