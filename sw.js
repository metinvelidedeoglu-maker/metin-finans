const CACHE='metin-finans-v18';
const SHELL=['./','./index.html','./style.css?v=18','./calendar.css?v=18','./repeat.css?v=18','./bulk.css?v=18','./category.css?v=18','./interaction.css?v=18','./app.js?v=18','./calendar.js?v=18','./repeat.js?v=18','./bulk.js?v=18','./category.js?v=18','./interaction.js?v=18','./firebase.js?v=18','./manifest.webmanifest?v=18','./icon.svg?v=18'];
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
