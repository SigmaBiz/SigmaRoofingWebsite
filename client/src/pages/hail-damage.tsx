import { useState, useEffect } from "react";
import { Calendar, MapPin, Phone, Star, AlertTriangle, Shield, Clock, CheckCircle, Mail } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [hailData, setHailData] = useState({
    city: "Oklahoma City",
    date_of_loss: new Date().toLocaleDateString(),
    hail_size: "2.5",
    damage_likely: true,
    verified: false
  });

  // Sample reviews data
  const reviews: Review[] = [
    {
      name: "Sarah Johnson",
      role: "Homeowner",
      rating: 5,
      review: "BBAV Roofing did an amazing job after the hail storm. They handled everything with our insurance company and the new roof looks fantastic!",
      date: "2 weeks ago",
      initials: "SJ"
    },
    {
      name: "Mike Chen",
      role: "Property Manager",
      rating: 5,
      review: "Professional, timely, and fair pricing. They completed our roof replacement ahead of schedule and the quality is excellent.",
      date: "1 month ago",
      initials: "MC"
    },
    {
      name: "Lisa Rodriguez",
      role: "Homeowner",
      rating: 5,
      review: "The team was courteous and cleaned up perfectly after the job. Highly recommend for any roofing needs!",
      date: "3 weeks ago",
      initials: "LR"
    }
  ];

  // EXACT validation functions from your working validation test
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    const allowedDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'protonmail.com', 'live.com', 'msn.com', 'comcast.net',
      'verizon.net', 'sbcglobal.net', 'att.net', 'cox.net', 'charter.net'
    ];
    
    return allowedDomains.includes(domain);
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10;
  };

  // Load hail damage data
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setHailData({
        city: "Oklahoma City",
        date_of_loss: "Recent Storm Event",
        hail_size: "2.5\"",
        damage_likely: true,
        verified: true
      });
    }, 2000);
    
    return () => clearTimeout(loadingTimeout);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Property address is required";
    
    // Enhanced email validation using your exact validation logic
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Invalid email or domain not allowed";
    }
    
    // Enhanced phone validation using your exact validation logic
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission attempted');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      console.log('Validation errors:', errors);
      setSubmitMessage({
        type: 'error',
        text: 'Please fill in all required fields correctly.'
      });
      return;
    }
    
    console.log('Form validation passed');
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      console.log('Simulating API call...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('API call successful');
      setSubmitMessage({
        type: 'success',
        text: "Request submitted successfully! We'll contact you within 2 hours to schedule your free inspection."
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
      
    } catch (error) {
      console.log('API call failed:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Submission failed. Please try again or call us directly at (405) 902-5266'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof ContactForm, value: string) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    // Clear submit message when user starts typing
    if (submitMessage) {
      setSubmitMessage(null);
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
              <p className="text-lg font-semibold text-emerald-600">(405) 902-5266</p>
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
                  {reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="border-0 shadow-sm bg-gray-50 rounded-lg">
                      <div className="p-6">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-2">
              <div className="sticky top-8">
                <div className="border-0 shadow-xl bg-white rounded-lg">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Storm Damage Inspection</h3>
                      <p className="text-gray-600">Get your roof assessed by certified professionals</p>
                    </div>

                    {/* Submit Message */}
                    {submitMessage && (
                      <div className={`mb-6 p-4 rounded-lg ${
                        submitMessage.type === 'success' 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {submitMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2" htmlFor="firstName">First Name *</label>
                          <input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => updateFormData('firstName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              errors.firstName ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2" htmlFor="lastName">Last Name *</label>
                          <input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => updateFormData('lastName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              errors.lastName ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="email">Email Address *</label>
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          placeholder="test@gmail.com"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Value: "{formData.email}"</p>
                        {formData.email && (
                          validateEmail(formData.email) ? (
                            <p className="text-green-600 text-sm">✓ Valid email</p>
                          ) : (
                            <p className="text-red-500 text-sm">✗ Invalid email or domain not allowed</p>
                          )
                        )}
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="phone">Phone Number *</label>
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Value: "{formData.phone}"</p>
                        {formData.phone && (
                          validatePhone(formData.phone) ? (
                            <p className="text-green-600 text-sm">✓ Valid phone</p>
                          ) : (
                            <p className="text-red-500 text-sm">✗ Phone must be 10 digits</p>
                          )
                        )}
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="address">Property Address *</label>
                        <input
                          id="address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => updateFormData('address', e.target.value)}
                          placeholder="Street address, City, State"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="serviceType">Service Needed</label>
                        <select
                          id="serviceType"
                          value={formData.serviceType}
                          onChange={(e) => updateFormData('serviceType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="Storm Damage Assessment">Storm Damage Assessment</option>
                          <option value="Insurance Claim Support">Insurance Claim Support</option>
                          <option value="Roof Replacement">Roof Replacement</option>
                          <option value="Emergency Repairs">Emergency Repairs</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="description">Additional Details</label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => updateFormData('description', e.target.value)}
                          placeholder="Describe any visible damage or concerns..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition duration-200"
                      >
                        {isSubmitting ? 'Submitting...' : 'Schedule Free Inspection'}
                      </button>

                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">Or call us directly:</p>
                        <a href="tel:4059025266" className="text-lg font-semibold text-emerald-600 hover:text-emerald-700">
                          (405) 902-5266
                        </a>
                      </div>
                    </form>
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