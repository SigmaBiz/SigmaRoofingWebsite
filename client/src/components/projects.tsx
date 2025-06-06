import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { applyTrademarks } from "@/lib/trademark-utils";

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

// Memoized project image component with optimized error handling
const ProjectImage = memo(({ src, alt, fallbackSrc }: { src: string; alt: string; fallbackSrc: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  
  const handleError = useCallback(() => {
    setImgSrc(fallbackSrc);
  }, [fallbackSrc]);
  
  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className="w-full h-48 object-cover" 
      onError={handleError}
      loading="lazy"
    />
  );
});

ProjectImage.displayName = 'ProjectImage';

// Memoized individual project card
const ProjectCard = memo(({ project }: { project: any }) => {
  const fallbackImage = "https://images.unsplash.com/photo-1604709177225-055f99402ea3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  
  return (
    <Card className="bg-white overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-t-sigma-emerald">
      <ProjectImage 
        src={project.image || project.imageUrl} 
        alt={project.title}
        fallbackSrc={fallbackImage}
      />
      <CardContent className="p-6">
        <h3 className="font-bold text-xl mb-2 text-sigma-charcoal">{applyTrademarks(project.title)}</h3>
        <p className="text-sigma-light-gray mb-4">{applyTrademarks(project.description)}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-sigma-emerald font-semibold bg-sigma-emerald/10 px-3 py-1 rounded-full">{project.category}</span>
          <Button variant="link" className="text-sigma-emerald p-0 h-auto hover:text-emerald-600">
            View Details →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ProjectCard.displayName = 'ProjectCard';

// Constants moved outside component for better performance
const PROJECT_KEYS = ['project1', 'project2', 'project3', 'project4', 'project5', 'project6'];

export default function Projects() {
  const [adminProjects, setAdminProjects] = useState<any[]>([]);
  const [useAdminProjects, setUseAdminProjects] = useState(false);

  // Use API to load projects consistently across all devices
  const { data: apiProjects } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30 // 30 minutes
  });

  // Memoized function to load admin projects from multiple sources
  const loadAdminProjects = useMemo(() => {
    try {
      // First check API data
      if (apiProjects?.success && apiProjects?.projects && Array.isArray(apiProjects.projects) && apiProjects.projects.length > 0) {
        return { projects: apiProjects.projects, hasProjects: true };
      }

      // Fallback to localStorage for development
      const savedProjects = localStorage.getItem('adminProjects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
          return { projects: parsedProjects, hasProjects: true };
        }
      }

      // Then check individual project storage with batch localStorage access
      const customProjects: any[] = [];
      let hasAnyProjects = false;

      for (const key of PROJECT_KEYS) {
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
      }

      if (hasAnyProjects) {
        return { projects: customProjects, hasProjects: true };
      }

      return { projects: [], hasProjects: false };
    } catch (error) {
      console.log('Error loading admin projects:', error);
      return { projects: [], hasProjects: false };
    }
  }, [apiProjects]); // Depend on API data

  useEffect(() => {
    const { projects, hasProjects } = loadAdminProjects;
    if (hasProjects) {
      setAdminProjects(projects);
      setUseAdminProjects(true);
    } else {
      setUseAdminProjects(false);
    }
  }, [loadAdminProjects]);

  // Memoized project selection and validation
  const { projectsArray, showingAdminProjects } = useMemo(() => {
    const projects = useAdminProjects ? adminProjects : staticProjects;
    const validProjects = Array.isArray(projects) && projects.length > 0 ? projects : staticProjects;
    
    return {
      projectsArray: validProjects,
      showingAdminProjects: useAdminProjects && adminProjects.length > 0
    };
  }, [useAdminProjects, adminProjects]);

  // Memoized description text to avoid recalculation
  const descriptionText = useMemo(() => {
    return showingAdminProjects 
      ? "Custom project gallery showcasing our latest roofing work managed through your admin panel."
      : "Take a look at some of our recent roofing projects in the Edmond area. Each project showcases our commitment to quality and attention to detail.";
  }, [showingAdminProjects]);

  // Memoized project list to prevent unnecessary re-renders
  const projectList = useMemo(() => {
    return projectsArray.map((project: any, index: number) => (
      <ProjectCard key={project.id || project.title || index} project={project} />
    ));
  }, [projectsArray]);

  return (
    <section id="projects" className="py-20 bg-sigma-charcoal">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-white mb-4">Recent Projects</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {descriptionText}
          </p>
          {showingAdminProjects && (
            <div className="mt-4 inline-flex items-center px-3 py-1 bg-sigma-emerald text-white text-sm rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
              Admin Managed Gallery
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectList}
        </div>

        <div className="text-center mt-12">
          <Button className="bg-sigma-emerald text-white hover:bg-emerald-600 text-lg px-8 py-4 shadow-lg">
            View All Projects
          </Button>
        </div>
      </div>
    </section>
  );
}