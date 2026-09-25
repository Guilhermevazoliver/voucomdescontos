// Service worker do Vou com Descontos — só cacheia o "shell" estático
// (HTML das páginas) pra funcionar offline/instalado. NUNCA cacheia
// chamada à API (search-products/product-detail/julia/watchlist) —
// preço e disponibilidade são sempre buscados de novo, pra nunca
// mostrar dado antigo como se fosse atual (regra permanente do projeto:
// nunca inventar/reaproveitar preço velho).
const CACHE_NAME = "vcd-shell-v1";
const SHELL_URLS = [
  "/", "/buscar/", "/oferta/", "/minha-lista/", "/queridinhos/",
  "/top-100/", "/categorias/", "/julia/", "/manifest.webmanifest",
  "/icon-192.png", "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca intercepta chamadas de API (outro domínio, supabase functions).
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  // Network-first pro shell: sempre tenta buscar a versão nova primeiro;
  // só usa o cache se estiver offline. Assim nunca serve HTML desatualizado
  // enquanto o site estiver acessível.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
