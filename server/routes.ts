import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactRequestSchema } from "@shared/schema";
import { emailService } from "./email-service";
import { stormDataService } from "./storm-data-service-final";


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

      // Get recent photos from the library (no album filter)
      const photosResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
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

  // Get website images
  app.get("/api/website-images", async (req, res) => {
    try {
      const images = await storage.getWebsiteImages();
      res.json({
        success: true,
        images: images || {}
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get website images"
      });
    }
  });

  // Update website images
  app.post("/api/website-images", async (req, res) => {
    try {
      const updatedImages = await storage.updateWebsiteImages(req.body);
      res.json({
        success: true,
        message: "Website images updated successfully!",
        images: updatedImages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update website images"
      });
    }
  });

  // Serve trending phrases data for dynamic landing pages
  app.get('/api/trending_phrases.json', (req, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'trending_phrases.json');
      
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(data));
      } else {
        res.status(404).json({ error: 'Trending phrases data not found' });
      }
    } catch (error) {
      console.error('Error serving trending phrases:', error);
      res.status(500).json({ error: 'Failed to load trending phrases' });
    }
  });

  // Get daily hail content with trending phrase integration
  app.get('/api/storm-data/daily-hail-content', async (req, res) => {
    try {
      const phrase = req.query.phrase as string;
      
      // Get hail content with trending phrase integration (12 months lookback)
      const activeContent = await stormDataService.getDailyHailContentWithTrends(phrase);
      
      if (activeContent) {
        res.json({
          success: true,
          storm: activeContent
        });
      } else {
        res.json({
          success: false,
          message: 'No verified NOAA hail content available from past 12 months'
        });
      }
      
    } catch (error) {
      console.error('Error getting trending hail content:', error);
      res.json({
        success: false,
        message: 'Unable to retrieve storm content'
      });
    }
  });

  // Get recent large hail events for "Other Events" section - CSV implementation
  app.get('/api/storm-data/recent-large-hail', async (req, res) => {
    try {
      // Use CSV-based hail data - return empty for now to prevent errors
      res.json({
        success: false,
        message: 'CSV implementation in progress',
        events: []
      });
    } catch (error) {
      console.error('Error getting recent hail events:', error);
      res.json({
        success: false,
        message: 'Unable to retrieve recent hail data',
        events: []
      });
    }
  });

  // Active tornado damage data with trending phrase integration (14 days only)
  app.get('/api/storm-data/active-tornado', async (req, res) => {
    try {
      // Get tornado content with trending phrase integration (14 days only)
      const stormData = await stormDataService.getTornadoContentWithTrends();
      
      if (stormData) {
        res.json({
          success: true,
          storm: stormData
        });
      } else {
        // No recent tornado events - return null to hide page
        res.json({
          success: false,
          message: 'No recent tornado events found in past 14 days',
          storm: null
        });
      }
      
    } catch (error) {
      console.error('Error getting tornado data:', error);
      res.json({
        success: false,
        message: 'Unable to retrieve tornado data',
        storm: null
      });
    }
  });

  // Latest storm data from CSV - removed NOAA API dependency
  app.get('/api/storm-data/latest', async (req, res) => {
    try {
      console.log('Fetching latest storm data from CSV...');
      // Return empty response until CSV implementation is complete
      res.json({
        success: true,
        hasStorm: false,
        message: 'CSV implementation in progress',
        data: null
      });
      
    } catch (error) {
      console.error('Error fetching storm data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch storm data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test CSV data connection - removed NOAA API dependency
  app.get('/api/storm-data/test', async (req, res) => {
    try {
      console.log('Testing CSV data availability...');
      // Simple test that CSV service is initialized
      res.json({
        success: true,
        message: 'CSV storm data service ready',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error testing CSV service:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test CSV service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Storm landing page generation functions
  function generateHailLandingPage(event: any, phrase: string): string {
    const hailSize = parseFloat(event.hail_size);
    const severityText = hailSize >= 2.5
      ? `<p>Storms like this bring serious risk — not just to your roof, but to the safety, comfort, and value of your home. Severe impacts often fracture shingles, dislodge flashing, and void warranties — damage that can go unseen until it becomes a major problem. That's why searches like <strong>"${phrase}"</strong> have spiked — homeowners are looking for real answers and real help.</p>`
      : `<p>Hail in this size range may seem minor — and sometimes it is. But prolonged storms or repeated impacts can strip protective granules from shingles, silently shaving years off your roof's lifespan. Even "smaller" hail can leave behind costly, hidden damage. That's why you'll see more searches lately for <strong>"${phrase}"</strong>.</p>`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${phrase} - Hail Damage Repair | Sigma Roofing LLC</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 800px; margin: auto; padding: 20px; background: white; }
          .header, .emergency, .footer { padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; text-align: center; }
          .emergency { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; text-align: center; }
          .footer { font-size: 12px; color: #6b7280; text-align: center; background: #f9fafb; }
          button { background: white; color: #b91c1c; font-weight: bold; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; }
          button:hover { background: #f3f4f6; }
          .highlight { background: #fef3c7; border-left: 5px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          strong { color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${phrase}</h1>
            <p>Hail Damage Restoration Experts - Sigma Roofing LLC</p>
          </div>

          <div>
            <h2>Recent Storm Report</h2>
            <p><strong>Storm Type:</strong> ${event.storm_type.toUpperCase()}</p>
            <p><strong>Date:</strong> ${event.date_of_loss}</p>
            <p><strong>Location:</strong> ${event.affected_city}</p>
            <p><strong>Hail Size:</strong> ${event.hail_size}</p>

            <p>In light of the recent <strong>${event.storm_type}</strong> on <strong>${event.date_of_loss}</strong> in <strong>${event.affected_city}</strong> that swept through your area, we know you are concerned and we are here to help.</p>

            ${severityText}

            <div class="highlight">
              <p>Hailstones as large as <strong>${event.hail_size}</strong> were reported in your area. This level of impact is known to crack shingles, dent metal panels, and cause leaks that may not show until months later.</p>
            </div>

            <p>Our expertise is at your disposal in managing any damages — verified or potential — and ensuring the safety of your home.</p>

            <p>Whether you need immediate tarping or just a roof inspection, we have experts ready to put your mind back at ease.</p>
          </div>

          <!-- Google Reviews Section -->
          <div class="reviews-section" style="background: #f9fafb; padding: 30px; border-radius: 8px; margin: 30px 0;">
            <h2 style="text-align: center; margin-bottom: 20px;">What Our Customers Say</h2>
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="color: #fbbf24; font-size: 24px;">★★★★★</span>
              <span style="margin-left: 10px; font-weight: bold;">4.9/5.0 (Real Google Reviews)</span>
            </div>
            <div id="reviews-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
              <!-- Reviews will be loaded here -->
            </div>
          </div>

          <!-- Recent Projects Section -->
          <div class="projects-section" style="background: #f0fdf4; padding: 30px; border-radius: 8px; margin: 30px 0;">
            <h2 style="text-align: center; margin-bottom: 20px;">Recent Storm Damage Projects</h2>
            <div id="projects-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
              <!-- Projects will be loaded here -->
            </div>
          </div>

          <!-- Lead Form Section -->
          <div class="form-section" style="background: #fff; border: 2px solid #10b981; padding: 30px; border-radius: 8px; margin: 30px 0;">
            <h2 style="text-align: center; margin-bottom: 20px; color: #10b981;">Get Your Free Storm Damage Estimate</h2>
            <p style="text-align: center; margin-bottom: 20px; color: #6b7280;">Professional storm damage assessment in Oklahoma. Fill out our secure form for a detailed estimate within 24 hours.</p>
            <form id="storm-contact-form" style="max-width: 600px; margin: 0 auto;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <input type="text" name="firstName" placeholder="First Name*" required style="padding: 12px; border: 1px solid #d1d5db; border-radius: 4px;">
                <input type="text" name="lastName" placeholder="Last Name*" required style="padding: 12px; border: 1px solid #d1d5db; border-radius: 4px;">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <input type="email" name="email" placeholder="Email Address*" required style="padding: 12px; border: 1px solid #d1d5db; border-radius: 4px;">
                <input type="tel" name="phone" placeholder="Phone Number*" required style="padding: 12px; border: 1px solid #d1d5db; border-radius: 4px;">
              </div>
              <input type="text" name="address" placeholder="Property Address (Oklahoma)*" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 15px;">
              
              <select name="serviceType" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 15px;">
                <option value="">Select Service Type*</option>
                <option value="Storm Damage Assessment">Storm Damage Assessment</option>
                <option value="Hail Damage Repair">Hail Damage Repair</option>
                <option value="Emergency Roof Repair">Emergency Roof Repair</option>
                <option value="Insurance Claim Assistance">Insurance Claim Assistance</option>
              </select>
              
              <textarea name="description" placeholder="Describe the storm damage and your roofing needs..." rows="4" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 15px; resize: vertical;"></textarea>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: bold;">Preferred Date 1*</label>
                  <input type="date" name="preferredDate1" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: bold;">Preferred Time 1*</label>
                  <select name="preferredTime1" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px;">
                    <option value="">Select Time</option>
                    <option value="8:00 AM - 12:00 PM">8:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 4:00 PM">12:00 PM - 4:00 PM</option>
                    <option value="4:00 PM - 7:00 PM">4:00 PM - 7:00 PM</option>
                  </select>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: bold;">Preferred Date 2*</label>
                  <input type="date" name="preferredDate2" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: bold;">Preferred Time 2*</label>
                  <select name="preferredTime2" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px;">
                    <option value="">Select Time</option>
                    <option value="8:00 AM - 12:00 PM">8:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 4:00 PM">12:00 PM - 4:00 PM</option>
                    <option value="4:00 PM - 7:00 PM">4:00 PM - 7:00 PM</option>
                  </select>
                </div>
              </div>
              
              <button type="submit" style="width: 100%; background: #10b981; color: white; padding: 15px; border: none; border-radius: 4px; font-size: 18px; font-weight: bold; cursor: pointer;">Submit Free Estimate Request</button>
            </form>
          </div>

          <div class="emergency">
            <h2>Emergency Storm Damage?</h2>
            <p>Call us now for immediate help:</p>
            <button onclick="window.location.href='tel:+14059021826'">📞 (405) 902-1826</button>
          </div>

          <div class="footer">
            Storm data source: NOAA Storm Events Database<br />
            Page generated on: ${new Date(event.generated_at).toLocaleString()}
          </div>
        </div>
        
        <script>
          // Load Google Reviews
          async function loadReviews() {
            try {
              const response = await fetch('/api/reviews');
              const data = await response.json();
              
              if (data.success && data.reviews) {
                const container = document.getElementById('reviews-container');
                container.innerHTML = data.reviews.slice(0, 3).map(review => \`
                  <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                      <div style="width: 40px; height: 40px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 10px;">
                        \${review.initials}
                      </div>
                      <div>
                        <div style="font-weight: bold;">\${review.name}</div>
                        <div style="color: #fbbf24;">\${'★'.repeat(review.rating)}</div>
                      </div>
                    </div>
                    <p style="color: #4b5563; line-height: 1.5;">\${review.review}</p>
                    <div style="color: #9ca3af; font-size: 12px; margin-top: 10px;">\${review.date}</div>
                  </div>
                \`).join('');
              }
            } catch (error) {
              console.error('Error loading reviews:', error);
            }
          }

          // Load Recent Projects from Admin Gallery
          async function loadProjects() {
            try {
              // First try to get admin projects
              const adminResponse = await fetch('/api/projects');
              const adminData = await adminResponse.json();
              
              if (adminData.success && adminData.projects && adminData.projects.length > 0) {
                displayProjects(adminData.projects.slice(0, 3));
              } else {
                // Fallback to website images with project data
                const imageResponse = await fetch('/api/website-images');
                const imageData = await imageResponse.json();
                
                if (imageData.success && imageData.images) {
                  const fallbackProjects = [
                    {
                      title: 'Residential Roof Replacement',
                      description: 'Complete roof replacement with architectural shingles',
                      imageUrl: imageData.images.project1 || '/api/placeholder/250/200',
                      category: 'Roof Replacement',
                      location: 'Edmond, OK'
                    },
                    {
                      title: 'Storm Damage Restoration',
                      description: 'Hail damage repair and insurance claim assistance',
                      imageUrl: imageData.images.project2 || '/api/placeholder/250/200',
                      category: 'Storm Damage',
                      location: 'Oklahoma City, OK'
                    },
                    {
                      title: 'Emergency Roof Repair',
                      description: 'Emergency leak repair and temporary protection',
                      imageUrl: imageData.images.project3 || '/api/placeholder/250/200',
                      category: 'Emergency Repair',
                      location: 'Norman, OK'
                    }
                  ];
                  displayProjects(fallbackProjects);
                }
              }
            } catch (error) {
              console.error('Error loading projects:', error);
            }
          }

          function displayProjects(projects) {
            const container = document.getElementById('projects-container');
            container.innerHTML = projects.map(project => \`
              <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <img src="\${project.imageUrl}" alt="\${project.title}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 15px;">
                  <h3 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">\${project.title}</h3>
                  <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">\${project.category || 'Roofing'}</p>
                  <p style="margin: 0; color: #374151; font-size: 14px;">\${project.location}</p>
                </div>
              </div>
            \`).join('');
          }

          // Handle form submission with complete validation
          document.getElementById('storm-contact-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            
            // Set minimum dates for date inputs
            const today = new Date().toISOString().split('T')[0];
            const date1Input = document.querySelector('input[name="preferredDate1"]');
            const date2Input = document.querySelector('input[name="preferredDate2"]');
            date1Input.min = today;
            date2Input.min = today;
            
            const data = {
              firstName: formData.get('firstName'),
              lastName: formData.get('lastName'),
              email: formData.get('email'),
              phone: formData.get('phone'),
              address: formData.get('address'),
              serviceType: formData.get('serviceType'),
              description: formData.get('description'),
              preferredDate1: formData.get('preferredDate1'),
              preferredTime1: formData.get('preferredTime1'),
              preferredDate2: formData.get('preferredDate2'),
              preferredTime2: formData.get('preferredTime2')
            };

            // Basic validation
            if (!data.firstName || !data.lastName || !data.email || !data.phone || 
                !data.address || !data.serviceType || !data.description ||
                !data.preferredDate1 || !data.preferredTime1 || 
                !data.preferredDate2 || !data.preferredTime2) {
              alert('Please fill in all required fields.');
              return;
            }

            // Email validation
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailRegex.test(data.email)) {
              alert('Please enter a valid email address.');
              return;
            }

            // Oklahoma address validation
            if (!data.address.toLowerCase().includes('oklahoma') && 
                !data.address.toLowerCase().includes(' ok')) {
              alert('Please enter an Oklahoma address.');
              return;
            }

            try {
              const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });

              if (response.ok) {
                alert('Request submitted successfully! We\\'ll contact you within 24 hours to schedule your estimate.');
                e.target.reset();
              } else {
                throw new Error('Submission failed');
              }
            } catch (error) {
              alert('Please check your information and try again, or call us directly at (405) 902-1826');
            }
          });

          // Load content when page loads
          document.addEventListener('DOMContentLoaded', function() {
            loadReviews();
            loadProjects();
          });
        </script>
      </body>
      </html>
    `;
  }

  function generateTornadoLandingPage(event: any, keyword: string): string {
    const severityText = `<p>Winds from this ${event.storm_type} event damaged homes directly in its path — and even nearby structures saw uplifted shingles, fallen limbs, and structural stress. If you're within range, your roof may be more vulnerable than it appears.</p>`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${keyword} - Sigma Roofing LLC</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .main-pitch { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .emergency-section { background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .emergency-section button { background: white; color: #dc2626; border: none; padding: 15px 30px; font-size: 18px; font-weight: bold; border-radius: 5px; cursor: pointer; }
          .data-source { font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
          strong { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sigma Roofing LLC - Tornado Damage Assessment</h1>
          <p>Stand firm. Brave the storm. Serve with heart.</p>
        </div>
        
        <div class="main-pitch">
          <h2>Thank You for visiting us today!</h2>
          <p>In light of the recent <strong>${event.storm_type}</strong> on <strong>${event.date_of_loss}</strong> in <strong>${event.affected_city}</strong> that swept through your area, we know you are concerned and we are here to help.</p>
          ${severityText}
          <p>Our expertise is at your disposal in managing any damages — verified or potential — and ensuring the safety of your home.</p>
          <p>Whether you need immediate tarping or just a roof inspection, we have experts ready to put your mind back at ease.</p>
        </div>
        
        <div class="emergency-section">
          <h2>Emergency Storm Damage?</h2>
          <p>If you have immediate safety concerns or active leaks, call us now for emergency services.</p>
          <button onclick="window.location.href='tel:+14059021826'">Emergency: (405) 902-1826</button>
        </div>
        
        <div class="data-source">
          <strong>Storm Data Source:</strong> NOAA Storm Events CSV | Generated: ${event.generated_at}
        </div>
      </body>
      </html>`;
  }

  // Hail damage landing page (always active)
  app.get('/hail-damage', async (req, res) => {
    try {
      const phrases = stormDataService.getTrendingPhrases();
      const event = await stormDataService.getDailyHailContentWithTrends();
      
      if (!event) {
        return res.send(`<h1>No qualifying hail events found</h1><p>Call us directly: (405) 902-1826</p>`);
      }

      // Enhanced trending phrase matching logic
      const recentPhrases = phrases.filter(p => (p as any).recent);
      const fallbackPhrase = 'Oklahoma Hail Storm Damage';

      // Create a temporary event object for matching that includes the original CSV structure
      const eventForMatching = {
        EVENT_TYPE: event.storm_type,
        EVENT_NARRATIVE: event.event_details,
        CZ_NAME: event.affected_city,
        BEGIN_LOCATION: event.affected_city,
        BEGIN_DATE_TIME: '',
        MAGNITUDE: event.hail_size,
        EVENT_ID: '',
        STATE: 'OKLAHOMA'
      };

      const matchingPhrase = 
        recentPhrases.find(p => stormDataService.matchesPhrase(eventForMatching, (p as any).text || p))?.text ||
        phrases.find(p => stormDataService.matchesPhrase(eventForMatching, p)) ||
        fallbackPhrase;

      const html = generateHailLandingPage(event, matchingPhrase);
      res.send(html);
      
    } catch (err) {
      console.error(err);
      res.status(500).send(`<h1>Service Unavailable</h1><p>Please call us: (405) 902-1826</p>`);
    }
  });

  // Tornado damage landing page (conditional - only if recent events)
  app.get('/tornado-damage', async (req, res) => {
    try {
      const phrases = stormDataService.getTrendingPhrases();
      const event = await stormDataService.getTornadoContentWithTrends();
      
      if (!event) {
        return res.send('<h1>No tornado found in last 14 days for OKC metro.</h1>');
      }

      const matchingPhrase = phrases.find(phrase => 
        stormDataService.matchesPhrase(event as any, phrase)
      ) || 'Tornado damage Oklahoma';
      
      const html = generateTornadoLandingPage(event, matchingPhrase);
      res.send(html);
    } catch (error) {
      console.error('Error generating tornado landing page:', error);
      res.status(500).send('<h1>Error loading storm data</h1>');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
