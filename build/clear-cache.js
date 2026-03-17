// Unregister any existing service workers to clear cache
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister();
            console.log('✅ Service Worker unregistered');
        }
    });
}

// Clear all caches
if ('caches' in window) {
    caches.keys().then(function (names) {
        for (let name of names) {
            caches.delete(name);
            console.log('✅ Cache cleared:', name);
        }
    });
}

console.log('🔄 Cache cleared. Please refresh the page.');
