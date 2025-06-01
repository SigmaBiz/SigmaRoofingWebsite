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
              With over 15 years of experience serving the Edmond, Oklahoma area, Sigma Roofing LLC has built a reputation for quality workmanship, reliability, and customer satisfaction. We are a fully licensed and insured roofing contractor committed to protecting your most valuable investment.
            </p>
            <p className="text-lg text-gray-200">
              Our team of certified roofing professionals uses only the highest quality materials and follows industry best practices to ensure your roof stands the test of time. From minor repairs to complete roof replacements, we deliver exceptional results on every project.
            </p>
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