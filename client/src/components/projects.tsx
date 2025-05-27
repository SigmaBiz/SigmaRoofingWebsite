import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface BusinessPhoto {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
}

const staticProjects = [
  {
    image: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Asphalt Shingle Replacement",
    description: "Complete asphalt shingle roof replacement for a 2,200 sq ft home in Edmond. High-quality materials with comprehensive warranty.",
    category: "Residential Project"
  },
  {
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Exterior House Painting",
    description: "Complete exterior painting for a beautiful Edmond home. Premium paint with weather protection and curb appeal enhancement.",
    category: "Painting Project"
  },
  {
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Storm Damage Repair",
    description: "Complete asphalt shingle restoration after hail damage. Insurance claim assistance and emergency repairs provided.",
    category: "Insurance Claim"
  },
  {
    image: "https://images.unsplash.com/photo-1609220136736-443140cffec6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Asphalt Shingle Installation",
    description: "New asphalt shingle roof installation for family home. Durable materials with enhanced ventilation system.",
    category: "New Installation"
  },
  {
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Shingle Roof Repair",
    description: "Professional asphalt shingle repair and maintenance service to extend roof life and prevent leaks.",
    category: "Repair Project"
  },
  {
    image: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Gutter Installation",
    description: "New seamless gutter system installation with leaf guards to protect foundation and landscaping.",
    category: "Gutter Project"
  }
];

export default function Projects() {
  const [adminProjects, setAdminProjects] = useState<any[]>([]);
  const [useAdminProjects, setUseAdminProjects] = useState(false);

  // Fetch real photos from Google Business Profile
  const { data: businessPhotosData, isLoading: photosLoading } = useQuery({
    queryKey: ['/api/business-photos'],
    retry: 1,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  useEffect(() => {
    // Check if admin has uploaded custom projects
    const savedProjects = localStorage.getItem('adminProjects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        if (parsedProjects.length > 0) {
          setAdminProjects(parsedProjects);
          setUseAdminProjects(true);
        }
      } catch (error) {
        console.log('No admin projects found');
      }
    }

    // Also check individual project storage
    let hasAnyProjects = false;
    const projectKeys = ['project1', 'project2', 'project3', 'project4', 'project5', 'project6'];
    const customProjects: any[] = [];

    projectKeys.forEach((key) => {
      const savedProject = localStorage.getItem(`project_${key}`);
      if (savedProject) {
        try {
          const projectData = JSON.parse(savedProject);
          if (projectData.imageUrl) {
            customProjects.push({
              image: projectData.imageUrl,
              title: projectData.title || `Project ${customProjects.length + 1}`,
              description: projectData.description || 'Custom project managed through admin panel',
              category: projectData.category || 'Admin Project'
            });
            hasAnyProjects = true;
          }
        } catch (error) {
          console.log('Error loading project:', key);
        }
      }
    });

    if (hasAnyProjects) {
      setAdminProjects(customProjects);
      setUseAdminProjects(true);
      // Update the adminProjects cache too
      localStorage.setItem('adminProjects', JSON.stringify(customProjects));
    }
  }, []);

  // Prioritize admin projects, then Google Business photos, then static projects
  const projects = useAdminProjects 
    ? adminProjects 
    : (businessPhotosData as any)?.success 
      ? (businessPhotosData as any).photos 
      : staticProjects;
  
  const showingLivePhotos = !useAdminProjects && (businessPhotosData as any)?.success;
  const showingAdminProjects = useAdminProjects;

  // Ensure projects is always an array
  const projectsArray = Array.isArray(projects) ? projects : staticProjects;

  return (
    <section id="projects" className="py-20 bg-sigma-charcoal">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-white mb-4">Recent Projects</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {showingAdminProjects 
              ? "Custom project gallery showcasing our latest roofing work managed through your admin panel."
              : showingLivePhotos 
                ? "Live photos from our Google Business profile showcasing our latest roofing work in the Edmond area."
                : "Take a look at some of our recent roofing projects in the Edmond area. Each project showcases our commitment to quality and attention to detail."
            }
          </p>
          {showingAdminProjects && (
            <div className="mt-4 inline-flex items-center px-3 py-1 bg-sigma-emerald text-white text-sm rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
              Admin Managed Gallery
            </div>
          )}
          {showingLivePhotos && !showingAdminProjects && (
            <div className="mt-4 inline-flex items-center px-3 py-1 bg-emerald-600 text-white text-sm rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
              Live from Google Business Profile
            </div>
          )}
        </div>

        {photosLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="bg-white overflow-hidden border-t-4 border-t-sigma-emerald">
                <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectsArray.map((project: any, index: number) => (
              <Card key={index} className="bg-white overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-t-sigma-emerald">
                <img 
                  src={showingLivePhotos ? project.imageUrl : project.image} 
                  alt={project.title} 
                  className="w-full h-48 object-cover" 
                  onError={(e) => {
                    // Fallback to placeholder if Google photo fails to load
                    e.currentTarget.src = "https://images.unsplash.com/photo-1604709177225-055f99402ea3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
                  }}
                />
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-2 text-sigma-charcoal">{project.title}</h3>
                  <p className="text-sigma-light-gray mb-4">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-sigma-emerald font-semibold bg-sigma-emerald/10 px-3 py-1 rounded-full">{project.category}</span>
                    <Button variant="link" className="text-sigma-emerald p-0 h-auto hover:text-emerald-600">
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button className="bg-sigma-emerald text-white hover:bg-emerald-600 text-lg px-8 py-4 shadow-lg">
            View All Projects
          </Button>
        </div>
      </div>
    </section>
  );
}
