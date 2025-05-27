import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage, getProjectPhotos } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';

export default function FirebasePhotoManager() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load existing photos
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const photoUrls = await getProjectPhotos();
      setPhotos(photoUrls);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast({
        title: "Error",
        description: "Failed to load photos from Firebase Storage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        // Create a unique filename
        const fileName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `project-photos/${fileName}`);
        
        // Upload file
        await uploadBytes(storageRef, file);
        
        toast({
          title: "Success",
          description: `${file.name} uploaded successfully!`
        });
      }
      
      // Reload photos after upload
      await loadPhotos();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const deletePhoto = async (photoUrl: string) => {
    try {
      // Extract the path from the URL to create a reference
      const urlParts = photoUrl.split('/');
      const pathWithToken = urlParts[urlParts.length - 1];
      const fileName = pathWithToken.split('?')[0];
      
      const photoRef = ref(storage, `project-photos/${fileName}`);
      await deleteObject(photoRef);
      
      toast({
        title: "Success",
        description: "Photo deleted successfully!"
      });
      
      // Reload photos
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Firebase Photo Manager
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
              Select multiple images to upload to Firebase Storage
            </p>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Upload className="h-4 w-4 animate-spin" />
              Uploading photos...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Photos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading photos...</div>
          ) : photos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No photos uploaded yet. Upload some photos above!
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photoUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`Project photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deletePhoto(photoUrl)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}