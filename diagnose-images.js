// Comprehensive image diagnosis
(function() {
  console.log('=== COMPREHENSIVE IMAGE DIAGNOSIS ===');
  
  // 1. Check localStorage
  console.log('\n1. LOCALSTORAGE CHECK:');
  const imageKeys = [
    'heroBackground', 'residentialRoofingImage', 'roofRepairImage',
    'roofInspectionImage', 'gutterServiceImage', 'stormDamageImage',
    'paintingServiceImage', 'teamPhoto', 'visionImage', 'stormReportBackground'
  ];
  
  const storedImages = {};
  imageKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      storedImages[key] = value;
      console.log(`✓ ${key}: ${value.substring(0, 50)}...`);
    } else {
      console.log(`✗ ${key}: NOT FOUND`);
    }
  });
  
  // 2. Check current hero background
  console.log('\n2. HERO BACKGROUND CHECK:');
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    const computed = window.getComputedStyle(heroBg);
    console.log('Current background:', computed.backgroundImage.substring(0, 100) + '...');
    console.log('Has custom style?', heroBg.style.backgroundImage ? 'Yes' : 'No');
  } else {
    console.log('No .hero-bg element found');
  }
  
  // 3. Look for actual img elements in hero
  console.log('\n3. HERO IMG ELEMENTS:');
  const heroSection = document.querySelector('#home');
  if (heroSection) {
    const imgs = heroSection.querySelectorAll('img');
    console.log(`Found ${imgs.length} img elements in hero`);
    imgs.forEach((img, i) => {
      console.log(`Img ${i}: src="${img.src}", alt="${img.alt}", display="${img.style.display || 'default'}"`);
    });
  }
  
  // 4. Check service section structure
  console.log('\n4. SERVICE SECTION CHECK:');
  const serviceCards = document.querySelectorAll('#services [class*="card"]');
  console.log(`Found ${serviceCards.length} service cards`);
  
  if (serviceCards.length > 0) {
    const firstCard = serviceCards[0];
    console.log('\nFirst card structure:');
    const title = firstCard.querySelector('h3')?.textContent;
    console.log('Title:', title);
    
    const hasImgElement = firstCard.querySelector('img');
    console.log('Has <img> element?', !!hasImgElement);
    
    const hasImageDiv = firstCard.querySelector('.h-48');
    console.log('Has image div (.h-48)?', !!hasImageDiv);
    
    if (hasImageDiv) {
      console.log('Image div details:', {
        className: hasImageDiv.className,
        hasChildren: hasImageDiv.children.length,
        innerHTML: hasImageDiv.innerHTML.substring(0, 100)
      });
    }
  }
  
  // 5. Try to call getWebsiteImages if available
  console.log('\n5. TESTING IMAGE SERVICE:');
  if (window.__imageService) {
    console.log('ImageService available, testing...');
    window.__imageService.getWebsiteImages().then(images => {
      console.log('ImageService returned:', Object.keys(images).length, 'images');
      console.log('Images:', images);
    });
  } else {
    console.log('ImageService not available in window scope');
  }
  
  // 6. Check for any error messages in console
  console.log('\n6. RECOMMENDATIONS:');
  if (Object.keys(storedImages).length === 0) {
    console.log('❌ No images in localStorage - need to restore them');
  } else if (Object.keys(storedImages).length < 10) {
    console.log('⚠️ Some images missing from localStorage');
  } else {
    console.log('✓ All images present in localStorage');
    console.log('→ Issue is likely with component rendering or imageService');
  }
})();