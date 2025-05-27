import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function CloudinaryPhotoManager() {
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const uploadedUrls: string[] = [];

      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'sigma_roofing'); // We'll create this preset
        formData.append('folder', 'sigma-roofing/projects');

        // Get cloud name from environment variables
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) {
          throw new Error('Cloudinary cloud name not configured');
        }

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.secure_url);
          
          toast({
            title: "Success",
            description: `${file.name} uploaded successfully!`
          });
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
      
      setUploadedPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Upload Error",
        description: "Please check your Cloudinary settings and try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Project Photo Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="photo-upload">Upload Project Photos</Label>
            <Input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload your roofing project photos to showcase your work
            </p>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Upload className="h-4 w-4 animate-spin" />
              Uploading photos to Cloudinary...
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to set up Cloudinary:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Create an unsigned upload preset called "sigma_roofing"</li>
              <li>2. Set folder to "sigma-roofing/projects"</li>
              <li>3. Enable auto-optimization for best performance</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {uploadedPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Uploaded ({uploadedPhotos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedPhotos.map((photoUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photoUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/')}
                    alt={`Project photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}