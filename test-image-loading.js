// Test if the Hero component is loading images
console.log('=== TESTING IMAGE LOADING IN COMPONENTS ===');

// Check if React components exist
const heroSection = document.querySelector('#home');
console.log('Hero section found:', !!heroSection);

// Check for background image styles
const elementsWithBackgrounds = document.querySelectorAll('[style*="background-image"]');
console.log('Elements with background-image:', elementsWithBackgrounds.length);
elementsWithBackgrounds.forEach((el, i) => {
  console.log(`Element ${i}:`, el.style.backgroundImage);
});

// Check hero specific
const heroElement = document.querySelector('.relative.min-h-screen');
console.log('Hero element found:', !!heroElement);
if (heroElement) {
  console.log('Hero background style:', heroElement.style.backgroundImage);
}

// Manually test the imageService
console.log('\n=== MANUALLY CALLING getWebsiteImages ===');

// Create a test function that mimics the imageService
async function testImageService() {
  const images = {};
  const imageKeys = [
    'heroBackground', 'heroFeatureImage', 'residentialRoofingImage', 'roofRepairImage',
    'roofInspectionImage', 'gutterServiceImage', 'stormDamageImage',
    'paintingServiceImage', 'teamPhoto', 'visionImage', 'companyLogo',
    'processStep1Image', 'processStep2Image', 'processStep3Image',
    'processStep4Image', 'testimonialBackground', 'stormReportBackground'
  ];
  
  imageKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      images[key] = value;
    }
  });
  
  console.log('Images found:', Object.keys(images).length);
  console.log('Hero background:', images.heroBackground);
  return images;
}

testImageService().then(images => {
  console.log('Test complete. Images loaded:', images);
  
  // Try to manually set the hero background
  const heroDiv = document.querySelector('.relative.min-h-screen');
  if (heroDiv && images.heroBackground) {
    console.log('Attempting to manually set hero background...');
    heroDiv.style.backgroundImage = `url(${images.heroBackground})`;
    console.log('Background set!');
  }
});