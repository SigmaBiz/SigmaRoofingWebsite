export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-bold text-4xl text-sigma-dark mb-8">Terms of Service</h1>
        <div className="text-sigma-gray space-y-6">
          <p className="text-sm text-sigma-gray mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Services Provided</h2>
            <p>Sigma Roofing LLC provides residential roofing, exterior painting, gutter services, and related home improvement services in the Edmond, Oklahoma area. All work is performed by licensed and insured professionals.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Estimates and Contracts</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>All estimates are provided free of charge and are valid for 30 days</li>
              <li>Work begins only after a signed contract and any required permits</li>
              <li>Changes to the original scope of work require written approval</li>
              <li>Payment terms will be specified in your service contract</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Warranties</h2>
            <p>We provide warranties on our workmanship as specified in your service contract. Material warranties are provided by manufacturers. Warranty terms vary by service type and will be clearly outlined in your agreement.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Liability and Insurance</h2>
            <p>Sigma Roofing LLC maintains comprehensive liability insurance and workers' compensation coverage. We are licensed in Oklahoma (LIC#80006734) and comply with all local building codes and regulations.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Customer Responsibilities</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Provide clear access to work areas</li>
              <li>Remove valuable items from work areas</li>
              <li>Inform us of any special conditions or concerns</li>
              <li>Make payments according to contract terms</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl text-sigma-dark mb-4">Contact Information</h2>
            <div className="mt-2">
              <p>Sigma Roofing LLC</p>
              <p>16612 N Western Avenue, Edmond, OK 73012</p>
              <p>Phone: (405) 902-5266</p>
              <p>Email: ok.sigmaroofs@gmail.com</p>
              <p>License: LIC#80006734</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}