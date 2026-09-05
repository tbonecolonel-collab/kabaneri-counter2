const CACHE = "kabaneri-v79";
const ASSETS = ["./.nojekyll", "./README.txt", "./assets/backgrounds/black-minimal.svg", "./assets/backgrounds/iron-red.svg", "./assets/backgrounds/rail-night.svg", "./assets/backgrounds/steel-dark.svg", "./assets/buttons/attack.svg", "./assets/buttons/avoid.svg", "./assets/buttons/result-fail.svg", "./assets/fixed/end_members.jpg", "./assets/fixed/end_swimsuit.jpg", "./assets/fixed/intro_biba.jpg", "./assets/fixed/intro_female.jpg", "./assets/fixed/intro_male.jpg", "./assets/fixed/item_ayame_bow.jpg", "./assets/fixed/item_butterfly.jpg", "./assets/fixed/item_chukichi.jpg", "./assets/fixed/item_daikichi.jpg", "./assets/fixed/item_jiketsu.jpg", "./assets/fixed/item_kurusu_sword.jpg", "./assets/fixed/item_mumei_gun.jpg", "./assets/fixed/item_mumei_kendama.jpg", "./assets/fixed/item_shokichi.jpg", "./assets/fixed/item_tsuranuiki.jpg", "./assets/fixed/result_ep.jpg", "./assets/fixed/result_shun.jpg", "./assets/fixed/sea_ayame.jpg", "./assets/fixed/sea_kajika.jpg", "./assets/fixed/sea_lie_mumei.jpg", "./assets/fixed/sea_mumei.jpg", "./assets/fixed/sea_sakura_mumei.jpg", "./assets/fixed/sea_yukina.jpg", "./assets/fixed/stage_kotetsujo.jpg", "./assets/fixed/stage_line6.jpg", "./assets/fixed/stage_yard.jpg", "./assets/fixed/trophy_bronze.jpg", "./assets/fixed/trophy_gold.jpg", "./assets/fixed/trophy_kirin.jpg", "./assets/fixed/trophy_rainbow.jpg", "./assets/fixed/trophy_silver.jpg", "./assets/fixed/voice_female.jpg", "./assets/fixed/voice_kage_mid.jpg", "./assets/fixed/voice_kage_strong.jpg", "./assets/fixed/voice_kage_weak.jpg", "./assets/fixed/voice_male.jpg", "./assets/fixed/voice_none.jpg", "./assets/fixed/voice_special.jpg", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/ikoma.png", "./assets/item_ayame_bow.png", "./assets/item_butterfly.png", "./assets/item_chukichi.png", "./assets/item_daikichi.png", "./assets/item_jiketsu.png", "./assets/item_kurusu_sword.png", "./assets/item_mumei_gun.png", "./assets/item_mumei_kendama.png", "./assets/item_shokichi.png", "./assets/item_tsuranuiki.png", "./assets/kabane.png", "./assets/mumei.png", "./assets/placeholder.svg", "./css/style.css", "./index.html", "./js/app.js", "./js/data.js", "./js/storage.js", "./manifest.json"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k.startsWith("kabaneri-")).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then(response => {
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    return response;
  }).catch(() => caches.match(event.request).then(r => r || caches.match("./index.html"))));
});
