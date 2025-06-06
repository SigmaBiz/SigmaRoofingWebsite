// Inspect what's actually rendered on the page
console.log('=== INSPECTING PAGE STRUCTURE ===');

// Check basic page info
console.log('Current URL:', window.location.href);
console.log('Page title:', document.title);

// Look for any sections
const sections = document.querySelectorAll('section');
console.log('\nSections found:', sections.length);
sections.forEach((section, i) => {
  console.log(`Section ${i}: id="${section.id}", class="${section.className}"`);
});

// Look for main containers
const containers = document.querySelectorAll('[class*="container"], [class*="Container"]');
console.log('\nContainers found:', containers.length);

// Look for any divs with specific patterns
console.log('\nLooking for hero patterns...');
const heroPatterns = [
  'div[class*="hero"]',
  'div[class*="Hero"]',
  'div[class*="banner"]',
  'div[class*="Banner"]',
  'header',
  'main'
];

heroPatterns.forEach(pattern => {
  const elements = document.querySelectorAll(pattern);
  if (elements.length > 0) {
    console.log(`${pattern}: ${elements.length} found`);
    elements.forEach((el, i) => {
      if (i < 3) { // Show first 3
        console.log(`  - ${el.tagName} class="${el.className}"`);
      }
    });
  }
});

// Check if we're on the admin page
if (window.location.pathname.includes('admin')) {
  console.log('\n⚠️ You are on the ADMIN page. Navigate to the main page to see hero/services.');
}

// Look for the root React app
const root = document.getElementById('root') || document.getElementById('app');
console.log('\nRoot element:', root ? `Found (id="${root.id}")` : 'Not found');
if (root) {
  console.log('Root children:', root.children.length);
  console.log('Root HTML preview:', root.innerHTML.substring(0, 200) + '...');
}