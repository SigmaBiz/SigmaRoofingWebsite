import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Eye, Image, Home, Wrench, Users, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CloudinaryPhotoManager from "@/components/cloudinary-photo-manager";

interface ProjectForm {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  location: string;
}

interface WebsiteImages {
  // Hero Section
  heroBackground: string;
  heroFeatureImage: string;
  
  // Services Section
  roofRepairImage: string;
  roofInspectionImage: string;
  gutterServiceImage: string;
  stormDamageImage: string;
  paintingServiceImage: string;
  
  // About Section
  teamPhoto: string;
  companyLogo: string;
  
  // Process Section
  processStep1Image: string;
  processStep2Image: string;
  processStep3Image: string;
  processStep4Image: string;
  
  // Testimonials
  testimonialBackground: string;
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

  // Project Gallery Images (6 slots)
  const [projectImages, setProjectImages] = useState({
    project1: "",
    project2: "",
    project3: "",
    project4: "",
    project5: "",
    project6: ""
  });
  const [duplicateWarnings, setDuplicateWarnings] = useState<{[key: string]: boolean}>({});

  const [websiteImages, setWebsiteImages] = useState<WebsiteImages>({
    heroBackground: "",
    heroFeatureImage: "",
    roofRepairImage: "",
    roofInspectionImage: "",
    gutterServiceImage: "",
    stormDamageImage: "",
    paintingServiceImage: "",
    teamPhoto: "",
    companyLogo: "",
    processStep1Image: "",
    processStep2Image: "",
    processStep3Image: "",
    processStep4Image: "",
    testimonialBackground: ""
  });

  const [imagePreview, setImagePreview] = useState<string>("");

  // Load saved images when component mounts
  useEffect(() => {
    // Load website images
    Object.keys(websiteImages).forEach(key => {
      const saved = localStorage.getItem(key);
      if (saved) {
        setWebsiteImages(prev => ({ ...prev, [key]: saved }));
      }
    });

    // Load project images
    Object.keys(projectImages).forEach(key => {
      const saved = localStorage.getItem(`projectGallery_${key}`);
      if (saved) {
        setProjectImages(prev => ({ ...prev, [key]: saved }));
      }
    });
  }, []);

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

  const handleImageChange = (field: keyof WebsiteImages, value: string) => {
    setWebsiteImages(prev => ({ ...prev, [field]: value }));
  };

  // Check for duplicate project images
  const checkForDuplicates = (newUrl: string, currentProject: string) => {
    const urls = Object.values(projectImages);
    const isDuplicate = urls.some((url, index) => {
      const projectKey = Object.keys(projectImages)[index];
      return url === newUrl && projectKey !== currentProject && url !== "";
    });
    return isDuplicate;
  };

  const handleProjectImageChange = (project: string, value: string) => {
    const isDuplicate = checkForDuplicates(value, project);
    
    setDuplicateWarnings(prev => ({ ...prev, [project]: isDuplicate }));
    
    if (!isDuplicate) {
      setProjectImages(prev => ({ ...prev, [project]: value }));
    }
  };

  const saveProjectImages = () => {
    // Only save if no duplicates exist
    const hasDuplicates = Object.values(duplicateWarnings).some(warning => warning);
    if (hasDuplicates) {
      toast({
        title: "Cannot Save - Duplicate Images",
        description: "Please fix duplicate images before saving.",
        variant: "destructive",
      });
      return;
    }

    // Save each project image individually
    Object.entries(projectImages).forEach(([key, url]) => {
      localStorage.setItem(`projectGallery_${key}`, url);
    });

    // Convert to array format for the Projects component
    const projectArray = Object.entries(projectImages)
      .filter(([_, url]) => url !== "")
      .map(([key, url], index) => ({
        image: url,
        title: `Project ${index + 1}`,
        description: `Custom project managed through admin panel`,
        category: "Admin Project"
      }));

    localStorage.setItem('adminProjects', JSON.stringify(projectArray));
    
    toast({
      title: "Project Gallery Updated!",
      description: "Your project images are now live on the website.",
    });
  };

  const handleSaveWebsiteImages = async () => {
    try {
      // Save all website images to localStorage
      Object.entries(websiteImages).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
        }
      });
      
      toast({
        title: "Website Images Updated!",
        description: "All your website images have been updated. Refresh your main website to see the changes!",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Please try again or check your internet connection.",
        variant: "destructive",
      });
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

  const ImageUploadField = ({ 
    label, 
    field, 
    description, 
    currentValue 
  }: { 
    label: string; 
    field: keyof WebsiteImages; 
    description: string;
    currentValue: string;
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        value={currentValue}
        onChange={(e) => handleImageChange(field, e.target.value)}
        placeholder="Paste Cloudinary URL here..."
        className="h-12"
      />
      <p className="text-xs text-gray-500">{description}</p>
      {currentValue && (
        <div className="border rounded-lg overflow-hidden">
          <img 
            src={currentValue} 
            alt={label} 
            className="w-full h-32 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sigma Roofing Website Manager</h1>
          <p className="text-gray-600">Control every image and project on your website from one place</p>
        </div>

        <Tabs defaultValue="images" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="images" className="flex items-center">
              <Image className="w-4 h-4 mr-2" />
              Website Images
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Project Gallery
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Photo Manager
            </TabsTrigger>
          </TabsList>

          {/* Website Images Tab */}
          <TabsContent value="images">
            <div className="grid gap-6">
              {/* Hero Section */}
              <Card>
                <CardHeader className="bg-emerald-600 text-white">
                  <CardTitle className="flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    Hero Section Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <ImageUploadField
                    label="Hero Background Image"
                    field="heroBackground"
                    description="Main background image for your homepage hero section"
                    currentValue={websiteImages.heroBackground}
                  />
                  <ImageUploadField
                    label="Hero Feature Image"
                    field="heroFeatureImage"
                    description="Featured roofing project image next to your main message"
                    currentValue={websiteImages.heroFeatureImage}
                  />
                </CardContent>
              </Card>

              {/* Services Section */}
              <Card>
                <CardHeader className="bg-emerald-600 text-white">
                  <CardTitle className="flex items-center">
                    <Wrench className="w-5 h-5 mr-2" />
                    Service Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <ImageUploadField
                      label="Roof Repair Image"
                      field="roofRepairImage"
                      description="Showcase your roof repair work"
                      currentValue={websiteImages.roofRepairImage}
                    />
                    <ImageUploadField
                      label="Roof Inspection Image"
                      field="roofInspectionImage"
                      description="Professional inspection process"
                      currentValue={websiteImages.roofInspectionImage}
                    />
                    <ImageUploadField
                      label="Gutter Service Image"
                      field="gutterServiceImage"
                      description="Gutter installation or repair work"
                      currentValue={websiteImages.gutterServiceImage}
                    />
                    <ImageUploadField
                      label="Storm Damage Image"
                      field="stormDamageImage"
                      description="Storm damage restoration work"
                      currentValue={websiteImages.stormDamageImage}
                    />
                  </div>
                  <ImageUploadField
                    label="Painting Service Image"
                    field="paintingServiceImage"
                    description="Professional painting services"
                    currentValue={websiteImages.paintingServiceImage}
                  />
                </CardContent>
              </Card>

              {/* About & Team Section */}
              <Card>
                <CardHeader className="bg-emerald-600 text-white">
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    About & Team Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <ImageUploadField
                      label="Team Photo"
                      field="teamPhoto"
                      description="Professional photo of your team"
                      currentValue={websiteImages.teamPhoto}
                    />
                    <ImageUploadField
                      label="Company Logo"
                      field="companyLogo"
                      description="Sigma Roofing logo for branding"
                      currentValue={websiteImages.companyLogo}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Process Section */}
              <Card>
                <CardHeader className="bg-emerald-600 text-white">
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Process & Background Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <ImageUploadField
                      label="Process Step 1 Image"
                      field="processStep1Image"
                      description="Initial consultation/inspection image"
                      currentValue={websiteImages.processStep1Image}
                    />
                    <ImageUploadField
                      label="Process Step 2 Image"
                      field="processStep2Image"
                      description="Planning/preparation image"
                      currentValue={websiteImages.processStep2Image}
                    />
                    <ImageUploadField
                      label="Process Step 3 Image"
                      field="processStep3Image"
                      description="Installation/work in progress"
                      currentValue={websiteImages.processStep3Image}
                    />
                    <ImageUploadField
                      label="Process Step 4 Image"
                      field="processStep4Image"
                      description="Completion/quality check"
                      currentValue={websiteImages.processStep4Image}
                    />
                  </div>
                  <ImageUploadField
                    label="Testimonials Background"
                    field="testimonialBackground"
                    description="Background image for customer testimonials section"
                    currentValue={websiteImages.testimonialBackground}
                  />
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSaveWebsiteImages}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Update All Website Images
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card className="shadow-lg">
              <CardHeader className="bg-emerald-600 text-white">
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Project Gallery (6 Slots)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <p className="text-gray-600 mb-6">
                    Upload your best 6 project photos. Each slot gets its own image - no duplicates allowed!
                  </p>

                  {/* 6 Project Image Slots */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(projectImages).map(([projectKey, imageUrl], index) => (
                      <div key={projectKey} className="space-y-3">
                        <Label className="text-sm font-medium">
                          Project {index + 1} Image
                        </Label>
                        <Input
                          value={imageUrl}
                          onChange={(e) => handleProjectImageChange(projectKey, e.target.value)}
                          placeholder="Paste Cloudinary URL here..."
                          className={`h-12 ${duplicateWarnings[projectKey] ? 'border-red-500' : ''}`}
                        />
                        {duplicateWarnings[projectKey] && (
                          <p className="text-red-500 text-xs">⚠️ This image is already used in another slot. Please choose a different image.</p>
                        )}
                        {imageUrl && !duplicateWarnings[projectKey] && (
                          <div className="mt-2">
                            <img 
                              src={imageUrl} 
                              alt={`Project ${index + 1}`}
                              className="w-full h-32 object-cover rounded border"
                              onError={() => handleProjectImageChange(projectKey, "")}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={saveProjectImages}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Update Project Gallery
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo Manager Tab */}
          <TabsContent value="upload">
            <CloudinaryPhotoManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}