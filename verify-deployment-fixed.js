// Verify that the latest version is deployed
console.log('=== VERIFYING DEPLOYMENT ===\n');

// 1. Check if debug panel is hidden by default
console.log('1. CHECKING DEBUG PANEL...');
const allButtons = Array.from(document.querySelectorAll('button'));
const debugButton = allButtons.find(btn => 
  btn.textContent === 'Debug' || 
  btn.className.includes('bg-red-600')
);

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
    const urlMatch = bgImage.match(/url\("?([^"]+)"?\)/);
    if (urlMatch) console.log('   URL:', urlMatch[1]);
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
const serviceSection = document.querySelector('#services');
const serviceImages = serviceSection ? serviceSection.querySelectorAll('img') : [];
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
} else if (cloudinaryCount === 0) {
  console.log('⚠️  No service images found or using different sources');
}

// 5. Check project images
console.log('\n5. CHECKING PROJECT IMAGES...');
const projectImages = document.querySelectorAll('#projects img');
let projectCloudinaryCount = 0;
let projectUnsplashCount = 0;

projectImages.forEach(img => {
  if (img.src.includes('cloudinary')) projectCloudinaryCount++;
  if (img.src.includes('unsplash')) projectUnsplashCount++;
});

console.log(`   Cloudinary images: ${projectCloudinaryCount}`);
console.log(`   Unsplash images: ${projectUnsplashCount}`);

// 6. Check localStorage data
console.log('\n6. CHECKING LOCALSTORAGE...');
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

// 7. Check for specific version markers
console.log('\n7. VERSION MARKERS...');
// Check if the page has our fallback images by looking at inline styles or computed styles
const aboutSection = document.querySelector('#about');
const aboutImages = aboutSection ? aboutSection.querySelectorAll('img') : [];
const hasRealAboutImages = Array.from(aboutImages).some(img => 
  img.src.includes('rfwxm4ysfg1nsi9yumde') || // team photo
  img.src.includes('cc9tl1zez7eibeog2uvt')    // vision image
);

if (hasRealAboutImages) {
  console.log('✅ About section has real team/vision images (new version)');
} else {
  console.log('⚠️  About section images not verified');
}

// 8. Summary
console.log('\n=== DEPLOYMENT SUMMARY ===');
console.log('Expected git commit: ca8f27d');
console.log('Server should be on port 3000');
console.log('\nVersion indicators:');
console.log('- Debug button hidden: ' + (!debugButton ? '✅' : '❌'));
console.log('- Cloudinary images: ' + (cloudinaryCount > 0 ? '✅' : '❌'));
console.log('- No Unsplash images: ' + (unsplashCount === 0 ? '✅' : '❌'));
console.log('- Latest text (maybe): ' + (projectDesc?.textContent.includes('admin panel') ? '❌' : '✅'));

console.log('\nTo fully verify:');
console.log('1. Add ?debug=true to URL to test debug panel');
console.log('2. Press Ctrl+Shift+D to test keyboard activation');
console.log('3. If images are generic, run restore-all-data.js');