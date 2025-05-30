import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Phone, Star, AlertTriangle, Shield, Clock, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface HailEvent {
  date: string;
  city: string;
  hail_size: string;
  damage_assessment: string;
}

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

export default function HailDamage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    serviceType: "Storm Damage Assessment",
    description: "",
    preferredDate1: "",
    preferredTime1: "",
    preferredDate2: "",
    preferredTime2: ""
  });

  const [hailData, setHailData] = useState({
    city: "Oklahoma City",
    date_of_loss: new Date().toLocaleDateString(),
    hail_size: "2.5",
    damage_likely: true,
    verified: false
  });

  // Load verified NOAA hail storm data only
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phrase = urlParams.get('phrase');
    
    // Only proceed if we have a phrase to verify against NOAA data
    if (!phrase) {
      // Check for rotated verified storms from past 9 months
      fetch('/api/storm-data/verified-hail-rotation')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.storm && data.verified) {
            setHailData({
              city: data.storm.affected_city,
              date_of_loss: data.storm.date_of_loss,
              hail_size: data.storm.hail_size,
              damage_likely: parseFloat(data.storm.hail_size) >= 2,
              verified: true
            });
          } else {
            // No verified NOAA data available - don't show page
            setHailData(prev => ({ ...prev, verified: false }));
          }
        })
        .catch(() => {
          setHailData(prev => ({ ...prev, verified: false }));
        });
      return;
    }
    
    // Verify phrase against NOAA storm events ≥2" in OKC metro
    fetch(`/api/storm-data/verify-hail-phrase?phrase=${encodeURIComponent(phrase)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.verified && data.storm) {
          setHailData({
            city: data.storm.affected_city,
            date_of_loss: data.storm.date_of_loss,
            hail_size: data.storm.hail_size,
            damage_likely: parseFloat(data.storm.hail_size) >= 2,
            verified: true
          });
        } else {
          // Phrase doesn't match verified NOAA event - don't show page
          setHailData(prev => ({ ...prev, verified: false }));
        }
      })
      .catch(() => {
        setHailData(prev => ({ ...prev, verified: false }));
      });
  }, []);

  // Fetch Google reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch recent hail events (2+ inches in last 12 months)
  const { data: recentHailEvents } = useQuery({
    queryKey: ['/api/storm-data/hail-events'],
    staleTime: 1000 * 60 * 60, // 1 hour
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
        serviceType: "Storm Damage Assessment",
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

  // Show loading only briefly while data loads
  if (!hailData.verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storm data...</p>
        </div>
      </div>
    );
  }

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
                Hail Damage Alert: {hailData.city} Area
              </h2>
              <p className="text-red-700 text-lg">
                Recent {hailData.hail_size} hail event on {hailData.date_of_loss} may have damaged roofs in your area. 
                <strong> Insurance claims must be filed within policy timeframes.</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Information */}
          <div>
            {/* Hail Damage Info */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Shield className="w-6 h-6 text-emerald-600 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">Why {hailData.hail_size} Hail Matters</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <p className="text-yellow-800 font-semibold">
                      Hail {hailData.hail_size} and larger typically causes significant roof damage that qualifies for insurance replacement.
                    </p>
                  </div>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 mr-3" />
                      <span>Granule loss exposing shingle mat to UV damage</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 mr-3" />
                      <span>Shingle fractures that lead to water infiltration</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 mr-3" />
                      <span>Gutter and flashing damage affecting drainage</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 mr-3" />
                      <span>Exposed nail heads leading to future leaks</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Recent Hail Activity */}
            {recentHailEvents && recentHailEvents.length > 0 && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Calendar className="w-6 h-6 text-emerald-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">Recent Significant Hail Events (2"+ in Last 12 Months)</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {recentHailEvents.slice(0, 5).map((event: HailEvent, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="font-semibold">{event.city}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="destructive">{event.hail_size}</Badge>
                          <span className="text-sm text-gray-600">{event.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                    <p className="text-emerald-800 font-semibold">
                      Oklahoma City metro has experienced {recentHailEvents.length} significant hail events in the past year. 
                      This pattern indicates your roof likely needs professional assessment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <p className="text-gray-600">Professional hail damage inspection with insurance claim assistance</p>
                  <div className="flex items-center justify-center mt-3">
                    <Clock className="w-4 h-4 text-emerald-600 mr-2" />
                    <span className="text-sm text-emerald-600 font-semibold">Usually responds within 2 hours</span>
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
                      <SelectItem value="Storm Damage Assessment">Storm Damage Assessment</SelectItem>
                      <SelectItem value="Insurance Claim Assistance">Insurance Claim Assistance</SelectItem>
                      <SelectItem value="Emergency Repair">Emergency Repair</SelectItem>
                      <SelectItem value="Full Roof Replacement">Full Roof Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Textarea
                    placeholder="Describe any visible damage or concerns..."
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
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? "Submitting..." : "Schedule Free Assessment"}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-3">Need immediate assistance?</p>
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