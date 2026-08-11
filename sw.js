const CACHE='metin-finans-v10';
const SHELL=['./','./index.html','./style.css?v=10','./calendar.css?v=10','./repeat.css?v=10','./bulk.css?v=10','./category.css?v=10','./app.js?v=10','./calendar.js?v=10','./repeat.js?v=10','./bulk.js?v=10','./category.js?v=10','./firebase.js?v=10','./manifest.webmanifest?v=10','./icon.svg?v=10'];
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