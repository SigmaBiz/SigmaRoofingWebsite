// Check current page state
(function() {
  console.log('=== CHECKING PAGE STATE ===');
  
  // 1. Check URL and basic info
  console.log('Current URL:', window.location.href);
  console.log('Page title:', document.title);
  
  // 2. Check for sections
  const sections = document.querySelectorAll('section');
  console.log('\nSections found:', sections.length);
  sections.forEach(section => {
    console.log(`- ${section.id || 'no-id'}: ${section.className}`);
  });
  
  // 3. Check for error states
  const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
  console.log('\nError elements:', errorElements.length);
  
  // 4. Check React root
  const root = document.getElementById('root');
  console.log('\nReact root:', root ? 'Found' : 'Not found');
  if (root) {
    console.log('Root innerHTML length:', root.innerHTML.length);
    console.log('First 200 chars:', root.innerHTML.substring(0, 200));
  }
  
  // 5. Check for loading states
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"], [class*="spinner"]');
  console.log('\nLoading elements:', loadingElements.length);
  
  // 6. Force reload if needed
  console.log('\nIf the page appears broken, try:');
  console.log('1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
  console.log('2. Or run: location.reload(true)');
})();