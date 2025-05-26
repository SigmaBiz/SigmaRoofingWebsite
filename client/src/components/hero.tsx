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
        <div className="max-w-3xl text-white text-center lg:text-left">
          <h1 className="font-bold text-4xl lg:text-6xl mb-6 leading-tight">
            <span className="text-white">Stand firm.</span>{" "}
            <span className="text-sigma-emerald">Brave the storm.</span>{" "}
            <span className="text-white">Serve with heart.</span>
          </h1>
          <p className="text-lg lg:text-xl mb-8 leading-relaxed text-gray-200 max-w-2xl mx-auto lg:mx-0">
            Quality craftsmanship and down-to-earth, responsive customer service is what we do. Whether you need 
            major repairs or minor fixes, we work with you to find the best solution for your home's specific needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
            <Button
              size="lg"
              className="bg-sigma-emerald text-white hover:bg-emerald-600 text-lg px-8 py-4 shadow-lg transform hover:scale-105 transition-transform min-w-[200px]"
              onClick={() => window.open("tel:(405)902-1826")}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call (405) 902-1826
            </Button>
            <Button
              size="lg"
              className="bg-sigma-emerald text-white hover:bg-emerald-600 text-lg px-8 py-4 shadow-lg transform hover:scale-105 transition-transform min-w-[200px]"
              onClick={scrollToContact}
            >
              Free Estimate
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/120px-Flag_of_Oklahoma.svg.png" 
                alt="Oklahoma Flag" 
                className="w-16 h-12 mb-2 rounded shadow-lg"
              />
              <div className="text-sm text-gray-300 font-semibold">Operated</div>
            </div>
            <div className="flex flex-col items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/120px-Flag_of_Oklahoma.svg.png" 
                alt="Oklahoma Flag" 
                className="w-16 h-12 mb-2 rounded shadow-lg"
              />
              <div className="text-sm text-gray-300 font-semibold">Founded</div>
            </div>
            <div className="flex flex-col items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/120px-Flag_of_Oklahoma.svg.png" 
                alt="Oklahoma Flag" 
                className="w-16 h-12 mb-2 rounded shadow-lg"
              />
              <div className="text-sm text-gray-300 font-semibold">Licensed & Insured</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
