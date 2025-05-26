import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export default function Hero() {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center hero-bg">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl text-white">
          <h1 className="font-bold text-5xl lg:text-6xl mb-6 leading-tight">
            Professional Roofing Services in{" "}
            <span className="text-sigma-gold">Edmond, OK</span>
          </h1>
          <p className="text-xl mb-8 leading-relaxed text-gray-200">
            Trusted roofing and painting contractor with over 15 years of experience. We provide quality 
            residential roofing, exterior painting, and home improvement solutions with comprehensive warranties.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              size="lg"
              className="bg-sigma-gold text-white hover:bg-yellow-600 text-lg px-8 py-4"
              onClick={() => window.open("tel:(405)902-1826")}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call (405) 902-1826
            </Button>
            <Button
              size="lg"
              className="bg-sigma-gold text-white hover:bg-yellow-600 text-lg px-8 py-4"
              onClick={scrollToContact}
            >
              Free Estimate
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-sigma-gold">15+</div>
              <div className="text-sm text-gray-300">Years Experience</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-sigma-gold">500+</div>
              <div className="text-sm text-gray-300">Projects Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-sigma-gold">100%</div>
              <div className="text-sm text-gray-300">Licensed & Insured</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
