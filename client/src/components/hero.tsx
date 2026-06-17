import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { getWebsiteImages } from "@/lib/imageService";

export default function Hero() {
  const [images, setImages] = useState<any>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload hero background image for better performance
  useEffect(() => {
    const loadImages = async () => {
      try {
        const imageData = await getWebsiteImages();
        setImages(imageData);
        
        // Preload hero background if available
        if (imageData.heroBackground) {
          const img = new Image();
          img.src = imageData.heroBackground;
          img.onload = () => setImagesLoaded(true);
          img.onerror = () => setImagesLoaded(true);
        } else {
          setImagesLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load hero images:', error);
        setImagesLoaded(true);
      }
    };
    
    loadImages();
  }, []);

  const scrollToContact = useCallback(() => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Memoized Oklahoma flag URL to prevent repeated declarations
  const oklahomaFlagUrl = useMemo(() => 
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/120px-Flag_of_Oklahoma.svg.png",
    []
  );

  // Memoized flag style to prevent recalculation
  const flagStyle = useMemo(() => ({
    opacity: 0.7,
    filter: 'brightness(1.3) contrast(1.2)',
    aspectRatio: '3/2' as const
  }), []);

  return (
    <section 
      id="home" 
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background image with better mobile support */}
      {images.heroBackground ? (
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={images.heroBackground} 
            alt="Hero Background"
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              console.error('[Hero] Background image failed to load:', images.heroBackground);
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        <div className="hero-bg absolute inset-0" />
      )}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-white text-center">
          <h1 className="font-bold text-4xl lg:text-6xl mb-6 leading-tight">
            <span className="text-white">Stand firm.</span>{" "}
            <span className="text-sigma-gold">Brave the storm.</span>{" "}
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
          <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 max-w-3xl mx-auto">
            <Button
              size="lg"
              className="bg-sigma-emerald text-white hover:bg-primary/90 text-lg px-8 py-4 shadow-lg transform hover:scale-105 transition-transform w-full sm:w-64"
              onClick={() => window.open("tel:(405)902-1826")}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call (405) 902-5266
            </Button>
            <Button
              size="lg"
              className="bg-sigma-emerald text-white hover:bg-primary/90 text-lg px-8 py-4 shadow-lg transform hover:scale-105 transition-transform w-full sm:w-64 flex items-center justify-center"
              onClick={scrollToContact}
            >
              Free Estimate
            </Button>
          </div>
          
          <div className="mt-16 flex justify-between items-center max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <img 
                src={oklahomaFlagUrl}
                alt="Oklahoma Flag" 
                className="w-20 h-auto mb-2 rounded shadow-lg object-contain"
                style={flagStyle}
                loading="lazy"
              />
              <div className="text-sm text-gray-300 font-semibold">Operated</div>
            </div>
            <div className="flex flex-col items-center">
              <img 
                src={oklahomaFlagUrl}
                alt="Oklahoma Flag" 
                className="w-20 h-auto mb-2 rounded shadow-lg object-contain"
                style={flagStyle}
                loading="lazy"
              />
              <div className="text-sm text-gray-300 font-semibold">Founded</div>
            </div>
            <div className="flex flex-col items-center">
              <img 
                src={oklahomaFlagUrl}
                alt="Oklahoma Flag" 
                className="w-20 h-auto mb-2 rounded shadow-lg object-contain"
                style={flagStyle}
                loading="lazy"
              />
              <div className="text-sm text-gray-300 font-semibold">Licensed & Insured</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Photo credit - discreet positioning in bottom left */}
      <div className="absolute bottom-2 left-2 text-xs text-white/60 z-20">
        Photo by{' '}
        <a 
          href="https://unsplash.com/@tornadogreg?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/80 transition-colors"
        >
          Greg Johnson
        </a>
        {' '}on{' '}
        <a 
          href="https://unsplash.com/photos/a-large-tornado-is-seen-in-the-sky-over-a-green-field-2ww84LX_um4?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/80 transition-colors"
        >
          Unsplash
        </a>
      </div>
    </section>
  );
}