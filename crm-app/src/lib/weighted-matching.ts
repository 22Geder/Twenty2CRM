// 🎯 מנוע התאמה עם משקלות ומרחק גיאוגרפי
// ==========================================

// 📊 משקלות לתגיות לפי סוג
export const TAG_WEIGHTS: Record<string, number> = {
  // כישורים טכניים - משקל גבוה
  'מלגזה': 10,
  'מלגזן': 10,
  'היגש': 9,
  'reach truck': 9,
  'forklift': 10,
  'WMS': 8,
  'SAP': 7,
  'ERP': 7,
  'אקסל': 5,
  'Excel': 5,
  
  // תפקידים ספציפיים
  'טלר': 10,
  'בנקאי': 10,
  'יועץ מכירות': 9,
  'נציג שירות': 8,
  'מלקט': 8,
  'מחסנאי': 7,
  'בקר': 7,
  'רפרנט': 7,
  
  // תעשיות
  'לוגיסטיקה': 6,
  'מחסן': 6,
  'בנקאות': 6,
  'רכב': 5,
  'מכירות': 5,
  'שירות לקוחות': 5,
  
  // מיקום - משקל נמוך יותר (יטופל בנפרד)
  'אשדוד': 3,
  'בית שמש': 3,
  'תל אביב': 3,
  'ירושלים': 3,
  'חיפה': 3,
  'דרום': 2,
  'מרכז': 2,
  'צפון': 2,
  
  // רישיונות - חשוב מאוד
  'רישיון נהיגה': 7,
  'רישיון מלגזה': 9,
  
  // שפות
  'אנגלית': 4,
  'רוסית': 4,
  'ערבית': 4,
  
  // ברירת מחדל
  'default': 1
}

// 🗺️ קואורדינטות ערים בישראל (לחישוב מרחק)
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'תל אביב': { lat: 32.0853, lon: 34.7818 },
  'ירושלים': { lat: 31.7683, lon: 35.2137 },
  'חיפה': { lat: 32.7940, lon: 34.9896 },
  'באר שבע': { lat: 31.2530, lon: 34.7915 },
  'אשדוד': { lat: 31.8044, lon: 34.6553 },
  'בית שמש': { lat: 31.7464, lon: 34.9892 },
  'נתניה': { lat: 32.3286, lon: 34.8572 },
  'פתח תקווה': { lat: 32.0873, lon: 34.8878 },
  'ראשון לציון': { lat: 31.9730, lon: 34.7925 },
  'רמת גן': { lat: 32.0680, lon: 34.8241 },
  'חולון': { lat: 32.0231, lon: 34.7805 },
  'בני ברק': { lat: 32.0844, lon: 34.8331 },
  'רחובות': { lat: 31.8954, lon: 34.8071 },
  'אשקלון': { lat: 31.6688, lon: 34.5743 },
  'נשר': { lat: 32.7786, lon: 35.0387 },
  'כפר סבא': { lat: 32.1753, lon: 34.9077 },
  'רעננה': { lat: 32.1841, lon: 34.8708 },
  'הרצליה': { lat: 32.1656, lon: 34.8467 },
  'לוד': { lat: 31.9514, lon: 34.8951 },
  'רמלה': { lat: 31.9280, lon: 34.8713 },
  'מודיעין': { lat: 31.8977, lon: 35.0104 },
  'יבנה': { lat: 31.8788, lon: 34.7376 },
  'קרית אתא': { lat: 32.8117, lon: 35.0991 },
  'קרית גת': { lat: 31.6100, lon: 34.7642 },
  'ערד': { lat: 31.2548, lon: 35.2155 },
  'דימונה': { lat: 31.0630, lon: 35.0320 },
  'בני דרום': { lat: 31.6731, lon: 34.5892 },
  'חפץ חיים': { lat: 31.7853, lon: 34.8203 },
  'מבקיעים': { lat: 31.5547, lon: 34.5714 },
  'נס ציונה': { lat: 31.9295, lon: 34.7952 },
  'הוד השרון': { lat: 32.1536, lon: 34.8917 },
  'רמת השרון': { lat: 32.1436, lon: 34.8391 },
  'גבעתיים': { lat: 32.0654, lon: 34.8119 },
  'קרית אונו': { lat: 32.0594, lon: 34.8553 },
}

// 🗺️ אזורים גיאוגרפיים
export const REGIONS: Record<string, string[]> = {
  'דרום': ['אשדוד', 'באר שבע', 'אשקלון', 'קרית גת', 'ערד', 'דימונה', 'בני דרום', 'מבקיעים', 'אילת'],
  'מרכז': ['תל אביב', 'רמת גן', 'חולון', 'בת ים', 'פתח תקווה', 'ראשון לציון', 'רחובות', 'לוד', 'רמלה', 'מודיעין', 'יבנה', 'נס ציונה', 'גבעתיים', 'קרית אונו', 'בית שמש', 'חפץ חיים'],
  'שרון': ['נתניה', 'הרצליה', 'כפר סבא', 'רעננה', 'הוד השרון', 'רמת השרון', 'כפר יונה'],
  'צפון': ['חיפה', 'נשר', 'קרית אתא', 'עכו', 'נהריה', 'כרמיאל', 'טבריה', 'עפולה'],
  'ירושלים': ['ירושלים', 'מעלה אדומים', 'מבשרת ציון', 'בית שמש'],
}

/**
 * מחשב מרחק בין שתי נקודות (בק"מ)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // רדיוס כדור הארץ בק"מ
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * מחפש עיר בקואורדינטות
 */
export function findCityCoordinates(cityName: string): { lat: number; lon: number } | null {
  const cityLower = cityName.toLowerCase().trim()
  
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (city.includes(cityName) || cityName.includes(city) || 
        city.toLowerCase().includes(cityLower) || cityLower.includes(city.toLowerCase())) {
      return coords
    }
  }
  
  return null
}

/**
 * מחשב קרבה גיאוגרפית בין מועמד למשרה
 * @returns ציון 0-100 (100 = באותה עיר, 0 = רחוק מאוד)
 */
export function calculateGeoProximity(candidateCity: string, positionLocation: string): number {
  if (!candidateCity || !positionLocation) return 50 // ברירת מחדל
  
  // אם באותה עיר
  if (candidateCity.includes(positionLocation) || positionLocation.includes(candidateCity)) {
    return 100
  }
  
  // בדוק אם באותו אזור
  for (const [region, cities] of Object.entries(REGIONS)) {
    const candidateInRegion = cities.some(c => candidateCity.includes(c) || c.includes(candidateCity))
    const positionInRegion = cities.some(c => positionLocation.includes(c) || c.includes(positionLocation))
    
    if (candidateInRegion && positionInRegion) {
      return 85 // באותו אזור
    }
  }
  
  // חשב מרחק בפועל
  const candidateCoords = findCityCoordinates(candidateCity)
  const positionCoords = findCityCoordinates(positionLocation)
  
  if (candidateCoords && positionCoords) {
    const distance = calculateDistance(
      candidateCoords.lat, candidateCoords.lon,
      positionCoords.lat, positionCoords.lon
    )
    
    // 0-10 ק"מ = 100, 10-20 = 90, 20-30 = 80, etc.
    if (distance <= 10) return 100
    if (distance <= 20) return 90
    if (distance <= 30) return 80
    if (distance <= 50) return 70
    if (distance <= 75) return 60
    if (distance <= 100) return 50
    if (distance <= 150) return 40
    return 30
  }
  
  return 50 // לא הצלחנו לחשב - ברירת מחדל
}

/**
 * מחשב ציון התאמה עם משקלות
 */
export function calculateWeightedMatch(
  candidateTags: string[],
  positionKeywords: string[],
  candidateCity: string,
  positionLocation: string
): {
  score: number
  matchedTags: Array<{ tag: string; weight: number }>
  geoScore: number
  details: string[]
} {
  const matchedTags: Array<{ tag: string; weight: number }> = []
  let totalWeight = 0
  let matchedWeight = 0
  const details: string[] = []
  
  // נרמול התגיות
  const normalizedCandidateTags = candidateTags.map(t => t.toLowerCase().trim())
  const normalizedPositionKeywords = positionKeywords.map(k => k.toLowerCase().trim())
  
  // חישוב משקל כולל של התגיות במשרה
  for (const keyword of normalizedPositionKeywords) {
    const weight = TAG_WEIGHTS[keyword] || TAG_WEIGHTS['default']
    totalWeight += weight
  }
  
  // חישוב התאמות
  for (const keyword of normalizedPositionKeywords) {
    const weight = TAG_WEIGHTS[keyword] || TAG_WEIGHTS['default']
    
    // חפש התאמה בתגיות המועמד
    const hasMatch = normalizedCandidateTags.some(tag => 
      tag.includes(keyword) || keyword.includes(tag) ||
      // בדוק נרדפות
      areSynonyms(tag, keyword)
    )
    
    if (hasMatch) {
      matchedWeight += weight
      matchedTags.push({ tag: keyword, weight })
      details.push(`✓ ${keyword} (משקל: ${weight})`)
    }
  }
  
  // חישוב ציון מבוסס משקל
  let tagScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 50
  
  // ציון גיאוגרפי
  const geoScore = calculateGeoProximity(candidateCity, positionLocation)
  
  // שילוב הציונים (70% תגיות, 30% גיאוגרפיה)
  const finalScore = Math.round(tagScore * 0.7 + geoScore * 0.3)
  
  details.push(`📍 קרבה גיאוגרפית: ${geoScore}%`)
  details.push(`🏷️ התאמת תגיות: ${Math.round(tagScore)}%`)
  details.push(`📊 ציון סופי: ${finalScore}%`)
  
  return {
    score: finalScore,
    matchedTags,
    geoScore,
    details
  }
}

// 📚 מילון נרדפות
const SYNONYMS: Record<string, string[]> = {
  'מלגזן': ['forklift', 'מלגזה', 'מפעיל מלגזה', 'forklift operator'],
  'מלגזה': ['מלגזן', 'forklift', 'מפעיל מלגזה'],
  'היגש': ['reach truck', 'reach', 'מלגזת היגש'],
  'מחסנאי': ['warehouse worker', 'עובד מחסן', 'מחסן'],
  'מלקט': ['picker', 'ליקוט', 'order picker'],
  'בקר': ['controller', 'בקרה', 'quality control', 'QC'],
  'טלר': ['teller', 'bank teller', 'פקיד בנק'],
  'שירות לקוחות': ['customer service', 'שירות', 'נציג שירות', 'cs'],
  'מכירות': ['sales', 'מוכר', 'נציג מכירות', 'סוכן מכירות'],
  'אנגלית': ['english', 'אנגלית שפת אם', 'אנגלית ברמה גבוהה'],
  'רוסית': ['russian', 'רוסית שפת אם'],
  'WMS': ['מערכת ניהול מחסן', 'warehouse management'],
}

/**
 * בודק אם שתי מילים הן נרדפות
 */
export function areSynonyms(word1: string, word2: string): boolean {
  const w1 = word1.toLowerCase().trim()
  const w2 = word2.toLowerCase().trim()
  
  // אותה מילה
  if (w1 === w2) return true
  
  // בדוק במילון
  for (const synonymGroup of Object.values(SYNONYMS)) {
    const groupLower = synonymGroup.map(s => s.toLowerCase())
    if (groupLower.includes(w1) && groupLower.includes(w2)) {
      return true
    }
  }
  
  // בדוק אם אחת מכילה את השנייה
  if (w1.includes(w2) || w2.includes(w1)) {
    return true
  }
  
  return false
}

/**
 * מחזיר את כל הנרדפות של מילה
 */
export function getSynonyms(word: string): string[] {
  const wordLower = word.toLowerCase().trim()
  const synonyms: Set<string> = new Set([word])
  
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (key.toLowerCase() === wordLower || values.map(v => v.toLowerCase()).includes(wordLower)) {
      synonyms.add(key)
      values.forEach(v => synonyms.add(v))
    }
  }
  
  return Array.from(synonyms)
}

/**
 * מרחיב תגיות עם נרדפות
 */
export function expandTagsWithSynonyms(tags: string[]): string[] {
  const expanded: Set<string> = new Set()
  
  for (const tag of tags) {
    const synonyms = getSynonyms(tag)
    synonyms.forEach(s => expanded.add(s.toLowerCase()))
  }
  
  return Array.from(expanded)
}
