// Verify that the latest version is deployed
console.log('=== VERIFYING DEPLOYMENT ===\n');

// 1. Check if debug panel is hidden by default
console.log('1. CHECKING DEBUG PANEL...');
const debugButton = document.querySelector('button:has-text("Debug")') || 
                   document.querySelector('button[class*="bg-red-600"]');
if (!debugButton) {
  console.log('✅ Debug button is hidden (as expected)');
  console.log('   Access with: ?debug=true or Ctrl+Shift+D');
} else {
  console.log('❌ Debug button is visible (should be hidden)');
}

// 2. Check hero background image
console.log('\n2. CHECKING HERO BACKGROUND...');
const heroSection = document.querySelector('.hero-bg');
if (heroSection) {
  const computedStyle = window.getComputedStyle(heroSection);
  const bgImage = computedStyle.backgroundImage;
  
  if (bgImage.includes('cloudinary')) {
    console.log('✅ Hero uses Cloudinary image');
    console.log('   URL:', bgImage.match(/url\("?([^"]+)"?\)/)?.[1]);
  } else if (bgImage.includes('unsplash')) {
    console.log('❌ Hero still uses Unsplash (old version)');
  } else {
    console.log('⚠️  Hero background:', bgImage);
  }
}

// 3. Check project gallery text
console.log('\n3. CHECKING PROJECT GALLERY TEXT...');
const projectSection = document.querySelector('#projects');
const projectDesc = projectSection?.querySelector('p.text-xl.text-gray-300');
if (projectDesc) {
  const text = projectDesc.textContent.trim();
  console.log('   Current text:', text);
  
  if (text === "Custom project gallery showcasing our latest work.") {
    console.log('✅ Project text is correct (new version)');
  } else if (text.includes('admin panel')) {
    console.log('❌ Project text still has "admin panel" (old version)');
  } else {
    console.log('ℹ️  Different text (probably showing static projects)');
  }
}

// 4. Check service images
console.log('\n4. CHECKING SERVICE IMAGES...');
const serviceImages = document.querySelectorAll('.service-card img, [class*="service"] img');
let cloudinaryCount = 0;
let unsplashCount = 0;

serviceImages.forEach(img => {
  if (img.src.includes('cloudinary')) cloudinaryCount++;
  if (img.src.includes('unsplash')) unsplashCount++;
});

console.log(`   Cloudinary images: ${cloudinaryCount}`);
console.log(`   Unsplash images: ${unsplashCount}`);

if (unsplashCount === 0 && cloudinaryCount > 0) {
  console.log('✅ All service images use Cloudinary');
} else if (unsplashCount > 0) {
  console.log('❌ Still using Unsplash images (old version)');
}

// 5. Check localStorage data
console.log('\n5. CHECKING LOCALSTORAGE...');
const adminProjects = localStorage.getItem('adminProjects');
const heroBackground = localStorage.getItem('heroBackground');

if (adminProjects) {
  try {
    const projects = JSON.parse(adminProjects);
    console.log(`✅ Admin projects: ${projects.length} projects`);
  } catch (e) {
    console.log('⚠️  Admin projects: Invalid JSON');
  }
} else {
  console.log('⚠️  No admin projects in localStorage');
}

if (heroBackground) {
  console.log('✅ Hero background in localStorage');
} else {
  console.log('⚠️  No hero background in localStorage');
}

// 6. Summary
console.log('\n=== DEPLOYMENT SUMMARY ===');
console.log('Git commit: ca8f27d (latest)');
console.log('Server: Running on port 3000');
console.log('To verify completely:');
console.log('1. Add ?debug=true to URL and check debug panel');
console.log('2. Run restore-all-data.js if images are missing');
console.log('3. Check all pages for Cloudinary images');

// Test debug activation
console.log('\n=== TESTING DEBUG ACTIVATION ===');
console.log('Press Ctrl+Shift+D to test keyboard activation...');