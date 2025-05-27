import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactRequestSchema } from "@shared/schema";
import { emailService } from "./email-service";


export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactRequestSchema.parse(req.body);
      const contactRequest = await storage.createContactRequest(validatedData);
      
      // Send email notification for new lead
      try {
        await emailService.sendLeadNotification(contactRequest);
        console.log(`Email notification sent for lead: ${contactRequest.firstName} ${contactRequest.lastName}`);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the request if email fails - lead is still saved
      }
      
      res.json({ 
        success: true, 
        message: "Thank you for your inquiry! We'll contact you within 24 hours.",
        id: contactRequest.id 
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(400).json({ 
        success: false, 
        message: "Please check your form data and try again." 
      });
    }
  });

  // Get contact requests (for admin purposes)
  app.get("/api/contact-requests", async (req, res) => {
    try {
      const requests = await storage.getContactRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching contact requests:", error);
      res.status(500).json({ message: "Failed to fetch contact requests" });
    }
  });

  // Google Places Autocomplete for Oklahoma addresses
  app.get("/api/address-suggestions", async (req, res) => {
    try {
      const query = req.query.q as string;
      const apiKey = process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ success: false, message: "Google API key not configured" });
      }

      if (!query || query.length < 3) {
        return res.json({ success: true, suggestions: [] });
      }

      // Google Places Autocomplete API with Oklahoma restriction
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query + ' Oklahoma')}&types=address&key=${apiKey}`
      );
      
      const data = await response.json();
      
      console.log(`Address search for "${query}":`, data);
      
      if (data.status === "OK") {
        const suggestions = data.predictions?.slice(0, 5).map((pred: any) => ({
          formatted_address: pred.description,
          place_id: pred.place_id
        })) || [];
        
        console.log(`Found ${suggestions.length} suggestions`);
        
        res.json({ 
          success: true, 
          suggestions: suggestions 
        });
      } else {
        console.log('Places API error:', data.status, data.error_message);
        res.json({ success: true, suggestions: [] });
      }
      
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      res.json({ success: true, suggestions: [] });
    }
  });

  // Debug endpoint to check current domain
  app.get("/api/debug-domain", (req, res) => {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
    const fullUrl = `${protocol}://${host}`;
    
    console.log('=== DOMAIN DEBUG ===');
    console.log('Host:', host);
    console.log('Protocol:', protocol);
    console.log('Full URL:', fullUrl);
    console.log('Required redirect URI:', `${fullUrl}/api/google-photos/callback`);
    console.log('==================');
    
    res.json({
      host,
      protocol,
      fullUrl,
      redirectUri: `${fullUrl}/api/google-photos/callback`
    });
  });

  // Google Photos OAuth authentication URL
  app.get("/api/google-photos/auth-url", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        return res.status(500).json({ success: false, message: "OAuth Client ID not configured" });
      }

      const scopes = [
        'https://www.googleapis.com/auth/photoslibrary.readonly',
        'https://www.googleapis.com/auth/photoslibrary.appendonly'
      ].join(' ');

      // Get the domain from the request headers
      const host = req.get('host');
      const redirectUri = `https://${host}/api/google-photos/callback`;
      
      console.log('Redirect URI:', redirectUri);
      
      // Try a simpler OAuth flow to test basic authentication
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        state: Date.now().toString()
      });
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      console.log('Generated auth URL:', authUrl);
      console.log('Client ID being used:', clientId);
      console.log('Scopes requested:', scopes);

      res.setHeader('Cache-Control', 'no-cache');
      res.json({ authUrl, redirectUri, timestamp: Date.now() });
      
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ success: false, message: "Failed to generate auth URL" });
    }
  });

  // Google Photos OAuth callback
  app.get("/api/google-photos/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).send("Authorization code not provided");
      }

      // Get the domain from the request headers
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || 'https';

      // Exchange code for access token
      console.log('Token exchange - Client ID:', process.env.GOOGLE_CLIENT_ID);
      console.log('Token exchange - Has Client Secret:', !!process.env.GOOGLE_CLIENT_SECRET);
      console.log('Token exchange - Code received:', !!code);
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${protocol}://${host}/api/google-photos/callback`
        })
      });

      const tokenData = await tokenResponse.json();
      console.log('Token response status:', tokenResponse.status);
      console.log('Token response:', JSON.stringify(tokenData, null, 2));
      
      if (tokenData.access_token) {
        // Store token securely (in a real app, you'd use a database)
        // For now, we'll pass it to the client
        res.send(`
          <script>
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              token: '${tokenData.access_token}'
            }, '*');
            window.close();
          </script>
        `);
      } else {
        res.status(400).send("Failed to obtain access token");
      }
      
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Get all media items from Google Photos (without album filter)
  app.get("/api/google-photos/all-photos", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Access token required" });
      }

      const accessToken = authHeader.split(' ')[1];

      // First, let's test if we can access the API at all
      const testResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Test API call status:', testResponse.status);
      const testData = await testResponse.json();
      console.log('Test API response:', JSON.stringify(testData, null, 2));

      // Get recent photos from the library using POST method with request body
      const photosResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pageSize: 10
        })
      });

      const photosData = await photosResponse.json();
      
      console.log('Photos API Status:', photosResponse.status);
      console.log('All photos API response:', JSON.stringify(photosData, null, 2));
      
      // Check if we got an error response
      if (!photosResponse.ok) {
        console.error('Photos API Error:', photosData);
        return res.json({ 
          success: false, 
          message: `API Error: ${photosData.error?.message || 'Unknown error'}`,
          statusCode: photosResponse.status,
          debug: photosData 
        });
      }
      
      if (photosData.mediaItems) {
        const photos = photosData.mediaItems.slice(0, 10).map((item: any, index: number) => ({
          id: item.id,
          title: item.filename || `Photo ${index + 1}`,
          description: `Photo from your Google Photos library`,
          imageUrl: `${item.baseUrl}=w800-h600-c`,
          originalUrl: item.baseUrl
        }));

        res.json({ success: true, photos, total: photosData.mediaItems.length });
      } else {
        res.json({ 
          success: false, 
          message: "No photos found in your Google Photos library",
          debug: photosData 
        });
      }
      
    } catch (error) {
      console.error("Error accessing Google Photos:", error);
      res.status(500).json({ success: false, message: "Failed to access Google Photos" });
    }
  });

  // Google Photos integration for specific album
  app.get("/api/google-photos/:albumName", async (req, res) => {
    try {
      const { albumName } = req.params;
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Access token required" });
      }

      const accessToken = authHeader.split(' ')[1];

      // Search for albums with the specified name
      const albumsResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const albumsData = await albumsResponse.json();
      
      console.log('Albums API response:', JSON.stringify(albumsData, null, 2));
      
      if (!albumsData.albums) {
        return res.json({ 
          success: false, 
          message: "No albums found",
          debug: albumsData 
        });
      }

      console.log('Available albums:', albumsData.albums.map((a: any) => a.title));

      // Find the specific album (case insensitive)
      const targetAlbum = albumsData.albums.find((album: any) => 
        album.title.toLowerCase().includes(albumName.toLowerCase())
      );

      if (!targetAlbum) {
        return res.json({ 
          success: false, 
          message: `Album "${albumName}" not found. Available albums: ${albumsData.albums.map((a: any) => a.title).join(', ')}`,
          availableAlbums: albumsData.albums.map((a: any) => a.title)
        });
      }

      // Get photos from the album
      const photosResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          albumId: targetAlbum.id,
          pageSize: 10
        })
      });

      const photosData = await photosResponse.json();
      
      if (photosData.mediaItems) {
        const photos = photosData.mediaItems.map((item: any, index: number) => ({
          id: item.id,
          title: item.filename || `Photo ${index + 1}`,
          description: `Photo from ${albumName} folder`,
          imageUrl: `${item.baseUrl}=w800-h600-c`,
          originalUrl: item.baseUrl
        }));

        res.json({ success: true, photos });
      } else {
        res.json({ success: false, message: "No photos found in album" });
      }
      
    } catch (error) {
      console.error("Error accessing Google Photos:", error);
      res.status(500).json({ success: false, message: "Failed to access Google Photos" });
    }
  });

  // Google Business Profile photos for project gallery
  app.get("/api/business-photos", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      console.log("API Key present:", !!apiKey);
      
      if (!apiKey) {
        return res.status(500).json({ success: false, message: "Google API key not configured" });
      }

      const businessName = "BBAV ROOFING LLC";
      const businessAddress = "16612 N Western Avenue Edmond OK";
      const searchQuery = `${businessName} ${businessAddress}`;
      
      console.log("Searching for:", searchQuery);
      
      // First, find the place
      const findResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name&key=${apiKey}`
      );
      
      const findData = await findResponse.json();
      console.log("Search response:", findData);
      
      if (findData.status !== "OK" || !findData.candidates?.length) {
        return res.json({ success: false, message: "Business not found" });
      }
      
      const placeId = findData.candidates[0].place_id;
      console.log("Found place ID:", placeId);
      
      // Get place details including photos
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,photos&key=${apiKey}`
      );
      
      const detailsData = await detailsResponse.json();
      console.log("Place details response:", detailsData);
      console.log("Photos available:", detailsData.result?.photos?.length || 0);
      
      if (detailsData.status === "OK" && detailsData.result?.photos) {
        const photos = detailsData.result.photos.slice(0, 6).map((photo: any, index: number) => ({
          id: index + 1,
          title: `Roofing Project ${index + 1}`,
          description: "Professional roofing work completed by Sigma Roofing LLC",
          imageUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`,
          category: index % 2 === 0 ? "Residential" : "Commercial"
        }));
        
        res.json({ 
          success: true, 
          photos: photos 
        });
      } else {
        res.json({ success: false, message: "No photos found" });
      }
      
    } catch (error) {
      console.error("Error fetching business photos:", error);
      res.status(500).json({ success: false, message: "Failed to fetch photos" });
    }
  });

  // Google Business Profile reviews for BBAV Roofing LLC
  app.get("/api/reviews", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      console.log("API Key present:", !!apiKey);
      
      if (!apiKey) {
        return res.status(500).json({ success: false, message: "Google Business API key not configured" });
      }

      // Try direct search for BBAV Roofing LLC in Edmond, OK
      const searchQuery = "BBAV ROOFING LLC 16612 N Western Avenue Edmond OK";
      console.log("Searching for:", searchQuery);
      
      const searchResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name&key=${apiKey}`
      );
      
      const searchData = await searchResponse.json();
      console.log("Search response:", searchData);
      
      if (searchData.status !== "OK" || !searchData.candidates.length) {
        // If specific business not found, let's try a broader search
        const broaderSearch = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent("BBAV ROOFING LLC Edmond Oklahoma")}&key=${apiKey}`
        );
        
        const broaderData = await broaderSearch.json();
        console.log("Broader search response:", broaderData);
        
        if (broaderData.status !== "OK" || !broaderData.results.length) {
          throw new Error(`Business not found in Google Places. Status: ${searchData.status}`);
        }
        
        const placeId = broaderData.results[0].place_id;
        console.log("Found place ID:", placeId);
        
        // Get reviews using the place_id
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`
        );
        
        const data = await response.json();
        console.log("Place details response:", data);
        
        if (data.status !== "OK") {
          throw new Error(`Google API status: ${data.status}`);
        }
        
        const reviews = data.result.reviews || [];
        const formattedReviews = reviews.map((review: any) => ({
          name: review.author_name,
          role: "Verified Customer", 
          rating: review.rating,
          review: review.text,
          date: new Date(review.time * 1000).toLocaleDateString(),
          initials: review.author_name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        }));
        
        res.json({ 
          success: true, 
          reviews: formattedReviews,
          businessRating: data.result.rating || 5.0,
          totalReviews: data.result.user_ratings_total || reviews.length,
          businessName: data.result.name
        });
      } else {
        const placeId = searchData.candidates[0].place_id;
        console.log("Found place ID:", placeId);
        
        // Get reviews using the place_id
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`
        );
        
        const data = await response.json();
        console.log("Place details response:", data);
        
        if (data.status !== "OK") {
          throw new Error(`Google API status: ${data.status}`);
        }
        
        const reviews = data.result.reviews || [];
        const formattedReviews = reviews.map((review: any) => ({
          name: review.author_name,
          role: "Verified Customer",
          rating: review.rating,
          review: review.text,
          date: new Date(review.time * 1000).toLocaleDateString(),
          initials: review.author_name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        }));
        
        res.json({ 
          success: true, 
          reviews: formattedReviews,
          businessRating: data.result.rating || 5.0,
          totalReviews: data.result.user_ratings_total || reviews.length,
          businessName: data.result.name
        });
      }
      
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ 
        success: false, 
        message: "Unable to fetch reviews from Google Business Profile",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
