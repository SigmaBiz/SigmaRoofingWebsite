import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function LogoBackground() {
  const { data: websiteImages } = useQuery({
    queryKey: ['/api/website-images'],
  });

  useEffect(() => {
    const logoUrl = websiteImages?.images?.companyLogo;
    
    if (logoUrl) {
      // Create CSS custom property for the logo pattern
      document.documentElement.style.setProperty(
        '--logo-pattern', 
        `url("${logoUrl}")`
      );
    } else {
      // Remove the pattern if no logo is available
      document.documentElement.style.removeProperty('--logo-pattern');
    }
  }, [websiteImages]);

  return null; // This component doesn't render anything visible
}