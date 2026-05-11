/* eslint-disable no-restricted-globals */
// Custom service worker logic merged into the workbox-generated SW via
// `workbox.importScripts` in vite.config.ts. Owns notification interaction
// only — caching and routing remain workbox's job.

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetPath = typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/workouts/active';
  event.waitUntil(
    (async () => {
      const targetUrl = new URL(targetPath, self.location.origin).href;
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Prefer an existing window already on the workout — just focus it.
      for (const client of allClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise focus any open window and route it to the workout.
      for (const client of allClients) {
        if ('focus' in client) {
          try {
            if ('navigate' in client && typeof client.navigate === 'function') {
              await client.navigate(targetUrl);
            }
            return client.focus();
          } catch {
            // ignore and fall through to openWindow
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })()
  );
});
