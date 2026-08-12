const CACHE='metin-finans-v15';
const SHELL=['./','./index.html','./style.css?v=15','./calendar.css?v=15','./repeat.css?v=15','./bulk.css?v=15','./category.css?v=15','./app.js?v=15','./calendar.js?v=15','./repeat.js?v=15','./bulk.js?v=15','./category.js?v=15','./firebase.js?v=15','./manifest.webmanifest?v=15','./icon.svg?v=15'];
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