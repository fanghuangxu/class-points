/**
 * Service Worker - 缓存策略实现
 * 提供离线访问和更快的加载速度
 */

const CACHE_NAME = 'class-points-v1.0.1';
const STATIC_CACHE = 'static-v1.0.1';
const DYNAMIC_CACHE = 'dynamic-v1.0.1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './script.js',
    './style.css',
];

// CDN资源（谨慎缓存，因为可能更新）
const CDN_RESOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TweenMax.min.js',
    'https://cdn.jsdelivr.net/npm/winwheel@1.0.1/dist/Winwheel.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
    console.log('[SW] 安装中...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] 缓存静态资源');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // 跳过等待，立即激活
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] 缓存失败:', err);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    console.log('[SW] 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('[SW] 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // 立即控制所有页面
                return self.clients.claim();
            })
    );
});

// 拦截请求 - 实现缓存策略
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 跳过chrome-extension和非http(s)请求
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // 对于CDN资源，使用网络优先策略
    if (CDN_RESOURCES.some(cdn => request.url.startsWith(cdn.split('?')[0]))) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // 对于本地资源，使用缓存优先策略
    event.respondWith(cacheFirstStrategy(request));
});

/**
 * 缓存优先策略 - 适用于静态资源
 */
async function cacheFirstStrategy(request) {
    // 先查找缓存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // 缓存未命中，从网络获取
    try {
        const networkResponse = await fetch(request);
        
        // 只缓存成功的GET请求
        if (request.method === 'GET' && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] 网络请求失败:', error);
        
        // 返回离线页面或默认响应
        return new Response('离线模式：无法加载资源', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * 网络优先策略 - 适用于CDN资源
 */
async function networkFirstStrategy(request) {
    try {
        // 先尝试从网络获取
        const networkResponse = await fetch(request);
        
        // 更新缓存
        if (request.method === 'GET' && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // 网络失败，尝试从缓存获取
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// 监听消息事件 - 支持主动更新缓存
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            })
        );
    }
});
