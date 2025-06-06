// Fix service section images
(function() {
  console.log('=== FIXING SERVICE IMAGES ===');
  
  // Find service section
  const serviceSection = document.querySelector('#services');
  if (!serviceSection) {
    console.log('Service section not found');
    return;
  }
  
  // Look for service cards with different selectors
  let cards = serviceSection.querySelectorAll('.bg-white.rounded-xl');
  console.log('Service cards (rounded-xl):', cards.length);
  
  if (cards.length === 0) {
    cards = serviceSection.querySelectorAll('[class*="card"]');
    console.log('Service cards (card class):', cards.length);
  }
  
  if (cards.length === 0) {
    // Look for any divs that might be service containers
    const allDivs = serviceSection.querySelectorAll('div');
    console.log('Total divs in services:', allDivs.length);
    
    // Find divs that look like service cards (have specific height)
    cards = Array.from(allDivs).filter(div => {
      const classes = div.className;
      return classes.includes('overflow-hidden') || classes.includes('h-48') || classes.includes('rounded');
    });
    console.log('Potential service containers:', cards.length);
  }
  
  // Service images mapping
  const serviceImages = [
    { key: 'residentialRoofingImage', title: 'Residential Roofing' },
    { key: 'roofRepairImage', title: 'Roof Repair' },
    { key: 'roofInspectionImage', title: 'Roof Inspection' },
    { key: 'gutterServiceImage', title: 'Gutter Service' },
    { key: 'stormDamageImage', title: 'Storm Damage' },
    { key: 'paintingServiceImage', title: 'Painting' }
  ];
  
  // Try to match service titles to images
  serviceImages.forEach(service => {
    const imgUrl = localStorage.getItem(service.key);
    if (!imgUrl) {
      console.log(`No image found for ${service.title}`);
      return;
    }
    
    // Search for the service by title text
    const titleElements = serviceSection.querySelectorAll('h3, h4, .font-bold');
    titleElements.forEach(titleEl => {
      if (titleEl.textContent.includes(service.title)) {
        console.log(`Found ${service.title} title element`);
        
        // Find the image container near this title
        let card = titleEl.closest('.bg-white') || titleEl.closest('[class*="rounded"]');
        if (card) {
          // Look for image container in the card
          const imgContainer = card.querySelector('div[class*="h-48"], div[class*="overflow-hidden"]');
          if (imgContainer && !imgContainer.querySelector('img')) {
            console.log(`Setting background for ${service.title}`);
            imgContainer.style.backgroundImage = `url('${imgUrl}')`;
            imgContainer.style.backgroundSize = 'cover';
            imgContainer.style.backgroundPosition = 'center';
          }
        }
      }
    });
  });
  
  // Also check About section images
  console.log('\n=== CHECKING ABOUT SECTION ===');
  const aboutSection = document.querySelector('#about');
  if (aboutSection) {
    const teamPhoto = localStorage.getItem('teamPhoto');
    const visionImage = localStorage.getItem('visionImage');
    
    if (teamPhoto || visionImage) {
      const imgElements = aboutSection.querySelectorAll('img');
      console.log('About section images found:', imgElements.length);
      
      imgElements.forEach((img, index) => {
        if (index === 0 && teamPhoto && img.src.includes('unsplash')) {
          console.log('Updating team photo');
          img.src = teamPhoto;
        } else if (index === 1 && visionImage && img.src.includes('unsplash')) {
          console.log('Updating vision image');
          img.src = visionImage;
        }
      });
    }
  }
  
  console.log('\n✅ Service image fix complete!');
})();