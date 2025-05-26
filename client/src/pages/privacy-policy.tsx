import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation */}
      <div className="bg-sigma-cream py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-sigma-gold hover:text-yellow-600 font-semibold">
            ← Back to Sigma Roofing LLC
          </Link>
        </div>
      </div>
      
      <div className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-bold text-4xl text-sigma-dark mb-8">Privacy Policy</h1>
          <div className="text-sigma-gray space-y-6">
          <p className="text-sm text-sigma-gray mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Information We Collect</h2>
            <p>When you contact Sigma Roofing LLC for services, we may collect:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Name and contact information (phone, email, address)</li>
              <li>Property details for service estimates</li>
              <li>Service preferences and project requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Provide roofing and painting service estimates</li>
              <li>Schedule and complete requested services</li>
              <li>Communicate about your project</li>
              <li>Follow up on completed work</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share information only when:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Required by law or legal process</li>
              <li>Necessary for service completion (such as material suppliers)</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us:</p>
            <div className="mt-2">
              <p>Sigma Roofing LLC</p>
              <p>16612 N Western Avenue, Edmond, OK 73012</p>
              <p>Phone: (405) 902-1826</p>
              <p>Email: ok.sigmaroofs@gmail.com</p>
            </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}