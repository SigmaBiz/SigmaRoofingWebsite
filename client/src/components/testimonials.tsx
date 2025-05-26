import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Michael Johnson",
    role: "Edmond Homeowner",
    initials: "MJ",
    review: "Sigma Roofing did an amazing job on our roof replacement. Professional, timely, and the quality is outstanding. Highly recommend them to anyone in the Edmond area."
  },
  {
    name: "Sarah Davis",
    role: "Business Owner",
    initials: "SD",
    review: "After storm damage, Sigma Roofing helped us through the entire insurance process and restored our roof better than new. Excellent customer service!"
  },
  {
    name: "Robert Wilson",
    role: "Edmond Resident",
    initials: "RW",
    review: "Professional team, fair pricing, and quality work. Our metal roof looks fantastic and the energy savings are already noticeable. Very satisfied!"
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-sigma-cream">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-dark mb-4">What Our Customers Say</h2>
          <p className="text-xl text-sigma-gray max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers in the Edmond area have to say about our roofing services.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-sigma-gold text-lg">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="fill-current" size={20} />
                    ))}
                  </div>
                </div>
                <p className="text-sigma-gray mb-6 italic">
                  "{testimonial.review}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-sigma-gold rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">{testimonial.initials}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-sigma-gray">{testimonial.role}</div>
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
