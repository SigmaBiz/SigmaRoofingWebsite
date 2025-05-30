import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Phone, Star, AlertTriangle, Wind, Clock, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

interface Review {
  name: string;
  role: string;
  rating: number;
  review: string;
  date: string;
  initials: string;
}

export default function TornadoDamage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    serviceType: "Tornado Damage Assessment",
    description: "",
    preferredDate1: "",
    preferredTime1: "",
    preferredDate2: "",
    preferredTime2: ""
  });

  const [tornadoData, setTornadoData] = useState({
    city: "Oklahoma City",
    date_of_loss: new Date().toLocaleDateString(),
    storm_type: "tornado",
    wind_speed: "EF1-EF2"
  });

  // Fetch Google reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Contact form submission
  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted Successfully!",
        description: "We'll contact you within 24 hours to schedule your free inspection.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        serviceType: "Tornado Damage Assessment",
        description: "",
        preferredDate1: "",
        preferredTime1: "",
        preferredDate2: "",
        preferredTime2: ""
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or call us directly at (405) 902-1826",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Σ</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sigma Roofing LLC</h1>
                <p className="text-sm text-gray-600">Licensed #80006734</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-emerald-600">(405) 902-1826</p>
              <p className="text-sm text-gray-600">24/7 Emergency Service</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Alert Banner */}
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-500 mt-1 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-red-800 mb-2">
                Tornado Damage Alert: {tornadoData.city} Area
              </h2>
              <p className="text-red-700 text-lg">
                Recent {tornadoData.wind_speed} tornado activity on {tornadoData.date_of_loss} may have caused structural damage. 
                <strong> Professional inspection is critical even if damage isn't immediately visible.</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Information */}
          <div>
            {/* Tornado Damage Info */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Wind className="w-6 h-6 text-red-600 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">Hidden Tornado Damage Risks</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <p className="text-yellow-800 font-semibold">
                      Tornadoes create unique damage patterns through debris impact, uplift forces, and pressure changes that may not be immediately visible.
                    </p>
                  </div>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-red-500 mt-1 mr-3" />
                      <div>
                        <span className="font-semibold">Debris Impact Damage:</span>
                        <p className="text-gray-600 text-sm">Flying objects can puncture or crack shingles, creating entry points for water</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-red-500 mt-1 mr-3" />
                      <div>
                        <span className="font-semibold">Wind Uplift Forces:</span>
                        <p className="text-gray-600 text-sm">High winds can lift and reseal shingles, weakening their attachment without visible damage</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-red-500 mt-1 mr-3" />
                      <div>
                        <span className="font-semibold">Building Envelope Failure:</span>
                        <p className="text-gray-600 text-sm">Pressure changes can compromise seals around vents, flashing, and penetrations</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-red-500 mt-1 mr-3" />
                      <div>
                        <span className="font-semibold">Structural Stress:</span>
                        <p className="text-gray-600 text-sm">Tornado forces can shift or stress roof decking and structural components</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Urgency Section */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Clock className="w-6 h-6 text-orange-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Why Immediate Inspection Matters</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">Time-Sensitive Issues:</h4>
                    <ul className="space-y-2 text-orange-700">
                      <li>• Compromised seals may allow gradual water infiltration</li>
                      <li>• Loosened materials can become projectiles in future storms</li>
                      <li>• Insurance adjusters need to document damage while it's fresh</li>
                      <li>• Weather exposure can worsen existing damage quickly</li>
                    </ul>
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-800 mb-2">Professional Assessment Identifies:</h4>
                    <ul className="space-y-2 text-emerald-700">
                      <li>• Micro-fractures in shingles from debris impact</li>
                      <li>• Lifted or shifted materials that may fail</li>
                      <li>• Compromised flashing and penetration seals</li>
                      <li>• Gutter and downspout damage affecting drainage</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Reviews */}
            {reviewsData?.reviews && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-6">
                    <Star className="w-6 h-6 text-yellow-500 mr-3" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {reviewsData.businessRating}/5 ({reviewsData.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {reviewsData.reviews.slice(0, 3).map((review: Review, index: number) => (
                      <div key={index} className="border-l-4 border-emerald-500 pl-4">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                            {review.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{review.name}</p>
                            <div className="flex text-yellow-400">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{review.review}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contact Form */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Schedule Your Free Roof Assessment</h2>
                  <p className="text-gray-600">Professional tornado damage inspection with insurance claim assistance</p>
                  <div className="flex items-center justify-center mt-3">
                    <Clock className="w-4 h-4 text-emerald-600 mr-2" />
                    <span className="text-sm text-emerald-600 font-semibold">Emergency response available</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                  
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                  
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                  
                  <Input
                    placeholder="Property Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                  />
                  
                  <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tornado Damage Assessment">Tornado Damage Assessment</SelectItem>
                      <SelectItem value="Emergency Structural Inspection">Emergency Structural Inspection</SelectItem>
                      <SelectItem value="Insurance Claim Assistance">Insurance Claim Assistance</SelectItem>
                      <SelectItem value="Emergency Temporary Repairs">Emergency Temporary Repairs</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Textarea
                    placeholder="Describe any visible damage, debris impact, or structural concerns..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Preferred Inspection Times:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="date"
                        value={formData.preferredDate1}
                        onChange={(e) => handleInputChange("preferredDate1", e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Select value={formData.preferredTime1} onValueChange={(value) => handleInputChange("preferredTime1", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</SelectItem>
                          <SelectItem value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</SelectItem>
                          <SelectItem value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</SelectItem>
                          <SelectItem value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</SelectItem>
                          <SelectItem value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="date"
                        value={formData.preferredDate2}
                        onChange={(e) => handleInputChange("preferredDate2", e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Select value={formData.preferredTime2} onValueChange={(value) => handleInputChange("preferredTime2", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Alt. Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</SelectItem>
                          <SelectItem value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</SelectItem>
                          <SelectItem value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</SelectItem>
                          <SelectItem value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</SelectItem>
                          <SelectItem value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => window.location.href = '/#contact'}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Free Assessment
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-3">Emergency situation? Call now:</p>
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => window.open("tel:(405)902-1826")}
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Emergency: (405) 902-1826
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}