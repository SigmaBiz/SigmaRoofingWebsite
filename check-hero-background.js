// Check the hero background element specifically
console.log('=== CHECKING HERO BACKGROUND ===');

// Find the hero background div
const heroBg = document.querySelector('.hero-bg');
console.log('Hero background element found:', !!heroBg);

if (heroBg) {
  // Check computed styles
  const computedStyle = window.getComputedStyle(heroBg);
  console.log('\nComputed styles:');
  console.log('- background-image:', computedStyle.backgroundImage);
  console.log('- background-size:', computedStyle.backgroundSize);
  console.log('- background-position:', computedStyle.backgroundPosition);
  console.log('- opacity:', computedStyle.opacity);
  console.log('- display:', computedStyle.display);
  console.log('- position:', computedStyle.position);
  console.log('- width:', computedStyle.width);
  console.log('- height:', computedStyle.height);
  
  // Check inline styles
  console.log('\nInline style:', heroBg.style.cssText);
  
  // Try to manually set the background
  const heroBackground = localStorage.getItem('heroBackground');
  if (heroBackground && (!computedStyle.backgroundImage || computedStyle.backgroundImage === 'none')) {
    console.log('\n🔧 Manually setting background image...');
    heroBg.style.backgroundImage = `url(${heroBackground})`;
    heroBg.style.backgroundSize = 'cover';
    heroBg.style.backgroundPosition = 'center';
    console.log('✓ Background image set!');
  }
}

// Also check for service images
console.log('\n=== CHECKING SERVICE IMAGES ===');
const serviceCards = document.querySelectorAll('#services img');
console.log('Service images found:', serviceCards.length);
serviceCards.forEach((img, i) => {
  console.log(`Service ${i}: src="${img.src}", display="${window.getComputedStyle(img).display}"`);
});