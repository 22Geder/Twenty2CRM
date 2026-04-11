import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// POST /api/update-boutik-hapita - עדכון משרות בוטיק הפיתה
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // מציאת המעסיק
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: "בוטיק הפיתה", mode: "insensitive" } },
          { email: { contains: "boutik-hapita", mode: "insensitive" } },
        ]
      }
    })

    if (!employer) {
      // יצירת מעסיק חדש
      employer = await prisma.employer.create({
        data: {
          name: "בוטיק הפיתה",
          email: "rotem@butik-hapita.co.il",
          phone: "050-8499958",
          description: "רשת מאפיות בוטיק הפיתה - מאפים איכותיים",
        }
      })
      console.log("✅ נוצר מעסיק חדש:", employer.name)
    }

    // מחיקת משרות קיימות של המעסיק (כדי להחליף בחדשות)
    await prisma.position.deleteMany({
      where: { employerId: employer.id }
    })

    // תגיות
    const tagNames = ["אפייה", "אופה", "מאפייה", "מזון", "מחסנאי", "לוגיסטיקה"]
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await prisma.tag.findFirst({
          where: { name: { equals: name, mode: "insensitive" } }
        })
        if (!tag) {
          tag = await prisma.tag.create({
            data: { name, color: "#FF9800" }
          })
        }
        return tag
      })
    )

    const bakeryTags = tags.filter(t => ["אפייה", "אופה", "מאפייה", "מזון"].includes(t.name))
    const warehouseTags = tags.filter(t => ["מחסנאי", "לוגיסטיקה", "מזון"].includes(t.name))

    // רשימת המשרות החדשות
    const positions = [
      {
        title: "אופה ראשי / מנהל אפייה",
        description: `🥖 מה התפקיד כולל?
• ניהול תהליכי האפייה ברמה גבוהה עד לתוצר המוגמר
• הובלת צוות האופים: חלוקת משימות, ניהול כלל העובדים בסניף, פיקוח ועמידה ביעדים
• שמירה על סטנדרטים גבוהים של איכות ודיוק בכל מוצר שיוצא מהמאפייה
• אחריות על תפעול העבודה בסניף תוך עמידה בצרכים היומיומיים

למי זה מתאים?
✅ בעלי ניסיון כאופה ראשי/ת – חובה!
✅ למי שיש יכולות ניהול צוות ויחסי אנוש מצוינים
✅ למי ששולט/ת בתהליכי האפייה על כל שלביהם
✅ למי שמסודר/ת, אחראי/ת ועם תשומת לב לפרטים הקטנים`,
        requirements: `ניסיון כאופה ראשי - חובה, יכולות ניהול צוות, שליטה בתהליכי אפייה, אחריות ותשומת לב לפרטים`,
        location: "חיפה והסביבה",
        salaryRange: "50-60 ₪ לשעה (בהתאם לניסיון)",
        employmentType: "משרה מלאה",
        workHours: "04:00-14:00, לעיתים משמרת ערב 12:00-20:30",
        benefits: "שכר מתגמל במיוחד, סביבה מקצועית ונעימה, אפשרות התפתחות",
        contactName: "רותם",
        contactEmail: "rotem@butik-hapita.co.il",
        active: true,
        priority: 2,
        tags: bakeryTags,
      },
      {
        title: "אופה מתלמד",
        description: `🥖 מה התפקיד כולל?
• עבודה לצד האופה הראשי, לימוד תהליכי אפייה ברמה גבוהה
• לאחר ההכשרה: עבודה עצמאית בתהליכי האפייה – עם הרבה מקום ליצירתיות!
• שמירה על איכות, דיוק ונראות של כל מוצר שיוצא מהמאפייה

מה יוצא לך מזה?
💰 שכר מתגמל: חודש ראשון 40 ₪ לשעה
💰 שדרוג שכר לאחר ההכשרה! 45 ₪ בהתאם לביצועים
🌟 סביבת עבודה נעימה: צוות מקצועי, משפחתי ומפרגן!
📈 הזדמנות להתפתח: ללמוד ולהיות חלק ממאפייה מצליחה

למי זה מתאים?
✅ בעלי ניסיון באפייה – יתרון (אבל גם אם אין, אנחנו נלמד אותך!)
✅ למי שאוהב/ת את עולם האפייה ורוצה לגדול בתחום
✅ למי שאחראי/ת, מסודר/ת ועם יחסי אנוש מעולים
✅ למי שמחפש/ת סביבה דינאמית עם הרבה עשייה וכיף!`,
        requirements: `ניסיון באפייה - יתרון, לא חובה! נכונות ללמוד, אחריות, יחסי אנוש טובים`,
        location: "חיפה והסביבה",
        salaryRange: "40-45 ₪ לשעה",
        employmentType: "משרה מלאה",
        workHours: "הכשרה: 05:30-14:00 | לאחר הכשרה: א-ה 12:00-20:30, שישי 05:00-16:00",
        benefits: "הכשרה מקצועית, שדרוג שכר לאחר הכשרה, צוות משפחתי ומפרגן",
        contactName: "רותם",
        contactEmail: "rotem@butik-hapita.co.il",
        active: true,
        priority: 1,
        tags: bakeryTags,
      },
      {
        title: "מחסנאי/ת - ליקוט והפצה",
        description: `📦 מה התפקיד כולל?
• עבודה לצד המחסנאי הראשי
• ליקוט תוצרים גמורים והדפסת תעודות יציאה לסניפים

מה יוצא לך מזה?
💰 שכר מתגמל: חודש ראשון 40 ₪ לשעה
💰 שדרוג שכר לאחר ההכשרה! 45 ₪ בהתאם לביצועים
🌟 סביבת עבודה נעימה: צוות מקצועי, משפחתי ומפרגן!
📈 הזדמנות להתפתח: ללמוד ולהיות חלק ממאפייה מצליחה

למי זה מתאים?
✅ בעלי ניסיון במחסנים – יתרון (אבל גם אם אין, אנחנו נלמד אותך!)
✅ למי שאחראי/ת, מסודר/ת ועם יחסי אנוש מעולים
✅ למי שמחפש/ת סביבה דינאמית עם הרבה עשייה וכיף!`,
        requirements: `ניסיון במחסנים - יתרון, לא חובה! אחריות, סדר וארגון, יחסי אנוש טובים`,
        location: "חיפה והסביבה",
        salaryRange: "40-45 ₪ לשעה",
        employmentType: "משרה מלאה",
        workHours: "א-ה: 03:30-13:00 | שישי: 01:00-08:00",
        benefits: "הכשרה מקצועית, שדרוג שכר, צוות משפחתי",
        contactName: "רותם",
        contactEmail: "rotem@butik-hapita.co.il",
        active: true,
        priority: 1,
        tags: warehouseTags,
      },
    ]

    const results = []

    for (const posData of positions) {
      const { tags: posTags, ...positionData } = posData
      
      const newPosition = await prisma.position.create({
        data: {
          ...positionData,
          employerId: employer.id,
          tags: {
            connect: posTags.map(t => ({ id: t.id }))
          }
        }
      })

      results.push({
        title: positionData.title,
        status: "created",
        id: newPosition.id,
        salary: positionData.salaryRange,
      })
    }

    // ספירת משרות פעילות
    const totalPositions = await prisma.position.count({
      where: { employerId: employer.id, active: true }
    })

    return NextResponse.json({
      success: true,
      employer: {
        id: employer.id,
        name: employer.name,
        contact: "רותם",
        phone: "050-8499958",
        email: "rotem@butik-hapita.co.il"
      },
      positions: results,
      totalActivePositions: totalPositions,
      message: `✅ בוטיק הפיתה - עודכנו ${results.length} משרות`
    })

  } catch (error) {
    console.error("Error updating Boutik Hapita:", error)
    return NextResponse.json(
      { error: "Failed to update positions", details: String(error) },
      { status: 500 }
    )
  }
}
