import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Hero() {
  const [heroBackground, setHeroBackground] = useState("");

  // Load images from admin panel
  const { data: websiteImages } = useQuery({
    queryKey: ['/api/website-images'],
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  useEffect(() => {
    // Load from admin panel first, then fall back to localStorage
    if (websiteImages && websiteImages.images) {
      if (websiteImages.images.heroBackground) {
        setHeroBackground(websiteImages.images.heroBackground);
      }
    } else {
      // Fallback to localStorage
      const savedHeroBackground = localStorage.getItem('heroBackground');
      if (savedHeroBackground) {
        setHeroBackground(savedHeroBackground);
      }
    }
  }, [websiteImages]);

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      id="home" 
      className="relative min-h-screen flex items-center"
      style={{
        backgroundImage: heroBackground ? `url(${heroBackground})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {!heroBackground && <div className="hero-bg absolute inset-0" />}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-white text-center">
          <h1 className="font-bold text-4xl lg:text-6xl mb-6 leading-tight">
            <span className="text-white">Stand firm.</span>{" "}
            <span className="text-sigma-emerald">Brave the storm.</span>{" "}
            <span className="text-white">Serve with heart.</span>
          </h1>
          <p className="text-lg lg:text-xl mb-6 leading-relaxed text-gray-200 max-w-3xl mx-auto">
            Quality craftsmanship and down-to-earth, responsive customer service is what we do. Whether you need 
            major repairs or minor fixes, we work with you to find the best solution for your home's specific needs.
          </p>
          <p className="text-base lg:text-lg mb-8 leading-relaxed text-gray-300 max-w-3xl mx-auto font-medium">
            Schedule today for your on-site estimate or ask about our convenient digital estimates. Emergency storm 
            repairs like tarping and damage assessments are available upon request. Book today!
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-12 max-w-3xl mx-auto">
            <Button
              size="lg"
              className="bg-sigma-emerald text-white hover:bg-emerald-600 text-lg px-8 py-4 shadow-lg transform hover:scale-105 transition-transform w-full sm:w-64"
              onClick={() => window.open("tel:(405)902-1826")}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call (405) 902-1826
            </Button>
            <Button
              size="lg"
              className="bg-sigma-emerald text-white hover:bg-emerald-600 text-lg px-8 py-4 shadow-lg transform hover:scale-105 transition-transform w-full sm:w-64 flex items-center justify-center"
              onClick={scrollToContact}
            >
              Free Estimate
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/120px-Flag_of_Oklahoma.svg.png" 
                alt="Oklahoma Flag" 
                className="w-16 h-12 mb-2 rounded shadow-lg"
                style={{
                  filter: 'hue-rotate(180deg) saturate(0) brightness(1.2) contrast(1.5)',
                  mixBlendMode: 'multiply'
                }}
              />
              <div className="text-sm text-gray-300 font-semibold">Operated</div>
            </div>
            <div className="flex flex-col items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/120px-Flag_of_Oklahoma.svg.png" 
                alt="Oklahoma Flag" 
                className="w-16 h-12 mb-2 rounded shadow-lg"
                style={{
                  filter: 'hue-rotate(180deg) saturate(0) brightness(1.2) contrast(1.5)',
                  mixBlendMode: 'multiply'
                }}
              />
              <div className="text-sm text-gray-300 font-semibold">Founded</div>
            </div>
            <div className="flex flex-col items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/120px-Flag_of_Oklahoma.svg.png" 
                alt="Oklahoma Flag" 
                className="w-16 h-12 mb-2 rounded shadow-lg"
                style={{
                  filter: 'hue-rotate(180deg) saturate(0) brightness(1.2) contrast(1.5)',
                  mixBlendMode: 'multiply'
                }}
              />
              <div className="text-sm text-gray-300 font-semibold">Licensed & Insured</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
