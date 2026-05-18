import React, { useState, useEffect, useCallback, useMemo, useReducer, lazy, Suspense, memo } from "react";
import { Calendar, MapPin, Phone, Star, AlertTriangle, Shield, Clock, CheckCircle, Mail } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Lazy load heavy components
const Projects = lazy(() => import("@/components/projects"));

// Constants moved outside component
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'protonmail.com', 'live.com', 'msn.com', 'comcast.net',
  'verizon.net', 'sbcglobal.net', 'att.net', 'cox.net', 'charter.net'
];

const INITIAL_BOOKED_SLOTS = [
  '2024-05-31-09:00', '2024-05-31-14:00', '2024-06-01-11:00'
];

const TIME_SLOTS = [
  { value: "08:00", label: "8:00 AM - 10:00 AM" },
  { value: "10:00", label: "10:00 AM - 12:00 PM" },
  { value: "12:00", label: "12:00 PM - 2:00 PM" },
  { value: "14:00", label: "2:00 PM - 4:00 PM" },
  { value: "16:00", label: "4:00 PM - 6:00 PM" }
];

// Utility functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10;
};

// Debounce function (simple implementation to avoid lodash dependency)
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Types
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
  S: string;
  DOL: string;
  X: string;
  HS: string;
  phrase: string;
  hail_less_than_1_5: boolean;
}

interface TrendingPhrase {
  title: string;
  traffic: string;
  relatedQueries: string[];
}

interface AddressSuggestion {
  formatted_address: string;
  place_id: string;
}

interface LandingPageImages {
  stormReportBackground: string;
}

// Form reducer for better state management
type FormAction = 
  | { type: 'UPDATE_FIELD'; field: keyof ContactForm; value: string }
  | { type: 'RESET_FORM' }
  | { type: 'SET_ERRORS'; errors: {[key: string]: string} }
  | { type: 'CLEAR_ERROR'; field: string };

interface FormState {
  data: ContactForm;
  errors: {[key: string]: string};
}

const initialFormState: FormState = {
  data: {
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
  },
  errors: {}
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: "" }
      };
    case 'RESET_FORM':
      return initialFormState;
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'CLEAR_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: "" } };
    default:
      return state;
  }
}

// Custom hook for storm data
function useStormData() {
  const [stormContent, setStormContent] = useState<DynamicStormContent | null>(null);
  const [isLoadingStormData, setIsLoadingStormData] = useState(true);
  const [stormDataError, setStormDataError] = useState<string | null>(null);

  const fetchTrendingPhrases = useCallback(async (): Promise<TrendingPhrase[]> => {
    try {
      const trendsResponse = await fetch('/api/trending-phrases');
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        return trendsData.phrases || [];
      }
      
      return [
        { title: 'hail damage roof inspection Oklahoma', traffic: 'High', relatedQueries: [] },
        { title: 'storm damage insurance claim', traffic: 'Medium', relatedQueries: [] },
        { title: 'roof repair after hail storm', traffic: 'Medium', relatedQueries: [] }
      ];
    } catch (error) {
      console.error('Error fetching trending phrases:', error);
      return [
        { title: 'hail damage roof inspection Oklahoma', traffic: 'High', relatedQueries: [] }
      ];
    }
  }, []);

  const fetchStormData = useCallback(async (): Promise<DynamicStormContent> => {
    try {
      const trendingPhrases = await fetchTrendingPhrases();
      
      const stormResponse = await fetch('/api/storm-data/daily-hail-content');
      if (!stormResponse.ok) {
        throw new Error('Failed to fetch storm data');
      }
      
      const stormResult = await stormResponse.json();
      
      if (!stormResult.success || !stormResult.storm) {
        throw new Error('No verified NOAA storm data available');
      }
      
      const stormData = stormResult.storm;
      
      const selectedPhrase = trendingPhrases.length > 0 
        ? trendingPhrases[0].title 
        : "hail damage roof inspection Oklahoma";

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
  }, [fetchTrendingPhrases]);

  useEffect(() => {
    const loadStormContent = async () => {
      try {
        setIsLoadingStormData(true);
        setStormDataError(null);
        
        const cached = localStorage.getItem('storm-content-cache');
        const cacheTimestamp = localStorage.getItem('storm-content-timestamp');
        const now = Date.now();
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;
        
        if (cached && cacheAge < 24 * 60 * 60 * 1000) {
          setStormContent(JSON.parse(cached));
          setIsLoadingStormData(false);
          return;
        }
        
        const content = await fetchStormData();
        setStormContent(content);
        
        localStorage.setItem('storm-content-cache', JSON.stringify(content));
        localStorage.setItem('storm-content-timestamp', now.toString());
        
      } catch (error) {
        console.error('Failed to load storm content:', error);
        setStormDataError('Unable to load current storm data');
        
        const cached = localStorage.getItem('storm-content-cache');
        if (cached) {
          setStormContent(JSON.parse(cached));
        }
      } finally {
        setIsLoadingStormData(false);
      }
    };

    loadStormContent();
  }, [fetchStormData]);

  return { stormContent, isLoadingStormData, stormDataError };
}

// Custom hook for landing page images
function useLandingPageImages() {
  const [images, setImages] = useState<LandingPageImages>({
    stormReportBackground: ''
  });

  useEffect(() => {
    // Try to load from API first
    const loadImages = async () => {
      try {
        const response = await fetch('/api/website-images');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.images?.stormReportBackground) {
            setImages(prev => ({
              ...prev,
              stormReportBackground: data.images.stormReportBackground
            }));
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load images from API:', error);
      }
      
      // Fallback to localStorage
      const savedBackground = localStorage.getItem('stormReportBackground');
      if (savedBackground) {
        setImages(prev => ({ ...prev, stormReportBackground: savedBackground }));
      }
    };

    loadImages();
  }, []);

  return images;
}

// Memoized components
const ReviewCard = memo<{ review: Review }>(({ review }) => (
  <div className="border-0 shadow-sm bg-gray-50 rounded-lg">
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
));

ReviewCard.displayName = 'ReviewCard';

export default function HailLandingPage() {
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Address autocomplete states
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  // Appointment booking states
  const [bookedSlots] = useState<string[]>(INITIAL_BOOKED_SLOTS);

  // Use custom hook for storm data
  const { stormContent, isLoadingStormData, stormDataError } = useStormData();
  
  // Use custom hook for landing page images
  const landingPageImages = useLandingPageImages();

  const [hailData, setHailData] = useState({
    city: "Oklahoma City",
    date_of_loss: new Date().toLocaleDateString(),
    hail_size: "2.5",
    damage_likely: true,
    verified: false
  });

  // Fetch real Google Business reviews with extended cache
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<ReviewsResponse>({
    queryKey: ['/api/reviews'],
    staleTime: 60 * 60 * 1000, // Extended to 1 hour
  });

  const reviews: Review[] = reviewsData?.reviews || [];

  // Contact form submission mutation
  const contactMutation = useMutation({
    mutationFn: (data: ContactForm) => apiRequest('POST', '/api/contact', data),
  });

  // Debounced address search
  const searchOklahomaAddresses = useMemo(
    () => debounce(async (query: string) => {
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
    }, 300),
    []
  );

  const handleAddressSelect = useCallback((suggestion: AddressSuggestion) => {
    dispatch({ type: 'UPDATE_FIELD', field: 'address', value: suggestion.formatted_address });
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  }, []);

  // Memoized slot availability check
  const isSlotAvailable = useCallback((date: string, time: string, isSecondChoice = false): boolean => {
    const slotKey = `${date}-${time}`;
    
    if (bookedSlots.includes(slotKey)) {
      return false;
    }
    
    if (isSecondChoice && formState.data.preferredDate1 === date && formState.data.preferredTime1 === time) {
      return false;
    }
    
    return true;
  }, [bookedSlots, formState.data.preferredDate1, formState.data.preferredTime1]);

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

  const validateForm = useCallback((): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formState.data.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formState.data.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formState.data.email.trim()) newErrors.email = "Email is required";
    if (!formState.data.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formState.data.address.trim()) newErrors.address = "Property address is required";
    
    if (formState.data.email && !validateEmail(formState.data.email)) {
      newErrors.email = "Invalid email or domain not allowed";
    }
    
    if (formState.data.phone && !validatePhone(formState.data.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }
    
    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  }, [formState.data]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission attempted');
    console.log('Form data:', formState.data);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      console.log('Validation errors:', formState.errors);
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
      const result = await contactMutation.mutateAsync(formState.data);
      
      console.log('Form submitted successfully:', result);
      setSubmitMessage({
        type: 'success',
        text: "Request submitted successfully! We'll contact you within 2 hours to schedule your free inspection."
      });
      
      dispatch({ type: 'RESET_FORM' });
      
    } catch (error) {
      console.log('Form submission failed:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Submission failed. Please try again or call us directly at (405) 902-5266'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formState.data, formState.errors, validateForm, contactMutation]);

  const updateFormData = useCallback((field: keyof ContactForm, value: string) => {
    console.log(`Updating ${field} to:`, value);
    dispatch({ type: 'UPDATE_FIELD', field, value });
    if (submitMessage) {
      setSubmitMessage(null);
    }
    
    if (field === 'address') {
      searchOklahomaAddresses(value);
    }
  }, [submitMessage, searchOklahomaAddresses]);

  const scrollToForm = useCallback(() => {
    const element = document.getElementById("contact-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Memoized email validation display
  const emailValidationDisplay = useMemo(() => {
    if (!formState.data.email) return null;
    
    return validateEmail(formState.data.email) ? (
      <p className="text-green-600 text-sm">✓ Valid email</p>
    ) : (
      <p className="text-red-500 text-sm">✗ Invalid email or domain not allowed</p>
    );
  }, [formState.data.email]);

  // Memoized phone validation display
  const phoneValidationDisplay = useMemo(() => {
    if (!formState.data.phone) return null;
    
    return validatePhone(formState.data.phone) ? (
      <p className="text-green-600 text-sm">✓ Valid phone</p>
    ) : (
      <p className="text-red-500 text-sm">✗ Phone must be 10 digits</p>
    );
  }, [formState.data.phone]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 rounded-xl shadow-md">
                <img 
                  src="/sigma-logo.png" 
                  alt="Sigma Roofing LLC Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sigma Roofing LLC</h1>
                <p className="text-sm text-emerald-600 font-medium">Licensed & Insured</p>
              </div>
            </div>
            <div className="text-right">
              <a 
                href="tel:4059025266" 
                className="text-lg font-bold text-emerald-600 hover:text-emerald-700 transition-all duration-200 hover:scale-105 inline-block"
              >
                (405) 902-5266
              </a>
              <p className="text-sm text-gray-600 font-medium">24/7 Emergency Service</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative bg-gradient-to-br from-slate-50 to-white">
        {/* Storm Report Section with Background Image */}
        <div 
          className="relative bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: landingPageImages.stormReportBackground 
              ? `url(${landingPageImages.stormReportBackground})`
              : 'none'
          }}
        >
          {/* Very subtle overlay for better text readability while keeping background visible */}
          {landingPageImages.stormReportBackground && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/20" />
          )}
          
          <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24 relative z-10">
            {/* Dynamic Storm Report Section */}
            <div className="max-w-4xl mx-auto mb-16">
            {isLoadingStormData ? (
              <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 border-l-4 border-blue-500 rounded-2xl p-8 lg:p-12 shadow-xl backdrop-blur-lg border border-white/30">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-lg text-blue-800">Loading current storm data from NOAA...</p>
                </div>
              </div>
            ) : stormDataError ? (
              <div className="bg-gradient-to-r from-yellow-50/30 to-orange-50/30 border-l-4 border-yellow-500 rounded-2xl p-8 lg:p-12 shadow-xl backdrop-blur-lg border border-white/30">
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
              <div className={`bg-gradient-to-r from-red-50/20 via-orange-50/25 to-yellow-50/20 border-l-4 border-red-500 rounded-2xl p-8 lg:p-12 shadow-xl backdrop-blur-lg border border-white/40 ${landingPageImages.stormReportBackground ? 'backdrop-blur-lg' : ''}`}>
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center animate-pulse">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">Recent Storm Report</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/25 backdrop-blur-md rounded-lg p-4 border border-white/40 shadow-lg">
                        <p className="text-sm font-medium text-gray-800 mb-1">Storm Type</p>
                        <p className="text-lg font-bold text-gray-900">{stormContent.S}</p>
                      </div>
                      <div className="bg-white/25 backdrop-blur-md rounded-lg p-4 border border-white/40 shadow-lg">
                        <p className="text-sm font-medium text-gray-800 mb-1">Date</p>
                        <p className="text-lg font-bold text-gray-900">{stormContent.DOL}</p>
                      </div>
                      <div className="bg-white/25 backdrop-blur-md rounded-lg p-4 border border-white/40 shadow-lg">
                        <p className="text-sm font-medium text-gray-800 mb-1">Location</p>
                        <p className="text-lg font-bold text-gray-900">{stormContent.X}</p>
                      </div>
                      <div className="bg-white/25 backdrop-blur-md rounded-lg p-4 border border-white/40 shadow-lg">
                        <p className="text-sm font-medium text-gray-800 mb-1">Hail Size</p>
                        <p className="text-lg font-bold text-gray-900">{stormContent.HS}</p>
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
                onClick={scrollToForm}
                className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-200 border border-emerald-500/20 backdrop-blur-sm"
              >
                <CheckCircle className="mr-3 h-7 w-7 animate-pulse" />
                Get Free Storm Damage Inspection Now
              </button>
              <p className="text-gray-100 mt-4 text-lg font-medium backdrop-blur-sm bg-black/20 rounded-lg px-4 py-2 mx-auto inline-block">
                Quick response • Insurance assistance • No obligation
              </p>
            </div>
            
            {/* Urgency Message */}
            <div className="bg-gradient-to-r from-amber-50/30 to-yellow-50/30 border-l-4 border-amber-500 rounded-xl p-6 mt-8 shadow-2xl backdrop-blur-lg border border-white/40">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-100/80 rounded-full flex items-center justify-center animate-bounce shadow-lg">
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
        </div>
      </div>
    </div>

      {/* Projects Gallery Section with Lazy Loading */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/20 to-blue-50/20"></div>
        <div className="container mx-auto px-6 lg:px-12 py-16 relative z-10">
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          }>
            <Projects />
          </Suspense>
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
                      <ReviewCard key={index} review={review} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-8">
                <div id="contact-form" className="border-0 shadow-2xl bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/50">
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
                            value={formState.data.firstName}
                            onChange={(e) => updateFormData('firstName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              formState.errors.firstName ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {formState.errors.firstName && <p className="text-red-500 text-sm mt-1">{formState.errors.firstName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2" htmlFor="lastName">Last Name *</label>
                          <input
                            id="lastName"
                            type="text"
                            value={formState.data.lastName}
                            onChange={(e) => updateFormData('lastName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              formState.errors.lastName ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {formState.errors.lastName && <p className="text-red-500 text-sm mt-1">{formState.errors.lastName}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="email">Email Address *</label>
                        <input
                          id="email"
                          type="email"
                          value={formState.data.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          placeholder="test@gmail.com"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            formState.errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Value: "{formState.data.email}"</p>
                        {emailValidationDisplay}
                        {formState.errors.email && <p className="text-red-500 text-sm mt-1">{formState.errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="phone">Phone Number *</label>
                        <input
                          id="phone"
                          type="tel"
                          value={formState.data.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            formState.errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Value: "{formState.data.phone}"</p>
                        {phoneValidationDisplay}
                        {formState.errors.phone && <p className="text-red-500 text-sm mt-1">{formState.errors.phone}</p>}
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium mb-2" htmlFor="address">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Property Address in Oklahoma *
                        </label>
                        <input
                          id="address"
                          type="text"
                          value={formState.data.address}
                          onChange={(e) => updateFormData('address', e.target.value)}
                          onFocus={() => {
                            if (formState.data.address.length >= 3) {
                              searchOklahomaAddresses(formState.data.address);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowAddressSuggestions(false), 200);
                          }}
                          placeholder="Start typing your Oklahoma address..."
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            formState.errors.address ? 'border-red-500' : formState.data.address.toLowerCase().includes('ok') ? 'border-green-500' : 'border-gray-300'
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
                        
                        {formState.errors.address && <p className="text-red-500 text-sm mt-1">{formState.errors.address}</p>}
                        
                        {formState.data.address.toLowerCase().includes('oklahoma') || formState.data.address.toLowerCase().includes('ok') ? (
                          <p className="text-green-600 text-sm mt-1">✓ Oklahoma address verified</p>
                        ) : formState.data.address.length > 0 && (
                          <p className="text-amber-600 text-sm mt-1">⚠ Please enter an Oklahoma address</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="serviceType">Service Needed</label>
                        <select
                          id="serviceType"
                          value={formState.data.serviceType}
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
                          value={formState.data.description}
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
                              value={formState.data.preferredDate1}
                              onChange={(e) => updateFormData('preferredDate1', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">Preferred Time</label>
                            <select
                              value={formState.data.preferredTime1}
                              onChange={(e) => updateFormData('preferredTime1', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select time</option>
                              {TIME_SLOTS.map(slot => (
                                <option 
                                  key={slot.value} 
                                  value={slot.value} 
                                  disabled={!isSlotAvailable(formState.data.preferredDate1, slot.value)}
                                >
                                  {slot.label} {!isSlotAvailable(formState.data.preferredDate1, slot.value) ? '(Booked)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Second Preferred Time (Alternative) */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-2 text-gray-600">Alternative Date & Time (Optional)</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="date"
                              value={formState.data.preferredDate2}
                              onChange={(e) => updateFormData('preferredDate2', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            
                            <select
                              value={formState.data.preferredTime2}
                              onChange={(e) => updateFormData('preferredTime2', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select time</option>
                              {TIME_SLOTS.map(slot => (
                                <option 
                                  key={slot.value} 
                                  value={slot.value} 
                                  disabled={!isSlotAvailable(formState.data.preferredDate2, slot.value, true)}
                                >
                                  {slot.label} {!isSlotAvailable(formState.data.preferredDate2, slot.value, true) ? '(Booked/Selected)' : ''}
                                </option>
                              ))}
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
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </div>
                        ) : (
                          'Schedule Free Inspection'
                        )}
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