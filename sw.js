const CACHE="seasons-v114-20260628";
const ASSETS=["./","./index.html","./style.css?v=1.1.4","./storage.js?v=1.1.4","./engine.js?v=1.1.4","./ui.js?v=1.1.4","./app.js?v=1.1.4","./manifest.webmanifest","./icon.svg","./version.json"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));});
