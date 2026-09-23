// Service Worker - Festa da Padroeira
// Permite abrir o site offline. Estratégia:
// - Arquivos próprios (HTML/JS/CSS): network-first (sempre tenta a versão nova; cai no cache se offline)
// - Bibliotecas de CDN: cache-first (baixa uma vez e reusa)
// IMPORTANTE: NÃO intercepta chamadas do Firebase (dados) — essas passam direto pela rede,
// e o próprio Firebase cuida da fila offline/sincronização.

const CACHE = 'padroeira-v3';

// Arquivos do próprio site para funcionar offline
const ARQUIVOS_LOCAIS = [
  './',
  './index.html',
  './painel.html',
  './caixas.html',
  './camisetas.html',
  './doacoes.html',
  './necessidades.html',
  './patrocinios.html',
  './style.css',
  './app.js',
  './shared.js',
  './firebase-config.js',
  './pagina-caixas.js',
  './pagina-camisetas.js',
  './pagina-doacoes.js',
  './pagina-necessidades.js',
  './pagina-patrocinios.js',
  './logo.png',
  './manifest.json'
];

// Bibliotecas externas (CDN) para cachear
const LIBS_CDN = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cacheia os locais (obrigatório) e tenta os CDN (best-effort)
      return cache.addAll(ARQUIVOS_LOCAIS).then(() => {
        LIBS_CDN.forEach(url => cache.add(url).catch(() => {}));
      }).catch(() => {});
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // só GET

  const url = new URL(req.url);

  // NÃO interceptar Firebase (dados em tempo real e fila offline são do próprio SDK)
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('google') ||
      url.protocol === 'wss:') {
    return; // deixa passar direto pela rede
  }

  // Fontes do Google: cache-first
  if (url.hostname.includes('fonts.g')) {
    event.respondWith(
      caches.match(req).then(c => c || fetch(req).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(ca => ca.put(req, clone));
        return resp;
      }).catch(() => c))
    );
    return;
  }

  // Bibliotecas de CDN: cache-first
  if (LIBS_CDN.some(u => req.url.indexOf(u.split('?')[0]) === 0)) {
    event.respondWith(
      caches.match(req).then(c => c || fetch(req).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(ca => ca.put(req, clone));
        return resp;
      }))
    );
    return;
  }

  // Mesma origem (arquivos do site): network-first, cai no cache se offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(ca => ca.put(req, clone));
        return resp;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }
});
