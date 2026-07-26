const CACHE='metin-finans-v7';
const SHELL=['./','./index.html','./style.css?v=7','./calendar.css?v=7','./repeat.css?v=7','./bulk.css?v=7','./app.js?v=7','./calendar.js?v=7','./repeat.js?v=7','./bulk.js?v=7','./firebase.js?v=7','./manifest.webmanifest?v=7','./icon.svg?v=7'];
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