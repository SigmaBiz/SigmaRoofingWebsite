import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactRequestSchema.parse(req.body);
      const contactRequest = await storage.createContactRequest(validatedData);
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
      const apiKey = process.env.GOOGLE_BUSINESS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, message: "Google Business API key not configured" });
      }

      // BBAV Roofing LLC address: 16612 N Western Avenue, Edmond, OK 73013
      // We'll need to find the place ID for this specific business location
      const address = "16612 N Western Avenue, Edmond, OK 73013";
      
      // First, search for the place to get the place_id
      const searchResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=BBAV ROOFING LLC ${address}&inputtype=textquery&fields=place_id&key=${apiKey}`
      );
      
      if (!searchResponse.ok) {
        throw new Error(`Google API search error: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (searchData.status !== "OK" || !searchData.candidates.length) {
        throw new Error(`Business not found: ${searchData.status}`);
      }
      
      const placeId = searchData.candidates[0].place_id;
      
      // Now get the reviews using the place_id
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== "OK") {
        throw new Error(`Google API status: ${data.status}`);
      }
      
      const reviews = data.result.reviews || [];
      const formattedReviews = reviews.slice(0, 6).map((review: any) => ({
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
        businessRating: data.result.rating,
        totalReviews: data.result.user_ratings_total
      });
      
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ success: false, message: "Failed to fetch reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
