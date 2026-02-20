// 🔄 Service Worker - Twenty2 CRM PWA
// =====================================

const CACHE_NAME = 'twenty2-crm-v3'
const STATIC_ASSETS = [
  '/',
  '/upload-cv',
  '/install',
  '/dashboard',
  '/dashboard/candidates',
  '/dashboard/positions',
  '/dashboard/employers',
  '/manifest.json',
  '/logo.jpeg',
]

// התקנה - שמירת קבצים סטטיים בקאש
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing v3...')
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
  console.log('✅ Service Worker: Activated v3')
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

// 📤 טיפול בשיתוף קבצים מאפליקציות אחרות (WhatsApp וכו')
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 🔗 טיפול בשיתוף קבצים - Share Target
  if (url.pathname === '/api/share-target' && request.method === 'POST') {
    console.log('📥 Share Target: Handling shared file...')
    event.respondWith(handleShareTarget(event))
    return
  }
  
  // דלג על בקשות API אחרות - תמיד נטוורק
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
          // החזר דף offline אם קיים
          if (request.destination === 'document') {
            return caches.match('/upload-cv')
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// 📤 פונקציית טיפול בשיתוף קבצים
async function handleShareTarget(event) {
  try {
    const formData = await event.request.formData()
    const file = formData.get('file')
    
    if (!file) {
      console.log('⚠️ Share Target: No file in request')
      return Response.redirect('/upload-cv', 303)
    }
    
    console.log('📄 Share Target SW: File received:', file.name)
    
    // העבר לAPI
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: uploadFormData,
    })
    
    if (!response.ok) {
      console.error('❌ Share Target: Upload failed')
      return Response.redirect('/upload-cv?error=' + encodeURIComponent('שגיאה בהעלאה'), 303)
    }
    
    const result = await response.json()
    console.log('✅ Share Target: Success -', result.candidate?.name)
    
    // שלח התראה על הצלחה
    if (self.registration.showNotification) {
      self.registration.showNotification('קו"ח הועלה בהצלחה! 🎉', {
        body: result.candidate?.name ? `${result.candidate.name} נוסף למערכת` : 'הקובץ נשמר במערכת',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'upload-success',
        data: { url: '/dashboard/candidates' }
      })
    }
    
    // Redirect לדף הצלחה
    const redirectUrl = new URL('/upload-cv', self.location.origin)
    redirectUrl.searchParams.set('success', 'true')
    if (result.candidate?.name) redirectUrl.searchParams.set('name', result.candidate.name)
    if (result.candidate?.id) redirectUrl.searchParams.set('candidateId', result.candidate.id)
    
    return Response.redirect(redirectUrl.toString(), 303)
    
  } catch (error) {
    console.error('❌ Share Target Error:', error)
    return Response.redirect('/upload-cv?error=' + encodeURIComponent('שגיאה לא צפויה'), 303)
  }
}

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
