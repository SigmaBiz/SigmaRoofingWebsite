// Force save the images to the API from localStorage
// Run this after setting images in localStorage to ensure API has the data

const imageData = {
  "heroBackground": localStorage.getItem('heroBackground'),
  "residentialRoofingImage": localStorage.getItem('residentialRoofingImage'),
  "roofRepairImage": localStorage.getItem('roofRepairImage'),
  "roofInspectionImage": localStorage.getItem('roofInspectionImage'),
  "gutterServiceImage": localStorage.getItem('gutterServiceImage'),
  "stormDamageImage": localStorage.getItem('stormDamageImage'),
  "paintingServiceImage": localStorage.getItem('paintingServiceImage'),
  "teamPhoto": localStorage.getItem('teamPhoto'),
  "visionImage": localStorage.getItem('visionImage'),
  "stormReportBackground": localStorage.getItem('stormReportBackground')
};

// Save to API
fetch('/api/website-images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(imageData)
}).then(response => response.json())
  .then(data => {
    console.log('API Save Result:', data);
    if (data.success) {
      console.log('✅ Images saved to API successfully!');
      console.log('Now refresh the page and images should display.');
    } else {
      console.log('❌ API save failed:', data);
    }
  })
  .catch(error => {
    console.error('Error saving to API:', error);
  });