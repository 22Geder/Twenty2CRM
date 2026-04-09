/**
 * 🗺️ חישוב מרחק בק"מ בין ערים בישראל
 * משתמש בנוסחת Haversine + מאגר קואורדינטות של ~120 ישובים מרכזיים
 * 
 * עבור ישובים שאין להם קואורדינטות - fallback לקבוצות קרבה
 */

import { areLocationsProximate, normalizeLocalityComplete } from './israel-locations-complete'

// קואורדינטות GPS של ישובים מרכזיים בישראל (lat, lng)
const CITY_COORDS: Record<string, [number, number]> = {
  // גוש דן
  'תל אביב': [32.0853, 34.7818],
  'תל אביב יפו': [32.0853, 34.7818],
  'רמת גן': [32.0680, 34.8248],
  'גבעתיים': [32.0714, 34.8120],
  'בני ברק': [32.0834, 34.8331],
  'חולון': [32.0117, 34.7748],
  'בת ים': [32.0236, 34.7516],
  'אזור': [32.0280, 34.7920],
  'קריית אונו': [32.0590, 34.8560],
  'אור יהודה': [32.0285, 34.8536],
  'יהוד': [32.0327, 34.8780],
  'יהוד מונוסון': [32.0327, 34.8780],
  'גבעת שמואל': [32.0755, 34.8540],
  'סביון': [32.0470, 34.8700],
  'גני תקווה': [32.0620, 34.8720],

  // שרון
  'הרצליה': [32.1629, 34.7914],
  'רמת השרון': [32.1459, 34.8392],
  'רעננה': [32.1860, 34.8710],
  'כפר סבא': [32.1780, 34.9066],
  'הוד השרון': [32.1580, 34.8880],
  'נתניה': [32.3286, 34.8574],
  'כפר יונה': [32.3166, 34.9350],
  'אבן יהודה': [32.2750, 34.8870],
  'קדימה צורן': [32.2780, 34.9150],
  'תל מונד': [32.2560, 34.9200],

  // מזרח מרכז
  'פתח תקווה': [32.0841, 34.8878],
  'ראש העין': [32.0957, 34.9570],
  'שוהם': [31.9990, 34.9470],
  'אלעד': [32.0520, 34.9510],
  'מודיעין': [31.8969, 35.0104],
  'מודיעין מכבים רעות': [31.8969, 35.0104],

  // דרום מרכז
  'ראשון לציון': [31.9642, 34.7998],
  'נס ציונה': [31.9294, 34.7948],
  'רחובות': [31.8928, 34.8113],
  'יבנה': [31.8766, 34.7367],
  'גן יבנה': [31.8600, 34.7100],
  'גדרה': [31.8140, 34.7790],
  'באר יעקב': [31.9450, 34.8340],
  'מזכרת בתיה': [31.8530, 34.7970],
  'לוד': [31.9515, 34.8953],
  'רמלה': [31.9275, 34.8625],

  // שפלה ודרום שפלה
  'אשדוד': [31.8014, 34.6502],
  'אשקלון': [31.6684, 34.5712],
  'קריית גת': [31.6100, 34.7649],
  'קריית מלאכי': [31.7300, 34.7450],

  // ירושלים והסביבה
  'ירושלים': [31.7683, 35.2137],
  'בית שמש': [31.7470, 34.9920],
  'מעלה אדומים': [31.7470, 35.3010],
  'מבשרת ציון': [31.8010, 35.1470],
  'ביתר עילית': [31.7000, 35.1200],
  'גבעת זאב': [31.8600, 35.1700],

  // חיפה והקריות
  'חיפה': [32.7940, 34.9896],
  'קריית אתא': [32.8085, 35.1063],
  'קריית ביאליק': [32.8291, 35.0847],
  'קריית מוצקין': [32.8393, 35.0777],
  'קריית ים': [32.8462, 35.0667],
  'נשר': [32.7746, 35.0423],
  'טירת כרמל': [32.7617, 34.9730],
  'רכסים': [32.7554, 35.0878],
  'עתלית': [32.6959, 34.9457],

  // צפון
  'עכו': [32.9280, 35.0840],
  'נהריה': [33.0050, 35.1000],
  'כרמיאל': [32.9140, 35.3020],
  'מעלות תרשיחא': [33.0170, 35.2750],
  'שלומי': [33.0800, 35.1600],
  'עפולה': [32.6082, 35.2880],
  'נצרת': [32.7000, 35.3030],
  'נוף הגליל': [32.7230, 35.3230],
  'נצרת עילית': [32.7230, 35.3230],
  'מגדל העמק': [32.6780, 35.2410],
  'יוקנעם': [32.6510, 35.1060],
  'יוקנעם עילית': [32.6580, 35.1120],
  'טבריה': [32.7922, 35.5312],
  'צפת': [32.9646, 35.4960],
  'קריית שמונה': [33.2067, 35.5705],
  'חצור הגלילית': [32.9838, 35.5494],
  'ראש פינה': [32.9688, 35.5416],
  'בית שאן': [32.4974, 35.5002],
  'קצרין': [32.9888, 35.6920],
  'שפרעם': [32.8056, 35.1696],
  'טמרה': [32.8530, 35.2010],

  // חדרה
  'חדרה': [32.4340, 34.9190],
  'אור עקיבא': [32.5090, 34.9200],
  'קיסריה': [32.5180, 34.8970],
  'פרדס חנה כרכור': [32.4710, 34.9710],
  'בנימינה': [32.5180, 34.9440],
  'זכרון יעקב': [32.5720, 34.9530],
  'חריש': [32.4600, 35.0440],

  // נגב
  'באר שבע': [31.2518, 34.7913],
  'דימונה': [31.0680, 35.0330],
  'ערד': [31.2563, 35.2127],
  'ירוחם': [30.9860, 34.9270],
  'מצפה רמון': [30.6088, 34.8012],
  'אופקים': [31.3130, 34.6200],
  'נתיבות': [31.4214, 34.5880],
  'שדרות': [31.5254, 34.5968],
  'מיתר': [31.3260, 34.7760],
  'עומר': [31.2650, 34.8500],
  'להבים': [31.3770, 34.7990],
  'אילת': [29.5569, 34.9517],

  // שומרון ויהודה
  'אריאל': [32.1057, 35.1740],
  'קרני שומרון': [32.1770, 35.0900],
  'אלקנה': [32.1100, 35.0270],
}

/**
 * חישוב מרחק בק"מ בין שתי נקודות GPS (Haversine)
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // רדיוס כדור הארץ בק"מ
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * מציאת קואורדינטות של ישוב - עם fuzzy matching
 */
function findCoords(cityName: string): [number, number] | null {
  if (!cityName) return null
  const normalized = cityName.trim().toLowerCase()
  
  // חיפוש ישיר
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (city.toLowerCase() === normalized || 
        normalized.includes(city.toLowerCase()) || 
        city.toLowerCase().includes(normalized)) {
      return coords
    }
  }
  
  // חיפוש מנורמל
  const norm = normalizeLocalityComplete(cityName)
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const cityNorm = normalizeLocalityComplete(city)
    if (cityNorm === norm || norm.includes(cityNorm) || cityNorm.includes(norm)) {
      return coords
    }
  }
  
  return null
}

/**
 * 📍 חישוב מרחק בק"מ בין שני ישובים
 * מחזיר null אם אחד הישובים לא נמצא במאגר
 */
export function getDistanceKm(city1: string, city2: string): number | null {
  const coords1 = findCoords(city1)
  const coords2 = findCoords(city2)
  
  if (!coords1 || !coords2) return null
  
  return Math.round(haversineKm(coords1[0], coords1[1], coords2[0], coords2[1]) * 10) / 10
}

/**
 * 📊 חישוב ציון מיקום (0-50) על בסיס מרחק בק"מ
 * 
 * כללים:
 * - עיר זהה (0 ק"מ) = 50 נקודות
 * - כל 10 ק"מ מוריד 15% מה-50
 * - מינימום 0
 * 
 * דוגמאות:
 * - 0 ק"מ = 50
 * - 10 ק"מ = 42.5 → 43
 * - 20 ק"מ = 35
 * - 30 ק"מ = 27.5 → 28
 * - 40 ק"מ = 20
 * - 50 ק"מ = 12.5 → 13
 * - 60 ק"מ = 5
 * - 67+ ק"מ = 0
 * 
 * Fallback: אם אין קואורדינטות, משתמש בקבוצות קרבה:
 * - אותה קבוצה (~15 ק"מ) = 39
 * - לא באותה קבוצה = 0
 */
export function calculateLocationScore(candidateCity: string, positionLocation: string): {
  score: number
  distanceKm: number | null
  matchType: 'exact' | 'distance' | 'proximity' | 'none'
} {
  if (!candidateCity || !positionLocation) {
    return { score: 0, distanceKm: null, matchType: 'none' }
  }

  const candNorm = normalizeLocalityComplete(candidateCity)
  const posNorm = normalizeLocalityComplete(positionLocation)

  // בדיקת עיר זהה
  if (candNorm === posNorm || candNorm.includes(posNorm) || posNorm.includes(candNorm)) {
    return { score: 50, distanceKm: 0, matchType: 'exact' }
  }

  // חישוב מרחק בק"מ
  const distanceKm = getDistanceKm(candidateCity, positionLocation)
  
  if (distanceKm !== null) {
    // נוסחה: 50 * (1 - 0.15 * (km / 10)) = 50 - 0.75 * km
    const score = Math.max(0, Math.round(50 * (1 - 0.15 * (distanceKm / 10))))
    return { 
      score, 
      distanceKm, 
      matchType: 'distance' 
    }
  }

  // Fallback: קבוצות קרבה (~15 ק"מ ≈ 39 נקודות)
  if (areLocationsProximate(candidateCity, positionLocation)) {
    return { score: 39, distanceKm: 15, matchType: 'proximity' }
  }

  return { score: 0, distanceKm: null, matchType: 'none' }
}
