import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

export default function Testimonials() {
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['/api/google-reviews'],
    queryFn: async () => {
      const response = await fetch('/api/google-reviews');
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return response.json() as Promise<GoogleReview[]>;
    }
  });

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-charcoal mb-4">What Our Customers Say</h2>
          <p className="text-xl text-sigma-light-gray max-w-2xl mx-auto">
            Real reviews from our satisfied customers on Google Business. See what people are saying about our roofing services.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="bg-white shadow-lg animate-pulse border-l-4 border-l-gray-200">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-sigma-light-gray">
            <p>Unable to load Google reviews at this time. Please check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {reviews && reviews.length > 0 ? (
              reviews.slice(0, 4).map((review, index) => (
                <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-sigma-emerald">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex text-sigma-emerald">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="fill-current" size={20} />
                        ))}
                      </div>
                      <span className="text-sm text-sigma-light-gray">{review.relative_time_description}</span>
                    </div>
                    <p className="text-sigma-light-gray mb-6 italic leading-relaxed">
                      "{review.text}"
                    </p>
                    <div className="border-t pt-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-sigma-emerald rounded-full flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-lg">
                            {review.author_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-sigma-charcoal">{review.author_name}</div>
                          <div className="text-sm text-sigma-emerald font-medium">Google Business Review</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-sigma-light-gray">
                <p>No Google reviews available at this time.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
