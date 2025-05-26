import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Review {
  name: string;
  role: string;
  rating: number;
  review: string;
  date: string;
  initials: string;
}

// Fallback reviews in case API is unavailable
const fallbackReviews = [
  {
    name: "Jenna Goodner",
    role: "Verified Customer",
    rating: 5,
    review: "If I could give 100 stars, I absolutely would. From start to finish, this company was exceptional to work with. They not only did everything they promised — they went above and beyond in every way. In today's world, it's rare to find a team this honest, thorough, and committed to true customer service. I had the pleasure of working with Antonio, and he has truly restored my faith in humanity.",
    date: "3 weeks ago",
    initials: "JG"
  },
  {
    name: "Marlene Musgrave", 
    role: "Verified Customer",
    rating: 5,
    review: "I highly recommend BBAV Roofing, LLC. Antonio Escalante was awesome to work with. Their quality of work is great. They replaced my roof, gutters, garage door and did some painting and I am 100 percent happy with everything. No high-pressure sales techniques, which was really nice after talking to some other roofing companies.",
    date: "2 months ago",
    initials: "MM"
  },
  {
    name: "Matthew Thornton",
    role: "Verified Customer", 
    rating: 5,
    review: "Antonio and his crew did an Outstanding job getting us back into our house after the November Tornado. He helped us with every aspect of the damage: drywall, roof, chimney, carpet, tile, garage door, and other interior needs. We are extremely pleased with the results and he is great to work with. Will never use anyone else.",
    date: "2 months ago",
    initials: "MT"
  },
  {
    name: "Shanna Gill",
    role: "Verified Customer",
    rating: 5,
    review: "I had tornado damage on November 3rd and they were next door putting a tarp on my neighbors house. Without hesitation they came to my assistance. They put a tarp up and reinforced my roof and patiently checked in on me while I had a public adjuster helping me fight the insurance company. Me and three of my neighbors are extremely grateful we have bbav as our roofing company.",
    date: "a month ago", 
    initials: "SG"
  },
  {
    name: "Jocelyn Sanchez",
    role: "Verified Customer",
    rating: 5,
    review: "I 100% recommend using BBAV Roofing! The crew is very knowledgeable and great to work with. I couldn't be happier with how everything turned out. They worked on my roof, ceiling, and even did some painting on the inside. Five stars all the way.",
    date: "2 months ago",
    initials: "JS"
  }
];

// Function to fetch reviews directly from Google Places API
const fetchGoogleReviews = async (): Promise<Review[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "YOUR_API_KEY_HERE";
  const placeId = "ChIJ3-aw31sdsocRvkrmmxIT0Tc"; // Your BBAV Roofing LLC place ID
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === "OK" && data.result.reviews) {
      return data.result.reviews.slice(0, 6).map((review: any) => ({
        name: review.author_name,
        role: "Verified Customer",
        rating: review.rating,
        review: review.text,
        date: review.relative_time_description,
        initials: review.author_name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }));
    }
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
  }
  
  return fallbackReviews;
};

export default function Testimonials() {
  const { data: reviews = fallbackReviews, isLoading } = useQuery<Review[]>({
    queryKey: ["google-reviews"],
    queryFn: fetchGoogleReviews,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-charcoal mb-4">What Our Customers Say</h2>
          <p className="text-xl text-sigma-light-gray max-w-2xl mx-auto">
            Authentic reviews from satisfied customers who have experienced our professional roofing services.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="flex text-sigma-emerald">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="fill-current" size={20} />
                ))}
              </div>
              <span className="ml-2 font-semibold text-sigma-charcoal">5.0</span>
            </div>
            <span className="text-sigma-light-gray">•</span>
            <span className="text-sigma-light-gray">9 reviews</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-sigma-emerald">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-sigma-emerald text-lg">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={i < review.rating ? "fill-current" : ""} size={20} />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-sigma-light-gray">{review.date}</span>
                </div>
                <p className="text-sigma-light-gray mb-6 italic">
                  "{review.review}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-sigma-emerald rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">{review.initials}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sigma-charcoal">{review.name}</div>
                    <div className="text-sm text-sigma-light-gray">{review.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
