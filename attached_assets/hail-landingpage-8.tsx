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

// ... existing code ... 