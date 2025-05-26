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

  // Google Business reviews
  app.get("/api/google-reviews", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google API key not configured" });
      }

      // Search for Sigma Roofing LLC in Edmond, OK
      const searchResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Sigma%20Roofing%20LLC%20Edmond%20Oklahoma&inputtype=textquery&fields=place_id&key=${apiKey}`
      );

      if (!searchResponse.ok) {
        throw new Error("Failed to search for business");
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.candidates || searchData.candidates.length === 0) {
        return res.status(404).json({ error: "Business not found" });
      }

      const placeId = searchData.candidates[0].place_id;

      // Get place details including reviews
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`
      );

      if (!detailsResponse.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const detailsData = await detailsResponse.json();
      
      if (!detailsData.result || !detailsData.result.reviews) {
        return res.json([]);
      }

      // Filter for 5-star reviews only and return top 4
      const fiveStarReviews = detailsData.result.reviews
        .filter((review: any) => review.rating === 5)
        .slice(0, 4);

      res.json(fiveStarReviews);
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
