const CACHE='metin-finans-v16';
const SHELL=['./','./index.html','./style.css?v=16','./calendar.css?v=16','./repeat.css?v=16','./bulk.css?v=16','./category.css?v=16','./app.js?v=16','./calendar.js?v=16','./repeat.js?v=16','./bulk.js?v=16','./category.js?v=16','./firebase.js?v=16','./manifest.webmanifest?v=16','./icon.svg?v=16'];
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
