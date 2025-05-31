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

function InputDebugger({ formData }: { formData: ContactForm }) {
  useEffect(() => {
    console.log("[DEBUG] formData updated:", formData);
  }, [formData]);
  return null;
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

  const { data: recentHailEvents } = useQuery({
    queryKey: ['/api/recent-hail-events'],
    staleTime: 1000 * 60 * 30,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 1000 * 60 * 30,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    staleTime: 1000 * 60 * 30,
  });
  
  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to submit');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Scheduled!",
        description: "We'll contact you within 2 hours to confirm your appointment.",
      });
      setFormData({
        firstName: "", lastName: "", email: "", phone: "", address: "",
        serviceType: "Storm Damage Assessment", description: "",
        preferredDate1: "", preferredTime1: "", preferredDate2: "", preferredTime2: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule assessment. Please try again.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phrase = urlParams.get('phrase');
    const loadingTimeout = setTimeout(() => {
      setHailData({
        city: "Oklahoma City",
        date_of_loss: "Recent Storm Event",
        hail_size: "2.5\"",
        damage_likely: true,
        verified: true
      });
    }, 10000);

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
        setHailData({
          city: "Oklahoma City",
          date_of_loss: "Recent Storm Event",
          hail_size: "2.5\"",
          damage_likely: true,
          verified: true
        });
      });
  }, []);

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

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    let processedValue = value;
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };
  useEffect(() => {
    console.log("[TEST] HailDamage component rendered");
  }, []);
  if (!hailData.verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storm data...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-white">
        {/* ... existing UI code ... */}
        <InputDebugger formData={formData} />
      </div>
    );
  }

