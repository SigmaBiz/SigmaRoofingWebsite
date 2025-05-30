import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Phone, Star, AlertTriangle, Shield, Clock, CheckCircle, Mail } from "lucide-react";

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

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [hailData, setHailData] = useState({
    city: "Oklahoma City",
    date_of_loss: new Date().toLocaleDateString(),
    hail_size: "2.5",
    damage_likely: true,
    verified: false
  });

  // Recent hail events from API
  const { data: recentHailEvents } = useQuery({
    queryKey: ['/api/recent-hail-events'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch recent projects data
  const { data: projectsData } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch Google reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to submit');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Scheduled!",
        description: "We'll contact you within 2 hours to confirm your appointment.",
      });
      // Reset form
      setFormData({
        firstName: "", lastName: "", email: "", phone: "", address: "",
        serviceType: "Storm Damage Assessment", description: "",
        preferredDate1: "", preferredTime1: "", preferredDate2: "", preferredTime2: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule assessment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Load active hail damage content with daily rotation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phrase = urlParams.get('phrase');
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setHailData({
        city: "Oklahoma City",
        date_of_loss: "Recent Storm Event",
        hail_size: "2.5\"",
        damage_likely: true,
        verified: true
      });
    }, 10000);
    
    // Get today's active hail content (phrase + verified NOAA data)
    fetch(`/api/storm-data/daily-hail-content${phrase ? `?phrase=${encodeURIComponent(phrase)}` : ''}`)
      .then(res => res.json())
      .then(data => {
        clearTimeout(loadingTimeout);
        if (data.success && data.storm) {
          setHailData({
            city: data.storm.affected_city,
            date_of_loss: data.storm.date_of_loss,
            hail_size: data.storm.hail_size,
            damage_likely: parseFloat(data.storm.hail_size) >= 2,
            verified: true
          });
        } else {
          setHailData({
            city: "Oklahoma City",
            date_of_loss: "Recent Storm Event", 
            hail_size: "2.5\"",
            damage_likely: true,
            verified: true
          });
        }
      })
      .catch(() => {
        clearTimeout(loadingTimeout);
        setHailData({
          city: "Oklahoma City",
          date_of_loss: "Recent Storm Event",
          hail_size: "2.5\"", 
          damage_likely: true,
          verified: true
        });
      });
  }, []);

  // Email validation - strict for lead quality (same as homepage)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return emailRegex.test(email) && 
           !email.includes('+') && 
           email.length <= 50 &&
           (commonDomains.includes(domain) || domain?.includes('.com') || domain?.includes('.net') || domain?.includes('.org'));
  };

  // Phone validation (US format only) - same as homepage
  const validatePhone = (phone: string): boolean => {
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length === 10 && !['0000000000', '1111111111', '1234567890'].includes(phoneDigits);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return phoneNumber;
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    let processedValue = value;
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  // Show loading only briefly while data loads
  if (!hailData.verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storm data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-light text-gray-900">Sigma Roofing</h1>
                <p className="text-sm text-gray-500">Oklahoma Licensed • Fully Insured</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-medium text-emerald-600">(405) 902-1826</p>
              <p className="text-sm text-gray-500">Emergency Service Available</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24">
          {/* Alert Banner - Redesigned */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-3xl p-8 lg:p-12">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">
                    Hail Damage Alert: {hailData.city} Area
                  </h1>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Recent {hailData.hail_size} hail event on {hailData.date_of_loss} may have damaged roofs in your area. 
                    <span className="font-medium text-red-700"> Insurance claims must be filed within policy timeframes.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white">
        <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Left Column - Information (3 columns wide) */}
            <div className="lg:col-span-3 space-y-16">
              {/* Hail Damage Info - Redesigned */}
              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-light text-gray-900">Why {hailData.hail_size} Hail Matters</h2>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-8">
                  <p className="text-lg text-amber-800 font-medium leading-relaxed">
                    Hail {hailData.hail_size} and larger typically causes significant roof damage that qualifies for insurance replacement.
                  </p>
                </div>
                
                <div className="grid gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">Granule loss exposing shingle mat to UV damage</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">Shingle fractures that lead to water infiltration</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">Gutter and flashing damage affecting drainage</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">Exposed nail heads leading to future leaks</p>
                  </div>
                </div>
              </div>

              {/* Google Reviews Section */}
              {reviewsData && reviewsData.reviews && (
                <div className="space-y-8">
                  <div className="text-center lg:text-left">
                    <h2 className="text-2xl lg:text-3xl font-light text-gray-900 mb-6">What Our Customers Say</h2>
                    <div className="flex items-center justify-center lg:justify-start space-x-2 mb-8">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                      <span className="text-lg font-medium text-gray-900">
                        {reviewsData.businessRating}/5.0 ({reviewsData.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid gap-6">
                    {reviewsData.reviews.slice(0, 3).map((review: Review, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">
                            {review.initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{review.name}</p>
                            <div className="flex text-yellow-400">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.review}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contact Form (2 columns wide) */}
            <div className="lg:col-span-2">
              <div className="sticky top-8">
                <div className="bg-gradient-to-b from-slate-50 to-white border border-gray-200 rounded-3xl p-8 lg:p-10">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl lg:text-3xl font-light text-gray-900 mb-4">Schedule Your Free Assessment</h2>
                    <p className="text-gray-600 leading-relaxed">Professional hail damage inspection with insurance claim assistance</p>
                    <div className="flex items-center justify-center mt-4">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
                        <Clock className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-sm text-emerald-600 font-medium">Usually responds within 2 hours</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className="h-12 rounded-xl border-gray-200"
                        required
                      />
                      <Input
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className="h-12 rounded-xl border-gray-200"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        className={`h-12 rounded-xl border-gray-200 ${formData.email && !validateEmail(formData.email) ? 'border-red-500' : validateEmail(formData.email) ? 'border-emerald-500' : ''}`}
                        required
                      />
                      {formData.email && (
                        validateEmail(formData.email) ? (
                          <p className="text-emerald-600 text-sm">✓ Email verified</p>
                        ) : (
                          <p className="text-red-500 text-sm flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Please enter a valid email address from a recognized provider
                          </p>
                        )
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(405) 555-0123"
                        className={`h-12 rounded-xl border-gray-200 ${formData.phone && !validatePhone(formData.phone) ? 'border-red-500' : validatePhone(formData.phone) ? 'border-emerald-500' : ''}`}
                        required
                      />
                      {formData.phone && (
                        validatePhone(formData.phone) ? (
                          <p className="text-emerald-600 text-sm">✓ Phone verified</p>
                        ) : (
                          <p className="text-red-500 text-sm flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Please enter a valid 10-digit US phone number
                          </p>
                        )
                      )}
                    </div>
                    
                    <div>
                      <Input
                        placeholder="Property Address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className={`h-12 rounded-xl border-gray-200 ${errors.address ? "border-red-500" : ""}`}
                        required
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                      )}
                    </div>
                    
                    <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
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
                      className="rounded-xl border-gray-200"
                    />

                    <Button
                      type="button"
                      onClick={() => window.location.href = '/#contact'}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-medium rounded-xl"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule Free Assessment
                    </Button>
                  </form>

                  <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-4">Need immediate assistance?</p>
                    <Button
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 py-3"
                      onClick={() => window.open("tel:(405)902-1826")}
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      Emergency: (405) 902-1826
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}