// Kill-switch service worker: clears all caches and unregisters itself.
// Deployed to replace the old caching service worker so that existing users
// who still have the previous SW installed will receive this update,
// wipe their caches, and never be controlled by a SW again.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => caches.delete(name)))
    ).then(() => self.clients.matchAll()).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
      return self.registration.unregister();
    })
  );
});
