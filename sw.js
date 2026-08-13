const CACHE='metin-finans-v17';
const SHELL=['./','./index.html','./style.css?v=17','./calendar.css?v=17','./repeat.css?v=17','./bulk.css?v=17','./category.css?v=17','./app.js?v=17','./calendar.js?v=17','./repeat.js?v=17','./bulk.js?v=17','./category.js?v=17','./firebase.js?v=17','./manifest.webmanifest?v=17','./icon.svg?v=17'];
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
