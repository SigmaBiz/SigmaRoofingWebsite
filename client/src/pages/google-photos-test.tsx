import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Image, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GooglePhotosTest() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [redirectUri, setRedirectUri] = useState<string>("");

  const initiateGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-photos/auth-url');
      const data = await response.json();
      
      // Show the user the redirect URI that needs to be added
      if (data.redirectUri) {
        setRedirectUri(data.redirectUri);
        toast({
          title: "Add this to Google Cloud Console",
          description: `Redirect URI: ${data.redirectUri}`,
          duration: 10000,
        });
      }
      
      if (data.authUrl) {
        // Open OAuth window in a way that bypasses cache
        const authWindow = window.open(data.authUrl, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        // Listen for auth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            setAccessToken(event.data.token);
            setIsConnected(true);
            authWindow?.close();
            window.removeEventListener('message', handleMessage);
            
            toast({
              title: "Authentication Successful!",
              description: "Connected to Google Photos successfully.",
            });
            
            // First try to load any photos from the library
            loadAllPhotos(event.data.token);
            // Then try the Home Page folder
            loadHomePagePhotos(event.data.token);
          }
        };
        
        window.addEventListener('message', handleMessage);
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

  const loadAllPhotos = async (token: string) => {
    try {
      const response = await fetch('/api/google-photos/all-photos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.photos) {
        setPhotos(data.photos);
        toast({
          title: "Photos Found!",
          description: `Found ${data.photos.length} photos in your Google Photos library (showing first 10).`,
        });
      } else {
        toast({
          title: "No Photos Found",
          description: data.message || "No photos found in your Google Photos library.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Load Photos",
        description: "Unable to access your Google Photos library.",
        variant: "destructive",
      });
    }
  };

  const loadHomePagePhotos = async (token: string) => {
    try {
      const response = await fetch('/api/google-photos/Home Page', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.photos) {
        setPhotos(data.photos);
        toast({
          title: "Photos Loaded!",
          description: `Found ${data.photos.length} photos in your Home Page folder.`,
        });
      } else {
        toast({
          title: "No Photos Found",
          description: data.message || "No photos found in Home Page folder.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Load Photos",
        description: "Unable to access your Google Photos Home Page folder.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Photos Integration Test</h1>
          <p className="text-gray-600">Connect your Google Photos to access your "Home Page" folder</p>
        </div>

        {/* Authentication Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Google Photos Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Connect to your Google Photos to access images from your "Home Page" folder.
                </p>
                <Button 
                  onClick={initiateGoogleAuth}
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
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center text-green-600 mb-2">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="font-medium">Successfully connected to Google Photos!</span>
                </div>
                <p className="text-gray-600">
                  You can now access photos from your Google Photos library.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos Display */}
        {photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="w-5 h-5 mr-2" />
                Photos from "Home Page" Folder ({photos.length} found)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <img 
                      src={photo.imageUrl} 
                      alt={photo.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        console.log('Failed to load image:', photo.imageUrl);
                      }}
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{photo.title}</h3>
                      <p className="text-sm text-gray-600">{photo.description}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          toast({
                            title: "Image URL Copied!",
                            description: "You can use this image on your website.",
                          });
                          navigator.clipboard.writeText(photo.imageUrl);
                        }}
                      >
                        Copy Image URL
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Redirect URI Display */}
        {redirectUri && (
          <Card className="mt-8 bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-yellow-900 mb-3">🔧 Google Cloud Console Setup Required</h3>
              <div className="bg-white p-4 rounded border text-sm font-mono break-all mb-3">
                {redirectUri}
              </div>
              <p className="text-yellow-800 text-sm mb-2">
                <strong>Add this redirect URI to your Google Cloud Console:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-yellow-800 text-sm">
                <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
                <li>Click on your OAuth 2.0 Client ID</li>
                <li>Under "Authorized redirect URIs", add the URL above</li>
                <li>Save the changes</li>
                <li>Try connecting again</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              <li>Make sure you have a Google Photos album named "Home Page"</li>
              <li>Add your best roofing/hero images to that album</li>
              <li>Click "Connect Google Photos" above to authenticate</li>
              <li>Your photos will automatically load and be available for your website</li>
              <li>Copy the image URLs to use them as hero images</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}