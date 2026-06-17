import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const faqData = [
  {
    question: "What kind of storm damage should I be concerned about?",
    answer: "Strong winds, hail, tornadoes, and fallen trees can all impact roofing systems. Some damage is visible — like missing shingles or leaks — while other forms may be less obvious. That's why we always recommend a professional inspection. We'll help you determine what's there — and what, if anything, needs to be done about it."
  },
  {
    question: "Do I need to file a claim immediately after a storm?",
    answer: "Not necessarily, but timing does matter. Policies vary, but most allow a window of time to file. Our role is to guide you through your options — we'll help you understand what qualifies as claim-worthy damage under your specific policy before you make any big decisions."
  },
  {
    question: "Will filing a claim affect my insurance rates?",
    answer: "It's a common question. Most storm-related claims fall under \"Acts of God\" and typically don't impact individual rates. We'll help you determine if your damage qualifies before recommending action. If it does, filing can be a smart move."
  },
  {
    question: "What's the first step if I suspect storm damage?",
    answer: "Start with a qualified inspection. Our team will assess any visible and hidden issues and walk you through what we find — transparently. If we believe a claim is in your best interest, we'll help you understand what steps come next."
  },
  {
    question: "Can you assist with filing the claim?",
    answer: "We don't speak for your insurance company — but we do advocate for you. We document all legitimate damage, assist with scope of repairs, and ensure your home gets the attention it needs. You'll never be left guessing."
  },
  {
    question: "What is a deductible and when is it due?",
    answer: "Your deductible is the part of the cost you agree to cover. It's due once repairs are completed. We'll make sure you know exactly what to expect — no surprises, just clear expectations."
  },
  {
    question: "Who receives the insurance funds?",
    answer: "Most payments go directly to the homeowner. The process often happens in stages — with an initial payment and a follow-up after work is complete. We'll walk you through how to manage this so it all runs smoothly."
  },
  {
    question: "Who is involved in the claims process?",
    answer: "It's a team effort. You, your adjuster, and us — your contractor — work together to make sure damage is accurately identified and restored. We take ownership of our role and ensure things move forward without confusion."
  },
  {
    question: "What if the insurance estimate doesn't cover the required repairs?",
    answer: "This happens. When it does, we submit supplemental documentation to justify what's needed. If you trust us to handle it, we'll make sure no corner is cut, and your roof is repaired properly — not just cheaply."
  },
  {
    question: "My neighbor is getting a new roof. Does that mean I have damage too?",
    answer: "Maybe. Maybe not. But it's worth checking. We don't assume — we inspect. Let us give you a clear answer based on facts."
  },
  {
    question: "Can I wait until I see leaks before acting?",
    answer: "You can — but it might cost you more. Roof systems often fail quietly. We believe in prevention. If your roof is damaged, early action helps ensure your insurance still covers it — and your home stays protected."
  },
  {
    question: "What role do you play in the insurance process?",
    answer: "We're your partner. We don't just install shingles — we guide you through the repair process, advocate for what's fair, and act in your long-term best interest. If we don't think a claim is in your favor, we'll tell you. Our goal is always to serve you, not just our short-term gain."
  },
  {
    question: "What if there's additional property damage — gutters, fences, siding, etc.?",
    answer: "We look at everything. If other parts of your property were affected, we'll document it thoroughly. You'll get a full picture of the damage and know what's needed to make things right."
  },
  {
    question: "Am I obligated to sign anything right away?",
    answer: "No. We don't believe in pressure. Our estimates and advice are here when you need them — and we'll help you move forward when you're ready."
  },
  {
    question: "What determines if my roof is considered a total loss?",
    answer: "Roofing systems are evaluated using industry-standard guidelines — not guesswork. During our inspection, we apply criteria established by insurance carriers, including the number of hail hits per square (typically 8+ in a 10'x10' area), shingle fracture, granule displacement, wind uplift, and overall age or brittleness of the material. If the damage meets or exceeds these thresholds, it may qualify as a total replacement under your policy."
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section id="faq" className="py-20 bg-[#f4efe6]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl text-sigma-charcoal mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-sigma-light-gray max-w-3xl mx-auto">
            Get answers to common questions about storm damage, insurance claims, and the roof repair process. 
            We believe in transparency and want you to feel confident every step of the way.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqData.map((faq, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left flex justify-between items-start hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-lg text-sigma-charcoal pr-4 leading-6">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 mt-1">
                    {openItems.includes(index) ? (
                      <ChevronUp className="w-5 h-5 text-sigma-emerald" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-sigma-emerald" />
                    )}
                  </div>
                </button>
                
                {openItems.includes(index) && (
                  <div className="px-6 pb-6 pt-0">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-sigma-light-gray leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 p-6 bg-sigma-emerald/10 rounded-lg border-l-4 border-sigma-emerald">
          <p className="text-sigma-charcoal font-medium mb-2">
            Have a question not covered here?
          </p>
          <p className="text-sigma-light-gray mb-4">
            Every case is different, and every home is unique. We approach each situation with fresh eyes and clear purpose — to help you get the best result possible based on what's real and what's right for your home.
          </p>
          <a 
            href="#contact" 
            className="inline-flex items-center px-6 py-3 bg-sigma-emerald text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Contact Us Today
          </a>
        </div>
      </div>
    </section>
  );
}