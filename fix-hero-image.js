// Fix the hero background image
console.log('=== FIXING HERO IMAGE ===');

// Get the correct image from localStorage
const heroBackground = localStorage.getItem('heroBackground');
console.log('Hero background from localStorage:', heroBackground);

// Method 1: Override the CSS with inline style
const heroBg = document.querySelector('.hero-bg');
if (heroBg && heroBackground) {
  console.log('Setting hero background via inline style...');
  heroBg.style.cssText = `
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
                url('${heroBackground}');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
  `;
  console.log('✓ Hero background updated!');
}

// Method 2: Check if there's an img element that should be showing
const heroSection = document.querySelector('#home');
const heroImg = heroSection?.querySelector('img[alt="Hero Background"]');
if (heroImg) {
  console.log('Found hero img element, src:', heroImg.src);
  if (heroImg.style.display === 'none') {
    console.log('Image was hidden due to error, fixing...');
    heroImg.style.display = 'block';
    heroImg.src = heroBackground;
  }
}

// Method 3: Create a style tag to override the CSS
const styleTag = document.createElement('style');
styleTag.textContent = `
  .hero-bg {
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
                url('${heroBackground}') !important;
    background-size: cover !important;
    background-position: center !important;
  }
`;
document.head.appendChild(styleTag);
console.log('✓ CSS override added');

// Check service images too
console.log('\n=== CHECKING SERVICE IMAGES ===');
const serviceSection = document.querySelector('#services');
if (serviceSection) {
  const serviceImages = [
    { key: 'residentialRoofingImage', title: 'Residential Roofing' },
    { key: 'roofRepairImage', title: 'Roof Repair' },
    { key: 'roofInspectionImage', title: 'Roof Inspection' },
    { key: 'gutterServiceImage', title: 'Gutter Services' },
    { key: 'stormDamageImage', title: 'Storm Damage' },
    { key: 'paintingServiceImage', title: 'Painting Services' }
  ];
  
  const cards = serviceSection.querySelectorAll('.group');
  console.log('Service cards found:', cards.length);
  
  cards.forEach((card, index) => {
    if (index < serviceImages.length) {
      const imgUrl = localStorage.getItem(serviceImages[index].key);
      if (imgUrl) {
        // Find the div that should have the background image
        const imgDiv = card.querySelector('div[class*="h-48"]');
        if (imgDiv) {
          console.log(`Setting ${serviceImages[index].title} image...`);
          imgDiv.style.backgroundImage = `url('${imgUrl}')`;
          imgDiv.style.backgroundSize = 'cover';
          imgDiv.style.backgroundPosition = 'center';
        }
      }
    }
  });
}