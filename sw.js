const CACHE='metin-finans-v8';
const SHELL=['./','./index.html','./style.css?v=8','./calendar.css?v=8','./repeat.css?v=8','./bulk.css?v=8','./category.css?v=8','./app.js?v=8','./calendar.js?v=8','./repeat.js?v=8','./bulk.js?v=8','./firebase.js?v=8','./manifest.webmanifest?v=8','./icon.svg?v=8'];
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