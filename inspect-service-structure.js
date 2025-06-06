// Inspect service card structure in detail
(function() {
  console.log('=== INSPECTING SERVICE CARD STRUCTURE ===');
  
  const serviceSection = document.querySelector('#services');
  if (!serviceSection) return;
  
  // Get first service card to understand structure
  const firstCard = serviceSection.querySelector('[class*="card"]');
  if (firstCard) {
    console.log('First service card HTML:');
    console.log(firstCard.outerHTML.substring(0, 500) + '...');
    
    // Check for images
    const img = firstCard.querySelector('img');
    if (img) {
      console.log('\nFound img element:');
      console.log('- src:', img.src);
      console.log('- alt:', img.alt);
      console.log('- class:', img.className);
    }
    
    // Check for divs that might need background
    const divs = firstCard.querySelectorAll('div');
    console.log('\nDivs in card:', divs.length);
    divs.forEach((div, i) => {
      if (div.className.includes('h-48') || div.className.includes('overflow-hidden')) {
        console.log(`Div ${i}: class="${div.className}"`);
        if (div.style.backgroundImage) {
          console.log('  - Has background:', div.style.backgroundImage);
        }
      }
    });
  }
  
  // Now fix all service images
  console.log('\n=== FIXING ALL SERVICE IMAGES ===');
  
  const serviceImages = {
    'Residential Roofing': localStorage.getItem('residentialRoofingImage'),
    'Roof Repair': localStorage.getItem('roofRepairImage'),
    'Roof Inspection': localStorage.getItem('roofInspectionImage'),
    'Gutter Service': localStorage.getItem('gutterServiceImage'),
    'Storm Damage': localStorage.getItem('stormDamageImage'),
    'Painting': localStorage.getItem('paintingServiceImage')
  };
  
  // Find all cards
  const cards = serviceSection.querySelectorAll('[class*="card"]');
  cards.forEach(card => {
    // Find the title
    const titleEl = card.querySelector('h3, h4, .font-bold');
    if (!titleEl) return;
    
    const title = titleEl.textContent.trim();
    const imageUrl = serviceImages[title];
    
    if (imageUrl) {
      console.log(`Processing ${title}...`);
      
      // Method 1: Update existing img element
      const img = card.querySelector('img');
      if (img) {
        console.log(`  - Updating img src for ${title}`);
        img.src = imageUrl;
        img.onerror = null; // Remove error handler
      }
      
      // Method 2: Find div and set background
      const imgDiv = card.querySelector('div[class*="h-48"], div[class*="aspect-video"]');
      if (imgDiv && !img) {
        console.log(`  - Setting background for ${title}`);
        imgDiv.style.backgroundImage = `url('${imageUrl}')`;
        imgDiv.style.backgroundSize = 'cover';
        imgDiv.style.backgroundPosition = 'center';
      }
    }
  });
  
  console.log('\n✅ Done!');
})();