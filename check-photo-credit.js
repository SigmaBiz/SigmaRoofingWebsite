// Check if photo credit is present
console.log('=== CHECKING PHOTO CREDIT ===\n');

// Look for the credit div
const creditDiv = document.querySelector('.absolute.bottom-2.left-2');

if (creditDiv) {
  console.log('✅ Photo credit div found!');
  console.log('Text content:', creditDiv.textContent);
  console.log('Classes:', creditDiv.className);
  
  // Check visibility
  const computed = window.getComputedStyle(creditDiv);
  console.log('\nVisibility details:');
  console.log('- Display:', computed.display);
  console.log('- Opacity:', computed.opacity);
  console.log('- Position:', computed.position);
  console.log('- Bottom:', computed.bottom);
  console.log('- Left:', computed.left);
  console.log('- Z-index:', computed.zIndex);
  console.log('- Color:', computed.color);
  
  // Check if it's being hidden by something
  const rect = creditDiv.getBoundingClientRect();
  console.log('\nPosition on screen:');
  console.log('- Top:', rect.top);
  console.log('- Left:', rect.left);
  console.log('- Width:', rect.width);
  console.log('- Height:', rect.height);
  
  // Make it temporarily more visible for testing
  console.log('\n🔍 Making it more visible temporarily...');
  creditDiv.style.fontSize = '20px';
  creditDiv.style.color = 'yellow';
  creditDiv.style.backgroundColor = 'black';
  creditDiv.style.padding = '10px';
  creditDiv.style.zIndex = '9999';
  console.log('Credit should now be VERY visible in yellow text on black background!');
  
} else {
  console.log('❌ Photo credit not found in DOM');
  
  // Check if hero section exists
  const heroSection = document.querySelector('#home');
  if (heroSection) {
    console.log('Hero section found. Looking for any absolute positioned elements...');
    const absolutes = heroSection.querySelectorAll('.absolute');
    console.log(`Found ${absolutes.length} absolute positioned elements in hero`);
    
    // Check for text containing "Greg Johnson"
    const allText = document.body.innerText;
    if (allText.includes('Greg Johnson')) {
      console.log('✅ "Greg Johnson" text found somewhere on page');
    } else {
      console.log('❌ "Greg Johnson" text not found anywhere');
    }
  }
}