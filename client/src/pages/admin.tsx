import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Calendar, Clock, User, Home } from "lucide-react";
import type { ContactRequest } from "@shared/schema";

export default function AdminDashboard() {
  const { data: leads = [], isLoading, refetch } = useQuery<ContactRequest[]>({
    queryKey: ['/api/contact-requests'],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const getServiceBadgeColor = (service: string) => {
    const colors: Record<string, string> = {
      'roof-repair': 'bg-red-100 text-red-800',
      'roof-inspection': 'bg-blue-100 text-blue-800',
      'gutter-services': 'bg-green-100 text-green-800',
      'storm-damage': 'bg-orange-100 text-orange-800',
      'painting': 'bg-purple-100 text-purple-800',
      'emergency': 'bg-red-500 text-white'
    };
    return colors[service] || 'bg-gray-100 text-gray-800';
  };

  const getServiceName = (service: string) => {
    const names: Record<string, string> = {
      'roof-repair': 'Roof Repair',
      'roof-inspection': 'Roof Inspection',
      'gutter-services': 'Gutter Services',
      'storm-damage': 'Storm Damage',
      'painting': 'Painting Services',
      'emergency': 'Emergency'
    };
    return names[service] || service;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
              <p className="text-gray-600 mt-1">Sigma Roofing LLC - Customer Inquiries</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => refetch()} variant="outline">
                Refresh Leads
              </Button>
              <Button asChild>
                <a href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Website
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{leads.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Leads (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {leads.filter(lead => {
                  if (!lead.createdAt) return false;
                  const leadDate = new Date(lead.createdAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return leadDate >= weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Emergency Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {leads.filter(lead => lead.serviceType === 'emergency' || lead.serviceType === 'storm-damage').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <div className="space-y-6">
          {leads.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
                <p className="text-gray-600">Customer inquiries will appear here when submitted through your website.</p>
              </CardContent>
            </Card>
          ) : (
            leads.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()).map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        Submitted {lead.createdAt ? formatDate(lead.createdAt) : 'Recently'}
                      </CardDescription>
                    </div>
                    <Badge className={getServiceBadgeColor(lead.serviceType)}>
                      {getServiceName(lead.serviceType)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <a href={`tel:${lead.phone}`} className="text-emerald-600 hover:underline font-medium">
                        {lead.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-600" />
                      <a href={`mailto:${lead.email}`} className="text-emerald-600 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-700">{lead.address}</span>
                  </div>

                  {/* Description */}
                  {lead.description && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">Project Description:</h4>
                      <p className="text-gray-700">{lead.description}</p>
                    </div>
                  )}

                  {/* Preferred Appointment Times */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Preferred Appointment Times:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-800">Option 1:</span>
                        <span className="text-sm text-gray-700">
                          {formatDate(lead.preferredDate1)} at {formatTime(lead.preferredTime1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-800">Option 2:</span>
                        <span className="text-sm text-gray-700">
                          {formatDate(lead.preferredDate2)} at {formatTime(lead.preferredTime2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm">
                      <a href={`tel:${lead.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={`mailto:${lead.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}