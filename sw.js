const CACHE='metin-finans-v19';
const SHELL=['./','./index.html','./style.css?v=19','./calendar.css?v=19','./repeat.css?v=19','./bulk.css?v=19','./category.css?v=19','./interaction.css?v=19','./app.js?v=19','./calendar.js?v=19','./repeat.js?v=19','./bulk.js?v=19','./category.js?v=19','./interaction.js?v=19','./firebase.js?v=19','./manifest.webmanifest?v=19','./icon.svg?v=19'];
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
