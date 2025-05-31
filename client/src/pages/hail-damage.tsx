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

  // Load active hail damage content with daily rotation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phrase = urlParams.get('phrase');
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      // If still loading after 10 seconds, show default content
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
          // API failed - show default content to prevent infinite loading
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
        // Error occurred - show default content to prevent infinite loading
        setHailData({
          city: "Oklahoma City",
          date_of_loss: "Recent Storm Event",
          hail_size: "2.5\"",
          damage_likely: true,
          verified: true
        });
      });
  }, []);

  // Fetch Google Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['/api/reviews'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted Successfully",
        description: "We'll contact you within 2 hours to schedule your free inspection.",
      });
      // Reset form
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
      setErrors({});
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or call us directly at (405) 902-1826",
        variant: "destructive",
      });
    }
  });

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Property address is required";
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Phone validation
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Form Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate(formData);
  };

  const updateFormData = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
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
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BBAV Roofing LLC</h1>
                <p className="text-sm text-gray-600">Licensed & Insured</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-emerald-600">(405) 902-1826</p>
              <p className="text-sm text-gray-600">24/7 Emergency Service</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24">
          {/* Alert Banner */}
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
                    Recent {hailData.hail_size}" hail event on {hailData.date_of_loss} may have damaged roofs in your area. 
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
            {/* Left Column - Information */}
            <div className="lg:col-span-3 space-y-16">
              {/* Hail Damage Info */}
              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-light text-gray-900">Why {hailData.hail_size}" Hail Matters</h2>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-8">
                  <p className="text-lg text-amber-800 font-medium leading-relaxed">
                    Hail {hailData.hail_size}" and larger typically causes significant roof damage that qualifies for insurance replacement.
                  </p>
                </div>
                
                <div className="grid gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Free Professional Inspection</h3>
                      <p className="text-gray-600">Our certified inspectors will assess all damage and document findings for your insurance claim.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Time-Sensitive Claims</h3>
                      <p className="text-gray-600">Most insurance policies require claims to be filed within one year of the damage date.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Insurance Claim Assistance</h3>
                      <p className="text-gray-600">We work directly with your insurance company to ensure your claim is properly documented and processed.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Reviews */}
              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-light text-gray-900">What Our Customers Say</h2>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {reviews.slice(0, 3).map((review: any, index: number) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 font-semibold">{review.initials}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{review.name}</h4>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 mb-2">"{review.review}"</p>
                            <p className="text-sm text-gray-500">{review.date}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-2">
              <div className="sticky top-8">
                <Card className="border-0 shadow-xl bg-white">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Storm Damage Inspection</h3>
                      <p className="text-gray-600">Get your roof assessed by certified professionals</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => updateFormData('firstName', e.target.value)}
                            className={errors.firstName ? 'border-red-500' : ''}
                          />
                          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => updateFormData('lastName', e.target.value)}
                            className={errors.lastName ? 'border-red-500' : ''}
                          />
                          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <Label htmlFor="address">Property Address *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => updateFormData('address', e.target.value)}
                          className={errors.address ? 'border-red-500' : ''}
                          placeholder="Street address, City, State"
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                      </div>

                      <div>
                        <Label htmlFor="serviceType">Service Needed</Label>
                        <Select value={formData.serviceType} onValueChange={(value) => updateFormData('serviceType', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Storm Damage Assessment">Storm Damage Assessment</SelectItem>
                            <SelectItem value="Insurance Claim Support">Insurance Claim Support</SelectItem>
                            <SelectItem value="Roof Replacement">Roof Replacement</SelectItem>
                            <SelectItem value="Emergency Repairs">Emergency Repairs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">Additional Details</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => updateFormData('description', e.target.value)}
                          placeholder="Describe any visible damage or concerns..."
                          rows={3}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={submitMutation.isPending}
                      >
                        {submitMutation.isPending ? 'Submitting...' : 'Schedule Free Inspection'}
                      </Button>

                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">Or call us directly:</p>
                        <a href="tel:4059021826" className="text-lg font-semibold text-emerald-600 hover:text-emerald-700">
                          (405) 902-1826
                        </a>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}