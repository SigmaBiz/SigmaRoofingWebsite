import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, IdCard, AlertTriangle, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceType: string;
  description: string;
}

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    serviceType: "",
    description: ""
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Request Submitted Successfully!",
        description: data.message,
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        serviceType: "",
        description: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error Submitting Request",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const serviceAreas = [
    "Edmond", "Oklahoma City", "Moore", "Norman", 
    "Yukon", "Mustang", "Guthrie", "Deer Creek"
  ];

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-dark mb-4">Get Your Free Estimate</h2>
          <p className="text-xl text-sigma-gray max-w-2xl mx-auto">
            Ready to protect your property with a quality roof? Contact Sigma Roofing LLC today for your free, no-obligation estimate.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="bg-sigma-cream">
            <CardContent className="p-8">
              <h3 className="font-bold text-2xl mb-6">Request Free Estimate</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(405) 123-4567"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="serviceType">Service Needed</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roof-repair">Roof Repair</SelectItem>
                      <SelectItem value="roof-replacement">Roof Replacement</SelectItem>
                      <SelectItem value="new-installation">New Installation</SelectItem>
                      <SelectItem value="storm-damage">Storm Damage</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="gutter-services">Gutter Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Please describe your roofing needs..."
                    rows={4}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-sigma-gold text-white hover:bg-yellow-600 text-lg py-4"
                  disabled={contactMutation.isPending}
                >
                  <Send className="mr-2" size={20} />
                  {contactMutation.isPending ? "Submitting..." : "Get Free Estimate"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-2xl mb-6">Get In Touch</h3>
              <p className="text-lg text-sigma-gray mb-8">
                Contact Sigma Roofing LLC today for professional roofing services in Edmond and surrounding areas. We're here to help with all your roofing needs.
              </p>
            </div>

            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-sigma-gold rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Phone</h4>
                  <p className="text-sigma-gray">(405) 902-1826</p>
                  <p className="text-sm text-sigma-gray">Mon-Fri: 7AM-6PM, Sat: 8AM-4PM</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-sigma-gold rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Email</h4>
                  <p className="text-sigma-gray">ok.sigmaroofs@gmail.com</p>
                  <p className="text-sm text-sigma-gray">We respond within 24 hours</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-sigma-gold rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Address</h4>
                  <p className="text-sigma-gray">16612 N Western Avenue</p>
                  <p className="text-sigma-gray">Edmond, OK 73012</p>
                </div>
              </div>

              {/* License */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-sigma-gold rounded-lg flex items-center justify-center flex-shrink-0">
                  <IdCard className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">License</h4>
                  <p className="text-sigma-gray">LIC#80006734</p>
                  <p className="text-sm text-sigma-gray">Fully Licensed & Insured</p>
                </div>
              </div>
            </div>

            {/* Service Areas */}
            <Card className="bg-sigma-cream">
              <CardContent className="p-6">
                <h4 className="font-bold text-xl mb-4">Service Areas</h4>
                <p className="text-sigma-gray mb-4">We proudly serve the following areas in central Oklahoma:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {serviceAreas.map((area, index) => (
                    <div key={index}>• {area}</div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Services */}
            <Card className="bg-red-50 border border-red-200">
              <CardContent className="p-6">
                <h4 className="font-bold text-xl mb-2 text-red-800">Emergency Services</h4>
                <p className="text-red-700 mb-4">Storm damage? Roof leak? We provide 24/7 emergency roofing services.</p>
                <Button 
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => window.open("tel:(405)902-1826")}
                >
                  <AlertTriangle className="mr-2" size={20} />
                  Emergency Call
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
