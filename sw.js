var CACHE_NAME = 'multishot-cache-v1';
var CURRENT_CACHES = CACHE_NAME;
var urlsToCache = [
  './',
  'index.html',
  'style.css',
  'favicon.ico',
  'site.webmanifest',
  'sw.js',
  'scripts/MediaInfo.js.mem',
  'scripts/MediaInfoWasm.wasm',
  'scripts/MediaInfo.js',
  'scripts/MediaInfoWasm.js',
  'scripts/multishot.js',
  'scripts/opencv_bgfg.js',
  'scripts/registerSW.js',
  'https://code.jquery.com/jquery-3.6.0.js',
  'https://code.jquery.com/ui/1.13.1/jquery-ui.js',
  'https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.eot?v=4.7.0',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.svg?v=4.7.0',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf?v=4.7.0',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff?v=4.7.0',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0',
  'mstile-70x70.png'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');

        // Add manually due to CORS restriction on opencv.org
        //const requestCV = new Request('https://docs.opencv.org/4.5.1/opencv.js', { mode: 'no-cors' });
        //fetch(requestCV).then(response => cache.put(requestCV, response));

        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  // Return without calling event.respondWith()
  // if this is a range request.
  if (event.request.headers.has('range')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

