import React, { useState, useEffect, useMemo, useRef, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Lazy loading image component with intersection observer
const LazyImage = memo(({ src, alt, className, fallback }: {
  src: string;
  alt: string;
  className: string;
  fallback?: string;
}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <img 
          src={src}
          alt={alt}
          className={className}
          onLoad={() => setHasLoaded(true)}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            if (fallback) {
              e.currentTarget.src = fallback;
            }
          }}
          style={{
            opacity: hasLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      ) : (
        <div className={`${className} bg-gray-300 animate-pulse flex items-center justify-center`}>
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default function About() {
  // Load images from admin panel with optimized caching
  const { data: websiteImages } = useQuery({
    queryKey: ['/api/website-images'],
    staleTime: 1000 * 60 * 30, // Increased to 30 minutes for better performance
    gcTime: 1000 * 60 * 60 // Cache for 1 hour
  });

  // Memoized image URLs to prevent unnecessary re-renders
  const { teamPhoto, visionImage } = useMemo(() => {
    // First check API response
    if (websiteImages?.success && websiteImages?.images) {
      return {
        teamPhoto: websiteImages.images.teamPhoto || localStorage.getItem('teamPhoto') || '',
        visionImage: websiteImages.images.visionImage || localStorage.getItem('visionImage') || ''
      };
    }
    
    // Fallback to localStorage with single batch read
    return {
      teamPhoto: localStorage.getItem('teamPhoto') || '',
      visionImage: localStorage.getItem('visionImage') || ''
    };
  }, [websiteImages]);

  // Fallback image URLs
  const fallbackTeamPhoto = "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  const fallbackVisionImage = "https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  return (
    <section id="about" className="py-20 bg-sigma-emerald">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-bold text-4xl text-white mb-6">About Sigma Roofing LLC</h2>
            <p className="text-lg text-gray-200 mb-6">
              Right after graduating from The University of Oklahoma with an engineering degree our founder entered the roofing industry and in the span of ten years discovered it's far more sophisticated than most realize—from the extensive range of materials and systems available to today's storm restoration processes that demand specialized expertise-roofing is our calling and we can proudly say we are an Oklahoma Local Roofing Contractor.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              Roofing is hard work but we make it easy for you. These core values are what we believe in and drive our process.
            </p>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-4">CARING • CRAFTSMANSHIP • COMMITMENT</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-lg text-gray-200">
                <span className="font-bold text-white">Caring</span> for our homeowners is what allows us to see their "vision" and we are just there to bring it to life.
              </p>
              <p className="text-lg text-gray-200">
                <span className="font-bold text-white">Craftsmanship</span> is a display of the pride we take in our work as a production focused company.
              </p>
              <p className="text-lg text-gray-200">
                <span className="font-bold text-white">Commitment</span> means we say what we mean and we mean what we say. Nothing more, nothing less.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Values Image with Lazy Loading */}
            <div className="space-y-2">
              <LazyImage
                src={teamPhoto || fallbackTeamPhoto}
                alt={teamPhoto ? "Sigma Roofing values" : "Professional roofing team at work"}
                className="rounded-lg shadow-lg w-full h-64 object-cover"
                fallback={fallbackTeamPhoto}
              />
              <p className="text-center text-gray-200 text-sm font-semibold">Our Values</p>
            </div>
            
            {/* Vision Image with Lazy Loading */}
            <div className="space-y-2">
              <LazyImage
                src={visionImage || fallbackVisionImage}
                alt={visionImage ? "Sigma Roofing vision" : "Professional roofing vision and goals"}
                className="rounded-lg shadow-lg w-full h-64 object-cover"
                fallback={fallbackVisionImage}
              />
              <p className="text-center text-gray-200 text-sm font-semibold">Our Vision</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}