export default function Sitemap() {
  const scrollToSection = (sectionId: string) => {
    window.location.href = '/#' + sectionId;
  };

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-bold text-4xl text-sigma-dark mb-8">Sitemap</h1>
        <div className="text-sigma-gray space-y-8">
          
          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Main Pages</h2>
            <ul className="space-y-2">
              <li><button onClick={() => scrollToSection("home")} className="text-sigma-gold hover:underline">Home</button></li>
              <li><button onClick={() => scrollToSection("services")} className="text-sigma-gold hover:underline">Services</button></li>
              <li><button onClick={() => scrollToSection("about")} className="text-sigma-gold hover:underline">About Us</button></li>
              <li><button onClick={() => scrollToSection("projects")} className="text-sigma-gold hover:underline">Recent Projects</button></li>
              <li><button onClick={() => scrollToSection("contact")} className="text-sigma-gold hover:underline">Contact & Free Estimates</button></li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Our Services</h2>
            <ul className="space-y-2">
              <li>• Residential Roofing (Asphalt Shingles)</li>
              <li>• Exterior Painting</li>
              <li>• Roof Repairs & Maintenance</li>
              <li>• Roof Inspections</li>
              <li>• Gutter Services</li>
              <li>• Storm Damage Restoration</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Service Areas</h2>
            <ul className="space-y-2">
              <li>• Edmond, OK</li>
              <li>• Oklahoma City, OK</li>
              <li>• Moore, OK</li>
              <li>• Norman, OK</li>
              <li>• Yukon, OK</li>
              <li>• Mustang, OK</li>
              <li>• Guthrie, OK</li>
              <li>• Deer Creek, OK</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Legal Information</h2>
            <ul className="space-y-2">
              <li><a href="/privacy-policy" className="text-sigma-gold hover:underline">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="text-sigma-gold hover:underline">Terms of Service</a></li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Contact Information</h2>
            <div className="space-y-2">
              <p><strong>Sigma Roofing LLC</strong></p>
              <p>16612 N Western Avenue, Edmond, OK 73012</p>
              <p>Phone: (405) 902-5266</p>
              <p>Email: ok.sigmaroofs@gmail.com</p>
              <p>License: LIC#80006734</p>
              <p>Available 24/7 for Emergency Services</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}