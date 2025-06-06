// Force update the project gallery text
console.log('=== FORCING TEXT UPDATE ===\n');

// Find the description paragraph
const descriptionP = document.querySelector('#projects p.text-xl.text-gray-300');

if (descriptionP) {
  console.log('Current text:', descriptionP.textContent.trim());
  
  // Update the text directly
  descriptionP.textContent = "Custom project gallery showcasing our latest work.";
  
  console.log('Updated text:', descriptionP.textContent.trim());
  console.log('\n✅ Text updated in DOM!');
  console.log('\nNOTE: This is a temporary fix. To make it permanent:');
  console.log('1. Clear your browser cache completely');
  console.log('2. Hard refresh (Cmd+Shift+R)');
  console.log('3. Or open in a new incognito window');
} else {
  console.log('❌ Could not find the description paragraph');
}