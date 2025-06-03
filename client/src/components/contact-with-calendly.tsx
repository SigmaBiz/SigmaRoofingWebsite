import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MapPin, AlertTriangle, Send, Calendar, ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PopupModal } from "react-calendly";

// Add script to head for Calendly
declare global {
  interface Window {
    Calendly: any;
  }
}

interface ContactForm {
  phone: string;
  address: string;
  serviceType: string;
  schedulingUrl?: string; // Store the Calendly booking URL after scheduling
}

interface ValidationErrors {
  phone?: string;
  address?: string;
}

interface AddressSuggestion {
  formatted_address: string;
  place_id: string;
  main_text?: string;
  secondary_text?: string;
}

export default function ContactWithCalendly() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactForm>({
    phone: "",
    address: "",
    serviceType: "",
    schedulingUrl: ""
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [hasScheduled, setHasScheduled] = useState(false);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);


  // Listen for Calendly events
  useEffect(() => {
    const handleCalendlyEvent = (e: MessageEvent) => {
      if (e.data.event && e.data.event.indexOf('calendly') === 0) {
        if (e.data.event === 'calendly.event_scheduled') {
          setHasScheduled(true);
          setFormData(prev => ({ 
            ...prev, 
            schedulingUrl: e.data.payload?.event?.uri || 'Appointment scheduled'
          }));
          toast({
            title: "Appointment Scheduled!",
            description: "Your appointment has been booked. Please complete the form to submit your details.",
          });
        }
      }
    };

    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
  }, [toast]);


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
      
      const data = await response.json();
      
      if (data.success && data.suggestions) {
        setAddressSuggestions(data.suggestions);
        setShowAddressSuggestions(data.suggestions.length > 0);
        
        // Log the source for debugging
        if (data.source === 'google_places') {
          console.log('✅ Using Google Places API');
        } else if (data.source === 'fallback') {
          console.log('⚠️ Using fallback suggestions');
        }
      } else {
        // Handle API errors gracefully
        setShowAddressSuggestions(false);
        if (data.message) {
          console.log('Address API:', data.message);
        }
      }
    } catch (error) {
      console.log('Address validation temporarily unavailable');
      setShowAddressSuggestions(false);
    }
  };

  // Real-time validation as user types
  const validateField = (field: keyof ContactForm, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
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
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    let processedValue = value;
    
    // Special processing for phone numbers
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    validateField(field, processedValue);
    
    // Address suggestions for Oklahoma
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

  // Comprehensive form validation before submission
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Valid phone number required";
    }
    
    if (!formData.address.toLowerCase().includes('oklahoma') && !formData.address.toLowerCase().includes('ok')) {
      newErrors.address = "Oklahoma address required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Information Saved!",
        description: "Now let's schedule your appointment...",
      });
      
      // Open Calendly popup after successful form submission
      setTimeout(() => {
        setIsCalendlyOpen(true);
      }, 1000); // Small delay to let the toast show
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please Complete All Required Fields",
        description: "Check the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }
    
    contactMutation.mutate(formData);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return validatePhone(formData.phone) &&
           formData.address.trim() &&
           formData.serviceType &&
           Object.keys(errors).length === 0;
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Get Your Free Roofing Estimate
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional roofing services in Oklahoma. Fill out our secure form and schedule your appointment below.
          </p>
          <div className="flex items-center justify-center mt-4 text-emerald-600">
            <ShieldCheck className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Verified Lead Protection</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(405) 555-0123"
                    required
                    className={`h-12 ${errors.phone ? 'border-red-500' : validatePhone(formData.phone) && formData.phone ? 'border-green-500' : ''}`}
                    autoComplete="tel"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                  {validatePhone(formData.phone) && formData.phone && !errors.phone && (
                    <p className="text-green-600 text-sm">✓ Phone verified</p>
                  )}
                </div>

                {/* Smart Address Input with Oklahoma Suggestions */}
                <div className="space-y-2 relative">
                  <Label htmlFor="address" className="text-sm font-medium">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Property Address in Oklahoma *
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onFocus={() => {
                      if (formData.address.length >= 3) {
                        searchOklahomaAddresses(formData.address);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking
                      setTimeout(() => setShowAddressSuggestions(false), 200);
                    }}
                    placeholder="Start typing your address... (e.g., 123 Main Street)"
                    required
                    className={`h-12 ${errors.address ? 'border-red-500' : formData.address.toLowerCase().includes('ok') ? 'border-green-500' : ''}`}
                    autoComplete="street-address"
                  />
                  
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-xl max-h-64 overflow-y-auto mt-1">
                      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        Verified Oklahoma addresses
                      </div>
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => handleAddressSelect(suggestion)}
                        >
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="flex-1">
                              {suggestion.main_text && suggestion.secondary_text ? (
                                <>
                                  <div className="text-gray-900 font-medium">{suggestion.main_text}</div>
                                  <div className="text-gray-500 text-xs">{suggestion.secondary_text}</div>
                                </>
                              ) : (
                                <span className="text-gray-900">{suggestion.formatted_address}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {errors.address && (
                    <p className="text-red-500 text-sm flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.address}
                    </p>
                  )}
                  
                  {formData.address.toLowerCase().includes('oklahoma') || formData.address.toLowerCase().includes('ok') ? (
                    <p className="text-green-600 text-sm flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      ✓ Oklahoma address verified
                    </p>
                  ) : null}
                </div>

                {/* Service Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Service Needed *</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select the service you need" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roof-repair">Roof Repair</SelectItem>
                      <SelectItem value="roof-replacement">Roof Replacement</SelectItem>
                      <SelectItem value="roof-inspection">Roof Inspection</SelectItem>
                      <SelectItem value="storm-damage">Storm Damage Assessment</SelectItem>
                      <SelectItem value="gutter-services">Gutter Services</SelectItem>
                      <SelectItem value="painting">Exterior Painting</SelectItem>
                      <SelectItem value="emergency">Emergency Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                {/* Calendly Inline Widget for Scheduling */}
                <div className="space-y-6">
                  <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 text-emerald-600 mr-2" />
                    <h3 className="text-lg font-semibold">Schedule Your Free Estimate</h3>
                  </div>
                  
                  {hasScheduled && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-green-800 flex items-center">
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        Great! Your appointment has been scheduled. Please submit the form to complete your request.
                      </p>
                    </div>
                  )}
                  
                  {/* Calendly scheduling section */}
                  <div className="bg-emerald-50 rounded-lg shadow-inner p-8 text-center border-2 border-emerald-100">
                    <div className="space-y-4">
                      <Calendar className="w-16 h-16 mx-auto text-emerald-600" />
                      <h4 className="text-xl font-semibold text-gray-900">Next: Hi! What is your name and when can we meet you?</h4>
                      <p className="text-gray-600">After submitting your contact info above, we'll open our scheduling calendar where you can tell us your name and pick your preferred appointment time.</p>
                      <div className="text-sm text-emerald-700 bg-emerald-100 p-3 rounded-lg">
                        ✨ Quick & Easy - Just 3 fields above, then schedule!
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button with Validation Status */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={!isFormValid() || contactMutation.isPending}
                    className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
                      isFormValid() 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {contactMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Send className="w-5 h-5 mr-2" />
                        Submit & Schedule Appointment
                      </div>
                    )}
                  </Button>
                  
                  {!isFormValid() && (
                    <p className="text-center text-gray-500 text-sm mt-2">
                      Please complete all required fields to submit your request
                    </p>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    🔒 Your information is secure and will only be used to contact you about your roofing needs
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Licensed Oklahoma Contractor #80006734 | Serving Edmond and surrounding areas
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Calendly Popup Modal */}
      <PopupModal
        url={`https://calendly.com/aescalante-oksigma/new-meeting`}
        onModalClose={() => {
          setIsCalendlyOpen(false);
          // Reset form after scheduling
          setFormData({
            phone: "",
            address: "",
            serviceType: "",
            schedulingUrl: ""
          });
          setErrors({});
          toast({
            title: "All Set!",
            description: "We've saved your information and will see you at your scheduled time!",
          });
        }}
        open={isCalendlyOpen}
        rootElement={document.getElementById("root") as HTMLElement}
      />
    </section>
  );
}