const CACHE='metin-finans-v9';
const SHELL=['./','./index.html','./style.css?v=9','./calendar.css?v=9','./repeat.css?v=9','./bulk.css?v=9','./category.css?v=9','./app.js?v=9','./calendar.js?v=9','./repeat.js?v=9','./bulk.js?v=9','./category.js?v=9','./firebase.js?v=9','./manifest.webmanifest?v=9','./icon.svg?v=9'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(
    fetch(event.request).then(response=>{
      if(response&&(response.ok||response.type==='opaque')){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html')))
  );
});