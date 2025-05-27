import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GooglePhotosAuthProps {
  onPhotosLoaded: (photos: any[]) => void;
  albumName: string;
}

export default function GooglePhotosAuth({ onPhotosLoaded, albumName }: GooglePhotosAuthProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>("");

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/google-photos/auth-status');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      
      if (data.authenticated) {
        loadPhotos();
      }
    } catch (error) {
      console.log('Auth status check failed');
    }
  };

  const initiateAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-photos/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        // Open OAuth window
        window.open(data.authUrl, 'google-auth', 'width=500,height=600');
        
        // Listen for auth completion
        window.addEventListener('message', handleAuthMessage);
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to start Google Photos authentication.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleAuthMessage = (event: MessageEvent) => {
    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      setIsAuthenticated(true);
      loadPhotos();
      window.removeEventListener('message', handleAuthMessage);
      
      toast({
        title: "Authentication Successful!",
        description: "Connected to Google Photos successfully.",
      });
    }
  };

  const loadPhotos = async () => {
    try {
      const response = await fetch(`/api/google-photos/${albumName}`);
      const data = await response.json();
      
      if (data.success && data.photos) {
        onPhotosLoaded(data.photos);
        toast({
          title: "Photos Loaded!",
          description: `Found ${data.photos.length} photos in ${albumName} folder.`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Load Photos",
        description: "Unable to access your Google Photos album.",
        variant: "destructive",
      });
    }
  };

  if (isAuthenticated) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center text-green-700">
            <Check className="w-5 h-5 mr-2" />
            <span className="font-medium">Connected to Google Photos</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Loading photos from "{albumName}" folder...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-blue-900">
          <Camera className="w-5 h-5 mr-2" />
          Connect Google Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-blue-700 text-sm mb-4">
          Connect your Google Photos to automatically use images from your "{albumName}" folder on your website.
        </p>
        <Button 
          onClick={initiateAuth}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Connect Google Photos
            </>
          )}
        </Button>
        <p className="text-xs text-blue-600 mt-2">
          This will open a secure Google authentication window.
        </p>
      </CardContent>
    </Card>
  );
}