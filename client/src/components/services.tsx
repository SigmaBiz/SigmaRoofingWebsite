import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, PaintBucket, Wrench, Shield, Droplets, CloudRain, CheckCircle } from "lucide-react";

const services = [
  {
    icon: Home,
    title: "Residential Roofing",
    description: "Complete residential roofing services including new installations, repairs, and maintenance for all roof types.",
    features: ["Asphalt Shingles", "Metal Roofing", "Tile Roofing", "Storm Damage Repair"]
  },
  {
    icon: PaintBucket,
    title: "Exterior Painting",
    description: "Professional exterior painting services to protect and beautify your home with quality materials and expert craftsmanship.",
    features: ["House Painting", "Trim & Siding", "Deck Staining", "Power Washing"]
  },
  {
    icon: Wrench,
    title: "Roof Repairs",
    description: "Emergency and scheduled roof repairs to protect your property from water damage and structural issues.",
    features: ["Leak Detection & Repair", "Shingle Replacement", "Flashing Repair", "Emergency Services"]
  },
  {
    icon: Shield,
    title: "Roof Inspections",
    description: "Comprehensive roof inspections to identify potential issues before they become costly problems.",
    features: ["Annual Inspections", "Storm Damage Assessment", "Insurance Claims Support", "Detailed Reports"]
  },
  {
    icon: Droplets,
    title: "Gutter Services",
    description: "Complete gutter installation, repair, and maintenance services to protect your roof and foundation.",
    features: ["Gutter Installation", "Gutter Cleaning", "Downspout Repair", "Gutter Guards"]
  },
  {
    icon: CloudRain,
    title: "Storm Damage",
    description: "Rapid response storm damage repair services with insurance claim assistance and emergency protection.",
    features: ["Emergency Tarping", "Insurance Claims", "Hail Damage Repair", "Wind Damage Restoration"]
  }
];

export default function Services() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-dark mb-4">Our Services</h2>
          <p className="text-xl text-sigma-gray max-w-2xl mx-auto">
            From residential roofing to exterior painting, we provide comprehensive home improvement solutions for all your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="bg-sigma-cream hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-sigma-gold rounded-lg flex items-center justify-center mb-6">
                  <service.icon className="text-white text-2xl" size={32} />
                </div>
                <h3 className="font-bold text-xl mb-4">{service.title}</h3>
                <p className="text-sigma-gray mb-6">{service.description}</p>
                <ul className="text-sm text-sigma-gray space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="text-sigma-gold mr-2" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="link" className="text-sigma-gold font-semibold p-0 h-auto">
                  Learn More →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
