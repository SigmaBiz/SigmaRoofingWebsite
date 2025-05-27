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
    if (websiteImages && websiteImages.images) {
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
            <p className="text-lg text-gray-200 mb-8">
              Our team of certified roofing professionals uses only the highest quality materials and follows industry best practices to ensure your roof stands the test of time. From minor repairs to complete roof replacements, we deliver exceptional results on every project.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="text-center p-4">
                  <div className="text-3xl font-bold text-white mb-2">15+</div>
                  <div className="text-sm text-gray-200">Years in Business</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="text-center p-4">
                  <div className="text-3xl font-bold text-white mb-2">A+</div>
                  <div className="text-sm text-gray-200">BBB Rating</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="text-center p-4">
                  <div className="text-3xl font-bold text-white mb-2">500+</div>
                  <div className="text-sm text-gray-200">Happy Customers</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="text-center p-4">
                  <div className="text-3xl font-bold text-white mb-2">100%</div>
                  <div className="text-sm text-gray-200">Licensed & Insured</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4 text-white">Why Choose Sigma Roofing?</h3>
                <ul className="space-y-3">
                  {[
                    "Licensed contractor (LIC#80006734) with full insurance coverage",
                    "Free estimates and competitive pricing",
                    "Quality materials from trusted manufacturers",
                    "Comprehensive warranties on all work",
                    "Emergency repair services available"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="text-white mr-3 mt-1" size={20} />
                      <span className="text-gray-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {teamPhoto ? (
              <img 
                src={teamPhoto} 
                alt="Sigma Roofing team" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            ) : (
              <img 
                src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Professional roofing team at work" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            )}
            <img 
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="Beautiful residential home with new roof" 
              className="rounded-lg shadow-lg w-full h-auto" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
