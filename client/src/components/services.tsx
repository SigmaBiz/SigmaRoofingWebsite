import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, PaintBucket, Hammer, ShieldCheck, Droplets, CloudRain, CheckCircle, Eye, Zap } from "lucide-react";
import { getWebsiteImages } from "@/lib/imageService";

const services = [
  {
    icon: Home,
    title: "Residential Roofing",
    description: "Complete residential roofing services including new installations, repairs, and maintenance for all roof types.",
    features: ["Asphalt Shingles", "Metal Roofing", "Wood Shingles", "Storm Damage Repair"],
    imageKey: "residentialRoofingImage",
    fallbackImage: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379460/sigma-roofing/projects/afuczeaaeow6y7iwexzx.jpg",
    iconColor: "bg-blue-500"
  },
  {
    icon: PaintBucket,
    title: "Exterior Painting", 
    description: "Professional exterior painting services to protect and beautify your home with quality materials and expert craftsmanship.",
    features: ["House Painting", "Trim & Siding", "Deck Staining", "Power Washing"],
    imageKey: "paintingServiceImage",
    fallbackImage: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748388890/sigma-roofing/projects/fqmpnsw0yuib7p44vzjt.jpg",
    iconColor: "bg-orange-500"
  },
  {
    icon: Hammer,
    title: "Roof Repairs",
    description: "Emergency and scheduled roof repairs to protect your property from water damage and structural issues.",
    features: ["Leak Detection & Repair", "Shingle Replacement", "Flashing Repair", "Emergency Services"],
    imageKey: "roofRepairImage",
    fallbackImage: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748388891/sigma-roofing/projects/uryhdz9sdu9tahumtjgx.jpg",
    iconColor: "bg-red-500"
  },
  {
    icon: Eye,
    title: "Roof Inspections",
    description: "Comprehensive roof inspections to identify potential issues before they become costly problems.",
    features: ["Annual Inspections", "Storm Damage Assessment", "Insurance Claims Support", "Detailed Reports"],
    imageKey: "roofInspectionImage",
    fallbackImage: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379453/sigma-roofing/projects/fhxuxcy7qc5falugqjxu.jpg",
    iconColor: "bg-purple-500"
  },
  {
    icon: Droplets,
    title: "Gutter Services",
    description: "Complete gutter installation, repair, and maintenance services to protect your roof and foundation.",
    features: ["Gutter Installation", "Gutter Cleaning", "Downspout Repair", "Gutter Guards"],
    imageKey: "gutterServiceImage",
    fallbackImage: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748388893/sigma-roofing/projects/nwdrsyjnsxmyml4vteof.jpg",
    iconColor: "bg-cyan-500"
  },
  {
    icon: Zap,
    title: "Storm Damage",
    description: "Rapid response storm damage repair services with insurance claim assistance and emergency protection.",
    features: ["Emergency Tarping", "Insurance Claims", "Hail Damage Repair", "Wind Damage Restoration"],
    imageKey: "stormDamageImage",
    fallbackImage: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379454/sigma-roofing/projects/tjthdiocyevopn6lpl6i.jpg",
    iconColor: "bg-yellow-500"
  }
];

// Memoized service card component
const ServiceCard = memo(({ service, imageUrl }: { service: any; imageUrl?: string }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const handleImageLoad = useCallback(() => {
    setImgLoaded(true);
  }, []);
  
  const handleImageError = useCallback(() => {
    setImgError(true);
    setImgLoaded(true);
  }, []);
  
  return (
    <Card className="bg-gray-50 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <CardContent className="p-0">
        {/* Optimized Image Header with Loading State */}
        {imageUrl && !imgError && (
          <div className="h-48 overflow-hidden rounded-t-lg relative">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <span className="text-gray-400 text-sm">Loading...</span>
              </div>
            )}
            <img 
              src={imageUrl}
              alt={service.title}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              style={{
                opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
            />
          </div>
        )}
        
        <div className="p-8">
          <div className={`w-16 h-16 ${service.iconColor} rounded-lg flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300`}>
            <service.icon className="text-white text-2xl" size={32} />
          </div>
          <h3 className="font-bold text-xl mb-4 text-sigma-charcoal">{service.title}</h3>
          <p className="text-sigma-light-gray mb-6">{service.description}</p>
          <ul className="text-sm text-sigma-light-gray space-y-2 mb-6">
            {service.features.map((feature: string, featureIndex: number) => (
              <li key={featureIndex} className="flex items-center">
                <CheckCircle className="text-sigma-emerald mr-2" size={16} />
                {feature}
              </li>
            ))}
          </ul>
          <Button 
            onClick={() => {
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-sigma-emerald hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-300"
          >
            Get Help
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default function Services() {
  const [serviceImages, setServiceImages] = useState<{[key: string]: string}>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Memoized image loading effect
  useEffect(() => {
    let isMounted = true;
    
    const loadImages = async () => {
      try {
        const images = await getWebsiteImages();
        
        if (!isMounted) return;
        
        // Batch process service images
        const serviceImageData: {[key: string]: string} = {};
        
        services.forEach(service => {
          const imageUrl = images[service.imageKey as keyof typeof images] as string;
          if (imageUrl) {
            serviceImageData[service.imageKey] = imageUrl;
          }
        });
        
        setServiceImages(serviceImageData);
        setImagesLoaded(true);
      } catch (error) {
        console.error('Failed to load service images:', error);
        setImagesLoaded(true);
      }
    };
    
    loadImages();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized service list to prevent re-renders
  const serviceList = useMemo(() => {
    return services.map((service, index) => (
      <ServiceCard 
        key={service.imageKey || index}
        service={service}
        imageUrl={serviceImages[service.imageKey] || service.fallbackImage}
      />
    ));
  }, [serviceImages]);

  return (
    <section id="services" className="py-20 bg-[#f4efe6]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-gray-800 mb-4">Our Services</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From residential roofing to exterior painting, we provide comprehensive home improvement solutions for all your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {imagesLoaded ? (
            serviceList
          ) : (
            // Loading skeleton for services
            Array.from({ length: 6 }, (_, index) => (
              <Card key={index} className="bg-gray-50">
                <CardContent className="p-0">
                  <div className="h-48 bg-gray-200 animate-pulse rounded-t-lg" />
                  <div className="p-8">
                    <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-lg mb-6" />
                    <div className="h-6 bg-gray-200 animate-pulse rounded mb-4" />
                    <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}