const CACHE='metin-finans-v12';
const SHELL=['./','./index.html','./style.css?v=12','./calendar.css?v=12','./repeat.css?v=12','./bulk.css?v=12','./category.css?v=12','./app.js?v=12','./calendar.js?v=12','./repeat.js?v=12','./bulk.js?v=12','./category.js?v=12','./firebase.js?v=12','./manifest.webmanifest?v=12','./icon.svg?v=12'];
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