import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const projects = [
  {
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Asphalt Shingle Replacement",
    description: "Complete asphalt shingle roof replacement for a 2,200 sq ft home in Edmond. High-quality materials with comprehensive warranty.",
    category: "Residential Project"
  },
  {
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Exterior House Painting",
    description: "Complete exterior painting for a beautiful Edmond home. Premium paint with weather protection and curb appeal enhancement.",
    category: "Painting Project"
  },
  {
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Storm Damage Repair",
    description: "Complete asphalt shingle restoration after hail damage. Insurance claim assistance and emergency repairs provided.",
    category: "Insurance Claim"
  },
  {
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Asphalt Shingle Installation",
    description: "New asphalt shingle roof installation for family home. Durable materials with enhanced ventilation system.",
    category: "New Installation"
  },
  {
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Shingle Roof Repair",
    description: "Professional asphalt shingle repair and maintenance service to extend roof life and prevent leaks.",
    category: "Repair Project"
  },
  {
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Gutter Installation",
    description: "New seamless gutter system installation with leaf guards to protect foundation and landscaping.",
    category: "Gutter Project"
  }
];

export default function Projects() {
  return (
    <section id="projects" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-dark mb-4">Recent Projects</h2>
          <p className="text-xl text-sigma-gray max-w-2xl mx-auto">
            Take a look at some of our recent roofing projects in the Edmond area. Each project showcases our commitment to quality and attention to detail.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card key={index} className="bg-sigma-cream overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={project.image} 
                alt={project.title} 
                className="w-full h-48 object-cover" 
              />
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-2">{project.title}</h3>
                <p className="text-sigma-gray mb-4">{project.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-sigma-gold font-semibold">{project.category}</span>
                  <Button variant="link" className="text-sigma-gold p-0 h-auto">
                    View Details →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button className="bg-sigma-gold text-white hover:bg-yellow-600 text-lg px-8 py-4">
            View All Projects
          </Button>
        </div>
      </div>
    </section>
  );
}
