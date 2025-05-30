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

export default function HailDamageFixed() {
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

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "We'll contact you within 24 hours to schedule your free estimate.",
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
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto shadow-xl border-emerald-100">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-emerald-800 mb-4">
                Get Your Free Storm Damage Estimate
              </h1>
              <p className="text-gray-600">
                Professional storm damage assessment in Oklahoma. Fill out our secure form for a detailed estimate within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name*</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="John"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name*</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Smith"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className={`h-12 rounded-xl ${formData.email && !validateEmail(formData.email) ? 'border-red-500' : validateEmail(formData.email) ? 'border-emerald-500' : 'border-gray-200'}`}
                    required
                  />
                  {formData.email && (
                    validateEmail(formData.email) ? (
                      <p className="text-emerald-600 text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Email verified
                      </p>
                    ) : (
                      <p className="text-red-500 text-sm flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Please enter a valid email address from a recognized provider
                      </p>
                    )
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number*</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(405) 555-0123"
                    className={`h-12 rounded-xl ${formData.phone && !validatePhone(formData.phone) ? 'border-red-500' : validatePhone(formData.phone) ? 'border-emerald-500' : 'border-gray-200'}`}
                    required
                  />
                  {formData.phone && (
                    validatePhone(formData.phone) ? (
                      <p className="text-emerald-600 text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Phone number verified
                      </p>
                    ) : (
                      <p className="text-red-500 text-sm flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Phone number must be 10 digits
                      </p>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Property Address (Oklahoma)*</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street, Oklahoma City, OK 73101"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceType">Select Service Type*</Label>
                <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Storm Damage Assessment">Storm Damage Assessment</SelectItem>
                    <SelectItem value="Roof Repair">Roof Repair</SelectItem>
                    <SelectItem value="Roof Replacement">Roof Replacement</SelectItem>
                    <SelectItem value="Gutter Services">Gutter Services</SelectItem>
                    <SelectItem value="Roof Inspection">Roof Inspection</SelectItem>
                    <SelectItem value="Emergency Repairs">Emergency Repairs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Describe the storm damage and your roofing needs...</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Please describe the damage you've noticed, when the storm occurred, and any specific concerns..."
                  className="min-h-24 rounded-xl resize-none"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                disabled={contactMutation.isPending}
              >
                {contactMutation.isPending ? "Submitting..." : "Submit Free Estimate Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}