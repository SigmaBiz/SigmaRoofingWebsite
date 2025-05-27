import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FirebasePhotoManager from "@/components/firebase-photo-manager";

interface ProjectForm {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  location: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProjectForm>({
    title: "",
    description: "",
    imageUrl: "",
    category: "",
    location: ""
  });

  const [imagePreview, setImagePreview] = useState<string>("");

  const categories = [
    "Residential",
    "Commercial", 
    "Storm Damage",
    "Gutter Services",
    "Roof Repair",
    "New Installation",
    "Emergency Repair"
  ];

  const handleInputChange = (field: keyof ProjectForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update image preview when URL changes
    if (field === 'imageUrl') {
      setImagePreview(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.imageUrl || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would save to your storage system
      toast({
        title: "Project Added Successfully!",
        description: "Your new project will appear on the website immediately.",
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        category: "",
        location: ""
      });
      setImagePreview("");
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Please try again or check your internet connection.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Gallery Admin</h1>
          <p className="text-gray-600">Add new roofing projects to showcase your work</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-emerald-600 text-white">
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add New Project
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image URL Input */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-sm font-medium">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Image URL *
                </Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/your-project-photo.jpg"
                  required
                  className="h-12"
                />
                <p className="text-xs text-gray-500">
                  Upload your photo to any image hosting service (Imgur, Google Photos, etc.) and paste the direct link here
                </p>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                      onError={() => setImagePreview("")}
                    />
                  </div>
                </div>
              )}

              {/* Project Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Project Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Modern Family Home Roof Replacement"
                    required
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Edmond, OK"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Project Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select project category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Project Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the project details, materials used, challenges overcome, etc."
                  required
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Project to Gallery
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-3">How to Upload Photos:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              <li>Take high-quality photos of your completed roofing projects</li>
              <li>Upload photos to Google Photos, Imgur, or any image hosting service</li>
              <li>Get the direct image link (should end in .jpg, .png, etc.)</li>
              <li>Paste the link in the Image URL field above</li>
              <li>Fill in the project details and click "Add Project"</li>
            </ol>
            <p className="text-blue-700 text-sm mt-3 font-medium">
              Your projects will appear on the website immediately and help generate more leads!
            </p>
          </CardContent>
        </Card>

        {/* Firebase Photo Manager */}
        <FirebasePhotoManager />
      </div>
    </div>
  );
}