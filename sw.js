// Service Worker για Οργανωτή Ταξιδιού
const CACHE_NAME = 'travel-planner-v2';
const OFFLINE_URL = '/index.html';

// Αρχεία για caching (ΒΑΣΙΚΑ)
const urlsToCache = [
  './',  // Κύριο HTML
  './index.html',
  './manifest.json'
];

// Εγκατάσταση - Προ-cache βασικών αρχείων
self.addEventListener('install', event => {
  console.log('✅ Service Worker: Εγκατάσταση...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Προ-caching βασικών αρχείων');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Όλα τα αρχεία προ-cached');
        return self.skipWaiting();
      })
  );
});

// Ενεργοποίηση
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Ενεργοποιήθηκε');
  event.waitUntil(self.clients.claim());
});

// Fetch - Offline πρώτη στρατηγική
self.addEventListener('fetch', event => {
  // Για navigation requests, επέστρεψε το offline.html αν αποτύχει
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Για άλλα requests (CSS, JS, JSON, κλπ)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Αν βρέθηκε στο cache, επέστρεψέ το
        if (response) {
          return response;
        }
        
        // Διαφορετικά, κάνε fetch και πρόσθεσέ το στο cache
        return fetch(event.request)
          .then(response => {
            // Μην cache-άρεις μη επιτυχημένα responses
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone το response για caching
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.log('❌ Fetch failed:', error);
            // Μπορείς να επιστρέψεις ένα fallback αν θες
          });
      })
  );
});
