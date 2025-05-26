import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const projects = [
  {
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Metal Roof Installation",
    description: "Complete metal roof replacement for a 2,500 sq ft home in Edmond. Energy-efficient solution with 50-year warranty.",
    category: "Residential Project"
  },
  {
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Commercial Flat Roof",
    description: "TPO roofing system installation for a 10,000 sq ft commercial building with enhanced insulation.",
    category: "Commercial Project"
  },
  {
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Storm Damage Repair",
    description: "Complete roof restoration after hail damage. Insurance claim assistance and emergency repairs provided.",
    category: "Insurance Claim"
  },
  {
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Tile Roof Installation",
    description: "Premium clay tile roofing for luxury home. Custom color matching and enhanced durability features.",
    category: "Premium Project"
  },
  {
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Shingle Replacement",
    description: "Complete asphalt shingle roof replacement with upgraded ventilation system and gutters.",
    category: "Residential Project"
  },
  {
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    title: "Industrial Roofing",
    description: "Large-scale industrial roof installation with specialized materials for harsh weather conditions.",
    category: "Industrial Project"
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
