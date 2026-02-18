import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 🔧 API לעדכון פרטי קשר של משרות YES
// GET /api/update-yes-contacts
export async function GET() {
  try {
    console.log('🔧 מעדכן פרטי קשר למשרות YES...')

    // מצא את המעסיק YES
    const yesEmployer = await prisma.employer.findFirst({
      where: { name: { contains: 'yes', mode: 'insensitive' } }
    })

    if (!yesEmployer) {
      return NextResponse.json({ error: 'לא נמצא מעסיק YES' }, { status: 404 })
    }

    console.log(`✅ נמצא מעסיק YES: ${yesEmployer.id}`)

    // =============================================================
    // פרטי הרכזים
    // =============================================================
    
    // שיר בניוניס - רכזת נשר
    const shirContact = {
      contactName: 'שיר בניוניס - Shir Benyunes',
      contactEmail: 'SBenyunes@yes.co.il',
      phone: '052-6152101',
      interviewInfo: 'ראיון פרונטלי בנשר כל יום בין 9:00-14:00. יש לעדכן את שיר במועד הראיון.'
    }

    // נופר קצב אבשרי - רכזת ב"ש וכפר סבא
    const nofarContact = {
      contactName: 'נופר קצב אבשרי - Nofar Katzav avshari',
      contactEmail: 'NKatzavavsha@yes.co.il',
      phone: '050-6954194'
    }

    const results: { position: string; action: string }[] = []

    // =============================================================
    // עדכון/יצירת משרות נשר - שיר
    // =============================================================
    
    // 1. נציג מכירות נשר
    const salesNesher = await upsertPosition({
      employerId: yesEmployer.id,
      title: 'נציג/ת מכירות נשר',
      location: 'נשר',
      description: `🎯 מוקד מכירות YES בנשר

ביצוע שיחות יוצאות/קבלת שיחות נכנסות מקהל לקוחות פוטנציאליים שהתעניין באתר/התקשר למוקד/השאיר פניה בפייסבוק של YES.
התפקיד כולל הצגת יתרונות המוצר/השירות והתאמתו לצורכי הלקוח, ניהול תהליך המכירה מקצה לקצה, עמידה ביעדי מכירה אישיים.

📞 ראיונות: פרונטלי בנשר כל יום בין 9:00-14:00
✉️ יש לעדכן את שיר במועד הראיון`,
      requirements: `אוריינטציה מכירתית - חובה
ניסיון במוקדי שירות/שימור/מכירה - יתרון משמעותי
יכולת עבודה בסביבה ממוחשבת - חובה
הישגיות ותחרותיות
כושר ביטוי ויכולת שכנוע
עבודה תחת לחץ
משמעת עצמית גבוהה`,
      salaryRange: 'שכר בסיס 34.30 ₪ לשעה + בונוס ממוצע 2,700 ₪ ללא תקרות',
      contactName: shirContact.contactName,
      contactEmail: shirContact.contactEmail,
      keywords: ['מכירות', 'מוקד', 'נשר', 'yes', 'יס', 'טלסיילס', 'לידים חמים', 'שיחות יוצאות', 'תקשורת', 'טלוויזיה']
    })
    results.push({ position: 'נציג/ת מכירות נשר', action: salesNesher })

    // 2. נציג שירות ותמיכה נשר
    const serviceNesher = await upsertPosition({
      employerId: yesEmployer.id,
      title: 'נציג/ת שירות ותמיכה נשר',
      location: 'נשר',
      description: `🎧 מוקד שירות ותמיכה YES בנשר

מתן מענה ללקוחות החברה בנושאים שונים: הוספת שירותים, מעברי דירה, טיפול בתקלות, הסבר מידע על חשבוניות, ושימור לקוחות.
תמיכה טכנית מרחוק, הדרכה וליווי הלקוח בשלט רחוק לפתרון תקלות.

📞 ראיונות: פרונטלי בנשר כל יום בין 9:00-14:00
✉️ יש לעדכן את שיר במועד הראיון`,
      requirements: `יכולת עבודה בסביבה ממוחשבת
כושר ביטוי טוב
יחסי אנוש
סבלנות ואמפתיה
יכולת עבודה תחת לחץ
נכונות לעבודה במשמרות
ידע טכני - יתרון`,
      salaryRange: '34.30 ₪ לשעה + 3,000 ₪ בונוס (טווח חודשי 8-9K)',
      contactName: shirContact.contactName,
      contactEmail: shirContact.contactEmail,
      keywords: ['שירות לקוחות', 'תמיכה טכנית', 'מוקד', 'נשר', 'yes', 'יס', 'call center', 'תקשורת', 'שימור', 'WhatsApp']
    })
    results.push({ position: 'נציג/ת שירות ותמיכה נשר', action: serviceNesher })

    // =============================================================
    // עדכון/יצירת משרות באר שבע - נופר (ראיון טלפוני)
    // =============================================================

    const serviceBeerSheva = await upsertPosition({
      employerId: yesEmployer.id,
      title: 'נציג/ת שירות ותמיכה באר שבע',
      location: 'באר שבע',
      description: `🎧 מוקד שירות ותמיכה YES בבאר שבע

מתן מענה ללקוחות החברה בנושאים שונים: הוספת שירותים, מעברי דירה, טיפול בתקלות, הסבר מידע על חשבוניות, ושימור לקוחות.
תמיכה טכנית מרחוק, הדרכה וליווי הלקוח בשלט רחוק לפתרון תקלות.

📞 ראיונות: טלפוניים על ידי נופר הרכזת
✉️ יש להעביר פרטי מועמדים במייל + לנילוסופט`,
      requirements: `יכולת עבודה בסביבה ממוחשבת
כושר ביטוי טוב
יחסי אנוש
סבלנות ואמפתיה
יכולת עבודה תחת לחץ
נכונות לעבודה במשמרות
ידע טכני - יתרון`,
      salaryRange: '34.30 ₪ לשעה + 3,000 ₪ בונוס (טווח חודשי 8-9K)',
      contactName: nofarContact.contactName,
      contactEmail: nofarContact.contactEmail,
      keywords: ['שירות לקוחות', 'תמיכה טכנית', 'מוקד', 'באר שבע', 'נגב', 'דרום', 'yes', 'יס', 'call center', 'תקשורת', 'שימור']
    })
    results.push({ position: 'נציג/ת שירות ותמיכה באר שבע', action: serviceBeerSheva })

    // =============================================================
    // עדכון/יצירת משרות כפר סבא - נופר (ראיון פרונטלי)
    // =============================================================

    // סוכן מכירות שטח עסקי
    const salesFieldAgent = await upsertPosition({
      employerId: yesEmployer.id,
      title: 'סוכן/ת מכירות שטח עסקי',
      location: 'מרכז / כפר סבא',
      description: `🚗 סוכן מכירות שטח למגזר עסקי - YES

מכירת מוצרי ושירותי החברה לבתי עסק בינוניים וגדולים, איתור לקוחות פוטנציאליים ותאום פגישות מכירה.
ביצוע פגישות המכירה ומו"מ לסגירת העסקאות, אחריות אישית וליווי תהליך הצטרפות הלקוח.
עבודה מול ממשקים פנים וחוץ ארגוניים, עמידה ביעדי המכירות.

📞 ראיונות: פרונטלי בכפר סבא מול נופר`,
      requirements: `ניסיון במכירות - חובה
הכרות עם המגזר העסקי - יתרון משמעותי
רקע טכני - יתרון משמעותי
דרייב למכירות ונכונות לעבודת שטח
יחסי אנוש מצויינים
רישיון נהיגה - חובה`,
      salaryRange: 'שכר בסיס 8,000 ₪ + בונוס ללא תקרה + רכב + סלולרי + טבלט + 10ביס',
      contactName: nofarContact.contactName,
      contactEmail: nofarContact.contactEmail,
      keywords: ['מכירות שטח', 'B2B', 'עסקי', 'סוכן', 'רכב צמוד', 'yes', 'יס', 'מרכז', 'כפר סבא', 'עצמאי', 'שטח']
    })
    results.push({ position: 'סוכן/ת מכירות שטח עסקי', action: salesFieldAgent })

    // אחראי תיק לקוח עסקי
    const accountManager = await upsertPosition({
      employerId: yesEmployer.id,
      title: 'אחראי/ת תיק לקוח עסקי',
      location: 'כפר סבא',
      description: `💼 אחראי תיק לקוח עסקי - YES

מתן מענה טלפוני ללקוחות העסקיים של החברה, מתן שירות ומכירה לתיק הלקוח העסקי.
מימוש הפוטנציאל העסקי של הלקוח באמצעות הוספת מנויים, שירותים ומוצרים.
אחריות מערכתית לניהול קשר עם הלקוח העסקי לטווח הארוך, שמירה על שביעות רצון גבוהה.

📞 ראיונות: פרונטלי בכפר סבא מול נופר`,
      requirements: `ניסיון של שנה לפחות בתפקידי שירות ו/או מכירה - יתרון משמעותי
ניסיון בעבודה עם מערכות ממוחשבות - חובה
שירותיות
אוריינטציה מכירתית ויכולת ניהול מו"מ
כושר ביטוי גבוה`,
      salaryRange: 'שכר בסיס 6,500 ₪ + שעות נוספות + בונוס עד 2,500 ₪',
      contactName: nofarContact.contactName,
      contactEmail: nofarContact.contactEmail,
      keywords: ['תיק לקוחות', 'B2B', 'עסקי', 'yes', 'יס', 'כפר סבא', 'שירות', 'מכירות', 'מוקד', 'account manager']
    })
    results.push({ position: 'אחראי/ת תיק לקוח עסקי', action: accountManager })

    // נציג קהילה דיגיטלית
    const communityRep = await upsertPosition({
      employerId: yesEmployer.id,
      title: 'נציג/ת קהילה דיגיטלית',
      location: 'כפר סבא',
      description: `📱 נציג קהילה דיגיטלית - YES

עבודה ברשתות החברתיות של החברה, מתן מענה ללקוחות ברשתות החברתיות.
ניהול קשר עם לקוחות בערוצים דיגיטליים, כתיבת תוכן ומעורבות עם הקהילה.

📞 ראיונות: פרונטלי בכפר סבא מול נופר`,
      requirements: `ניסיון בעבודה עם רשתות חברתיות
כושר ביטוי מעולה בכתב
יכולת עבודה בסביבה ממוחשבת
שירותיות
יצירתיות`,
      salaryRange: 'לפי הסכם',
      contactName: nofarContact.contactName,
      contactEmail: nofarContact.contactEmail,
      keywords: ['רשתות חברתיות', 'דיגיטל', 'קהילה', 'social media', 'yes', 'יס', 'כפר סבא', 'פייסבוק', 'אינסטגרם', 'community manager']
    })
    results.push({ position: 'נציג/ת קהילה דיגיטלית', action: communityRep })

    // =============================================================
    // הצגת כל המשרות
    // =============================================================
    
    const allYesPositions = await prisma.position.findMany({
      where: { employerId: yesEmployer.id, active: true },
      orderBy: { location: 'asc' },
      select: {
        id: true,
        title: true,
        location: true,
        contactName: true,
        contactEmail: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '✅ פרטי הקשר עודכנו בהצלחה!',
      summary: {
        shirPositions: ['נציג/ת מכירות נשר', 'נציג/ת שירות ותמיכה נשר'],
        nofarPositionsBeerSheva: ['נציג/ת שירות ותמיכה באר שבע'],
        nofarPositionsKfarSaba: ['סוכן/ת מכירות שטח עסקי', 'אחראי/ת תיק לקוח עסקי', 'נציג/ת קהילה דיגיטלית']
      },
      contacts: {
        shir: { name: shirContact.contactName, email: shirContact.contactEmail, phone: shirContact.phone },
        nofar: { name: nofarContact.contactName, email: nofarContact.contactEmail, phone: nofarContact.phone }
      },
      results,
      allPositions: allYesPositions
    })

  } catch (error) {
    console.error('❌ שגיאה:', error)
    return NextResponse.json(
      { error: 'שגיאה בעדכון פרטי קשר', details: String(error) },
      { status: 500 }
    )
  }
}

// פונקציה ליצירה/עדכון משרה
async function upsertPosition(data: {
  employerId: string
  title: string
  location: string
  description: string
  requirements: string
  salaryRange: string
  contactName: string
  contactEmail: string
  keywords: string[]
}): Promise<string> {
  const { employerId, title, keywords, ...updateData } = data
  
  // חפש משרה קיימת לפי כותרת ומעסיק
  const existing = await prisma.position.findFirst({
    where: {
      employerId,
      title: { contains: title.split('/')[0].trim(), mode: 'insensitive' }
    }
  })

  if (existing) {
    // עדכן משרה קיימת
    await prisma.position.update({
      where: { id: existing.id },
      data: {
        ...updateData,
        title,
        keywords: JSON.stringify(keywords),
        active: true
      }
    })
    return 'עודכן'
  } else {
    // צור משרה חדשה
    await prisma.position.create({
      data: {
        employerId,
        title,
        ...updateData,
        keywords: JSON.stringify(keywords),
        employmentType: 'משרה מלאה',
        active: true,
        openings: 1,
        priority: 5
      }
    })
    return 'נוצר'
  }
}
