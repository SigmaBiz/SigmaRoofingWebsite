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

interface ReviewsResponse {
  success: boolean;
  reviews: Review[];
  businessRating: number;
  totalReviews: number;
}

export default function Testimonials() {
  const { data: reviewsData, isLoading, error } = useQuery<ReviewsResponse>({
    queryKey: ["/api/reviews"],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
  // Fallback to display while loading or on error
  const reviews = reviewsData?.reviews || [];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-charcoal mb-4">What Our Customers Say</h2>
          <p className="text-xl text-sigma-light-gray max-w-2xl mx-auto">
            Real reviews from satisfied customers who have experienced our professional roofing services.
          </p>
          {reviewsData && (
            <div className="mt-4 flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="flex text-sigma-emerald">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={i < Math.floor(reviewsData.businessRating) ? "fill-current" : ""} size={20} />
                  ))}
                </div>
                <span className="ml-2 font-semibold text-sigma-charcoal">{reviewsData.businessRating}</span>
              </div>
              <span className="text-sigma-light-gray">•</span>
              <span className="text-sigma-light-gray">{reviewsData.totalReviews} reviews</span>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sigma-emerald"></div>
            <p className="mt-4 text-sigma-light-gray">Loading authentic customer reviews...</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sigma-light-gray">Unable to load reviews at this time. Please check back later.</p>
          </div>
        )}

        {reviews.length > 0 && (
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
        )}
      </div>
    </section>
  );
}
