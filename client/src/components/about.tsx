import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function About() {
  const [teamPhoto, setTeamPhoto] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");

  // Load images from admin panel
  const { data: websiteImages } = useQuery({
    queryKey: ['/api/website-images'],
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  useEffect(() => {
    // Load from admin panel first, then fall back to localStorage
    if (websiteImages?.success && websiteImages?.images) {
      if (websiteImages.images.teamPhoto) {
        setTeamPhoto(websiteImages.images.teamPhoto);
      }
      if (websiteImages.images.companyLogo) {
        setCompanyLogo(websiteImages.images.companyLogo);
      }
    } else {
      // Fallback to localStorage
      const savedTeamPhoto = localStorage.getItem('teamPhoto');
      const savedCompanyLogo = localStorage.getItem('companyLogo');
      if (savedTeamPhoto) {
        setTeamPhoto(savedTeamPhoto);
      }
      if (savedCompanyLogo) {
        setCompanyLogo(savedCompanyLogo);
      }
    }
  }, [websiteImages]);
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
            {/* Team Photo */}
            <div className="space-y-2">
              {teamPhoto ? (
                <img 
                  src={teamPhoto} 
                  alt="Sigma Roofing team" 
                  className="rounded-lg shadow-lg w-full h-64 object-cover" 
                />
              ) : (
                <img 
                  src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Professional roofing team at work" 
                  className="rounded-lg shadow-lg w-full h-64 object-cover" 
                />
              )}
              <p className="text-center text-gray-200 text-sm">Our Professional Team</p>
            </div>
            
            {/* Company Logo */}
            {companyLogo && (
              <div className="space-y-2">
                <img 
                  src={companyLogo} 
                  alt="Sigma Roofing Company Logo" 
                  className="rounded-lg shadow-lg w-full h-64 object-cover" 
                />
                <p className="text-center text-gray-200 text-sm">Company Logo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
