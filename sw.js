var CACHE="mylist-v6";
var ASSETS=["./","index.html","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","sync.js"];
self.addEventListener("install",function(e){ e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);})); self.skipWaiting(); });
self.addEventListener("activate",function(e){ e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return k!==CACHE?caches.delete(k):null;}));})); self.clients.claim(); });
self.addEventListener("fetch",function(e){
  var url;
  try{ url=new URL(e.request.url); }catch(_){ return; }
  if(url.origin!==location.origin) return; // never touch Supabase / API calls
  // network-first: always try fresh, cache it, fall back to cache when offline
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy=res.clone(); caches.open(CACHE).then(function(c){ try{c.put(e.request,copy);}catch(_){} }); return res;
    }).catch(function(){ return caches.match(e.request).then(function(hit){ return hit || caches.match("index.html"); }); })
  );
});
