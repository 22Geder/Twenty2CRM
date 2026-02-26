import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API לעדכון משרת טלימאן עם תגיות כלליות
 * המשרה צריכה להתאים לכל מועמד מחיפה!
 * 
 * GET /api/positions/update-teliman?key=twenty2port2026
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  
  if (key !== 'twenty2port2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // מציאת משרת טלימאן
    const telimanPosition = await prisma.position.findFirst({
      where: {
        OR: [
          { title: { contains: 'טלימאן' } },
          { title: { contains: 'טלמן' } }
        ]
      }
    })

    if (!telimanPosition) {
      return NextResponse.json({ 
        error: 'לא נמצאה משרת טלימאן במערכת',
        suggestion: 'צור את המשרה קודם דרך /api/positions/add-kishrey-galyam'
      }, { status: 404 })
    }

    // תגיות כלליות שיתאימו לכל מועמד מחיפה
    // כולל מגוון רחב של תחומים ותפקידים
    const generalKeywords = [
      // מיקום - הכרחי!
      'חיפה', 'נמל חיפה', 'אזור חיפה', 'קריות', 
      
      // עבודה כללית
      'עובד כללי', 'עובדת כללית', 'עובדים כלליים', 'עבודה כללית',
      'עבודה פיזית', 'עבודת שטח', 'עבודה בשטח',
      'משרה מלאה', 'משרה חלקית', 'עבודה זמנית',
      'ללא ניסיון', 'מתחילים', 'ללא ניסיון קודם',
      
      // תפקיד ספציפי
      'טלימאן', 'טלמן', 'טלמנית', 'רישום', 'תיעוד',
      'משאיות', 'רכב כבד', 'הובלה', 'שינוע',
      
      // נמל ולוגיסטיקה
      'נמל', 'עבודת נמל', 'עובד נמל', 'לוגיסטיקה',
      'מחסן', 'מחסנאי', 'מלקט', 'ליקוט',
      'סבלות', 'פריקה', 'טעינה', 'מטען',
      
      // ייצור ותעשייה
      'ייצור', 'עובד ייצור', 'פס ייצור', 'תעשייה',
      'מפעל', 'עובד מפעל', 'מפעלים',
      
      // שירות ומכירות (כי כולם יכולים)
      'שירות לקוחות', 'שירות', 'מכירות', 'קופאי', 'קופאית',
      
      // מאפיינים כלליים
      'אמין', 'אחראי', 'עצמאי', 'יסודי', 'מהיר',
      'עבודת צוות', 'גמישות', 'נכונות לשעות נוספות',
      
      // רקע מגוון
      'צבא', 'צהל', 'שירות לאומי', 'שירות צבאי',
      'סטודנט', 'סטודנטית', 'לימודים',
      'בוגר תיכון', 'השכלה תיכונית',
      
      // תנאי עבודה אטרקטיביים
      'שכר גבוה', 'שכר טוב', 'תנאים טובים',
      'רכב', 'נסיעות', 'ביטוח'
    ]

    // עדכון המשרה
    await prisma.position.update({
      where: { id: telimanPosition.id },
      data: {
        // וודא שהמיקום כולל חיפה באופן ברור
        location: 'נמל חיפה',
        // תגיות כלליות מופרדות בפסיקים
        keywords: generalKeywords.join(', '),
        // עדכון תיאור להדגיש שזו משרה פתוחה לכולם
        description: telimanPosition.description?.includes('משרה פתוחה לכולם') 
          ? telimanPosition.description 
          : `${telimanPosition.description || ''}

🌟 משרה פתוחה לכולם!
✅ אין צורך בניסיון קודם
✅ הכשרה במקום העבודה
✅ מתאים למתחילים
✅ שכר משתלם ותנאים מעולים

📍 מיקום: נמל חיפה - מתאים לתושבי חיפה והקריות`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'משרת טלימאן עודכנה בהצלחה עם תגיות כלליות!',
      position: {
        id: telimanPosition.id,
        title: telimanPosition.title,
        location: 'נמל חיפה'
      },
      keywordsCount: generalKeywords.length,
      note: 'עכשיו כל מועמד מחיפה יקבל ציון גבוה (50 נקודות מיקום + תגיות)'
    })

  } catch (error) {
    console.error('שגיאה בעדכון טלימאן:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
