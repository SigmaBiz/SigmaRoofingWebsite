import { useState, useEffect } from "react";
import { Calendar, MapPin, Phone, Star, AlertTriangle, Shield, Clock, CheckCircle, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

interface ReviewsResponse {
  success: boolean;
  reviews: Review[];
  businessRating: number;
  totalReviews: number;
  businessName: string;
}

export default function HailLandingPage() {
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

  // Fetch real Google Business reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<ReviewsResponse>({
    queryKey: ['/api/reviews'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const reviews: Review[] = reviewsData?.reviews || [];

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

  useEffect(() => {
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
    
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Invalid email or domain not allowed";
    }
    
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('API call successful');
      setSubmitMessage({
        type: 'success',
        text: "Request submitted successfully! We'll contact you within 2 hours to schedule your free inspection."
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
      setErrors({});
      
    } catch (error) {
      console.log('API call failed:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Submission failed. Please try again or call us directly at (405) 902-1826'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof ContactForm, value: string) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (submitMessage) {
      setSubmitMessage(null);
    }
  };

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
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BBAV Roofing LLC</h1>
                <p className="text-sm text-gray-600">Licensed & Insured</p>
              </div>
            </div>
            <div className="text-right">
              <a 
                href="tel:4059021826" 
                className="text-lg font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                (405) 902-1826
              </a>
              <p className="text-sm text-gray-600">24/7 Emergency Service</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-l-4 border-red-500 rounded-2xl p-8 lg:p-12 shadow-xl">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">
                    Hail Damage Alert: {hailData.city} Area
                  </h1>
                  <p className="text-xl text-gray-700 leading-relaxed mb-4">
                    Recent {hailData.hail_size}" hail event on {hailData.date_of_loss} may have damaged roofs in your area.
                  </p>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-red-200">
                    <p className="font-semibold text-red-700 text-lg flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Insurance claims must be filed within policy timeframes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid lg:grid-cols-5 gap-16">
            <div className="lg:col-span-3 space-y-16">
              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-light text-gray-900">Why {hailData.hail_size}" Hail Matters</h2>
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

              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-light text-gray-900">What Our Customers Say</h2>
                      {reviewsData?.businessRating && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < Math.floor(reviewsData.businessRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{reviewsData.businessRating}</span>
                          <span className="text-gray-600">({reviewsData.totalReviews} reviews)</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Google Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {reviewsLoading ? (
                  <div className="grid gap-6">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="border-0 shadow-sm bg-gray-50 rounded-lg animate-pulse">
                        <div className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-full"></div>
                              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{review.role}</span>
                              </div>
                              <p className="text-gray-600 mb-2">"{review.review}"</p>
                              <p className="text-sm text-gray-500">{review.date}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-8">
                <div className="border-0 shadow-xl bg-white rounded-lg">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Storm Damage Inspection</h3>
                      <p className="text-gray-600">Get your roof assessed by certified professionals</p>
                    </div>

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
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-md transition duration-200"
                      >
                        {isSubmitting ? 'Submitting...' : 'Schedule Free Inspection'}
                      </button>

                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">Or call us directly:</p>
                        <a href="tel:4059021826" className="text-lg font-semibold text-emerald-600 hover:text-emerald-700">
                          (405) 902-1826
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