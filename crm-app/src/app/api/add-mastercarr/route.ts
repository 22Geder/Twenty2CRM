import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/add-mastercarr - הוספת מעסיק MASTERCARR ו-3 משרות
export async function GET() {
  try {
    // בדיקה אם המעסיק כבר קיים
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: "MASTERCARR", mode: "insensitive" } },
          { name: { contains: "מאסטר קאר", mode: "insensitive" } },
          { name: { contains: "מאסטר קר", mode: "insensitive" } },
        ]
      }
    })

    if (!employer) {
      // יצירת מעסיק חדש
      employer = await prisma.employer.create({
        data: {
          name: "MASTERCARR - מוסך מאסטר קאר",
          industry: "רכב ומכונאות",
          contactName: "עודד גוזלן",
          contactEmail: "",
          contactPhone: "0537223722",
          address: "המלאכה 5, טירת כרמל",
          description: "מוסך מקצועי לתיקון ואחזקת רכבים",
          website: "",
          isActive: true,
        }
      })
      console.log("✅ נוצר מעסיק חדש:", employer.name)
    } else {
      console.log("ℹ️ מעסיק קיים:", employer.name)
    }

    // רשימת המשרות להוספה
    const positions = [
      {
        title: "מכונאי רכב מקצועי",
        description: "דרוש/ה מכונאי/ת רכב מקצועי/ת עם ניסיון מוכח של 5 שנים לפחות. עבודה במוסך מקצועי בטירת כרמל.",
        requirements: "ניסיון של 5 שנים לפחות במכונאות רכב, תעודת מכונאי רכב, יכולת עבודה עצמאית, ידע בכל סוגי הרכבים",
        location: "טירת כרמל",
        salaryRange: "לפי ניסיון",
        employmentType: "משרה מלאה",
        experienceRequired: "5 שנים",
        isActive: true,
        priority: 1,
      },
      {
        title: "מכונאי רכב מתלמד",
        description: "דרוש/ה מכונאי/ת רכב מתלמד/ת להתמחות במוסך מקצועי. אפשרות להתקדמות והכשרה מקצועית.",
        requirements: "ניסיון מינימלי, נכונות ללמוד, מוטיבציה גבוהה, יחס רציני לעבודה. מתאים גם לבוגרי קורסים או בית ספר מקצועי",
        location: "טירת כרמל",
        salaryRange: "לפי ניסיון",
        employmentType: "משרה מלאה",
        experienceRequired: "ללא ניסיון / מינימלי",
        isActive: true,
        priority: 1,
      },
      {
        title: "חשמלאי רכב מקצועי",
        description: "דרוש/ה חשמלאי/ת רכב מקצועי/ת עם ניסיון באבחון ותיקון תקלות חשמל ברכבים. עבודה במוסך מוביל בטירת כרמל.",
        requirements: "ניסיון בחשמל רכב, ידע באבחון ממוחשב, הכרת מערכות חשמל ברכבים מודרניים, יכולת קריאת תרשימי חשמל",
        location: "טירת כרמל",
        salaryRange: "לפי ניסיון",
        employmentType: "משרה מלאה",
        experienceRequired: "2+ שנים",
        isActive: true,
        priority: 1,
      },
    ]

    // תגיות לחיפוש/יצירה
    const tagNames = ["מכונאי רכב", "חשמלאי רכב", "רכב", "מוסך", "טכנאי רכב"]
    
    // יצירת/מציאת תגיות
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await prisma.tag.findFirst({
          where: { name: { equals: name, mode: "insensitive" } }
        })
        if (!tag) {
          tag = await prisma.tag.create({
            data: { name, color: "#E53935" } // אדום - רכב
          })
        }
        return tag
      })
    )

    const results = []

    for (const posData of positions) {
      // בדיקה אם המשרה כבר קיימת
      const existingPosition = await prisma.position.findFirst({
        where: {
          employerId: employer.id,
          title: posData.title,
        }
      })

      if (existingPosition) {
        results.push({
          title: posData.title,
          status: "already_exists",
          id: existingPosition.id
        })
        continue
      }

      // יצירת משרה חדשה
      const newPosition = await prisma.position.create({
        data: {
          ...posData,
          employerId: employer.id,
          tags: {
            connect: tags.map(t => ({ id: t.id }))
          }
        }
      })

      results.push({
        title: posData.title,
        status: "created",
        id: newPosition.id
      })
    }

    // ספירת משרות פעילות של המעסיק
    const totalPositions = await prisma.position.count({
      where: { employerId: employer.id, isActive: true }
    })

    return NextResponse.json({
      success: true,
      employer: {
        id: employer.id,
        name: employer.name,
        contact: "עודד גוזלן",
        phone: "0537223722",
        address: "המלאכה 5, טירת כרמל"
      },
      positions: results,
      totalActivePositions: totalPositions,
      message: `✅ MASTERCARR - נוספו ${results.filter(r => r.status === 'created').length} משרות חדשות`
    })

  } catch (error) {
    console.error("Error adding MASTERCARR:", error)
    return NextResponse.json(
      { error: "Failed to add employer and positions", details: String(error) },
      { status: 500 }
    )
  }
}
