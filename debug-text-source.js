// Debug where the text is coming from
console.log('=== DEBUGGING TEXT SOURCE ===\n');

// Get React fiber of the description element
const descriptionP = document.querySelector('#projects p.text-xl.text-gray-300');

if (descriptionP) {
  // Look for React internal properties
  const reactKey = Object.keys(descriptionP).find(key => key.startsWith('__react'));
  
  if (reactKey) {
    const fiber = descriptionP[reactKey];
    console.log('React Fiber found:', fiber);
    
    // Try to find the component and its props
    let currentFiber = fiber;
    while (currentFiber) {
      if (currentFiber.memoizedProps && currentFiber.memoizedProps.children) {
        console.log('\nComponent props:', currentFiber.memoizedProps);
        if (typeof currentFiber.memoizedProps.children === 'string') {
          console.log('Text content:', currentFiber.memoizedProps.children);
        }
      }
      currentFiber = currentFiber.return;
    }
  }
  
  // Also check if the text is being set by JavaScript after load
  console.log('\nSetting up mutation observer to catch text changes...');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        console.log('Text changed to:', mutation.target.textContent);
        console.trace('Text change stack trace');
      }
    });
  });
  
  observer.observe(descriptionP, {
    childList: true,
    characterData: true,
    subtree: true
  });
  
  console.log('Observer set. If the text changes, you\'ll see a stack trace.');
  
  // Store observer reference
  window._textObserver = observer;
  console.log('To stop observing: window._textObserver.disconnect()');
}