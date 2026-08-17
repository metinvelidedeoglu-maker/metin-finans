const CACHE='metin-finans-v20';
const SHELL=['./','./index.html','./style.css?v=20','./calendar.css?v=20','./repeat.css?v=20','./bulk.css?v=20','./category.css?v=20','./interaction.css?v=20','./app.js?v=20','./calendar.js?v=20','./repeat.js?v=20','./bulk.js?v=20','./category.js?v=20','./interaction.js?v=20','./firebase.js?v=20','./manifest.webmanifest?v=20','./icon.svg?v=20'];
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