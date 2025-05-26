import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-20 bg-sigma-cream">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-bold text-4xl text-sigma-dark mb-6">About Sigma Roofing LLC</h2>
            <p className="text-lg text-sigma-gray mb-6">
              With over 15 years of experience serving the Edmond, Oklahoma area, Sigma Roofing LLC has built a reputation for quality workmanship, reliability, and customer satisfaction. We are a fully licensed and insured roofing contractor committed to protecting your most valuable investment.
            </p>
            <p className="text-lg text-sigma-gray mb-8">
              Our team of certified roofing professionals uses only the highest quality materials and follows industry best practices to ensure your roof stands the test of time. From minor repairs to complete roof replacements, we deliver exceptional results on every project.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="text-center p-4">
                  <div className="text-3xl font-bold text-sigma-gold mb-2">15+</div>
                  <div className="text-sm text-sigma-gray">Years in Business</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center p-4">
                  <div className="text-3xl font-bold text-sigma-gold mb-2">A+</div>
                  <div className="text-sm text-sigma-gray">BBB Rating</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center p-4">
                  <div className="text-3xl font-bold text-sigma-gold mb-2">500+</div>
                  <div className="text-sm text-sigma-gray">Happy Customers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center p-4">
                  <div className="text-3xl font-bold text-sigma-gold mb-2">100%</div>
                  <div className="text-sm text-sigma-gray">Licensed & Insured</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4">Why Choose Sigma Roofing?</h3>
                <ul className="space-y-3">
                  {[
                    "Licensed contractor (LIC#80006734) with full insurance coverage",
                    "Free estimates and competitive pricing",
                    "Quality materials from trusted manufacturers",
                    "Comprehensive warranties on all work",
                    "Emergency repair services available"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="text-sigma-gold mr-3 mt-1" size={20} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Professional roofing team at work" 
              className="rounded-lg shadow-lg w-full h-auto" 
            />
            <img 
              src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="Beautiful residential home with new roof" 
              className="rounded-lg shadow-lg w-full h-auto" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
