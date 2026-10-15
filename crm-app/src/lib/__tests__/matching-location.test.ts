import { describe, expect, expectTypeOf, it } from 'vitest'
import { getDistanceKm } from '../israel-distance'
import { evaluateMatchingLocation, extractCandidateCity, extractMentionedCities, DEFAULT_RADIUS_KM } from '../matching-location'
import type { MatchingLocationInput, MatchingLocationResult } from '../matching-location'

describe('evaluateMatchingLocation — חוזה ושמות ערים', () => {
  it('מייצא את החוזה המשותף ואת כל שדות התוצאה', () => {
    expectTypeOf(evaluateMatchingLocation).parameter(0).toEqualTypeOf<MatchingLocationInput>()
    expectTypeOf(evaluateMatchingLocation).returns.toEqualTypeOf<MatchingLocationResult>()
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionLocation: 'חיפה' })).toEqual({
      score: 15, eligible: true, matchType: 'exact', distanceKm: 0,
      isExactCity: true, isNationwide: false, candidateCity: 'חיפה', matchedCity: 'חיפה',
      reason: expect.any(String),
    })
  })

  it.each([
    ['ת״א', 'תל אביב'], ['י-ם', 'ירושלים'], ['ראשל״צ', 'ראשון לציון'],
    ['פ"ת', 'פתח תקווה'], ['פתח תקוה', 'פתח תקווה'], ['ב״ש', 'באר שבע'],
    ['ב״ב', 'בני ברק'], ['כ״ס', 'כפר סבא'], ['ר״ג', 'רמת גן'],
    ['ק״ג', 'קריית גת'], ['קרית ים', 'קריית ים'], ['ק״מ', 'קריית מוצקין'],
    ['Tel Aviv', 'תל אביב'], ['PETAH TIKVAH', 'פתח תקווה'], ['Beer Sheva', 'באר שבע'],
    ['Ramat Hasharon', 'רמת השרון'], ['Modiin Illit', 'מודיעין עילית'],
    ['נצרת עילית', 'נוף הגליל'], ['תל אביב-יפו', 'תל אביב'],
    ['\u200f  גַּן  יַבְנֶה ', 'גן יבנה'], ['כפר חב״ד', 'כפר חב״ד'],
  ])('מנרמל %s לעיר המלאה %s ללא התאמת תת־מחרוזת', (alias, city) => {
    expect(evaluateMatchingLocation({ candidateCity: alias, positionLocation: city })).toMatchObject({
      candidateCity: city, matchedCity: city, matchType: 'exact', score: 15,
      eligible: true, isExactCity: true, isNationwide: false,
    })
  })

  it('גן יבנה אינה יבנה, גם עם קידומת ומקף', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'יבנה', positionLocation: 'בגן-יבנה' })).toMatchObject({
      matchType: 'nearby', isExactCity: false, matchedCity: 'גן יבנה', distanceKm: getDistanceKm('יבנה', 'גן יבנה'),
    })
    expect(getDistanceKm('יבנה', 'גן יבנה')).toBeGreaterThan(0)
  })

  it('מודיעין עילית ללא קואורדינטות אינה מקבלת את הקואורדינטות של מודיעין', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'מודיעין', positionLocation: 'מודיעין עילית' })).toMatchObject({
      matchType: 'unknown', eligible: null, isExactCity: false, distanceKm: null, matchedCity: 'מודיעין עילית',
    })
  })

  it('נצרת אינה נוף הגליל וקריית ים אינה ירושלים', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'נצרת', positionLocation: 'נצרת עילית' })).toMatchObject({ matchType: 'nearby', isExactCity: false })
    expect(evaluateMatchingLocation({ candidateCity: 'קריית ים', positionLocation: 'ירושלים' })).toMatchObject({ matchType: 'far', eligible: false })
  })

  it('מזהה יישוב מלא מהמאגר גם כשאין לו קואורדינטות', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'דפנה', positionLocation: 'דפנה' })).toMatchObject({ matchType: 'exact', eligible: true })
  })

  it.each(['עיר דמיונית', 'אביב', 'מיקום לא ידוע', 'אזור תעשייה', 'לא צוין', 'haifa@example.test', '   '])('לא ממציא התאמה מתוך %s', location => {
    expect(evaluateMatchingLocation({ candidateCity: location, positionLocation: location })).toMatchObject({
      matchType: 'unknown', eligible: null, isExactCity: false, isNationwide: false, distanceKm: null,
    })
  })

  it('לא מזהה קילומטרים, יום ראשון או ים כשמות ערים בטקסט חופשי', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'קריית מוצקין', positionLocation: 'במרחק 30 ק״מ מהים, פתיחה ביום ראשון' })).toMatchObject({ matchType: 'unknown', eligible: null })
  })
})

describe('מרחק אווירי, רדיוס וריבוי ערים', () => {
  it('ברירת המחדל היא קו אחיד של 12 ק״מ אווירי לכל המשרות', () => {
    expect(DEFAULT_RADIUS_KM).toBe(12)
    expect(evaluateMatchingLocation({ candidateCity: 'תל אביב', positionLocation: 'חולון' })).toMatchObject({ matchType: 'nearby', eligible: true })
    expect(evaluateMatchingLocation({ candidateCity: 'תל אביב', positionLocation: 'ראשון לציון' })).toMatchObject({ matchType: 'far', eligible: false })
    expect(evaluateMatchingLocation({ candidateCity: 'חדרה', positionLocation: 'אור עקיבא' })).toMatchObject({ matchType: 'nearby', eligible: true })
    expect(evaluateMatchingLocation({ candidateCity: 'חדרה', positionLocation: 'נתניה', maxDistanceKm: 14 })).toMatchObject({ matchType: 'nearby', eligible: true })
  })

  it('מזהה עיר קרובה ברדיוס ברירת המחדל', () => {
    const result = evaluateMatchingLocation({ candidateCity: 'תל אביב', positionLocation: 'הרצליה' })
    expect(result).toMatchObject({ matchType: 'nearby', eligible: true, isExactCity: false })
    expect(result.distanceKm).toBe(getDistanceKm('תל אביב', 'הרצליה'))
    expect(result.reason).toContain('אווירי')
    expect(result.reason).toContain('לא זמן נסיעה')
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(15)
  })

  it('פוסל מרחק ידוע מעבר לרדיוס בלי לייחס רכב או מעבר דירה', () => {
    expect(evaluateMatchingLocation({
      candidateCity: 'אילת', candidateResume: 'בעל רכב פרטי ונכונות להעתקת מגורים לכל הארץ',
      positionLocation: 'חיפה', transportation: 'חובה ניידות עצמאית, החזר נסיעות',
    })).toMatchObject({ matchType: 'far', eligible: false, score: 0, isNationwide: false })
  })

  it('מכבד את גבול הרדיוס כולל הערך המדויק', () => {
    const distance = getDistanceKm('תל אביב', 'הרצליה')!
    expect(evaluateMatchingLocation({ candidateCity: 'תל אביב', positionLocation: 'הרצליה', maxDistanceKm: distance }).eligible).toBe(true)
    expect(evaluateMatchingLocation({ candidateCity: 'תל אביב', positionLocation: 'הרצליה', maxDistanceKm: distance - 0.01 }).eligible).toBe(false)
    expect(evaluateMatchingLocation({ candidateCity: 'תל אביב', positionLocation: 'הרצליה', maxDistanceKm: 0 }).eligible).toBe(false)
    expect(evaluateMatchingLocation({ candidateCity: 'תל אביב', positionLocation: 'תל אביב', maxDistanceKm: 0 }).eligible).toBe(true)
  })

  it.each([NaN, Infinity, -Infinity, -1])('רדיוס לא תקין %s חוזר לברירת המחדל', maxDistanceKm => {
    const input = { candidateCity: 'חיפה', positionLocation: 'באר שבע' }
    expect(evaluateMatchingLocation({ ...input, maxDistanceKm })).toEqual(evaluateMatchingLocation(input))
  })

  it('מאפשר רדיוס מפורש גדול יותר', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionLocation: 'תל אביב', maxDistanceKm: 150 })).toMatchObject({ matchType: 'nearby', eligible: true })
  })

  it('מחלץ ערים משאילתת חיפוש חופשית בלי להמציא עיר ממילה כללית', () => {
    expect(extractMentionedCities('מחסנאי בחדרה או בנתניה')).toEqual(['חדרה', 'נתניה'])
    expect(extractMentionedCities('נציג שירות עם אנגלית')).toEqual([])
    expect(extractMentionedCities('עבודה במרכז')).toEqual([])
  })

  it.each(['אילת, באר שבע / חיפה', 'באילת ובחיפה', 'חיפה | אילת', 'Haifa; Eilat'])('בוחר התאמה מלאה מתוך %s', positionLocation => {
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionLocation })).toMatchObject({ matchType: 'exact', matchedCity: 'חיפה', eligible: true })
  })

  it('בוחר את העיר הקרובה ביותר, לא את הראשונה ברשימה', () => {
    const input = { candidateCity: 'גבעתיים', positionLocation: 'אילת, חיפה, רמת גן' }
    expect(evaluateMatchingLocation(input)).toMatchObject({ matchType: 'nearby', matchedCity: 'רמת גן' })
    expect(evaluateMatchingLocation({ ...input, positionLocation: 'רמת גן, חיפה, אילת' })).toEqual(evaluateMatchingLocation(input))
  })

  it.each(['חיפה, יישוב לא מזוהה', 'חיפה, דפנה'])('חלופה לא מדידה אינה גוררת פסילה של כל הרשימה: %s', positionLocation => {
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation })).toMatchObject({ matchType: 'unknown', eligible: null })
  })

  it('משתמש בעיר מתיאור רק כשיש תווית מפורשת של מקום העבודה', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionDescription: 'מיקום המשרה: חיפה' })).toMatchObject({ matchType: 'exact', eligible: true })
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionDescription: 'החברה נוסדה בחיפה ומוכרת ציוד' })).toMatchObject({ matchType: 'unknown', eligible: null })
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionTitle: 'משרה: מנהל', positionDescription: 'העבודה בחיפה' })).toMatchObject({ matchType: 'exact', eligible: true })
  })
})

describe('ארצי: היקף המשרה ולא היקף החברה', () => {
  it.each(['כל הארץ', 'בכל הארץ', 'לכל הארץ', 'בפריסה ארצית', 'ארצי', 'ארצית', 'across Israel', 'countrywide', 'nationwide', 'throughout Israel'])('מאשר %s גם ללא עיר מועמד', positionLocation => {
    expect(evaluateMatchingLocation({ positionLocation })).toMatchObject({
      matchType: 'nationwide', score: 15, eligible: true, isNationwide: true,
      isExactCity: false, distanceKm: null, candidateCity: null, matchedCity: null,
    })
  })

  it.each<MatchingLocationInput>([
    { positionLocation: 'חיפה', positionTitle: 'טכנאי שירות ארצי' },
    { positionLocation: 'חיפה', positionDescription: 'התפקיד כולל עבודה בכל הארץ' },
    { positionLocation: 'חיפה', positionDescription: 'העבודה בפריסה ארצית' },
    { positionLocation: 'חיפה', positionTitle: 'מנהל מכירות ארצי' },
    { positionLocation: 'חיפה', positionDescription: 'Work across Israel' },
    { positionLocation: 'חיפה', positionDescription: 'חברה ארצית. העבודה ברחבי ישראל' },
  ])('היקף תפקיד ארצי מפורש גובר על מרחק', input => {
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', ...input })).toMatchObject({ matchType: 'nationwide', eligible: true, distanceKm: null })
    expect(evaluateMatchingLocation(input).eligible).toBe(true)
  })

  it.each([
    'חברה ארצית מגייסת עובד לסניף חיפה', 'רשת ארצית מחפשת מנהל לסניף חיפה',
    'לחברה בפריסה ארצית דרוש מחסנאי בחיפה', 'לחברה עם סניפים בכל הארץ דרוש עובד בחיפה',
    'Technician for a nationwide company', 'A countrywide chain is hiring in Haifa',
  ])('תיאור חברה אינו משרה ארצית: %s', text => {
    for (const field of ['positionTitle', 'positionDescription'] as const) {
      expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation: 'חיפה', [field]: text })).toMatchObject({ matchType: 'far', eligible: false, isNationwide: false })
    }
  })

  it.each(['לא ארצי', 'התפקיד לא ארצי', 'העבודה אינה בפריסה ארצית', 'not nationwide', 'לא עבודה בכל הארץ'])('מכבד שלילה: %s', positionDescription => {
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation: 'חיפה', positionDescription })).toMatchObject({ matchType: 'far', eligible: false, isNationwide: false })
  })

  it('הגבלת אתר מקומי מפורשת מונעת דריסה על ידי כותרת ארצית', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation: 'חיפה בלבד', positionTitle: 'מנהל מכירות ארצי' })).toMatchObject({ matchType: 'far', eligible: false, isNationwide: false })
  })

  it('הסעות מכל הארץ אינן היקף ארצי של המשרה', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation: 'חיפה', positionDescription: 'הסעות מכל הארץ' })).toMatchObject({ matchType: 'far', eligible: false, isNationwide: false })
  })
})

describe('מרחוק: רק עבודה מלאה וללא סתירה', () => {
  it.each(['עבודה מהבית בלבד', 'עבודה מלאה מרחוק', 'Fully remote', '100% remote', 'work from home'])('מאשר עבודה מלאה: %s', positionDescription => {
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation: 'חיפה', positionDescription })).toMatchObject({ matchType: 'remote', eligible: true, isExactCity: false, isNationwide: false, distanceKm: null })
  })

  it('מאשר מיקום מרחוק ללא עיר מועמד', () => {
    expect(evaluateMatchingLocation({ positionLocation: 'Remote' })).toMatchObject({ matchType: 'remote', eligible: true, candidateCity: null })
  })

  it.each([
    'לא מהבית', 'אין עבודה מרחוק', 'ללא אפשרות לעבודה מהבית', 'not fully remote',
    'משרה היברידית עם עבודה מהבית', 'Hybrid, work from home', 'עבודה מהבית פעם בשבוע',
    'יומיים עבודה מהבית', 'אפשרות לעבודה מהבית', 'עבודה מהבית 50%',
    'עבודה מלאה מהבית, נדרש להגיע למשרד', 'תמיכה מרחוק בלקוחות',
  ])('לא מסיק עבודה מלאה מרחוק מתוך %s', positionDescription => {
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation: 'חיפה', positionDescription })).toMatchObject({ matchType: 'far', eligible: false })
  })

  it('שעות עבודה היברידיות מונעות חריגת מרחק', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation: 'חיפה', positionDescription: 'עבודה מלאה מהבית', workHours: 'יום מהבית, ארבעה ימים במשרד' })).toMatchObject({ matchType: 'far', eligible: false })
  })

  it('אין הגעה למשרד ואפשרות לקידום אינן סותרות עבודה מלאה מהבית', () => {
    expect(evaluateMatchingLocation({ positionDescription: 'עבודה מהבית בלבד. ללא הגעה למשרד. אפשרות לקידום' })).toMatchObject({ matchType: 'remote', eligible: true })
  })
})

describe('אזורים וחוסר ודאות', () => {
  it.each([
    ['רמת השרון', 'השרון'], ['נתניה', 'אזור השרון'], ['חיפה', 'צפון'],
    ['באר שבע', 'הדרום'], ['גבעתיים', 'גוש דן'], ['קריית ים', 'קריות'],
    ['ירושלים', 'ירושלים והסביבה'],
  ])('מחזיר אזור משותף, לא עיר או דקות נסיעה: %s / %s', (candidateCity, positionLocation) => {
    expect(evaluateMatchingLocation({ candidateCity, positionLocation })).toMatchObject({ matchType: 'region', eligible: null, isExactCity: false, isNationwide: false, distanceKm: null, matchedCity: null })
  })

  it('אינו הופך קריות לקריית ביאליק ואינו פוסל על אזור בלבד', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'קריות', positionLocation: 'קריית ביאליק' })).toMatchObject({ matchType: 'unknown', candidateCity: null, eligible: null })
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', positionLocation: 'צפון' })).toMatchObject({ matchType: 'unknown', eligible: null })
  })

  it.each<MatchingLocationInput>([
    {}, { candidateCity: 'חיפה' }, { positionLocation: 'חיפה' },
    { candidateCity: null, candidateResume: null, positionLocation: null, positionDescription: null, transportation: null, workHours: null },
    { candidateCity: ' ', positionLocation: ' ' }, { candidateCity: 'חיפה / תל אביב', positionLocation: 'חיפה' },
    { candidateCity: 'דפנה', positionLocation: 'אילת' },
  ])('חוסר מידע נשאר unknown ולא פסילה', input => {
    expect(evaluateMatchingLocation(input)).toMatchObject({ score: 0, matchType: 'unknown', eligible: null, isExactCity: false, isNationwide: false, distanceKm: null })
  })
})

describe('הסעות: מקור עירוני מלא ומפורש בלבד', () => {
  it.each(['יש הסעות מחיפה', 'הסעות מסודרות מחיפה', 'Shuttle from Haifa', 'הסעות: חיפה', 'הסעות מחיפה, באר שבע', 'הסעות מחיפה לאילת'])('מאשר מקור מדויק: %s', transportation => {
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionLocation: 'אילת', transportation })).toMatchObject({ matchType: 'transport', eligible: true, score: 12, isExactCity: false, isNationwide: false, matchedCity: 'אילת' })
  })

  it('מכבד שמות מלאים גם ברשימת מקורות עם ו/מ וקיצורים', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'באר שבע', positionLocation: 'אילת', transportation: 'הסעות מחיפה ומב״ש' })).toMatchObject({ matchType: 'transport', eligible: true })
    expect(evaluateMatchingLocation({ candidateCity: 'בני ברק', positionLocation: 'אילת', transportation: 'הסעות מבני ברק' })).toMatchObject({ matchType: 'transport', eligible: true })
  })

  it.each([
    'הסעות', 'יש הסעות', 'תחבורה ציבורית מחיפה', 'הסעות מאזור חיפה', 'הסעות מסביבת חיפה',
    'הסעות לחיפה', 'הסעות מבאר שבע לחיפה', 'הסעות מחיפה לתל אביב',
    'אין הסעות מחיפה', 'הסעות מחיפה אינן זמינות', 'אפשרות להסעות מחיפה',
    'הסעות מחיפה בכפוף לביקוש', 'הסעות מחיפה בבוקר בלבד', 'ייתכן שיהיו הסעות מחיפה',
    'הסעות מחיפה?', 'הסעות מבאר שבע, לא מחיפה',
  ])('לא מסיק הסעה מתאימה מתוך %s', transportation => {
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionLocation: 'אילת', transportation })).toMatchObject({ matchType: 'far', eligible: false })
  })

  it('הסעות מגן יבנה אינן הסעות מיבנה', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'יבנה', positionLocation: 'חיפה', transportation: 'הסעות מגן יבנה' })).toMatchObject({ matchType: 'far', eligible: false })
  })

  it('שלילה מפורשת גוברת על טקסט הסעות סותר', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionLocation: 'אילת', transportation: 'הסעות מחיפה', positionDescription: 'אין הסעות מחיפה' })).toMatchObject({ matchType: 'far', eligible: false })
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', positionLocation: 'אילת', transportation: 'אין הסעות', positionDescription: 'הסעות מחיפה' })).toMatchObject({ matchType: 'far', eligible: false })
  })

  it('לא הופך את ערי ההסעה למיקומי משרה', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'אשדוד', positionLocation: 'חיפה, הסעות מבאר שבע, אשדוד' })).toMatchObject({ matchType: 'transport', eligible: true, matchedCity: 'חיפה', isExactCity: false })
  })

  it('הסעה ללא מיקום עבודה או ללא עיר מועמד נשארת לא ידועה', () => {
    expect(evaluateMatchingLocation({ candidateCity: 'חיפה', transportation: 'הסעות מחיפה' })).toMatchObject({ matchType: 'unknown', eligible: null })
    expect(evaluateMatchingLocation({ positionLocation: 'אילת', transportation: 'הסעות מחיפה' })).toMatchObject({ matchType: 'unknown', eligible: null })
  })
})

describe('extractCandidateCity — עדות מגורים בלבד', () => {
  it.each([
    ['שם מועמד\nעיר מגורים: חולון\nניסיון תעסוקתי\nמנהל בחברת דוגמה, תל אביב\nהשכלה\nמכללת חיפה', 'חולון'],
    ['שם מועמד | מגורים: רמת-גן | טלפון: 0500000000', 'רמת גן'],
    ['כתובת: רחוב ירושלים 10, חיפה\nהשכלה: אוניברסיטת תל אביב', 'חיפה'],
    ['Candidate\nCity: Haifa\nExperience\nExample company, Tel Aviv', 'חיפה'],
    ['שם מועמד\nחיפה\nperson@example.test\nניסיון תעסוקתי\nחברה בתל אביב', 'חיפה'],
    ['שם מועמד | באר שבע | person@example.test\nהשכלה\nמכללת חיפה', 'באר שבע'],
    ['כתובת:\nראשון לציון\nניסיון תעסוקתי\nחיפה', 'ראשון לציון'],
    ['מגורים: פ״ת\nהשכלה\nאוניברסיטת חיפה', 'פתח תקווה'],
    ['מתגוררת בירושלים\nהשכלה\nחיפה', 'ירושלים'],
    ['מקום מגורים: גן יבנה\nכתובת: גן-יבנה', 'גן יבנה'],
  ])('מחלץ עיר מעדות בטוחה: %s', (resume, city) => {
    expect(extractCandidateCity(resume)).toBe(city)
  })

  it.each([
    '', '   ', 'שם מועמד\nניסיון תעסוקתי\nחברת דוגמה בחיפה',
    'שם מועמד\nהשכלה\nמכללת תל אביב',
    'שם מועמד\nאוניברסיטת חיפה\nחיפה',
    'שם מועמד\n2018–2023 עובד בחיפה\nחיפה',
    'שם מועמד\nניסיון תעסוקתי\nכתובת: חיפה',
    'שם מועמד\nכתובת מעסיק: חיפה',
    'מגורים: חיפה / תל אביב', 'מגורים: חיפה\nעיר מגורים: תל אביב',
    'שם מועמד\nחיפה\nתל אביב\nניסיון תעסוקתי',
    'שם מועמד\nחיפה\nמגורים: תל אביב',
    'מגורים: לא ידוע\nניסיון תעסוקתי\nחברת דוגמה בחיפה',
    'מגורים: לא בחיפה', 'מגורים: השרון', 'כתובת: haifa@example.test',
    'דן\nperson@example.test\nהשכלה\nמכללת חיפה',
    'שם מועמד\nמיקום עבודה רצוי: חיפה',
  ])('מחזיר null כשאין עדות חד־משמעית: %s', resume => {
    expect(extractCandidateCity(resume)).toBeNull()
  })

  it('משתמש בקו״ח רק כשאין עיר מובנית תקינה', () => {
    expect(evaluateMatchingLocation({ candidateResume: 'מגורים: חיפה\nניסיון תעסוקתי\nחברת דוגמה בתל אביב', positionLocation: 'חיפה' })).toMatchObject({ candidateCity: 'חיפה', matchType: 'exact' })
    expect(evaluateMatchingLocation({ candidateCity: 'אילת', candidateResume: 'מגורים: חיפה', positionLocation: 'חיפה' })).toMatchObject({ candidateCity: 'אילת', matchType: 'far' })
  })
})

describe('יציבות ודטרמיניזם', () => {
  it('שומר טווח ציונים וחוזה עקבי בין קריאות חוזרות', () => {
    const cities = [undefined, null, '', 'תל אביב', 'ירושלים', 'חיפה', 'אילת', 'גן יבנה', 'דפנה', 'עיר דמיונית']
    const locations = [...cities, 'כל הארץ', 'צפון', 'Remote', 'חיפה, אילת']
    for (const candidateCity of cities) {
      for (const positionLocation of locations) {
        const input = Object.freeze({ candidateCity, positionLocation })
        const result = evaluateMatchingLocation(input)
        expect(evaluateMatchingLocation(input)).toEqual(result)
        expect(Number.isFinite(result.score)).toBe(true)
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.score).toBeLessThanOrEqual(15)
        expect(result.isExactCity).toBe(result.matchType === 'exact')
        expect(result.isNationwide).toBe(result.matchType === 'nationwide')
        expect(result.reason.length).toBeGreaterThan(0)
        if (result.matchType === 'unknown') expect(result.eligible).toBeNull()
        if (result.eligible === false) expect(result.matchType).toBe('far')
        if (result.distanceKm !== null) expect(result.distanceKm).toBeGreaterThanOrEqual(0)
      }
    }
  })
})