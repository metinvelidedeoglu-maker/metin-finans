const CACHE='metin-finans-v13';
const SHELL=['./','./index.html','./style.css?v=13','./calendar.css?v=13','./repeat.css?v=13','./bulk.css?v=13','./category.css?v=13','./app.js?v=13','./calendar.js?v=13','./repeat.js?v=13','./bulk.js?v=13','./category.js?v=13','./firebase.js?v=13','./manifest.webmanifest?v=13','./icon.svg?v=13'];
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