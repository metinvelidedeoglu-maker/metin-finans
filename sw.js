const CACHE='metin-finans-v11';
const SHELL=['./','./index.html','./style.css?v=11','./calendar.css?v=11','./repeat.css?v=11','./bulk.css?v=11','./category.css?v=11','./app.js?v=11','./calendar.js?v=11','./repeat.js?v=11','./bulk.js?v=11','./category.js?v=11','./firebase.js?v=11','./manifest.webmanifest?v=11','./icon.svg?v=11'];
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