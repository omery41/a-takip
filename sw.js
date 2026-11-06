/* a-takip · çevrimdışı önbellek (sürüm cf772a5199) */
const C="at-cf772a5199";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(["./","index.html","manifest.json","icon-192.png","icon-180.png"]).catch(()=>{})))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
 if(u.hostname.endsWith("googleapis.com")||u.pathname.includes("/google.firestore"))return;
 if(u.hostname==="www.gstatic.com"){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{const y=x.clone();caches.open(C).then(c=>c.put(r,y));return x})));return}
 if(u.origin!==location.origin)return;
 if(u.pathname.endsWith("version.txt"))return;
 e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(r,y))}return x}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("index.html"))))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window"}).then(L=>L.length?L[0].focus():self.clients.openWindow("./")))});
