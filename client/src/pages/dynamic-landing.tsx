import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, CheckCircle, ArrowRight } from "lucide-react";

interface PhraseData {
  phrase_id: string;
  phrase: string;
  city: string;
  storm_type: string;
  storm_date: string;
  hail_size: string;
  generated_at: string;
}

export default function DynamicLanding() {
  const [location] = useLocation();
  const [phraseData, setPhraseData] = useState<PhraseData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const goToContactForm = () => {
    // Navigate directly to the main website's contact form
    window.location.href = '/#contact';
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

              {/* CTA Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  className="bg-sigma-emerald text-white hover:bg-emerald-600 text-xl px-12 py-6 shadow-lg transform hover:scale-105 transition-transform"
                  onClick={goToContactForm}
                >
                  🔍 Schedule Your Free Roof Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
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