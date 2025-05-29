import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, CheckCircle, ArrowRight, Mail, MapPin, Send, Calendar, Clock, ShieldCheck, AlertTriangle, Star } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PhraseData {
  phrase_id: string;
  phrase: string;
  city: string;
  storm_type: string;
  storm_date: string;
  hail_size: string;
  generated_at: string;
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

interface ValidationErrors {
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  dates?: string;
}

interface AddressSuggestion {
  formatted_address: string;
  place_id: string;
}

interface Review {
  name: string;
  role: string;
  rating: number;
  review: string;
  date: string;
  initials: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  location: string;
}

export default function DynamicLanding() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [phraseData, setPhraseData] = useState<PhraseData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Contact form state
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
    preferredTime2: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Available time slots for appointments
  const availableTimeSlots = [
    "8:00 AM - 12:00 PM",
    "12:00 PM - 4:00 PM", 
    "4:00 PM - 7:00 PM"
  ];

  useEffect(() => {
    // Extract phrase_id from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const phraseId = urlParams.get('phrase_id') || '001';

    // Trending phrases data (embedded for testing)
    const trendingData = {
      "001": {
        "phrase_id": "001",
        "phrase": "hail damage roof inspection oklahoma city",
        "city": "Oklahoma City",
        "storm_type": "hailstorm",
        "storm_date": "January 21, 2025",
        "hail_size": "golf-ball",
        "generated_at": "2025-01-28T23:10:00"
      },
      "002": {
        "phrase_id": "002",
        "phrase": "tornado roof damage edmond oklahoma",
        "city": "Edmond",
        "storm_type": "tornado",
        "storm_date": "January 20, 2025",
        "hail_size": "",
        "generated_at": "2025-01-28T23:10:00"
      },
      "003": {
        "phrase_id": "003",
        "phrase": "storm damage roof repair moore",
        "city": "Moore",
        "storm_type": "storm",
        "storm_date": "January 19, 2025",
        "hail_size": "quarter-sized",
        "generated_at": "2025-01-28T23:10:00"
      },
      "004": {
        "phrase_id": "004",
        "phrase": "roof leak repair norman oklahoma",
        "city": "Norman",
        "storm_type": "severe weather",
        "storm_date": "January 18, 2025",
        "hail_size": "",
        "generated_at": "2025-01-28T23:10:00"
      },
      "005": {
        "phrase_id": "005",
        "phrase": "windstorm roof damage tulsa",
        "city": "Tulsa",
        "storm_type": "windstorm",
        "storm_date": "January 17, 2025",
        "hail_size": "tennis-ball",
        "generated_at": "2025-01-28T23:10:00"
      }
    };

    const selectedPhrase = trendingData[phraseId];
    if (selectedPhrase) {
      setPhraseData(selectedPhrase);
    } else {
      // Fallback to first entry if phrase_id not found
      setPhraseData(trendingData["001"]);
    }
    setLoading(false);
  }, [location]);

  // Fetch Google Business Profile reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Use the same project data as your main page
  const [projectsData, setProjectsData] = useState<Project[]>([]);

  useEffect(() => {
    // Load projects from localStorage (same as main page)
    const staticProjects = [
      {
        id: 1,
        title: "GAF - Pewter Gray",
        description: "A beautiful roof with grayish blue hues complimented with black gutters all around and ridge vent to keep the attic properly ventilated. This roof suffered hail damage and was replaced as part of a larger project.",
        imageUrl: "https://res.cloudinary.com/sigma-roofing/image/upload/v1700000001/projects/gaf-pewter-gray.jpg",
        category: "Storm Damage",
        location: "Edmond, OK"
      },
      {
        id: 2,
        title: "Project 2",
        description: "Custom project managed through admin panel",
        imageUrl: "https://res.cloudinary.com/sigma-roofing/image/upload/v1700000002/projects/project-2.jpg",
        category: "Admin Project",
        location: "Oklahoma City, OK"
      },
      {
        id: 3,
        title: "Project 3",
        description: "Professional roofing installation with quality materials and expert craftsmanship.",
        imageUrl: "https://res.cloudinary.com/sigma-roofing/image/upload/v1700000003/projects/project-3.jpg",
        category: "New Installation",
        location: "Moore, OK"
      },
      {
        id: 4,
        title: "Project 4",
        description: "Storm damage restoration with insurance claim assistance and emergency repairs.",
        imageUrl: "https://res.cloudinary.com/sigma-roofing/image/upload/v1700000004/projects/project-4.jpg",
        category: "Insurance Claim",
        location: "Norman, OK"
      }
    ];

    // Check for admin-managed projects
    let hasAnyProjects = false;
    const projectKeys = ['project1', 'project2', 'project3', 'project4', 'project5', 'project6'];
    const customProjects: Project[] = [];

    projectKeys.forEach((key, index) => {
      const savedProject = localStorage.getItem(`project_${key}`);
      if (savedProject) {
        try {
          const projectData = JSON.parse(savedProject);
          if (projectData.imageUrl) {
            customProjects.push({
              id: index + 1,
              title: projectData.title || `Project ${index + 1}`,
              description: projectData.description || 'Custom project managed through admin panel',
              imageUrl: projectData.imageUrl,
              category: projectData.category || 'Admin Project',
              location: projectData.location || 'Oklahoma'
            });
            hasAnyProjects = true;
          }
        } catch (error) {
          console.log('Error loading project:', key);
        }
      }
    });

    // Use admin projects if available, otherwise use static projects
    setProjectsData(hasAnyProjects ? customProjects : staticProjects);
  }, []);

  // Contact form submission
  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "We'll contact you within 24 hours to schedule your free estimate.",
      });
      // Reset form
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
        preferredTime2: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: "Please try again or call us directly at (405) 902-1826",
        variant: "destructive",
      });
    },
  });

  // Email validation - strict for lead quality
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return emailRegex.test(email) && 
           !email.includes('+') && 
           email.length <= 50 &&
           (commonDomains.includes(domain) || domain?.includes('.com') || domain?.includes('.net') || domain?.includes('.org'));
  };

  // Phone validation (US format only)
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

  // Content filtering for spam and inappropriate content
  const filterContent = (text: string): boolean => {
    const bannedWords = ['spam', 'test123', 'asdf', 'qwerty', 'fake', 'scam', 'viagra', 'casino'];
    const suspiciousPatterns = [
      /(.)\1{4,}/g, // Repeated characters like "aaaaaaa"
      /^[A-Z\s!]{20,}$/g, // All caps long text
      /\b(click here|free money|act now|limited time|urgent)\b/gi, // Spam phrases
      /http[s]?:\/\//gi // URLs
    ];
    
    const lowerText = text.toLowerCase();
    return !bannedWords.some(word => lowerText.includes(word)) && 
           !suspiciousPatterns.some(pattern => pattern.test(text)) &&
           text.length >= 10; // Minimum description length
  };

  // Google Places Autocomplete for Oklahoma addresses
  const searchOklahomaAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    try {
      // Call our backend API to get address suggestions
      const response = await fetch(`/api/address-suggestions?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions) {
          setAddressSuggestions(data.suggestions);
          setShowAddressSuggestions(data.suggestions.length > 0);
        }
      }
    } catch (error) {
      console.log('Address validation temporarily unavailable');
      setShowAddressSuggestions(false);
    }
  };

  // Check if time slot is available (simulate booking system)
  const isSlotAvailable = (date: string, time: string): boolean => {
    const slotKey = `${date}-${time}`;
    return !bookedSlots.includes(slotKey);
  };

  // Validate appointment times don't overlap and are available
  const validateAppointmentTimes = (): string | null => {
    if (formData.preferredDate1 === formData.preferredDate2 && 
        formData.preferredTime1 === formData.preferredTime2 &&
        formData.preferredDate1 && formData.preferredTime1) {
      return "Please select different time slots for your preferred appointments";
    }
    
    if (formData.preferredDate1 && formData.preferredTime1) {
      if (!isSlotAvailable(formData.preferredDate1, formData.preferredTime1)) {
        return "Your first preferred time slot is already booked. Please select another time.";
      }
    }
    
    if (formData.preferredDate2 && formData.preferredTime2) {
      if (!isSlotAvailable(formData.preferredDate2, formData.preferredTime2)) {
        return "Your second preferred time slot is already booked. Please select another time.";
      }
    }
    
    return null;
  };

  // Real-time validation as user types
  const validateField = (field: keyof ContactForm, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (value && !validateEmail(value)) {
          newErrors.email = "Please enter a valid email address from a recognized provider";
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (value && !validatePhone(value)) {
          newErrors.phone = "Please enter a valid 10-digit US phone number";
        } else {
          delete newErrors.phone;
        }
        break;
      case 'address':
        if (value && !value.toLowerCase().includes('oklahoma') && !value.toLowerCase().includes('ok')) {
          newErrors.address = "We currently only serve properties in Oklahoma";
        } else {
          delete newErrors.address;
        }
        break;
      case 'description':
        if (value && !filterContent(value)) {
          newErrors.description = "Please provide a detailed, professional description of your roofing needs";
        } else {
          delete newErrors.description;
        }
        break;
    }
    
    // Check appointment conflicts
    const appointmentError = validateAppointmentTimes();
    if (appointmentError) {
      newErrors.dates = appointmentError;
    } else {
      delete newErrors.dates;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    // Format phone number
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
    
    // Address autocomplete
    if (field === 'address') {
      searchOklahomaAddresses(value);
    }
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({ ...prev, address: suggestion.formatted_address }));
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    validateField('address', suggestion.formatted_address);
  };

  const isFormValid = (): boolean => {
    return (
      formData.firstName.length >= 2 &&
      formData.lastName.length >= 2 &&
      validateEmail(formData.email) &&
      validatePhone(formData.phone) &&
      formData.address.length >= 10 &&
      formData.serviceType !== "" &&
      formData.description.length >= 10 &&
      formData.preferredDate1 !== "" &&
      formData.preferredTime1 !== ""
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      contactMutation.mutate(formData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sigma-emerald mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storm damage information...</p>
        </div>
      </div>
    );
  }

  if (!phraseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Storm Damage Information Not Found</h1>
          <p className="text-gray-600 mb-8">The requested storm information could not be loaded.</p>
          <Button onClick={() => window.location.href = '/'} className="bg-sigma-emerald hover:bg-emerald-600">
            Return to Home Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-sigma-emerald">Sigma Roofing</div>
          <div className="flex items-center space-x-4">
            <a href="tel:(405)902-1826" className="flex items-center text-sigma-emerald font-semibold">
              <Phone className="h-4 w-4 mr-2" />
              (405) 902-1826
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Dynamic Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              {phraseData.storm_type === 'severe weather' 
                ? `Storm in ${phraseData.city}? We're Here to Help.`
                : `${phraseData.storm_type.charAt(0).toUpperCase() + phraseData.storm_type.slice(1)} in ${phraseData.city} on ${phraseData.storm_date}? We're Here to Help.`
              }
            </h1>
            
            <div className="bg-white rounded-lg shadow-lg p-8 text-left mb-8">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Thanks for visiting us today. The {phraseData.storm_type} that hit {phraseData.city} on {phraseData.storm_date} caused widespread damage — weakening roofs even when leaks aren't immediately visible. Whether you have shingles, metal, or tile, exposure to {phraseData.hail_size ? `${phraseData.hail_size} hail or ` : ''}wind can void warranties, trigger insurance issues, or accelerate failure.
              </p>

              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Whether you're dealing with <a href="#qa-claim-denied" className="text-sigma-emerald font-semibold hover:underline">a denied claim</a>, <a href="#qa-should-call" className="text-sigma-emerald font-semibold hover:underline">unsure whether to call insurance</a>, or <a href="#qa-signs-of-damage" className="text-sigma-emerald font-semibold hover:underline">need to confirm roof damage</a> — you're in the right place.
              </p>

              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                We specialize in local storm restoration, no-pressure roof inspections, and expert help navigating both insurance and retail solutions.
              </p>

              {/* Contact Form */}
              <div className="mt-8">
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Your Free Storm Damage Assessment</h3>
                      <p className="text-gray-600">Submit your information and we'll contact you within 24 hours</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name *</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name *</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Contact Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email" className="text-gray-700 font-medium">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="(405) 555-0123"
                            required
                          />
                        </div>
                      </div>

                      {/* Address with Autocomplete */}
                      <div className="relative">
                        <Label htmlFor="address" className="text-gray-700 font-medium">Property Address *</Label>
                        <div className="relative">
                          <Input
                            id="address"
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className={`mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${errors.address ? 'border-red-500' : ''}`}
                            placeholder="Start typing your Oklahoma address..."
                            required
                          />
                          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 mt-0.5" />
                        </div>
                        
                        {/* Address Suggestions Dropdown */}
                        {showAddressSuggestions && addressSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {addressSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                onClick={() => handleAddressSelect(suggestion)}
                              >
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                                  <span className="text-gray-800">{suggestion.formatted_address}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {errors.address && (
                          <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                        )}
                      </div>

                      {/* Service Type */}
                      <div>
                        <Label htmlFor="serviceType" className="text-gray-700 font-medium">Type of Service Needed *</Label>
                        <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                          <SelectTrigger className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="storm-damage">Storm Damage Assessment</SelectItem>
                            <SelectItem value="roof-repair">Roof Repair</SelectItem>
                            <SelectItem value="roof-replacement">Roof Replacement</SelectItem>
                            <SelectItem value="roof-inspection">Roof Inspection</SelectItem>
                            <SelectItem value="gutter-service">Gutter Services</SelectItem>
                            <SelectItem value="painting">Exterior Painting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      <div>
                        <Label htmlFor="description" className="text-gray-700 font-medium">Describe Your Roofing Needs *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                          placeholder={`Tell us about the ${phraseData?.storm_type || 'storm'} damage you've noticed...`}
                          rows={4}
                          required
                        />
                      </div>

                      {/* Appointment Preferences */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Calendar className="mr-2 h-5 w-5 text-emerald-600" />
                          Preferred Appointment Times
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="preferredDate1" className="text-gray-700 font-medium">First Choice Date *</Label>
                            <Input
                              id="preferredDate1"
                              type="date"
                              value={formData.preferredDate1}
                              onChange={(e) => handleInputChange('preferredDate1', e.target.value)}
                              className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                              min={today}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="preferredTime1" className="text-gray-700 font-medium">First Choice Time Block *</Label>
                            <Select value={formData.preferredTime1} onValueChange={(value) => handleInputChange('preferredTime1', value)}>
                              <SelectTrigger className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                                <SelectValue placeholder="Select time block" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTimeSlots.map((slot) => {
                                  const isBooked = formData.preferredDate1 && !isSlotAvailable(formData.preferredDate1, slot);
                                  return (
                                    <SelectItem 
                                      key={slot} 
                                      value={slot}
                                      disabled={isBooked}
                                      className={isBooked ? "text-gray-400" : ""}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>{slot}</span>
                                        {isBooked && <span className="text-red-500 text-xs ml-2">(Booked)</span>}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="preferredDate2" className="text-gray-700 font-medium">Second Choice Date</Label>
                            <Input
                              id="preferredDate2"
                              type="date"
                              value={formData.preferredDate2}
                              onChange={(e) => handleInputChange('preferredDate2', e.target.value)}
                              className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                              min={today}
                            />
                          </div>
                          <div>
                            <Label htmlFor="preferredTime2" className="text-gray-700 font-medium">Second Choice Time Block</Label>
                            <Select value={formData.preferredTime2} onValueChange={(value) => handleInputChange('preferredTime2', value)}>
                              <SelectTrigger className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                                <SelectValue placeholder="Select time block" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTimeSlots.map((slot) => {
                                  const isBooked = formData.preferredDate2 && !isSlotAvailable(formData.preferredDate2, slot);
                                  const isDuplicate = formData.preferredDate1 === formData.preferredDate2 && formData.preferredTime1 === slot;
                                  const isDisabled = isBooked || isDuplicate;
                                  
                                  return (
                                    <SelectItem 
                                      key={slot} 
                                      value={slot}
                                      disabled={isDisabled}
                                      className={isDisabled ? "text-gray-400" : ""}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>{slot}</span>
                                        {isBooked && <span className="text-red-500 text-xs ml-2">(Booked)</span>}
                                        {isDuplicate && !isBooked && <span className="text-orange-500 text-xs ml-2">(Already selected)</span>}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Show appointment conflict error */}
                        {errors.dates && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-800 text-sm flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              {errors.dates}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-semibold shadow-lg"
                        disabled={!isFormValid() || contactMutation.isPending}
                      >
                        {contactMutation.isPending ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Schedule My Free Assessment
                          </>
                        )}
                      </Button>

                      {/* Trust Indicators */}
                      <div className="flex items-center justify-center space-x-6 pt-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 mr-1" />
                          Licensed #80006734
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mr-1" />
                          Fully Insured
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Why Choose Us - Storm Specific */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-800">Storm Specialists</h3>
                <p className="text-gray-600">Experienced with {phraseData.city} weather patterns and common storm damage types.</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-800">Insurance Experts</h3>
                <p className="text-gray-600">We help navigate insurance claims and ensure you get fair coverage for storm damage.</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="text-white" size={32} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-800">Local & Licensed</h3>
                <p className="text-gray-600">Oklahoma licensed contractors who understand local building codes and requirements.</p>
              </CardContent>
            </Card>
          </div>

          {/* Google Reviews Section */}
          {reviewsData?.success && reviewsData?.reviews && (
            <div className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-6 w-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    {reviewsData.businessRating}/5.0 ({reviewsData.totalReviews} reviews)
                  </span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviewsData.reviews.slice(0, 6).map((review: Review, index: number) => (
                  <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{review.initials}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{review.name}</h4>
                            <div className="flex">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{review.role}</p>
                          <p className="text-gray-700 leading-relaxed">{review.review}</p>
                          <p className="text-gray-500 text-sm mt-2">{review.date}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Projects Section */}
          {projectsData && (
            <div className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Storm Restoration Projects</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  See how we've helped Oklahoma homeowners recover from storm damage with professional roofing solutions.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectsData.slice(0, 6).map((project: Project) => (
                  <Card key={project.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow group">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img 
                        src={project.imageUrl} 
                        alt={project.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {project.category}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{project.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{project.location}</p>
                      <p className="text-gray-600">{project.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          <div className="bg-red-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Emergency Storm Damage?</h2>
            <p className="text-xl mb-6">If you have immediate safety concerns or active leaks, call us now for emergency services.</p>
            <Button
              size="lg"
              className="bg-white text-red-600 hover:bg-gray-100 text-xl px-8 py-4 font-bold"
              onClick={() => window.open("tel:(405)902-1826")}
            >
              <Phone className="mr-2 h-5 w-5" />
              Emergency: (405) 902-1826
            </Button>
          </div>

          {/* Debug Info (remove in production) */}
          <div className="mt-8 bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
            <strong>Page Data:</strong> Showing results for "{phraseData.phrase}" | City: {phraseData.city} | Storm: {phraseData.storm_type} | Date: {phraseData.storm_date}
          </div>
        </div>
      </main>
    </div>
  );
}