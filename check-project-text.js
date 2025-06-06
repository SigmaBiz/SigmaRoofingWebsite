// Check what text is currently displayed in the projects section
console.log('=== CHECKING PROJECT GALLERY TEXT ===\n');

// Find the projects section
const projectSection = document.querySelector('#projects');
if (!projectSection) {
  console.log('❌ Projects section not found');
} else {
  // Find the description paragraph
  const descriptionP = projectSection.querySelector('p.text-xl.text-gray-300');
  if (descriptionP) {
    console.log('Current text:', descriptionP.textContent.trim());
    console.log('\n');
    
    // Check if it contains the old text
    if (descriptionP.textContent.includes('managed through your admin panel')) {
      console.log('⚠️  Old text still present!');
      console.log('This might be cached. Try:');
      console.log('1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
      console.log('2. Clear browser cache');
      console.log('3. Open in incognito/private window');
    } else if (descriptionP.textContent.includes('Custom project gallery showcasing our latest work')) {
      console.log('✅ Text is already updated!');
    } else {
      console.log('ℹ️  Different text is displayed (probably showing static projects)');
    }
  } else {
    console.log('❌ Description paragraph not found');
  }
}

// Also check localStorage for admin projects
const adminProjects = localStorage.getItem('adminProjects');
if (adminProjects) {
  try {
    const projects = JSON.parse(adminProjects);
    console.log(`\n📦 Admin projects in localStorage: ${projects.length} projects`);
  } catch (e) {
    console.log('\n⚠️  Error parsing admin projects');
  }
} else {
  console.log('\n📦 No admin projects in localStorage');
}