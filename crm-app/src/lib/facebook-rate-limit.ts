// Rate limiting פשוט בזיכרון (Map) - מספיק לקונטיינר יחיד (אין multi-instance ב-Railway כאן).
// מכסת הפרסום היומית עצמה נשמרת ב-DB (FacebookAccount.publishesToday) ושורדת restart; זה רק הגנה על קצב בקשות API.

const buckets = new Map<string, number[]>()

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (buckets.get(key) || []).filter((timestamp) => now - timestamp < windowMs)
  if (timestamps.length >= limit) {
    buckets.set(key, timestamps)
    return true
  }
  timestamps.push(now)
  buckets.set(key, timestamps)
  return false
}
