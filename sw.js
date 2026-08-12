const CACHE='metin-finans-v14';
const SHELL=['./','./index.html','./style.css?v=14','./calendar.css?v=14','./repeat.css?v=14','./bulk.css?v=14','./category.css?v=14','./app.js?v=14','./calendar.js?v=14','./repeat.js?v=14','./bulk.js?v=14','./category.js?v=14','./firebase.js?v=14','./manifest.webmanifest?v=14','./icon.svg?v=14'];
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