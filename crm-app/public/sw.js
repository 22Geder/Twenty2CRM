// 🔄 Service Worker - Twenty2 CRM PWA
// =====================================

const CACHE_NAME = 'twenty2-crm-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/candidates',
  '/dashboard/positions',
  '/dashboard/employers',
  '/manifest.json',
]

// התקנה - שמירת קבצים סטטיים בקאש
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Service Worker: Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// הפעלה - ניקוי קאשים ישנים
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('🗑️ Service Worker: Removing old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// בקשות - Network First עם fallback לקאש
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // דלג על בקשות API - תמיד נטוורק
  if (url.pathname.startsWith('/api/')) {
    return
  }
  
  // דלג על בקשות חיצוניות
  if (!url.origin.includes(self.location.origin)) {
    return
  }
  
  // Network First - נסה קודם מהרשת
  event.respondWith(
    fetch(request)
      .then((response) => {
        // שמור בקאש אם הצליח
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // אם נכשל - נסה מהקאש
        return caches.match(request).then((response) => {
          if (response) {
            console.log('📦 Service Worker: Serving from cache:', request.url)
            return response
          }
          // דף offline כ-fallback
          return caches.match('/offline.html')
        })
      })
  )
})

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received')
  
  let data = { title: 'Twenty2 CRM', body: 'התראה חדשה' }
  
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data.body = event.data.text()
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'פתח' },
      { action: 'dismiss', title: 'סגור' }
    ],
    dir: 'rtl',
    lang: 'he'
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// לחיצה על התראה
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'dismiss') {
    return
  }
  
  // פתח את החלון הרלוונטי
  const urlToOpen = event.notification.data?.url || '/dashboard'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // אם יש חלון פתוח - התמקד בו
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      // אחרת - פתח חלון חדש
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})

// Background Sync - סנכרון ברקע
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag)
  
  if (event.tag === 'sync-candidates') {
    event.waitUntil(syncCandidates())
  }
})

async function syncCandidates() {
  // סנכרן נתונים שנשמרו מקומית כשלא היה אינטרנט
  console.log('📤 Syncing offline data...')
}

console.log('🚀 Twenty2 CRM Service Worker loaded')
