import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * הוספת לקוח חדש iDigital + 2 משרות פתוחות - יוני 2026
 *
 *   POST /api/positions/add-idigital-june2026
 *   body: { "key": "twenty2idigital2026" }
 *
 * משרה 1: מיישם/ת פריוריטי - iDigital (מס' 3496)
 * משרה 2: מנהל/ת חשבונות לקוחות - iCon (מס' 3458)
 * יצירת 2 מעסיקים + 50+ תגיות לכל משרה
 */

const VALID_KEYS = ['twenty2idigital2026', 'idigital2026', 'twenty2icon2026']

const CONTACT = {
  name: 'iDigital HR',
  email: 'career@idigital.co.il',
  ccName: 'יערה פוקס',
}

// ---- תגיות למשרת מיישם/ת פריוריטי (משרה 3496) ----
const PRIORITY_IMPLEMENTER_TAGS = [
  // מוצר/מערכת
  'פריוריטי', 'priority', 'Priority ERP', 'ERP', 'מערכת פריוריטי', 'priority system',
  'priority modules', 'מודולים', 'priority crm',
  // תחומי מודולים
  'מכירות', 'שירות', 'מלאי', 'כספים', 'inventory', 'sales', 'finance', 'service',
  // תפקיד
  'מיישם', 'מיישמת', 'מיישם פריוריטי', 'implementer', 'implementation', 'יישום',
  'הטמעה', 'ERP implementer', 'consultant', 'ייעוץ', 'יועץ ERP',
  // מיומנויות טכניות
  'אפיון', 'מסמכי אפיון', 'ניתוח צרכים', 'requirements analysis', 'system analysis',
  'ממשקים', 'interfaces', 'integration', 'אינטגרציה', 'API',
  'הדרכה', 'training', 'תמיכה', 'support', 'troubleshooting', 'תקלות',
  'BI', 'business intelligence', 'SQL', 'מסדי נתונים', 'databases',
  // השכלה/ניסיון
  'הנדסת תעשייה', 'industrial engineering', 'מערכות מידע', 'information systems', 'MIS',
  'קורס פריוריטי', 'תואר', 'ניסיון 3 שנים', 'ניסיון בכיר',
  // כישורים אישיים
  'עבודה עצמאית', 'עבודת צוות', 'ניהול פרויקטים', 'project management',
  'שירותיות', 'אחריות', 'לויאליות', 'מוסר עבודה', 'יחסי אנוש',
  'ריבוי משימות', 'multitasking', 'ספקים חיצוניים',
  // מיקום ותנאים
  'פתח תקווה', 'petah tikva', 'מרכז', 'גוש דן', 'השרון',
  'משרה מלאה', 'full time', 'ללא הגבלת שכר', 'משרה דחופה',
  // ענף
  'הייטק', 'technology', 'tech', 'תוכנה', 'software', 'IT', 'מידע', 'iDigital',
  'digital', 'אוטומציה', 'process improvement', 'workflow',
]

// ---- תגיות למשרת מנהל/ת חשבונות לקוחות (משרה 3458) ----
const ACCOUNTS_MANAGER_TAGS = [
  // תפקיד
  'הנהלת חשבונות', 'accountant', 'accounting', 'bookkeeper', 'מנהל חשבונות', 'מנהלת חשבונות',
  'חשבונות לקוחות', 'accounts receivable', 'AR', 'receivables', 'חייבים',
  'הנהלת חשבונות סוג 2', 'type 2', 'תעודת הנהלת חשבונות',
  // תחומי אחריות
  'גבייה', 'collection', 'debt collection', 'גביית חובות',
  'התאמות', 'reconciliation', 'bank reconciliation', 'התאמות בנקאיות',
  'חיובים', 'billing', 'invoicing', 'חשבוניות', 'invoices',
  'ביטוח אשראי', 'credit insurance', 'אשראי', 'credit',
  'לקוחות עסקיים', 'B2B', 'עסקי', 'business clients',
  'ממשקים פנים ארגוניים', 'ממשקים בין ארגוניים', 'cross-functional',
  // כלים ומיומנויות
  'פריוריטי', 'priority', 'ERP', 'אקסל', 'Excel', 'נוסחאות אקסל',
  'VLOOKUP', 'pivot', 'spreadsheet', 'אנגלית', 'English', 'אנגלית ברמה טובה',
  'מע"מ', 'VAT', 'month-end', 'סגירת חודש', 'דוחות כספיים', 'financial reports',
  // ניסיון/השכלה
  'חברות מסחריות', 'commercial companies', 'ריטייל', 'retail', 'חברות גדולות',
  'ניסיון בחברות מסחריות', 'לא ממשרד רו"ח',
  // כישורים אישיים
  'עבודה תחת לחץ', 'pressure', 'ניהול זמן', 'time management',
  'עבודת צוות', 'עבודה עצמאית', 'ריבוי משימות', 'multitasking',
  'אמינות', 'יושרה', 'מסירות', 'מוטיבציה', 'תודעת שירות', 'איכפתיות',
  // מיקום ותנאים
  'פתח תקווה', 'petah tikva', 'מרכז', 'גוש דן', 'השרון',
  'משרה מלאה', 'full time', '15000', 'שכר 15000', 'חנייה', 'parking', 'סיבוס',
  // חברה/ענף
  'iCon', 'Apple', 'אפל', 'מפיץ Apple', 'מפיץ רשמי', 'official distributor',
  'מסחר', 'commerce', 'retail tech', 'technology company',
]

async function ensureTag(name: string) {
  const trimmed = (name || '').trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > 50) return null
  return prisma.tag.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed, color: '#3B82F6', category: 'position' },
  })
}

async function upsertPosition(
  employerId: string,
  positionData: {
    title: string
    description: string
    requirements: string
    location: string
    salaryRange: string
    workHours: string
    benefits: string
    employmentType: string
    contactEmail: string
    contactName: string
    priority: number
    keywords: string
    aiProfile: string
    contactEmails: string
  },
  tagIds: { id: string }[],
) {
  const existing = await prisma.position.findFirst({
    where: { title: positionData.title, employerId },
  })

  if (existing) {
    return prisma.position.update({
      where: { id: existing.id },
      data: {
        ...positionData,
        active: true,
        employerId,
        tags: { set: [], connect: tagIds },
      },
      include: { tags: true },
    })
  }

  return prisma.position.create({
    data: {
      ...positionData,
      active: true,
      employerId,
      tags: { connect: tagIds },
    },
    include: { tags: true },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const key = body?.key ?? ''
    if (!key || !VALID_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ---- מעסיק 1: iDigital ----
    let idigitalEmployer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'iDigital' } },
          { name: { contains: 'אי-דיגיטל' } },
          { email: { contains: 'idigital' } },
        ],
      },
    })
    let idigitalCreated = false
    if (!idigitalEmployer) {
      idigitalEmployer = await prisma.employer.create({
        data: {
          name: 'iDigital',
          email: 'career@idigital.co.il',
          phone: '',
          website: '',
          description:
            'iDigital - חברה טכנולוגית מובילה בפתח תקווה. מחלקת מערכות מידע מגייסת מומחי ERP ופריוריטי.',
        },
      })
      idigitalCreated = true
    }

    // ---- מעסיק 2: iCon ----
    let iconEmployer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'iCon' } },
          { name: { contains: 'icon' } },
        ],
      },
    })
    let iconCreated = false
    if (!iconEmployer) {
      iconEmployer = await prisma.employer.create({
        data: {
          name: 'iCon',
          email: 'career@idigital.co.il',
          phone: '',
          website: '',
          description:
            'iCon - המפיצה הרשמית של Apple בישראל. מחפשת מנהלי/ות חשבונות לתחום הלקוחות בפתח תקווה.',
        },
      })
      iconCreated = true
    }

    // ---- תגיות משרה 1: מיישם/ת פריוריטי ----
    const priorityTagRecords: { id: string }[] = []
    for (const name of PRIORITY_IMPLEMENTER_TAGS) {
      const t = await ensureTag(name)
      if (t) priorityTagRecords.push({ id: t.id })
    }

    // ---- תגיות משרה 2: מנהל/ת חשבונות ----
    const accountsTagRecords: { id: string }[] = []
    for (const name of ACCOUNTS_MANAGER_TAGS) {
      const t = await ensureTag(name)
      if (t) accountsTagRecords.push({ id: t.id })
    }

    // ---- משרה 1: מיישם/ת פריוריטי - iDigital (מס' 3496) ----
    const priorityKeywords = PRIORITY_IMPLEMENTER_TAGS.filter(
      (t) => t.length >= 2,
    ).slice(0, 60)
    const priorityAiProfile = {
      role: 'מיישם/ת פריוריטי',
      jobNumber: '3496',
      industry: 'טכנולוגיה / מערכות מידע',
      seniority: 'MID_SENIOR',
      keywords: priorityKeywords,
      location: 'פתח תקווה',
      employer: 'iDigital',
      recruiter: { name: CONTACT.name, email: CONTACT.email, cc: CONTACT.ccName },
      requirements: [
        'תואר הנדסת תעשייה או מערכות מידע - חובה',
        'בוגר קורס יישום פריוריטי - חובה',
        'ניסיון 3 שנים+ כמיישם פריוריטי - חובה',
        'ניסיון במודולים: מכירות, שירות, מלאי, כספים - חובה',
        'ניסיון עם מערכות BI - יתרון',
      ],
      salary: 'ללא הגבלה',
      urgent: true,
    }

    const position1 = await upsertPosition(
      idigitalEmployer.id,
      {
        title: 'מיישם/ת פריוריטי - מחלקת מערכות מידע',
        description: `לחברה iDigital דרוש/ה מיישם/ת פריוריטי למחלקת מערכות מידע
מס' משרה: 3496 | משרה מלאה | פתח תקווה

תיאור התפקיד:
• ניתוח צרכי משתמשים, אפיון, יישום והטמעה, הדרכה
• תמיכה בממשקים של מערכת פריוריטי עם מערכות חיצוניות
• תמיכה וטיפול בתקלות
• עבודה מול ספקים חיצוניים ומשתמשי קצה
• כתיבת מסמכי אפיון ודרישות

דגשים:
⚡ משרה סופר דחופה
💰 ללא הגבלת שכר`,
        requirements: `דרישות חובה:
• תואר בהנדסת תעשייה / מערכות מידע - חובה
• בוגר/ת קורס יישום פריוריטי - חובה
• ניסיון ביישום והטמעת פריוריטי: מכירות, שירות, מלאי, כספים - חובה
• ניסיון של 3 שנים ומעלה כמיישם/ת פריוריטי - חובה
• יכולת הגדרת דרישות וכתיבת מסמכי אפיון

יתרון:
• ניסיון עם מערכות BI
• ניסיון עם ממשקים ואינטגרציות

כישורים אישיים:
• יכולת עבודה עצמאית, בצוות ועם ספקים חיצוניים
• שירותיות, אחריות, לויאליות, מוסר עבודה גבוה
• יכולת ביצוע מספר משימות במקביל`,
        location: 'פתח תקווה',
        salaryRange: 'ללא הגבלה',
        workHours: 'משרה מלאה',
        benefits: 'תנאים מעולים, סביבה טכנולוגית מתקדמת',
        employmentType: 'משרה מלאה',
        contactEmail: CONTACT.email,
        contactName: CONTACT.name,
        priority: 3,
        keywords: JSON.stringify(priorityKeywords),
        aiProfile: JSON.stringify(priorityAiProfile),
        contactEmails: JSON.stringify([
          { email: CONTACT.email, name: CONTACT.name },
          { email: CONTACT.email, name: CONTACT.ccName },
        ]),
      },
      priorityTagRecords,
    )

    // ---- משרה 2: מנהל/ת חשבונות לקוחות - iCon (מס' 3458) ----
    const accountsKeywords = ACCOUNTS_MANAGER_TAGS.filter(
      (t) => t.length >= 2,
    ).slice(0, 60)
    const accountsAiProfile = {
      role: 'מנהל/ת חשבונות לתחום הלקוחות',
      jobNumber: '3458',
      industry: 'מסחר / טכנולוגיה / ריטייל',
      seniority: 'MID',
      keywords: accountsKeywords,
      location: 'פתח תקווה',
      employer: 'iCon - מפיץ רשמי Apple',
      recruiter: { name: CONTACT.name, email: CONTACT.email, cc: CONTACT.ccName },
      requirements: [
        'תעודת הנהלת חשבונות סוג 2 לפחות - חובה',
        'ניסיון בהנהלת חשבונות לקוחות בחברות מסחריות',
        'שליטה באקסל כולל נוסחאות',
        'אנגלית ברמה טובה',
        'ניסיון מחברות ריטייל / חברות גדולות - יתרון',
        'היכרות עם מערכת פריוריטי - יתרון',
      ],
      salary: 'כ-15,000 ₪',
      benefits: ['חנייה', 'סיבוס 35 ₪ ליום'],
      note: 'מחפשים מי שיודע להתנהל תחת לחץ, ניסיון מחברות ריטייל/גדולות - לא ממשרד רו"ח',
    }

    const position2 = await upsertPosition(
      iconEmployer.id,
      {
        title: 'מנהל/ת חשבונות לתחום הלקוחות',
        description: `לחברת iCon - המפיצה הרשמית של Apple בישראל - דרוש/ה מנהל/ת חשבונות לתחום הלקוחות
מס' משרה: 3458 | משרה מלאה | פתח תקווה

תחומי אחריות:
• טיפול בלקוחות עסקיים – גבייה, התאמות, בדיקת חיובים והתנהלות שוטפת
• עבודה מול ממשקים פנים וחוץ ארגוניים
• עבודה מול ביטוח אשראי

יתרונות המשרה:
💰 שכר סביב 15,000 ₪
🅿️ חנייה
🍽️ סיבוס 35 ₪ ליום

הערה חשובה:
מחפשים מועמד/ת עם ניסיון מחברות ריטייל או חברות גדולות - לא ניסיון ממשרד רו"ח`,
        requirements: `דרישות:
• תעודת הנהלת חשבונות סוג 2 לפחות - חובה
• ניסיון בהנהלת חשבונות לקוחות בחברות מסחריות
• היכרות עם מערכת פריוריטי – יתרון
• שליטה באקסל (כולל נוסחאות)
• אנגלית ברמה טובה

כישורים אישיים:
• מוטיבציה גבוהה להצלחה בתפקיד
• איכפתיות ומסירות לעבודה
• יכולת עבודה עצמאית ובצוות ויכולת ניהול זמן
• יכולת לנהל מספר משימות במקביל ועבודה בתנאי לחץ
• אמינות ויושרה
• תודעת שירות גבוהה`,
        location: 'פתח תקווה',
        salaryRange: 'כ-15,000 ₪',
        workHours: 'משרה מלאה - ממשרדי החברה בלבד',
        benefits: 'חנייה, סיבוס 35 ₪ ליום',
        employmentType: 'משרה מלאה',
        contactEmail: CONTACT.email,
        contactName: CONTACT.name,
        priority: 2,
        keywords: JSON.stringify(accountsKeywords),
        aiProfile: JSON.stringify(accountsAiProfile),
        contactEmails: JSON.stringify([
          { email: CONTACT.email, name: CONTACT.name },
          { email: CONTACT.email, name: CONTACT.ccName },
        ]),
      },
      accountsTagRecords,
    )

    return NextResponse.json({
      success: true,
      message: 'iDigital ו-iCon נוספו בהצלחה עם 2 משרות',
      employers: [
        { id: idigitalEmployer.id, name: idigitalEmployer.name, created: idigitalCreated },
        { id: iconEmployer.id, name: iconEmployer.name, created: iconCreated },
      ],
      positions: [
        {
          id: position1.id,
          title: position1.title,
          jobNumber: '3496',
          employer: 'iDigital',
          location: position1.location,
          salaryRange: position1.salaryRange,
          tagsCount: position1.tags.length,
          tagsAtLeast50: position1.tags.length >= 50,
        },
        {
          id: position2.id,
          title: position2.title,
          jobNumber: '3458',
          employer: 'iCon',
          location: position2.location,
          salaryRange: position2.salaryRange,
          tagsCount: position2.tags.length,
          tagsAtLeast50: position2.tags.length >= 50,
        },
      ],
      contactInfo: {
        email: CONTACT.email,
        emailSubject: 'שם משרה + מס׳ משרה בכותרת (קריטי!)',
        cc: CONTACT.ccName,
      },
    })
  } catch (error: any) {
    console.error('[idigital-june2026] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed',
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 5),
      },
      { status: 500 },
    )
  }
}
