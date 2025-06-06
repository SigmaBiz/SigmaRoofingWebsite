// Search for the exact text in all loaded scripts
console.log('=== SEARCHING FOR TEXT IN LOADED SCRIPTS ===\n');

const searchText = "Custom project gallery showcasing our latest roofing work managed through your admin panel";
const scripts = document.getElementsByTagName('script');
let found = false;

// Search in inline scripts
for (let i = 0; i < scripts.length; i++) {
  if (scripts[i].innerHTML && scripts[i].innerHTML.includes(searchText)) {
    console.log('❌ Found in inline script #' + i);
    console.log('Script content preview:', scripts[i].innerHTML.substring(0, 200) + '...');
    found = true;
  }
}

// Search in all loaded JavaScript files via fetch
const scriptSrcs = Array.from(scripts).filter(s => s.src).map(s => s.src);

console.log('\nChecking loaded script files...');
scriptSrcs.forEach(async (src) => {
  try {
    const response = await fetch(src);
    const text = await response.text();
    if (text.includes(searchText)) {
      console.log('❌ Found in script:', src);
      
      // Try to find the exact location
      const index = text.indexOf(searchText);
      const preview = text.substring(Math.max(0, index - 50), index + searchText.length + 50);
      console.log('Context:', preview);
    }
  } catch (e) {
    console.log('Could not check:', src);
  }
});

// Also check the current React component
setTimeout(() => {
  const descP = document.querySelector('#projects p.text-xl.text-gray-300');
  if (descP) {
    console.log('\n=== CURRENT STATE ===');
    console.log('Current text:', descP.textContent);
    console.log('Text includes old version:', descP.textContent.includes('roofing work managed'));
    
    // Try to access React internals
    const reactKey = Object.keys(descP).find(key => key.startsWith('__react'));
    if (reactKey) {
      console.log('\nReact fiber found, checking component state...');
      let fiber = descP[reactKey];
      while (fiber) {
        if (fiber.memoizedState || fiber.memoizedProps) {
          console.log('Component type:', fiber.type?.name || fiber.elementType);
          if (fiber.memoizedProps?.children && typeof fiber.memoizedProps.children === 'string') {
            console.log('Props children:', fiber.memoizedProps.children);
          }
        }
        fiber = fiber.return;
      }
    }
  }
  
  if (!found) {
    console.log('\n✅ Text not found in loaded scripts');
    console.log('This suggests the text might be:');
    console.log('1. Coming from a cached build');
    console.log('2. Being set by server-side data');
    console.log('3. In a dynamically loaded chunk');
  }
}, 1000);