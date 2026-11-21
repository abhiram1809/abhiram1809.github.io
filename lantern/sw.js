// The game's assets kept in the browser between visits (the scans, the props, the people, the
// textures, the voices, the mocap): served from the cache at once, and fetched again behind it so a
// rebuilt file shows on the next visit (a hard refresh, Cmd+Shift+R, skips this altogether). The code
// itself isn't cached here: the dev server and a deploy's hashed bundles look after that.
// On the dev server it's the other way round: the server first (it's on this machine, and a rebuilt
// model must show at once, not a visit late), the cache only if the server doesn't answer.
const SCOPE = new URL(self.registration.scope).pathname;
const CACHE_PREFIX = `lantern-assets:${SCOPE}:`;
const CACHE = `${CACHE_PREFIX}v1`;
const ASSETS = /^(models|textures|voices|anims)\//;
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/.test(self.location.hostname);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => (key.startsWith(CACHE_PREFIX) && key !== CACHE) || (SCOPE === '/' && /^gl-assets-v[12]$/.test(key)))
    .map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)
      || !ASSETS.test(url.pathname.slice(SCOPE.length))) return;
  // the indexes (the voices' manifest) from the network every time: a stale one pointed new lines at nothing
  if (url.pathname.endsWith('.json')) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(req);
    const fresh = fetch(req, LOCAL ? { cache: 'no-cache' } : undefined).then((res) => {
      if (res.ok && res.status === 200) cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    if (hit && !LOCAL) { e.waitUntil(fresh); return hit; }
    return fresh;
  }));
});
