// Debug script to check image loading behavior

console.log('=== DEBUGGING IMAGE LOADING ===');

// 1. Check localStorage
console.log('\n1. LocalStorage Images:');
const imageKeys = [
  'heroBackground', 'residentialRoofingImage', 'roofRepairImage',
  'roofInspectionImage', 'gutterServiceImage', 'stormDamageImage',
  'paintingServiceImage', 'teamPhoto', 'visionImage', 'stormReportBackground'
];

imageKeys.forEach(key => {
  const value = localStorage.getItem(key);
  console.log(`${key}: ${value ? '✓ ' + value.substring(0, 50) + '...' : '✗ Missing'}`);
});

// 2. Try to fetch from API
console.log('\n2. Fetching from API...');
fetch('/api/website-images')
  .then(response => {
    console.log(`API Response Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('API Response:', data);
    if (data.images) {
      console.log('API Images:', Object.keys(data.images).filter(k => data.images[k]).length + ' non-null images');
    }
  })
  .catch(error => {
    console.error('API Error:', error);
  });

// 3. Test the imageService function
console.log('\n3. Testing imageService.getWebsiteImages()...');
import('/src/lib/imageService.js').then(module => {
  module.getWebsiteImages().then(images => {
    console.log('ImageService returned:', Object.keys(images).length + ' images');
    console.log('Images:', images);
  });
}).catch(error => {
  console.log('Could not import imageService, trying direct call...');
  
  // If import fails, try calling getWebsiteImages if it exists globally
  if (typeof getWebsiteImages === 'function') {
    getWebsiteImages().then(images => {
      console.log('ImageService returned:', Object.keys(images).length + ' images');
      console.log('Images:', images);
    });
  }
});