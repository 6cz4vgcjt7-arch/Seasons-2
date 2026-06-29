const CACHE="seasons-v135-20260629";
const ASSETS=["./","./index.html","./style.css?v=1.3.5","./storage.js?v=1.3.5","./engine.js?v=1.3.5","./ui.js?v=1.3.5","./app.js?v=1.3.5","./manifest.webmanifest","./icon.svg","./version.json"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(url.pathname.endsWith("/version.json")){event.respondWith(fetch(event.request,{cache:"no-store"}));return;}
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    return response;
  }).catch(()=>caches.match(event.request)));
});
