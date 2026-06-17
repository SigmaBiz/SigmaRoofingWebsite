import type { Express } from "express";
import { storage } from "./storage";
import { insertContactRequestSchema, insertSocialVideoSchema } from "@shared/schema";
import { emailService } from "./email-service";
import { stormDataService } from "./storm-data-service-final";
import { computeMeasurement, EstimateError } from "./estimate/measure";
import { priceEstimate } from "./estimate/pricing";
import { renderRoofSketch } from "./scripts/roof-sketch";
import { getReviews } from "./reviews";
import { logQuoteLead } from "./leads";


export async function registerRoutes(app: Express): Promise<Express> {
  // ---- SEO: real crawlable robots.txt + sitemap.xml (registered BEFORE the SPA catch-all so they serve as files) ----
  const SITE = "https://oksigma.com";
  const SITEMAP_PAGES = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/estimate", priority: "0.9", changefreq: "weekly" },
    { path: "/hail-damage", priority: "0.7", changefreq: "monthly" },
    { path: "/tornado-damage", priority: "0.7", changefreq: "monthly" },
    // "/social" (SocHub) omitted from the sitemap until it has videos — don't let Google index an empty page (Antonio, 2026-06-16)
    { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
    { path: "/terms-of-service", priority: "0.3", changefreq: "yearly" },
  ];
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  });
  app.get("/sitemap.xml", (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const urls = SITEMAP_PAGES.map(
      (p) => `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    ).join("\n");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  });

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

  // Google Places Autocomplete for Oklahoma addresses - MVP3 Enhanced
  app.get("/api/address-suggestions", async (req, res) => {
    try {
      const query = req.query.q as string;
      const apiKey = process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        console.log('Google API key not configured - using fallback suggestions');
        
        // Provide enhanced fallback suggestions for Oklahoma immediately
        const fallbackSuggestions = [
          { formatted_address: "Oklahoma City, OK, USA", place_id: "fallback_okc", main_text: "Oklahoma City", secondary_text: "OK, USA" },
          { formatted_address: "Edmond, OK, USA", place_id: "fallback_edmond", main_text: "Edmond", secondary_text: "OK, USA" },
          { formatted_address: "Norman, OK, USA", place_id: "fallback_norman", main_text: "Norman", secondary_text: "OK, USA" },
          { formatted_address: "Moore, OK, USA", place_id: "fallback_moore", main_text: "Moore", secondary_text: "OK, USA" },
          { formatted_address: "Midwest City, OK, USA", place_id: "fallback_mwc", main_text: "Midwest City", secondary_text: "OK, USA" },
          { formatted_address: "Yukon, OK, USA", place_id: "fallback_yukon", main_text: "Yukon", secondary_text: "OK, USA" },
          { formatted_address: "Mustang, OK, USA", place_id: "fallback_mustang", main_text: "Mustang", secondary_text: "OK, USA" },
          { formatted_address: "Deer Creek, OK, USA", place_id: "fallback_deer_creek", main_text: "Deer Creek", secondary_text: "OK, USA" }
        ].filter(city => 
          city.main_text.toLowerCase().includes(query.toLowerCase()) ||
          city.formatted_address.toLowerCase().includes(query.toLowerCase())
        );
        
        console.log(`⚠️ No Google API key - returning ${fallbackSuggestions.length} fallback suggestions for "${query}"`);
        
        return res.json({ 
          success: true, 
          suggestions: fallbackSuggestions,
          source: 'fallback',
          message: 'Using local suggestions - add Google API key for enhanced results'
        });
      }

      if (!query || query.length < 1) {
        return res.json({ success: true, suggestions: [] });
      }

      // Enhanced Google Places Autocomplete API call
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.set('input', `${query} Oklahoma`);
      url.searchParams.set('types', 'address');
      url.searchParams.set('components', 'country:us');
      url.searchParams.set('key', apiKey);
      
      console.log(`Fetching addresses for: "${query}"`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Google API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "OK") {
        const suggestions = data.predictions?.slice(0, 8).map((pred: any) => ({
          formatted_address: pred.description,
          place_id: pred.place_id,
          main_text: pred.structured_formatting?.main_text || pred.description,
          secondary_text: pred.structured_formatting?.secondary_text || ''
        })) || [];
        
        console.log(`✅ Found ${suggestions.length} Google Places suggestions`);
        
        res.json({ 
          success: true, 
          suggestions: suggestions,
          source: 'google_places'
        });
      } else if (data.status === "ZERO_RESULTS") {
        console.log(`No results found for "${query}"`);
        res.json({ success: true, suggestions: [], source: 'google_places' });
      } else {
        console.error('Google Places API error:', data.status, data.error_message);
        throw new Error(`Google Places API error: ${data.status}`);
      }
      
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      
      // Provide enhanced fallback suggestions for Oklahoma
      const query = req.query.q as string || '';
      const fallbackSuggestions = [
        { formatted_address: "Oklahoma City, OK, USA", place_id: "fallback_okc", main_text: "Oklahoma City", secondary_text: "OK, USA" },
        { formatted_address: "Edmond, OK, USA", place_id: "fallback_edmond", main_text: "Edmond", secondary_text: "OK, USA" },
        { formatted_address: "Norman, OK, USA", place_id: "fallback_norman", main_text: "Norman", secondary_text: "OK, USA" },
        { formatted_address: "Moore, OK, USA", place_id: "fallback_moore", main_text: "Moore", secondary_text: "OK, USA" },
        { formatted_address: "Midwest City, OK, USA", place_id: "fallback_mwc", main_text: "Midwest City", secondary_text: "OK, USA" },
        { formatted_address: "Yukon, OK, USA", place_id: "fallback_yukon", main_text: "Yukon", secondary_text: "OK, USA" },
        { formatted_address: "Mustang, OK, USA", place_id: "fallback_mustang", main_text: "Mustang", secondary_text: "OK, USA" },
        { formatted_address: "Deer Creek, OK, USA", place_id: "fallback_deer_creek", main_text: "Deer Creek", secondary_text: "OK, USA" }
      ].filter(city => 
        city.main_text.toLowerCase().includes(query.toLowerCase()) ||
        city.formatted_address.toLowerCase().includes(query.toLowerCase())
      );
      
      console.log(`⚠️ Using fallback suggestions (${fallbackSuggestions.length} matches)`);
      
      res.json({ 
        success: true, 
        suggestions: fallbackSuggestions,
        source: 'fallback',
        message: 'Using local suggestions - add Google API key for enhanced results'
      });
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

  // Google Business Profile reviews for Sigma Roofing LLC
  app.get("/api/reviews", async (req, res) => {
    try {
      // Live Google rating/reviews, cached ~6h in server/reviews.ts (was: 2 Places calls on EVERY hit).
      const data = await getReviews();
      if (!data) {
        return res.status(500).json({ success: false, message: "Unable to fetch reviews from Google Business Profile" });
      }
      res.json({
        success: true,
        reviews: data.reviews,
        businessRating: data.ratingValue,
        totalReviews: data.reviewCount,
        businessName: data.businessName,
      });
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ success: false, message: "Unable to fetch reviews from Google Business Profile" });
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: linear-gradient(to-br, #f8fafc, #e2e8f0); margin: 0; padding: 0; line-height: 1.6; }
          .container { max-width: 1200px; margin: auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; text-align: center; padding: 60px 40px; border-radius: 16px; margin-bottom: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header h1 { font-size: 3rem; margin-bottom: 20px; font-weight: 800; }
          .header p { font-size: 1.25rem; opacity: 0.9; }
          .content-section { background: white; padding: 40px; border-radius: 16px; margin-bottom: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .emergency { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; text-align: center; padding: 40px; border-radius: 16px; margin: 40px 0; box-shadow: 0 10px 25px rgba(220,38,38,0.15); }
          .footer { font-size: 14px; color: #6b7280; text-align: center; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          .emergency button { background: white; color: #dc2626; font-weight: bold; padding: 18px 36px; border: none; border-radius: 12px; cursor: pointer; font-size: 18px; transition: all 0.2s; }
          .emergency button:hover { background: #f9fafb; transform: translateY(-2px); }
          .highlight { background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 6px solid #f59e0b; padding: 30px; margin: 30px 0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          strong { color: #10b981; }
          .reviews-section, .projects-section, .form-section { background: white; padding: 40px; border-radius: 16px; margin: 40px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .form-field { position: relative; margin-bottom: 20px; }
          .address-suggestions { background: white; border: 1px solid #d1d5db; border-radius: 8px; max-height: 200px; overflow-y: auto; position: absolute; z-index: 1000; width: 100%; top: 100%; }
          .address-suggestion { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.2s; }
          .address-suggestion:hover { background: #f9fafb; }
          .address-suggestion:last-child { border-bottom: none; }
          input, select, textarea { width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; transition: border-color 0.2s; }
          input:focus, select:focus, textarea:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
          .error { border-color: #ef4444 !important; }
          .error-message { color: #ef4444; font-size: 14px; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${phrase}</h1>
            <p>Hail Damage Restoration Experts - Sigma Roofing LLC</p>
          </div>

          <div class="content-section">
            <h2 style="color: #1f2937; font-size: 2rem; margin-bottom: 20px;">Recent Storm Report</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
              <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981;">
                <h4 style="margin: 0 0 5px 0; color: #065f46;">Storm Type</h4>
                <p style="margin: 0; font-weight: bold; color: #1f2937;">${event.storm_type.toUpperCase()}</p>
              </div>
              <div style="background: #eff6ff; padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                <h4 style="margin: 0 0 5px 0; color: #1e40af;">Date</h4>
                <p style="margin: 0; font-weight: bold; color: #1f2937;">${event.date_of_loss}</p>
              </div>
              <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <h4 style="margin: 0 0 5px 0; color: #92400e;">Location</h4>
                <p style="margin: 0; font-weight: bold; color: #1f2937;">${event.affected_city}</p>
              </div>
              <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444;">
                <h4 style="margin: 0 0 5px 0; color: #991b1b;">Hail Size</h4>
                <p style="margin: 0; font-weight: bold; color: #1f2937;">${event.hail_size}</p>
              </div>
            </div>

            <p style="font-size: 1.125rem; color: #374151; margin-bottom: 25px;">In light of the recent <strong>${event.storm_type}</strong> on <strong>${event.date_of_loss}</strong> in <strong>${event.affected_city}</strong> that swept through your area, we know you are concerned and we are here to help.</p>

            ${severityText}

            <div class="highlight">
              <p style="font-size: 1.125rem; margin: 0;">Hailstones as large as <strong>${event.hail_size}</strong> were reported in your area. This level of impact is known to crack shingles, dent metal panels, and cause leaks that may not show until months later.</p>
            </div>

            <p style="font-size: 1.125rem; color: #374151; margin-bottom: 20px;">Our expertise is at your disposal in managing any damages — verified or potential — and ensuring the safety of your home.</p>

            <p style="font-size: 1.125rem; color: #374151;">Whether you need immediate tarping or just a roof inspection, we have experts ready to put your mind back at ease.</p>
          </div>

          <!-- Google Reviews Section -->
          <div class="reviews-section" style="background: #f9fafb; padding: 30px; border-radius: 8px; margin: 30px 0;">
            <h2 style="text-align: center; margin-bottom: 20px;">What Our Customers Say</h2>
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="color: #fbbf24; font-size: 32px; margin-bottom: 10px;">★★★★★</div>
              <div id="rating-display" style="font-size: 18px; font-weight: bold; color: #1f2937;">5.0/5.0 (Real Google Reviews)</div>
            </div>
            <div id="reviews-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px;">
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
            <form id="storm-contact-form" style="max-width: 700px; margin: 0 auto;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <input type="text" name="firstName" placeholder="First Name*" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                </div>
                <div>
                  <input type="text" name="lastName" placeholder="Last Name*" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <input type="email" name="email" placeholder="Email Address*" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                </div>
                <div>
                  <input type="tel" name="phone" placeholder="Phone Number*" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                </div>
              </div>
              
              <div class="form-field" style="margin-bottom: 20px;">
                <input type="text" name="address" id="address-input" placeholder="Property Address (Oklahoma)*" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                <div id="address-suggestions" class="address-suggestions" style="display: none;"></div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <select name="serviceType" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                  <option value="">Select Service Type*</option>
                  <option value="Storm Damage Assessment">Storm Damage Assessment</option>
                  <option value="Hail Damage Repair">Hail Damage Repair</option>
                  <option value="Emergency Roof Repair">Emergency Roof Repair</option>
                  <option value="Insurance Claim Assistance">Insurance Claim Assistance</option>
                </select>
              </div>
              
              <div style="margin-bottom: 20px;">
                <textarea name="description" placeholder="Describe the storm damage and your roofing needs..." rows="4" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; resize: vertical; box-sizing: border-box;"></textarea>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Preferred Date 1*</label>
                  <input type="date" name="preferredDate1" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Preferred Time 1*</label>
                  <select name="preferredTime1" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                    <option value="">Select Time</option>
                    <option value="8:00 AM - 12:00 PM">8:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 4:00 PM">12:00 PM - 4:00 PM</option>
                    <option value="4:00 PM - 7:00 PM">4:00 PM - 7:00 PM</option>
                  </select>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div>
                  <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Preferred Date 2*</label>
                  <input type="date" name="preferredDate2" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Preferred Time 2*</label>
                  <select name="preferredTime2" required style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                    <option value="">Select Time</option>
                    <option value="8:00 AM - 12:00 PM">8:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 4:00 PM">12:00 PM - 4:00 PM</option>
                    <option value="4:00 PM - 7:00 PM">4:00 PM - 7:00 PM</option>
                  </select>
                </div>
              </div>
              
              <button type="submit" style="width: 100%; background: #10b981; color: white; padding: 18px; border: none; border-radius: 12px; font-size: 18px; font-weight: bold; cursor: pointer; transition: background 0.2s;">Submit Free Estimate Request</button>
            </form>
          </div>

          <div class="emergency">
            <h2>Emergency Storm Damage?</h2>
            <p>Call us now for immediate help:</p>
            <button onclick="window.location.href='tel:+14059025266'">📞 (405) 902-5266</button>
          </div>

          <div class="footer">
            Storm data source: NOAA Storm Events Database<br />
            Page generated on: ${new Date(event.generated_at).toLocaleString()}
          </div>
        </div>
        
        <script>
          // Load Google Reviews with correct 5-star rating
          async function loadReviews() {
            try {
              const response = await fetch('/api/reviews');
              const data = await response.json();
              
              if (data.success && data.reviews) {
                // Update rating display with actual data
                const ratingDisplay = document.getElementById('rating-display');
                ratingDisplay.textContent = \`\${data.businessRating}/5.0 (\${data.totalReviews} Google Reviews)\`;
                
                const container = document.getElementById('reviews-container');
                container.innerHTML = data.reviews.slice(0, 6).map(review => \`
                  <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <div style="width: 48px; height: 48px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 15px; font-size: 18px;">
                        \${review.initials}
                      </div>
                      <div>
                        <div style="font-weight: bold; font-size: 16px; color: #1f2937;">\${review.name}</div>
                        <div style="color: #fbbf24; font-size: 16px; margin-top: 2px;">\${'★'.repeat(review.rating)}</div>
                      </div>
                    </div>
                    <p style="color: #374151; line-height: 1.6; font-size: 15px; margin-bottom: 15px;">\${review.review}</p>
                    <div style="color: #6b7280; font-size: 13px; font-weight: 500;">\${review.date}</div>
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
              // Get website images for project gallery
              const imageResponse = await fetch('/api/website-images');
              const imageData = await imageResponse.json();
              
              if (imageData.success && imageData.images) {
                const projects = [
                  {
                    title: 'Residential Roof Replacement',
                    description: 'Complete roof replacement with architectural shingles in Edmond area',
                    imageUrl: imageData.images.project1 || '/api/placeholder/300/240',
                    category: 'Roof Replacement',
                    location: 'Edmond, OK'
                  },
                  {
                    title: 'Storm Damage Restoration',
                    description: 'Professional hail damage repair with insurance assistance',
                    imageUrl: imageData.images.project2 || '/api/placeholder/300/240',
                    category: 'Storm Damage',
                    location: 'Oklahoma City, OK'
                  },
                  {
                    title: 'Emergency Roof Repair',
                    description: 'Fast emergency leak repair and storm protection',
                    imageUrl: imageData.images.project3 || '/api/placeholder/300/240',
                    category: 'Emergency Repair',
                    location: 'Norman, OK'
                  }
                ];
                displayProjects(projects);
              } else {
                console.log('No website images found, using placeholders');
                const placeholderProjects = [
                  {
                    title: 'Recent Roofing Project',
                    description: 'Professional roofing work in the Oklahoma City area',
                    imageUrl: '/api/placeholder/300/240',
                    category: 'Roofing Project',
                    location: 'Oklahoma City, OK'
                  },
                  {
                    title: 'Storm Damage Repair',
                    description: 'Expert storm damage restoration services',
                    imageUrl: '/api/placeholder/300/240',
                    category: 'Storm Repair',
                    location: 'Edmond, OK'
                  },
                  {
                    title: 'Roof Replacement',
                    description: 'Complete residential roof replacement',
                    imageUrl: '/api/placeholder/300/240',
                    category: 'Replacement',
                    location: 'Norman, OK'
                  }
                ];
                displayProjects(placeholderProjects);
              }
            } catch (error) {
              console.error('Error loading projects:', error);
              // Show placeholder projects if API fails
              const errorProjects = [
                {
                  title: 'Professional Roofing Services',
                  description: 'Quality roofing work throughout Oklahoma',
                  imageUrl: '/api/placeholder/300/240',
                  category: 'Roofing',
                  location: 'Oklahoma'
                }
              ];
              displayProjects(errorProjects);
            }
          }

          function displayProjects(projects) {
            const container = document.getElementById('projects-container');
            container.innerHTML = projects.map(project => \`
              <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; transition: transform 0.2s;">
                <img src="\${project.imageUrl}" alt="\${project.title}" style="width: 100%; height: 240px; object-fit: cover;" onerror="this.src='/api/placeholder/300/240'">
                <div style="padding: 20px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">\${project.title}</h3>
                  <p style="margin: 0 0 8px 0; color: #10b981; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">\${project.category || 'Roofing Project'}</p>
                  <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">\${project.description || project.title}</p>
                  <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">\${project.location}</p>
                </div>
              </div>
            \`).join('');
          }

          // Address suggestions functionality
          let addressTimeout;
          async function searchAddresses(query) {
            if (query.length < 3) {
              document.getElementById('address-suggestions').style.display = 'none';
              return;
            }

            clearTimeout(addressTimeout);
            addressTimeout = setTimeout(async () => {
              try {
                const response = await fetch(\`/api/address-suggestions?q=\${encodeURIComponent(query)}\`);
                const data = await response.json();
                
                if (data.success && data.suggestions && data.suggestions.length > 0) {
                  const suggestionsDiv = document.getElementById('address-suggestions');
                  suggestionsDiv.innerHTML = data.suggestions.slice(0, 5).map(suggestion => \`
                    <div class="address-suggestion" onclick="selectAddress('\${suggestion.formatted_address.replace(/'/g, "\\'")}')">
                      <div style="font-weight: 500; color: #1f2937;">\${suggestion.formatted_address}</div>
                    </div>
                  \`).join('');
                  suggestionsDiv.style.display = 'block';
                } else {
                  document.getElementById('address-suggestions').style.display = 'none';
                }
              } catch (error) {
                console.error('Error fetching address suggestions:', error);
                document.getElementById('address-suggestions').style.display = 'none';
              }
            }, 500);
          }

          function selectAddress(address) {
            document.getElementById('address-input').value = address;
            document.getElementById('address-suggestions').style.display = 'none';
          }

          // Validation functions
          function validateEmail(email) {
            // Enhanced email validation with real domain checking
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailRegex.test(email)) return false;
            
            // Check for common fake/temporary email patterns
            const fakeDomains = ['test.com', 'example.com', 'fake.com', 'temp.com', '10minutemail', 'guerrillamail'];
            const domain = email.split('@')[1]?.toLowerCase();
            return !fakeDomains.some(fake => domain?.includes(fake));
          }

          function validatePhone(phone) {
            const cleanPhone = phone.replace(/\\D/g, '');
            
            // Must be exactly 10 digits for US numbers
            if (cleanPhone.length !== 10) return false;
            
            // Area code cannot start with 0 or 1
            if (cleanPhone[0] === '0' || cleanPhone[0] === '1') return false;
            
            // Exchange code cannot start with 0 or 1
            if (cleanPhone[3] === '0' || cleanPhone[3] === '1') return false;
            
            // Check for fake patterns (repeated digits, sequential)
            if (/^(\\d)\\1{9}$/.test(cleanPhone)) return false; // All same digit
            if (cleanPhone === '1234567890' || cleanPhone === '0123456789') return false;
            
            return true;
          }

          function formatPhoneNumber(value) {
            const phone = value.replace(/\\D/g, '');
            if (phone.length <= 3) return phone;
            if (phone.length <= 6) return \`(\${phone.slice(0, 3)}) \${phone.slice(3)}\`;
            return \`(\${phone.slice(0, 3)}) \${phone.slice(3, 6)}-\${phone.slice(6, 10)}\`;
          }

          function validateAppointmentTimes(date1, time1, date2, time2) {
            if (date1 === date2 && time1 === time2) {
              return 'Please select different time slots for your two preferred appointments.';
            }
            return null;
          }

          // Handle form submission with complete validation
          document.getElementById('storm-contact-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
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

            // Comprehensive validation
            if (!data.firstName?.trim()) return alert('First name is required.');
            if (!data.lastName?.trim()) return alert('Last name is required.');
            if (!validateEmail(data.email)) return alert('Please enter a valid email address.');
            if (!validatePhone(data.phone)) return alert('Please enter a valid phone number.');
            if (!data.address?.trim()) return alert('Address is required.');
            if (!data.address.toLowerCase().includes('oklahoma') && !data.address.toLowerCase().includes(' ok')) {
              return alert('Please enter an Oklahoma address.');
            }
            if (!data.serviceType) return alert('Please select a service type.');
            if (!data.description?.trim()) return alert('Please describe your roofing needs.');
            if (!data.preferredDate1 || !data.preferredTime1) return alert('Please select your first preferred appointment.');
            if (!data.preferredDate2 || !data.preferredTime2) return alert('Please select your second preferred appointment.');
            
            const appointmentError = validateAppointmentTimes(data.preferredDate1, data.preferredTime1, data.preferredDate2, data.preferredTime2);
            if (appointmentError) return alert(appointmentError);

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
              alert('Please check your information and try again, or call us directly at (405) 902-5266');
            }
          });

          // Load content when page loads
          document.addEventListener('DOMContentLoaded', function() {
            loadReviews();
            loadProjects();
            
            // Add address suggestions listener
            const addressInput = document.getElementById('address-input');
            addressInput.addEventListener('input', function(e) {
              searchAddresses(e.target.value);
            });
            
            // Add phone number formatting
            const phoneInput = document.querySelector('input[name="phone"]');
            phoneInput.addEventListener('input', function(e) {
              e.target.value = formatPhoneNumber(e.target.value);
            });
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', function(e) {
              if (!e.target.closest('.form-field')) {
                document.getElementById('address-suggestions').style.display = 'none';
              }
            });
            
            // Set minimum dates for date inputs
            const today = new Date().toISOString().split('T')[0];
            document.querySelector('input[name="preferredDate1"]').min = today;
            document.querySelector('input[name="preferredDate2"]').min = today;
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
          <button onclick="window.location.href='tel:+14059025266'">Emergency: (405) 902-5266</button>
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
        return res.send(`<h1>No qualifying hail events found</h1><p>Call us directly: (405) 902-5266</p>`);
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
      res.status(500).send(`<h1>Service Unavailable</h1><p>Please call us: (405) 902-5266</p>`);
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

  // Projects API endpoint for consistent cross-device access
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json({ 
        success: true, 
        projects: projects || []
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.json({ 
        success: false, 
        projects: [],
        message: "Projects not available"
      });
    }
  });

  // Save projects API endpoint
  app.post("/api/projects", async (req, res) => {
    try {
      const projects = req.body.projects;
      await storage.saveProjects(projects);
      res.json({ 
        success: true, 
        message: "Projects saved successfully"
      });
    } catch (error) {
      console.error("Error saving projects:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to save projects"
      });
    }
  });

  // Social videos API (SocHub)
  app.get("/api/social-videos", async (req, res) => {
    try {
      const videos = await storage.getSocialVideos();
      res.json({ success: true, videos });
    } catch (error) {
      console.error("Error fetching social videos:", error);
      res.status(500).json({ success: false, videos: [], message: "Failed to fetch videos" });
    }
  });

  app.post("/api/social-videos", async (req, res) => {
    try {
      const validated = insertSocialVideoSchema.parse(req.body);
      const video = await storage.createSocialVideo(validated);
      res.json({ success: true, video });
    } catch (error) {
      console.error("Error creating social video:", error);
      res.status(400).json({ success: false, message: "Invalid video data" });
    }
  });

  app.delete("/api/social-videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSocialVideo(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, message: "Video not found" });
      }
    } catch (error) {
      console.error("Error deleting social video:", error);
      res.status(500).json({ success: false, message: "Failed to delete video" });
    }
  });

  // TikTok oEmbed thumbnail proxy — avoids CORS issues fetching from the browser
  app.get("/api/tiktok-thumbnail", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ thumbnail_url: null });
    try {
      const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      const data = await response.json() as { thumbnail_url?: string };
      res.json({ thumbnail_url: data.thumbnail_url || null });
    } catch (error) {
      console.error("TikTok oEmbed error:", error);
      res.json({ thumbnail_url: null });
    }
  });

  // Instant roof estimate: address -> Google Solar measurement + ballpark price.
  // Cost guard #1 (spec §10): cache by normalized address — a roof doesn't change between
  // reroofs, so we never pay to look the same address up twice (24h TTL).
  const estimateCache = new Map<string, { result: any; ts: number }>();
  const ESTIMATE_TTL_MS = 1000 * 60 * 60 * 24;
  const normalizeAddress = (a: string) =>
    a.toLowerCase().replace(/[.,]/g, ' ').replace(/\busa\b/g, '').replace(/\s+/g, ' ').trim();

  // Cost guard #2: an app-level DAILY CAP on *live* (cache-miss) estimates — the real "50% of free tier" limit,
  // since Google's Solar API has no per-day quota. Beyond the cap the page flips to the email/phone capture (no
  // Google call, lead still captured). Resets at local (Central) midnight. Cap = one env-tunable number.
  const DAILY_CAP = Number(process.env.ESTIMATE_DAILY_CAP) || 150;
  const USER_LIMIT = Number(process.env.ESTIMATE_USER_LIMIT) || 2; // per-browser (clientId) NEW estimates/day before the capture
  const capDay = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }); // YYYY-MM-DD
  const dailyCap = { day: "", n: 0 };
  const perUser: { day: string; map: Map<string, number> } = { day: "", map: new Map() };

  app.post("/api/estimate", async (req, res) => {
    try {
      const address = (req.body?.address ?? "").toString().trim();
      if (address.length < 5) {
        return res.status(400).json({ success: false, message: "Please enter a full street address." });
      }

      // Cost guard #3: the BOT WALL — verify the Turnstile token before ANY Google call. A bot hitting this
      // endpoint directly carries no valid token -> rejected -> $0 spent. (Skips if TURNSTILE_SECRET_KEY unset.)
      const { verifyTurnstile } = await import("./estimate/turnstile");
      const captcha = await verifyTurnstile(req.body?.turnstileToken, req.ip);
      if (!captcha.ok) {
        return res.status(403).json({ success: false, captcha: true, message: "We couldn't verify your browser — please retry." });
      }

      const key = process.env.GOOGLE_API_KEY;
      if (!key) {
        console.error("Estimate: GOOGLE_API_KEY not configured");
        return res.status(500).json({ success: false, message: "The estimator is temporarily unavailable." });
      }

      const cacheKey = normalizeAddress(address);
      const hit = estimateCache.get(cacheKey);
      if (hit && Date.now() - hit.ts < ESTIMATE_TTL_MS) {
        // a cached roof costs nothing -> always served, never counts against the per-user or daily caps
        return res.json({ success: true, measured: true, source: "cache", ...hit.result });
      }

      const today = capDay();

      // Per-user soft limit: a browser-stored clientId gets USER_LIMIT *new* estimates/day, then the "Got a question?"
      // capture. Spoofable (incognito / cleared storage resets it) -> a deterrent for casual over-use, NOT a hard wall;
      // the global cap + Turnstile are the real bounds. Skipped if the client sent no id.
      const cid = (req.body?.clientId ?? "").toString().slice(0, 64);
      if (perUser.day !== today) { perUser.day = today; perUser.map.clear(); }
      if (cid && (perUser.map.get(cid) || 0) >= USER_LIMIT) {
        return res.json({ success: true, measured: false, user_limit: true });
      }

      // live estimate (will spend Google $) -> gate on the GLOBAL daily cap
      if (dailyCap.day !== today) { dailyCap.day = today; dailyCap.n = 0; }
      if (dailyCap.n >= DAILY_CAP) {
        return res.json({
          success: true, measured: false, over_capacity: true,
          message: "We've reached today's limit for instant estimates. Leave your email or phone and we'll send your estimate personally.",
        });
      }
      dailyCap.n++; // reserve a slot (we're committing to the Google calls)
      if (cid) perUser.map.set(cid, (perUser.map.get(cid) || 0) + 1); // count this user's live estimate

      // dev: ESTIMATE_FORCE_RATE_LIMIT=1 simulates a Google per-minute 429, to test the "busy, try again" UX without hammering the API.
      if (process.env.ESTIMATE_FORCE_RATE_LIMIT === "1") throw new EstimateError("RATE_LIMITED", "forced (dev test)");

      const measurement = await computeMeasurement(address, key);
      const pricing = priceEstimate(measurement);
      const result = { ...measurement, pricing };
      estimateCache.set(cacheKey, { result, ts: Date.now() });

      console.log(
        `🏠 Estimate: ${measurement.address} -> ${measurement.totals.squares} sq, ${measurement.totals.predominant_pitch}, conf ${measurement.confidence.tier}`,
      );
      res.json({ success: true, measured: true, source: "live", ...result });
    } catch (error) {
      // Soft-fail (still success:true) -> the client shows the "book an inspection" branch,
      // which IS the conversion event for roofs we can't auto-measure.
      if (error instanceof EstimateError) {
        if (error.code === "RATE_LIMITED") {
          // Google rejected the call (per-minute quota) -> it wasn't billed, so don't burn a daily-cap or per-user slot.
          dailyCap.n = Math.max(0, dailyCap.n - 1);
          const cid = (req.body?.clientId ?? "").toString().slice(0, 64);
          if (cid && perUser.day === capDay()) perUser.map.set(cid, Math.max(0, (perUser.map.get(cid) || 0) - 1));
          res.setHeader("Retry-After", "60");
          return res.status(429).json({ success: false, rate_limited: true, message: "Our estimator's in high demand right now — give it about a minute and try again." });
        }
        if (error.code === "NO_BUILDING" || error.code === "GEOCODE_ZERO") {
          return res.json({
            success: true,
            measured: false,
            reason: error.code.toLowerCase(),
            message:
              "We couldn't auto-measure this roof from the air — let's get eyes on it with a free inspection.",
          });
        }
        // NOT_ENABLED / GEOCODE_DENIED / SOLAR_ERROR -> our problem, log it.
        console.error(`Estimate error [${error.code}]:`, error.message);
        return res.status(502).json({ success: false, message: "Couldn't reach the measurement service. Please try again." });
      }
      console.error("Estimate unexpected error:", error);
      res.status(500).json({ success: false, message: "Something went wrong generating your estimate." });
    }
  });

  // Roof facet-map image for the estimate card (DSM aspect+hillshade). Heavier call (Solar `dataLayers`) so cache HARD
  // (24h, by normalized address) — same cost guard as /api/estimate. A missing image is non-fatal: the card falls back
  // to a default illustration, so failures return 404 rather than breaking the estimate flow.
  const roofImageCache = new Map<string, { buffer: Buffer; ts: number }>();
  app.get("/api/roof-image", async (req, res) => {
    try {
      const address = (req.query?.address ?? "").toString().trim();
      if (address.length < 5) return res.status(400).json({ success: false, message: "address required" });
      const key = process.env.GOOGLE_API_KEY;
      if (!key) return res.status(500).json({ success: false, message: "image service unavailable" });

      const cacheKey = normalizeAddress(address);
      const hit = roofImageCache.get(cacheKey);
      let buffer: Buffer;
      if (hit && Date.now() - hit.ts < ESTIMATE_TTL_MS) {
        buffer = hit.buffer;
      } else {
        const out = await renderRoofSketch(address, key);
        buffer = out.buffer;
        roofImageCache.set(cacheKey, { buffer, ts: Date.now() });
        console.log(`🖼️  Roof image: ${address} -> ${out.W}x${out.H}px · ${out.secs}s`);
      }
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error: any) {
      console.error("Roof image error:", error?.message || error);
      res.status(404).json({ success: false, message: "no roof image" });
    }
  });

  // ── POC (cost): a roof "sketch" from buildingInsights ONLY (no Data Layers) → SVG; + a satellite static-map option. ──
  app.get("/api/roof-facet-sketch", async (req, res) => {
    try {
      const address = (req.query?.address ?? "").toString().trim();
      const key = process.env.GOOGLE_API_KEY;
      if (address.length < 5 || !key) return res.status(400).send("address + key required");
      const { renderFacetSketchSvg } = await import("./scripts/roof-facet-sketch");
      const out = await renderFacetSketchSvg(address, key);
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(out.svg);
    } catch (error: any) {
      const msg = (error?.message || error).toString().replace(/[<&>]/g, "");
      res.status(500).type("image/svg+xml").send(`<svg xmlns="http://www.w3.org/2000/svg" width="560" height="160"><rect width="560" height="160" fill="#1a1f27"/><text x="20" y="80" fill="#f87171" font-family="system-ui" font-size="14">sketch error: ${msg}</text></svg>`);
    }
  });
  app.get("/api/roof-satellite", async (req, res) => {
    try {
      const address = (req.query?.address ?? "").toString().trim();
      const key = process.env.GOOGLE_API_KEY;
      if (address.length < 5 || !key) return res.status(400).end();
      const zoom = Math.min(22, Math.max(17, parseInt(String(req.query?.zoom)) || 21)); // tighter on the roof; ?zoom=N to tune
      const { geocode, buildingInsights } = await import("./estimate/measure");
      const { location } = await geocode(address, key);
      let overlays = "";
      if (req.query?.pin) overlays += `&markers=color:0xf2b01e%7C${location.lat},${location.lng}`; // ?pin=1 → drop a pin on the target
      if (req.query?.outline) {
        // ?outline=1 → gold highlight tracing the measured building footprint (marks the target roof without obscuring it)
        try {
          const bb = (await buildingInsights(location, key))?.boundingBox;
          if (bb?.sw && bb?.ne) {
            const pts = [[bb.sw.latitude, bb.sw.longitude], [bb.sw.latitude, bb.ne.longitude], [bb.ne.latitude, bb.ne.longitude], [bb.ne.latitude, bb.sw.longitude], [bb.sw.latitude, bb.sw.longitude]]
              .map((p) => `${p[0]},${p[1]}`).join("%7C");
            overlays += `&path=color:0xffd24aff%7Cweight:3%7Cfillcolor:0xffd24a1f%7C${pts}`;
          }
        } catch { /* no bbox → skip the outline, still serve the photo */ }
      }
      const u = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=${zoom}&size=560x560&scale=2&maptype=satellite${overlays}&key=${key}`;
      const r = await fetch(u);
      if (!r.ok) return res.status(502).end();
      res.setHeader("Content-Type", r.headers.get("content-type") || "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch {
      res.status(502).end();
    }
  });

  // Quote-funnel lead from /estimate ("Lock in 5%" / "Got a question?"). Minimal capture → emails Antonio (no DB; manual follow-up).
  app.post("/api/quote-lead", async (req, res) => {
    try {
      const { ctaType, code, address, estimate, firstName, phone, email, question, preference } = req.body ?? {};
      if (!ctaType || !address) return res.status(400).json({ success: false, message: "Missing details." });
      if (!phone && !email) return res.status(400).json({ success: false, message: "Please add a phone or email so we can reach you." });
      // 1) DURABLE capture first — the lead is saved to data/quote-leads.jsonl no matter what (email may be down).
      logQuoteLead({ ctaType, code, address, estimate, firstName, phone, email, question, preference });
      // 2) Best-effort email notification (currently failing — SENDGRID_API_KEY returns 401; the file still has the lead).
      const sent = await emailService.sendQuoteLead({ ctaType, code, address, estimate, firstName, phone, email, question, preference });
      if (!sent) console.error(`⚠️  Lead SAVED to data/quote-leads.jsonl but EMAIL FAILED (fix SENDGRID_API_KEY) — ${code} · ${address}`);
      // 3) Branded confirmation to the CUSTOMER (only if they gave an email; fire-and-forget so it never blocks the response).
      if (email) emailService.sendCustomerConfirmation({ code, address, estimate, email, ctaType }).catch(() => {});
      res.json({ success: true, message: ctaType === "lock-in" ? "Locked in! An agent will reach out to confirm your 5%." : "Sent — we'll text or email you back shortly." });
    } catch (error) {
      console.error("Quote-lead error:", error);
      res.status(500).json({ success: false, message: "Something went wrong — please call (405) 902-5266." });
    }
  });

  // Don't create a new server here - just return the app
  return app;
}
