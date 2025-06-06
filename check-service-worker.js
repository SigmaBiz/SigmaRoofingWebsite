// Check for service workers and caches
console.log('=== CHECKING SERVICE WORKERS AND CACHES ===\n');

// Check if service worker is registered
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.log('⚠️  Service Workers found:', registrations.length);
      registrations.forEach((reg, i) => {
        console.log(`Worker ${i + 1}:`, reg.scope);
        console.log('  Active:', reg.active?.scriptURL);
        console.log('  Waiting:', reg.waiting?.scriptURL);
        
        // Unregister it
        reg.unregister().then(() => {
          console.log(`  ✅ Unregistered worker ${i + 1}`);
        });
      });
      console.log('\n🔄 Please refresh the page after workers are unregistered');
    } else {
      console.log('✅ No service workers registered');
    }
  });
} else {
  console.log('ℹ️  Service workers not supported');
}

// Check caches
if ('caches' in window) {
  caches.keys().then(names => {
    if (names.length > 0) {
      console.log('\n⚠️  Caches found:', names);
      names.forEach(name => {
        caches.delete(name).then(() => {
          console.log(`  ✅ Deleted cache: ${name}`);
        });
      });
    } else {
      console.log('\n✅ No caches found');
    }
  });
}