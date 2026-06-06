// ============================================
// Service Worker (PWA Phase 1)
// 戦略: App Shell + 画像を初回キャッシュ、以降は Cache First
// ============================================

const CACHE_VERSION = 'unmei-v15.2.5';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

// App shell（必須リソース）
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css?v=15.2.5',
  './js/data.js?v=15.2.5',
  './js/rare.js?v=15.2.5',
  './js/compatibility.js?v=15.2.5',
  './js/ranking.js?v=15.2.5',
  './js/share_actions.js?v=15.2.5',
  './js/ranking_card.js?v=15.2.5',
  './js/info_modal.js?v=15.2.5',
  './js/monetize.js?v=15.2.5',
  './js/flow.js?v=15.2.5',
  './js/share.js?v=15.2.5',
  './js/main.js?v=15.2.5',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png'
];

// キャラ画像20体（事前キャッシュ、初回ロード後にバックグラウンドDL）
const CHAR_IMAGES = [
  'assets/chars/unmei_intj_blackcat_reading.png',
  'assets/chars/unmei_intp_whitecat_sleepy.png',
  'assets/chars/unmei_infj_unicorn_pink.png',
  'assets/chars/unmei_infp_purplerabbit_moon.png',
  'assets/chars/unmei_enfp_squirrel_rainbow.png',
  'assets/chars/unmei_enfj_bear_heart.png',
  'assets/chars/unmei_entj_blackcat_crown.png',
  'assets/chars/unmei_entp_raccoon.png',
  'assets/chars/unmei_istj_shibainu.png',
  'assets/chars/unmei_isfj_sheep_pink.png',
  'assets/chars/unmei_istp_wolf_gray.png',
  'assets/chars/unmei_isfp_calico_paint.png',
  'assets/chars/unmei_estj_tiger.png',
  'assets/chars/unmei_esfj_bulldog.png',
  'assets/chars/unmei_estp_star.png',
  'assets/chars/unmei_esfp_chick_sun.png',
  'assets/chars/rare_cursed_purplerabbit.png',
  'assets/chars/rare_blank_whitecat.png',
  'assets/chars/rare_bloodline_goldrabbit.png',
  'assets/chars/rare_legendary_angelpoodle.png'
];

// ===== install: App Shell を即キャッシュ =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(APP_SHELL);
    }).then(() => {
      // 画像はバックグラウンドで遅延キャッシュ（ブロックしない）
      caches.open(IMAGE_CACHE).then((cache) => {
        cache.addAll(CHAR_IMAGES).catch((e) => {
          console.warn('[SW] image pre-cache partial fail', e);
        });
      });
      return self.skipWaiting();   // 即新SWに切替
    })
  );
});

// ===== activate: 古いキャッシュ削除 =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())   // すべてのタブを掌握
  );
});

// ===== fetch: Cache First (フォールバック: ネット) =====
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // GET 以外、cross-origin（Googleフォント等）はそのまま
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 画像は IMAGE_CACHE、それ以外は STATIC_CACHE
  const cacheName = url.pathname.includes('/assets/chars/') ? IMAGE_CACHE : STATIC_CACHE;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // バックグラウンドで最新版も取得（stale-while-revalidate 風）
        fetch(req).then((fresh) => {
          if (fresh.ok) {
            caches.open(cacheName).then((cache) => cache.put(req, fresh));
          }
        }).catch(() => {/* オフラインなら無視 */});
        return cached;
      }
      // キャッシュなし → ネット取得 → キャッシュ保存 → 返却
      return fetch(req).then((fresh) => {
        if (fresh.ok) {
          const copy = fresh.clone();
          caches.open(cacheName).then((cache) => cache.put(req, copy));
        }
        return fresh;
      }).catch(() => {
        // オフラインでHTMLが見つからない場合 → index.html を返す
        if (req.mode === 'navigate' || req.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ===== Phase 2用: メッセージ受信（将来のプッシュ通知連携など） =====
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
