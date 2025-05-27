import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, Copy, Check } from 'lucide-react';

export default function CloudinaryPhotoManager() {
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const copyToClipboard = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      toast({
        title: "URL Copied!",
        description: "The Cloudinary URL has been copied to your clipboard. You can now paste it in the Website Images or Project Gallery tabs.",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the URL from the text field below.",
        variant: "destructive",
      });
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
            <div className="space-y-4">
              {uploadedPhotos.map((photoUrl, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <img
                      src={photoUrl.replace('/upload/', '/upload/w_200,h_150,c_fill/')}
                      alt={`Project photo ${index + 1}`}
                      className="w-32 h-24 object-cover rounded border"
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Photo {index + 1} - Cloudinary URL:
                        </Label>
                        <div className="mt-1 flex gap-2">
                          <Input
                            value={photoUrl}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            onClick={() => copyToClipboard(photoUrl, index)}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy URL
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Copy this URL and paste it into the Website Images tab or Project Gallery tab
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}