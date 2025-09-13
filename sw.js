const CACHE_NAME = 'finance-goal-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кэш открыт');
                return cache.addAll(urlsToCache);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возврат кэшированной версии или загрузка
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(response => {
                    // Проверка валидности ответа
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Клонирование ответа для кэша
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Офлайн fallback
                return new Response('Приложение работает в офлайн режиме');
            })
    );
});
