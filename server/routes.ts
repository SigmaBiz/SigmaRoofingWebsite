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
