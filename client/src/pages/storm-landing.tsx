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

interface StormData {
  date_of_loss: string;      // {{DOL}}
  affected_city: string;     // {{X}}
  storm_type: string;        // {{S}}
  hail_size: string;         // {{HS}}
  is_hail_event: boolean;    // {{HH}}
  is_tornado_event: boolean; // {{T}}
  hail_less_than_1_5: boolean; // {{HS_less_than_1_5}}
  event_details: string;
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

interface BusinessPhoto {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
}

export default function StormLanding() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [stormData, setStormData] = useState<StormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noStormData, setNoStormData] = useState(false);
  
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
    // Fetch latest storm data from NOAA
    const fetchStormData = async () => {
      try {
        setLoading(true);
        console.log('Fetching real-time storm data from NOAA...');
        
        const response = await fetch('/api/storm-data/latest');
        const result = await response.json();
        
        if (result.success && result.hasStorm && result.data) {
          console.log('Storm data loaded:', result.data);
          setStormData(result.data);
          setNoStormData(false);
        } else {
          console.log('No recent storms found:', result.message);
          setNoStormData(true);
        }
      } catch (error) {
        console.error('Error fetching storm data:', error);
        setNoStormData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStormData();
  }, [location]);

  // Fetch Google Business Profile reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch recent business photos/projects
  const { data: projectsData } = useQuery({
    queryKey: ['/api/business-photos'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

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
        description: "Please try again or call us directly at (405) 902-5266",
        variant: "destructive",
      });
    },
  });

  // Form validation and handlers (same as dynamic landing)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return emailRegex.test(email) && 
           !email.includes('+') && 
           email.length <= 50 &&
           (commonDomains.includes(domain) || domain?.includes('.com') || domain?.includes('.net') || domain?.includes('.org'));
  };

  const validatePhone = (phone: string): boolean => {
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length === 10 && !['0000000000', '1111111111', '1234567890'].includes(phoneDigits);
  };

  const formatPhoneNumber = (value: string): string => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return phoneNumber;
  };

  const filterContent = (text: string): boolean => {
    const bannedWords = ['spam', 'test123', 'asdf', 'qwerty', 'fake', 'scam', 'viagra', 'casino'];
    const suspiciousPatterns = [
      /(.)\1{4,}/g,
      /^[A-Z\s!]{20,}$/g,
      /\b(click here|free money|act now|limited time|urgent)\b/gi,
      /http[s]?:\/\//gi
    ];
    
    const lowerText = text.toLowerCase();
    return !bannedWords.some(word => lowerText.includes(word)) && 
           !suspiciousPatterns.some(pattern => pattern.test(text)) &&
           text.length >= 10;
  };

  const searchOklahomaAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    try {
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

  const isSlotAvailable = (date: string, time: string): boolean => {
    const slotKey = `${date}-${time}`;
    return !bookedSlots.includes(slotKey);
  };

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
    
    const appointmentError = validateAppointmentTimes();
    if (appointmentError) {
      newErrors.dates = appointmentError;
    } else {
      delete newErrors.dates;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
    
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading latest storm information...</h2>
          <p className="text-gray-500 mt-2">Fetching real-time data from NOAA</p>
        </div>
      </div>
    );
  }

  if (noStormData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Recent Storms</h2>
          <p className="text-gray-600 mb-6">Great news! No significant storms have been reported in Oklahoma recently.</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Visit Our Main Site
          </Button>
        </div>
      </div>
    );
  }

  if (!stormData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Unable to load storm data</h2>
          <p className="text-gray-500 mt-2">Please try again later or contact us directly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-emerald-600">Sigma Roofing LLC</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="h-5 w-5 text-emerald-600" />
              <span className="text-lg font-semibold text-gray-900">(405) 902-5266</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Thank You for visiting us today!
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-left mb-8">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              In light of the recent <strong>{stormData.storm_type}</strong> on <strong>{stormData.date_of_loss}</strong> in <strong>{stormData.affected_city}</strong> that swept through your area, we know you are concerned and we are here to help.
            </p>

            {stormData.hail_less_than_1_5 ? (
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Hail in this size range may seem minor — and sometimes it is. But prolonged storms or repeated impacts can strip protective granules from shingles, silently shaving years off your roof's lifespan. Even "smaller" hail can leave behind costly, hidden damage.
              </p>
            ) : (
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Storms like this bring serious risk — not just to your roof, but to the safety, comfort, and value of your home. Severe impacts often fracture shingles, dislodge flashing, and void warranties — damage that can go unseen until it becomes a major problem.
              </p>
            )}

            {stormData.is_hail_event && stormData.hail_size && (
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Hailstones as large as <strong>{stormData.hail_size}</strong> were reported in your area. This level of impact is known to crack shingles, dent metal panels, and cause leaks that may not show until months later.
              </p>
            )}

            {stormData.is_tornado_event && (
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Winds from this <strong>{stormData.storm_type}</strong> event damaged homes directly in its path — and even nearby structures saw uplifted shingles, fallen limbs, and structural stress. If you're within range, your roof may be more vulnerable than it appears.
              </p>
            )}

            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Our expertise is at your disposal in managing any damages — verified or potential — and ensuring the safety of your home.
            </p>

            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Whether you need immediate tarping or just a roof inspection, we have experts ready to put your mind back at ease.
            </p>

            {/* Contact Form */}
            <div className="mt-8">
              <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">🔍 Schedule Your Free Roof Assessment</h3>
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
                          className={`mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${errors.email ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${errors.phone ? 'border-red-500' : ''}`}
                          placeholder="(405) 555-0123"
                          required
                        />
                        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
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
                        className={`mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${errors.description ? 'border-red-500' : ''}`}
                        placeholder={`Tell us about the ${stormData.storm_type} damage you've noticed...`}
                        rows={4}
                        required
                      />
                      {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
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
              {reviewsData.reviews.slice(0, 3).map((review: Review, index: number) => (
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
        {projectsData?.success && projectsData?.photos && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Storm Restoration Projects</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                See how we've helped Oklahoma homeowners recover from storm damage with professional roofing solutions.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsData.photos.slice(0, 6).map((project: BusinessPhoto) => (
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
            Emergency: (405) 902-5266
          </Button>
        </div>

        {/* Data Source Indicator */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <strong>Storm Data Source:</strong> Real-time data from NOAA Storm Events Database | Generated: {new Date(stormData.generated_at).toLocaleString()}
        </div>
      </main>
    </div>
  );
}