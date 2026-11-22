/* REGION: LEEWAY_CRM_PAGES_CACHE
 * TAG: LEEWAY-CRM-CACHE-001
 * WHAT: Network-first GitHub Pages assets, legacy cache cleanup
 * WHY: Prevent stale service worker from masking production ERP/CRM updates
 * WHO: LeeWay Industries / authorized maintainers
 * WHERE: service-worker.js
 * WHEN: 2026-11-02
 * HOW: Same-origin, in-scope GET navigation and app assets only; no customer data caching
 * LICENSE: Apache-2.0
 */
const CACHE_NAME = 'leeway-crm-shell-v2';
const SHELL = new Set([
  new URL('./', self.registration.scope).href,
  new URL('./index.html', self.registration.scope).href,
  new URL('./manifest.json', self.registration.scope).href,
  new URL('./icon.svg', self.registration.scope).href,
  new URL('./modules/engagement-operations.js', self.registration.scope).href,
  new URL('./modules/sidebar-navigation.js', self.registration.scope).href
]);

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name === 'leeway-crm-v1' || name.startsWith('leeway-crm-shell-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (!SHELL.has(url.href)) return;

  // Revalidate the application first, falling back to cached shell only if offline.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(req, {cache:'no-store'});
      if (response.ok) await cache.put(req, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(req);
      if (cached) return cached;
      throw error;
    }
  })());
});
