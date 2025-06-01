import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileEdit, Wrench, ClipboardCheck, DollarSign, Phone, FileX, Shield } from "lucide-react";

const retailProcess = [
  {
    icon: Users,
    title: "Free Consult",
    description: "We meet with you to discuss your roofing needs and provide expert recommendations"
  },
  {
    icon: FileEdit,
    title: "Estimation & Proposal",
    description: "Detailed written estimate with transparent pricing and material specifications"
  },
  {
    icon: Wrench,
    title: "We do the work",
    description: "Professional installation with quality materials and expert craftsmanship"
  },
  {
    icon: ClipboardCheck,
    title: "Final Inspection",
    description: "Thorough quality check to ensure everything meets our high standards"
  },
  {
    icon: DollarSign,
    title: "Payment",
    description: "Simple payment process with flexible options for your convenience"
  }
];

const insuranceProcess = [
  {
    icon: Phone,
    title: "Initial Contact",
    description: "Call us immediately after storm damage for emergency assessment and temporary repairs"
  },
  {
    icon: ClipboardCheck,
    title: "Damage Assessment",
    description: "Professional inspection and detailed documentation of all storm damage"
  },
  {
    icon: FileEdit,
    title: "Insurance Claim",
    description: "We assist with filing your claim and work directly with your insurance adjuster"
  },
  {
    icon: Shield,
    title: "Approval & Scheduling",
    description: "Once approved, we schedule your repairs and handle all paperwork"
  },
  {
    icon: Wrench,
    title: "Professional Restoration",
    description: "Complete repair using insurance-approved materials and methods"
  }
];

export default function Process() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-charcoal mb-4">Our Process</h2>
          <p className="text-xl text-sigma-light-gray max-w-2xl mx-auto">
            Our process is simple and contains only a few straightforward steps, designed to make your roofing project stress-free.
          </p>
        </div>

        <Tabs defaultValue="retail" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-12">
            <TabsTrigger value="retail" className="text-lg">Retail Jobs</TabsTrigger>
            <TabsTrigger value="insurance" className="text-lg">Insurance Jobs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="retail">
            <div className="relative">
              {/* Process Flow */}
              <div className="flex flex-col lg:flex-row items-center justify-center space-y-8 lg:space-y-0 lg:space-x-4">
                {retailProcess.map((step, index) => (
                  <div key={index} className="flex flex-col items-center relative">
                    {/* Process Card */}
                    <Card className="bg-white border-2 border-sigma-emerald/20 hover:border-sigma-emerald transition-all duration-300 hover:shadow-lg max-w-xs">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-sigma-emerald rounded-full flex items-center justify-center mx-auto mb-4">
                          <step.icon className="text-white" size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-sigma-charcoal mb-2">{step.title}</h3>
                        <p className="text-sm text-sigma-light-gray">{step.description}</p>
                      </CardContent>
                    </Card>
                    
                    {/* Arrow (hidden on last item) */}
                    {index < retailProcess.length - 1 && (
                      <div className="hidden lg:block absolute -right-8 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 text-sigma-emerald">→</div>
                      </div>
                    )}
                    
                    {/* Down arrow for mobile */}
                    {index < retailProcess.length - 1 && (
                      <div className="lg:hidden mt-4">
                        <div className="w-6 h-6 text-sigma-emerald">↓</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insurance">
            <div className="relative">
              {/* Process Flow */}
              <div className="flex flex-col lg:flex-row items-center justify-center space-y-8 lg:space-y-0 lg:space-x-4">
                {insuranceProcess.map((step, index) => (
                  <div key={index} className="flex flex-col items-center relative">
                    {/* Process Card */}
                    <Card className="bg-white border-2 border-sigma-emerald/20 hover:border-sigma-emerald transition-all duration-300 hover:shadow-lg max-w-xs">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-sigma-emerald rounded-full flex items-center justify-center mx-auto mb-4">
                          <step.icon className="text-white" size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-sigma-charcoal mb-2">{step.title}</h3>
                        <p className="text-sm text-sigma-light-gray">{step.description}</p>
                      </CardContent>
                    </Card>
                    
                    {/* Arrow (hidden on last item) */}
                    {index < insuranceProcess.length - 1 && (
                      <div className="hidden lg:block absolute -right-8 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 text-sigma-emerald">→</div>
                      </div>
                    )}
                    
                    {/* Down arrow for mobile */}
                    {index < insuranceProcess.length - 1 && (
                      <div className="lg:hidden mt-4">
                        <div className="w-6 h-6 text-sigma-emerald">↓</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}