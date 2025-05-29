import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, CheckCircle, ArrowRight, Mail, MapPin, Send, Calendar, Clock, ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
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

  // Form validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return emailRegex.test(email) && (commonDomains.includes(domain) || domain?.includes('.'));
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[\s\-\(\)]?[\d\s\-\(\)]{10,}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(phone) && cleanPhone.length >= 10;
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

                      {/* Address */}
                      <div>
                        <Label htmlFor="address" className="text-gray-700 font-medium">Property Address *</Label>
                        <Input
                          id="address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                          placeholder="123 Main Street, Oklahoma City, OK 73102"
                          required
                        />
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
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="preferredTime1" className="text-gray-700 font-medium">First Choice Time *</Label>
                            <Select value={formData.preferredTime1} onValueChange={(value) => handleInputChange('preferredTime1', value)}>
                              <SelectTrigger className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                                <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                                <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                                <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                                <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                                <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                                <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                                <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                                <SelectItem value="5:00 PM">5:00 PM</SelectItem>
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
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <Label htmlFor="preferredTime2" className="text-gray-700 font-medium">Second Choice Time</Label>
                            <Select value={formData.preferredTime2} onValueChange={(value) => handleInputChange('preferredTime2', value)}>
                              <SelectTrigger className="mt-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                                <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                                <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                                <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                                <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                                <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                                <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                                <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                                <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
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