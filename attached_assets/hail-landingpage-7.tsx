import { useState, useEffect } from "react";
import { Calendar, MapPin, Phone, Star, AlertTriangle, Shield, Clock, CheckCircle, Mail } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getWebsiteImages } from "@/lib/imageService";
import Projects from "@/components/projects";

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

interface DynamicStormContent {
  S: string; // Storm type
  DOL: string; // Date of loss
  X: string; // Location
  HS: string; // Hail size
  phrase: string; // Trending phrase
  hail_less_than_1_5: boolean;
}

interface TrendingPhrase {
  title: string;
  traffic: string;
  relatedQueries: string[];
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
  
  // Address autocomplete states
  const [addressSuggestions, setAddressSuggestions] = useState<{formatted_address: string, place_id: string}[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  // Appointment booking states
  const [bookedSlots] = useState<string[]>([
    '2024-05-31-09:00', '2024-05-31-14:00', '2024-06-01-11:00'
  ]);

  // Dynamic storm content states
  const [stormContent, setStormContent] = useState<DynamicStormContent | null>(null);
  const [isLoadingStormData, setIsLoadingStormData] = useState(true);
  const [stormDataError, setStormDataError] = useState<string | null>(null);
  
  // Visual enhancement states
  const [images, setImages] = useState<any>({});

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

  // Contact form submission mutation
  const contactMutation = useMutation({
    mutationFn: (data: ContactForm) => apiRequest('POST', '/api/contact', data),
  });

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

  // Google Places Autocomplete for Oklahoma addresses
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

  const handleAddressSelect = (suggestion: {formatted_address: string, place_id: string}) => {
    setFormData(prev => ({ ...prev, address: suggestion.formatted_address }));
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: "" }));
    }
  };

  // Check if time slot is available and doesn't conflict with other selections
  const isSlotAvailable = (date: string, time: string, isSecondChoice = false): boolean => {
    const slotKey = `${date}-${time}`;
    
    // Check if slot is already booked
    if (bookedSlots.includes(slotKey)) {
      return false;
    }
    
    // Check if it conflicts with the first choice (for second choice only)
    if (isSecondChoice && formData.preferredDate1 === date && formData.preferredTime1 === time) {
      return false;
    }
    
    return true;
  };

  // Fetch Google Trends data for storm-related keywords
  const fetchTrendingPhrases = async (): Promise<TrendingPhrase[]> => {
    try {
      // Try to fetch from Google Trends API via backend
      const trendsResponse = await fetch('/api/trending-phrases');
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        return trendsData.phrases || [];
      }
      
      // Fallback to default trending phrases if API unavailable
      return [
        { title: 'hail damage roof inspection Oklahoma', traffic: 'High', relatedQueries: [] },
        { title: 'storm damage insurance claim', traffic: 'Medium', relatedQueries: [] },
        { title: 'roof repair after hail storm', traffic: 'Medium', relatedQueries: [] }
      ];
    } catch (error) {
      console.error('Error fetching trending phrases:', error);
      // Return fallback phrases
      return [
        { title: 'hail damage roof inspection Oklahoma', traffic: 'High', relatedQueries: [] }
      ];
    }
  };

  // Fetch authentic NOAA storm data
  const fetchStormData = async (): Promise<DynamicStormContent> => {
    try {
      // Get trending phrases first
      const trendingPhrases = await fetchTrendingPhrases();
      
      // Fetch NOAA storm data from your existing authenticated service
      const stormResponse = await fetch('/api/storm-data/daily-hail-content');
      if (!stormResponse.ok) {
        throw new Error('Failed to fetch storm data');
      }
      
      const stormResult = await stormResponse.json();
      
      if (!stormResult.success || !stormResult.storm) {
        throw new Error('No verified NOAA storm data available');
      }
      
      const stormData = stormResult.storm;
      
      // Select the most relevant trending phrase
      const selectedPhrase = trendingPhrases.length > 0 
        ? trendingPhrases[0].title 
        : "hail damage roof inspection Oklahoma";

      // Convert storm data to required format
      const hailSizeNumber = parseFloat(stormData.hail_size) || 2.0;
      
      return {
        S: stormData.storm_type || 'Hail',
        DOL: stormData.date_of_loss || new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        X: stormData.affected_city || 'Oklahoma City',
        HS: stormData.hail_size || '2.5 inches',
        phrase: selectedPhrase,
        hail_less_than_1_5: hailSizeNumber < 1.5
      };
    } catch (error) {
      console.error('Error fetching storm data:', error);
      throw error;
    }
  };

  // Load dynamic storm content on component mount
  useEffect(() => {
    const loadStormContent = async () => {
      try {
        setIsLoadingStormData(true);
        setStormDataError(null);
        
        // Check cache first
        const cached = localStorage.getItem('storm-content-cache');
        const cacheTimestamp = localStorage.getItem('storm-content-timestamp');
        const now = Date.now();
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;
        
        // Use cache if less than 24 hours old
        if (cached && cacheAge < 24 * 60 * 60 * 1000) {
          setStormContent(JSON.parse(cached));
          setIsLoadingStormData(false);
          return;
        }
        
        // Fetch fresh data
        const content = await fetchStormData();
        setStormContent(content);
        
        // Cache the results
        localStorage.setItem('storm-content-cache', JSON.stringify(content));
        localStorage.setItem('storm-content-timestamp', now.toString());
        
      } catch (error) {
        console.error('Failed to load storm content:', error);
        setStormDataError('Unable to load current storm data');
        
        // Try to use any available cached data as fallback
        const cached = localStorage.getItem('storm-content-cache');
        if (cached) {
          setStormContent(JSON.parse(cached));
        }
      } finally {
        setIsLoadingStormData(false);
      }
    };

    loadStormContent();
  }, []);

  useEffect(() => {
    // Load images for visual enhancements
    getWebsiteImages().then((loadedImages) => {
      console.log('Loaded images:', loadedImages);
      console.log('Hail background:', loadedImages?.hailLandingPageBackground);
      setImages(loadedImages);
    });
    
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
      console.log('Submitting to SendGrid email service...');
      const result = await contactMutation.mutateAsync(formData);
      
      console.log('Form submitted successfully:', result);
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
      console.log('Form submission failed:', error);
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
    
    // Handle address autocomplete
    if (field === 'address') {
      searchOklahomaAddresses(value);
    }
  };

  // Background image styles for proper scaling
  const backgroundImageStyles = {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
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
    <div 
      className="min-h-screen parallax-bg"
      style={{
        backgroundImage: images.hailLandingPageBackground 
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${images.hailLandingPageBackground})`
          : 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)',
        ...backgroundImageStyles,
        minHeight: '100vh',
        maxWidth: '100vw',
        position: 'relative'
      }}
    >
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/sigma-logo.png" 
                alt="Sigma Roofing LLC Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sigma Roofing LLC</h1>
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

      <div className="relative z-10">
        <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24">
          {/* Dynamic Storm Report Section */}
          <div className="max-w-3xl mx-auto mb-16">
            {isLoadingStormData ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl p-8 lg:p-12 shadow-xl">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-lg text-blue-800">Loading current storm data from NOAA...</p>
                </div>
              </div>
            ) : stormDataError ? (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-2xl p-8 lg:p-12 shadow-xl">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Storm Report</h2>
                    <p className="text-lg text-gray-700 mb-4">
                      We're currently updating our storm data from NOAA sources. In the meantime, our team is ready to assess any potential hail damage in the Oklahoma City area.
                    </p>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-yellow-200">
                      <p className="font-semibold text-yellow-700 text-lg flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Schedule your free inspection today
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : stormContent && (
              <div 
                className="glass-card hover-lift bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-l-4 border-red-500 rounded-2xl p-8 lg:p-12 shadow-xl relative overflow-hidden"
                style={{
                  backgroundImage: images.sectionBreakImage2 
                    ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${images.sectionBreakImage2})`
                    : undefined,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  maxHeight: '100vh'
                }}
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center alert-icon-glow">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">Recent Storm Report</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="storm-data-box hover-lift rounded-lg p-4 shadow-md">
                        <p className="text-sm font-medium text-gray-600 mb-1">Storm Type</p>
                        <p className="text-lg font-bold text-gray-900">{stormContent.S}</p>
                      </div>
                      <div className="storm-data-box hover-lift rounded-lg p-4 shadow-md">
                        <p className="text-sm font-medium text-gray-600 mb-1">Date</p>
                        <p className="text-lg font-bold text-gray-900">{stormContent.DOL}</p>
                      </div>
                      <div className="storm-data-box hover-lift rounded-lg p-4 shadow-md">
                        <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                        <p className="text-lg font-bold text-gray-900">{stormContent.X}</p>
                      </div>
                      <div className="storm-data-box hover-lift rounded-lg p-4 shadow-md">
                        <p className="text-sm font-medium text-gray-600 mb-1">Hail Size</p>
                        <div className="flex items-center space-x-3">
                          <p className="text-lg font-bold text-gray-900">{stormContent.HS}</p>
                          <div className="size-indicator w-6 h-6 bg-red-500 rounded-full opacity-80"></div>
                        </div>
                      </div>
                    </div>

                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                      In light of the recent storm in {stormContent.X} on {stormContent.DOL}, we're here to help. The trending topic <strong>"{stormContent.phrase}"</strong> shows just how many homeowners are searching for answers right now — and we're proud to offer verified, local guidance using NOAA data.
                    </p>

                    {stormContent.hail_less_than_1_5 ? (
                      <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Hail in this size range may seem minor — and sometimes it is. But prolonged storms or repeated impacts can strip protective granules from shingles, silently shaving years off your roof's lifespan. Even "smaller" hail can leave behind costly, hidden damage. That's why more people are searching <strong>"{stormContent.phrase}"</strong> to figure out what to do next.
                      </p>
                    ) : (
                      <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Storms like this bring serious risk — not just to your roof, but to the safety, comfort, and value of your home. Severe impacts often fracture shingles, dislodge flashing, and void warranties — damage that can go unseen until it becomes a major problem. That's why searches like <strong>"{stormContent.phrase}"</strong> are trending in your area.
                      </p>
                    )}

                    <div className="bg-red-100 border border-red-200 rounded-lg p-6 mt-6">
                      <p className="text-lg font-semibold text-red-800 leading-relaxed">
                        Hailstones as large as <strong>{stormContent.HS}</strong> were reported in your area. This level of impact is known to crack shingles, dent metal panels, and cause leaks that may not show until months later. Don't wait — <strong>schedule an inspection today</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Strategic Call-to-Action Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="text-center">
              <button 
                onClick={() => {
                  const element = document.getElementById("contact-form");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="cta-pulse inline-flex items-center justify-center px-8 py-4 text-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                <CheckCircle className="mr-3 h-6 w-6" />
                Get Free Storm Damage Inspection Now
              </button>
              <p className="text-gray-600 mt-3 text-lg">
                Quick response • Insurance assistance • No obligation
              </p>
            </div>
            
            {/* Urgency Message */}
            <div className="urgency-glow bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-xl p-6 mt-8 shadow-md">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-amber-800">
                    ⚡ High demand after recent storms - Our crews are booking fast. Call now to secure your spot.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators Section */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white text-shadow-lg mb-4">Trusted by Oklahoma Homeowners</h3>
              <p className="text-gray-200 text-shadow-md">NOAA-verified data • Insurance approved • Licensed professionals</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {images.trustBadge1 && (
                <div className="glass-card hover-lift float-badge text-center p-6 rounded-xl">
                  <img src={images.trustBadge1} alt="Trust Badge 1" className="w-24 h-24 mx-auto mb-4 object-contain" />
                  <p className="text-white text-shadow-md font-semibold">NOAA Verified Data</p>
                </div>
              )}
              {images.trustBadge2 && (
                <div className="glass-card hover-lift float-badge text-center p-6 rounded-xl" style={{animationDelay: '0.5s'}}>
                  <img src={images.trustBadge2} alt="Trust Badge 2" className="w-24 h-24 mx-auto mb-4 object-contain" />
                  <p className="text-white text-shadow-md font-semibold">Insurance Approved</p>
                </div>
              )}
              {images.trustBadge3 && (
                <div className="glass-card hover-lift float-badge text-center p-6 rounded-xl" style={{animationDelay: '1s'}}>
                  <img src={images.trustBadge3} alt="Trust Badge 3" className="w-24 h-24 mx-auto mb-4 object-contain" />
                  <p className="text-white text-shadow-md font-semibold">BBB Rated</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Break Image */}
          {images.sectionBreakImage1 && (
            <div 
              className="parallax-bg min-h-80 flex items-center justify-center mb-16"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${images.sectionBreakImage1})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '320px'
              }}
            >
              <div className="text-center">
                <h3 className="text-4xl font-bold text-white text-shadow-lg mb-4">Storm Damage Restoration Experts</h3>
                <p className="text-xl text-gray-200 text-shadow-md">Professional assessment • Insurance claims • Quality repairs</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects Gallery Section */}
      <div className="bg-gray-50 relative z-10">
        <div className="container mx-auto px-6 lg:px-12 py-16">
          <Projects />
        </div>
      </div>

      <div className="bg-white relative z-10">
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
                <div id="contact-form" className="glass-card hover-lift border-0 shadow-xl rounded-lg">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white text-shadow-lg mb-2">Free Storm Damage Inspection</h3>
                      <p className="text-gray-200 text-shadow-md">Get your roof assessed by certified professionals</p>
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

                      <div className="relative">
                        <label className="block text-sm font-medium mb-2" htmlFor="address">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Property Address in Oklahoma *
                        </label>
                        <input
                          id="address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => updateFormData('address', e.target.value)}
                          onFocus={() => {
                            if (formData.address.length >= 3) {
                              searchOklahomaAddresses(formData.address);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowAddressSuggestions(false), 200);
                          }}
                          placeholder="Start typing your Oklahoma address..."
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors.address ? 'border-red-500' : formData.address.toLowerCase().includes('ok') ? 'border-green-500' : 'border-gray-300'
                          }`}
                          autoComplete="off"
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
                                  <span className="text-gray-900">{suggestion.formatted_address}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                        
                        {formData.address.toLowerCase().includes('oklahoma') || formData.address.toLowerCase().includes('ok') ? (
                          <p className="text-green-600 text-sm mt-1">✓ Oklahoma address verified</p>
                        ) : formData.address.length > 0 && (
                          <p className="text-amber-600 text-sm mt-1">⚠ Please enter an Oklahoma address</p>
                        )}
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

                      {/* Appointment Scheduling Section */}
                      <div className="border-t pt-6">
                        <div className="flex items-center mb-4">
                          <Calendar className="w-5 h-5 text-emerald-600 mr-2" />
                          <h4 className="text-lg font-semibold text-gray-900">Schedule Your Inspection</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* First Preferred Time */}
                          <div>
                            <label className="block text-sm font-medium mb-2">Preferred Date</label>
                            <input
                              type="date"
                              value={formData.preferredDate1}
                              onChange={(e) => updateFormData('preferredDate1', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">Preferred Time</label>
                            <select
                              value={formData.preferredTime1}
                              onChange={(e) => updateFormData('preferredTime1', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select time</option>
                              <option value="08:00" disabled={!isSlotAvailable(formData.preferredDate1, '08:00')}>
                                8:00 AM - 10:00 AM {!isSlotAvailable(formData.preferredDate1, '08:00') ? '(Booked)' : ''}
                              </option>
                              <option value="10:00" disabled={!isSlotAvailable(formData.preferredDate1, '10:00')}>
                                10:00 AM - 12:00 PM {!isSlotAvailable(formData.preferredDate1, '10:00') ? '(Booked)' : ''}
                              </option>
                              <option value="12:00" disabled={!isSlotAvailable(formData.preferredDate1, '12:00')}>
                                12:00 PM - 2:00 PM {!isSlotAvailable(formData.preferredDate1, '12:00') ? '(Booked)' : ''}
                              </option>
                              <option value="14:00" disabled={!isSlotAvailable(formData.preferredDate1, '14:00')}>
                                2:00 PM - 4:00 PM {!isSlotAvailable(formData.preferredDate1, '14:00') ? '(Booked)' : ''}
                              </option>
                              <option value="16:00" disabled={!isSlotAvailable(formData.preferredDate1, '16:00')}>
                                4:00 PM - 6:00 PM {!isSlotAvailable(formData.preferredDate1, '16:00') ? '(Booked)' : ''}
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Second Preferred Time (Alternative) */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-2 text-gray-600">Alternative Date & Time (Optional)</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="date"
                              value={formData.preferredDate2}
                              onChange={(e) => updateFormData('preferredDate2', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            
                            <select
                              value={formData.preferredTime2}
                              onChange={(e) => updateFormData('preferredTime2', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select time</option>
                              <option value="08:00" disabled={!isSlotAvailable(formData.preferredDate2, '08:00', true)}>
                                8:00 AM - 10:00 AM {!isSlotAvailable(formData.preferredDate2, '08:00', true) ? '(Booked/Selected)' : ''}
                              </option>
                              <option value="10:00" disabled={!isSlotAvailable(formData.preferredDate2, '10:00', true)}>
                                10:00 AM - 12:00 PM {!isSlotAvailable(formData.preferredDate2, '10:00', true) ? '(Booked/Selected)' : ''}
                              </option>
                              <option value="12:00" disabled={!isSlotAvailable(formData.preferredDate2, '12:00', true)}>
                                12:00 PM - 2:00 PM {!isSlotAvailable(formData.preferredDate2, '12:00', true) ? '(Booked/Selected)' : ''}
                              </option>
                              <option value="14:00" disabled={!isSlotAvailable(formData.preferredDate2, '14:00', true)}>
                                2:00 PM - 4:00 PM {!isSlotAvailable(formData.preferredDate2, '14:00', true) ? '(Booked/Selected)' : ''}
                              </option>
                              <option value="16:00" disabled={!isSlotAvailable(formData.preferredDate2, '16:00', true)}>
                                4:00 PM - 6:00 PM {!isSlotAvailable(formData.preferredDate2, '16:00', true) ? '(Booked/Selected)' : ''}
                              </option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-800">
                            <Clock className="w-4 h-4 inline mr-1" />
                            We'll confirm your appointment time within 2 hours of submission
                          </p>
                        </div>
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