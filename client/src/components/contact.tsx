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
  address: string;
  serviceType: string;
  description: string;
  preferredDate1: string;
  preferredTime1: string;
  preferredDate2: string;
  preferredTime2: string;
}

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    serviceType: "",
    description: "",
    preferredDate1: "",
    preferredTime1: "",
    preferredDate2: "",
    preferredTime2: ""
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
        address: "",
        serviceType: "",
        description: "",
        preferredDate1: "",
        preferredTime1: "",
        preferredDate2: "",
        preferredTime2: ""
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

  // Validation functions
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^[\d\s\-\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
  
  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      isValidEmail(formData.email) &&
      isValidPhone(formData.phone) &&
      formData.address.trim() &&
      formData.serviceType &&
      formData.preferredDate1 &&
      formData.preferredTime1 &&
      formData.preferredDate2 &&
      formData.preferredTime2
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields including two preferred appointment times.",
        variant: "destructive",
      });
      return;
    }

    contactMutation.mutate(formData);
  };

  // Generate time slots (8 AM to 3 PM start times for 4-hour windows)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 15; hour++) {
      const startTime = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
      const endHour = hour + 4;
      const endTime = endHour <= 12 ? `${endHour}:00 AM` : `${endHour - 12}:00 PM`;
      slots.push({
        value: `${hour}:00`,
        label: `${startTime} - ${endTime}`
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

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
                    className={!isValidPhone(formData.phone) && formData.phone ? "border-red-300" : ""}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Property Address *</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Main St, Edmond, OK 73012"
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
                      <SelectItem value="exterior-painting">Exterior Painting</SelectItem>
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

                {/* Appointment Scheduling */}
                <div className="bg-sigma-cream p-4 rounded-lg border-2 border-sigma-emerald/20">
                  <h3 className="font-semibold text-lg mb-4 text-sigma-charcoal">Preferred Appointment Times *</h3>
                  <p className="text-sm text-sigma-gray mb-4">Please select two preferred 4-hour appointment windows. We'll confirm which one works best for both of us.</p>
                  
                  {/* First Appointment Choice */}
                  <div className="space-y-3 mb-6">
                    <Label className="text-base font-medium">First Choice</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="preferredDate1">Date *</Label>
                        <Input
                          id="preferredDate1"
                          type="date"
                          value={formData.preferredDate1}
                          onChange={(e) => handleInputChange("preferredDate1", e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferredTime1">4-Hour Window *</Label>
                        <Select value={formData.preferredTime1} onValueChange={(value) => handleInputChange("preferredTime1", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time window..." />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((slot) => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Second Appointment Choice */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Second Choice</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="preferredDate2">Date *</Label>
                        <Input
                          id="preferredDate2"
                          type="date"
                          value={formData.preferredDate2}
                          onChange={(e) => handleInputChange("preferredDate2", e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferredTime2">4-Hour Window *</Label>
                        <Select value={formData.preferredTime2} onValueChange={(value) => handleInputChange("preferredTime2", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time window..." />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((slot) => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className={`w-full text-lg py-4 font-semibold transition-all duration-300 transform ${
                    isFormValid() 
                      ? "bg-sigma-gold text-white hover:bg-yellow-600 hover:scale-105 shadow-lg border-2 border-sigma-gold" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 border-2 border-gray-300"
                  }`}
                  disabled={contactMutation.isPending || !isFormValid()}
                >
                  <Send className="mr-2" size={20} />
                  {contactMutation.isPending 
                    ? "Submitting..." 
                    : isFormValid() 
                      ? "Get Free Estimate" 
                      : "Complete All Required Fields"
                  }
                </Button>
                
                {!isFormValid() && (
                  <p className="text-sm text-sigma-gray text-center mt-2">
                    Please fill in all required fields (*) to submit your request
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-2xl mb-6">Get In Touch</h3>
              <p className="text-lg text-sigma-gray mb-8">
                Contact Sigma Roofing LLC today for professional roofing and painting services in Edmond and surrounding areas. We're here to help with all your home improvement needs.
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
