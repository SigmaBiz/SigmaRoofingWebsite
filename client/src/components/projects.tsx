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
    image: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372972/sigma-roofing/projects/gkfyybvob6ew3fqavaaz.jpg",
    title: "GAF® Pewter Gray Laminate Roof w/ High Profile Z Ridge",
    description: "This beautiful new roof features rich charcoal gray shingles that perfectly complement the home's stone and wood exterior details. The clean installation and classic color choice create a timeless look that enhances the overall curb appeal of this home.",
    category: "Residential",
    location: "NW Oklahoma City"
  },
  {
    image: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372969/sigma-roofing/projects/nxwhjnvbnbmp1wfx1s1v.jpg",
    title: "GAF® Charcoal Laminate Roof w/ High Profile Z Ridge",
    description: "This new charcoal roof installation delivers a bold, sophisticated appearance with precise shingle alignment and expert flashing work. The deep gray tones create a striking contrast against the lighter elements, giving this home a fresh, classic look.",
    category: "Storm Damage",
    location: "South Oklahoma City"
  },
  {
    image: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372967/sigma-roofing/projects/vzmkyoilfhychhxwluin.jpg",
    title: "CertainTeed® Colonial Slate w/ Ridge Vent",
    description: "This Colonial Slate shingle roof replacement features beautiful multi-toned gray shingles that create an elegant weathered slate appearance. The varied gray tones and textured pattern give this home a distinguished, upscale look while providing long-lasting protection.",
    category: "Residential",
    location: "South Oklahoma City"
  },
  {
    image: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371608/sigma-roofing/projects/c9ip8kujkvrzpkfry2ah.jpg",
    title: "GAF® Charcoal Laminate Roof w/ Redeck",
    description: "This stunning brick home received a complete roof replacement including new decking and classic charcoal shingles that beautifully complement the red brick exterior. The timeless charcoal color creates a perfect contrast against the warm brick tones, transforming the home's entire aesthetic.",
    category: "Storm Damage",
    location: "SW Oklahoma City"
  },
  {
    image: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371606/sigma-roofing/projects/md8oh6pqosm188ihtcqx.jpg",
    title: "GAF ArmorShield™ II WeatheredWood Impact Resistant System",
    description: "This home features a new hail impact resistant roofing system with beautiful Weatherwood shingles that provide both superior storm protection and classic appeal. The natural weathered wood tones create a timeless look that blends seamlessly with any neighborhood while offering peace of mind against severe weather damage.",
    category: "Storm Damage",
    location: "Edmond"
  },
  {
    image: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371609/sigma-roofing/projects/jwx9k6khrtfg0zjgemxv.jpg",
    title: "GAF® Charcoal Laminate Roof w/ High Profile Ridge",
    description: "This charcoal roof installation showcases professional craftsmanship with sleek valley metal and high-profile ridge cap detailing that adds both function and visual appeal. The classic charcoal shingles paired with the premium finishing touches create a sophisticated look that stands out in the neighborhood.",
    category: "Residential",
    location: "The Village"
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
  const fallbackImage = "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372972/sigma-roofing/projects/gkfyybvob6ew3fqavaaz.jpg";
  
  return (
    <Card className="bg-gray-50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
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
  const { data: apiProjects } = useQuery<{success: boolean; projects: any[]}>({
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
      ? "Custom project gallery showcasing our latest work."
      : "Take a look at some of our recent work!";
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