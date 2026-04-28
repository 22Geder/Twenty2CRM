import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// חילוץ מהיר מקורות חיים - ללא AI (במקום analyzeResumeDeep האיטי)
function fastExtractFromCV(text: string) {
  // חילוץ אימייל
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : '';

  // חילוץ טלפון
  const phoneMatches = text.match(/0(?:5[0-9]|[2-4]|[7-9])[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g);
  const phone = phoneMatches?.[0]?.replace(/[\-\s]/g, '') || '';

  // חילוץ שם 
  const lines = text.split('\n').filter(l => l.trim());
  let name = '';
  for (const line of lines.slice(0, 5)) {
    const clean = line.trim();
    if (clean.length > 3 && clean.length < 50 && !clean.includes('@') && !/^\d{5,}/.test(clean)) {
      const words = clean.split(/\s+/);
      if (words.length >= 1 && words.length <= 4 && !/^0\d/.test(clean)) {
        name = clean;
        break;
      }
    }
  }

  // חילוץ עיר
  const cities = ['תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה', 'באר שבע', 'בני ברק', 'חולון', 'רמת גן', 'רעננה', 'אשקלון', 'רחובות', 'הרצליה', 'כפר סבא', 'חדרה', 'מודיעין', 'נצרת', 'לוד', 'רמלה', 'נהריה', 'טבריה', 'בת ים', 'הוד השרון', 'גבעתיים', 'אילת', 'עכו', 'כרמיאל', 'צפת', 'נס ציונה', 'יבנה', 'בית שמש', 'גדרה'];
  let city = '';
  for (const c of cities) {
    if (text.includes(c)) { city = c; break; }
  }

  // חילוץ תפקיד
  const titles = ['מפתח', 'מתכנת', 'מהנדס', 'מנהל', 'מזכירה', 'חשב', 'נהג', 'מחסנאי', 'מלגזן', 'שיווק', 'מכירות', 'Full Stack', 'Frontend', 'Backend', 'DevOps', 'QA', 'HR'];
  let currentTitle = '';
  for (const t of titles) {
    if (text.includes(t)) { currentTitle = t; break; }
  }

  // שנות ניסיון
  const expMatch = text.match(/(\d+)\s*(שנ[יה]|years?|שנות|שנים)/i);
  const yearsOfExperience = expMatch ? expMatch[1] : '';

  return { name, email, phone, city, currentTitle, yearsOfExperience };
}

// 🎨 צבעים לתגיות
function getTagColor(tagName: string): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];
  // צבע לפי hash של השם
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// GET /api/candidates - קבלת כל המועמדים
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          applications: {
            include: {
              position: {
                include: {
                  employer: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          tags: true,  // הוסף תגיות למועמדים
          uploadedBy: {  // 🆕 מי העלה את המועמד
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lastViewedBy: {  // 🆕 מי נכנס אחרון לכרטיס
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // 🆕 לאיזה מעסיק התקבל
          hiredToEmployer: {
            select: {
              id: true,
              name: true,
            },
          },
          // 🆕 לאיזה משרה בתהליך
          inProcessPosition: {
            select: {
              id: true,
              title: true,
              employer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              applications: true,
              interviews: true,
            },
          },
        },
      }),
      prisma.candidate.count({ where }),
    ])

    return NextResponse.json({
      candidates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    )
  }
}

// POST /api/candidates - יצירת מועמד חדש
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // 🆕 קבלת מזהה של המשתמש שמעלה
    const uploadedById = (session.user as any)?.id || null

    const body = await request.json()
    let {
      name,
      email,
      phone,
      alternatePhone,
      resumeUrl,
      linkedinUrl,
      portfolioUrl,
      currentCompany,
      currentTitle,
      yearsOfExperience,
      expectedSalary,
      noticePeriod,
      address,
      city,
      country,
      skills,
      notes,
      rating,
      source,
      isSelfEmployed,
      resume,  // 🆕 טקסט קורות חיים
      extractedTags,  // 🆕 תגיות שחולצו מקורות חיים
    } = body

    // 🚀 חילוץ מהיר - ללא AI (מהיר פי 100!)
    if (resume && resume.length >= 50) {
      try {
        console.log("🚀 FAST: Extracting CV data instantly...")
        const extracted = fastExtractFromCV(resume)
        
        // השלמת פרטים חסרים
        if (!name && extracted.name) name = extracted.name
        if (!phone && extracted.phone) phone = extracted.phone
        if (!email && extracted.email) email = extracted.email
        if (!city && extracted.city) city = extracted.city
        if (!currentTitle && extracted.currentTitle) currentTitle = extracted.currentTitle
        if (!yearsOfExperience && extracted.yearsOfExperience) yearsOfExperience = extracted.yearsOfExperience
        
        console.log("✅ FAST: Extracted:", name, phone, city)
      } catch (error) {
        console.error("Fast extraction error:", error)
      }
    }

    // ניסיון לחלץ שם מקורות החיים אם לא נמצא
    if (!name && resume) {
      // חיפוש שורה ראשונה שנראית כמו שם
      const lines = resume.split(/[\n\r]+/).filter((line: string) => line.trim())
      for (const line of lines.slice(0, 5)) { // בדיקת 5 שורות ראשונות
        const cleanLine = line.trim()
        // בדיקה אם זו שורה קצרה שנראית כמו שם (2-4 מילים עבריות או אנגליות)
        if (cleanLine.length > 3 && cleanLine.length < 40) {
          const words = cleanLine.split(/\s+/)
          if (words.length >= 1 && words.length <= 4) {
            // בדיקה שזה לא מספר טלפון או מייל
            if (!cleanLine.includes('@') && !/^\d+[\-\s]?\d+/.test(cleanLine)) {
              name = cleanLine
              console.log("📝 Extracted name from resume:", name)
              break
            }
          }
        }
      }
    }

    // אם עדיין אין שם, צור שם זמני
    if (!name && resume) {
      name = `מועמד חדש ${new Date().toLocaleDateString('he-IL')}`
      console.log("⚠️ Created placeholder name:", name)
    }

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if candidate with this email already exists
    if (email) {
      const existingCandidate = await prisma.candidate.findUnique({
        where: { email },
      })

      if (existingCandidate) {
        return NextResponse.json(
          { error: "Candidate with this email already exists" },
          { status: 409 }
        )
      }
    }

    // 🏷️ הכנת תגיות לחיבור
    const tagConnections = extractedTags && extractedTags.length > 0
      ? {
          connectOrCreate: extractedTags.slice(0, 15).map((tagName: string) => ({
            where: { name: tagName },
            create: { 
              name: tagName, 
              color: getTagColor(tagName),
              type: 'AUTO',
              category: 'auto-extracted'
            }
          }))
        }
      : undefined

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email: email || null,
        phone,
        alternatePhone,
        resumeUrl,
        linkedinUrl,
        portfolioUrl,
        currentCompany,
        currentTitle,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
        expectedSalary,
        noticePeriod,
        address,
        city,
        country,
        skills,
        notes,
        rating: rating ? parseInt(rating) : null,
        source,
        isSelfEmployed: Boolean(isSelfEmployed),
        resume: resume || null,  // 🆕 שמירת טקסט קורות חיים
        tags: tagConnections,    // 🆕 חיבור תגיות
        uploadedById,            // 🆕 מי העלה את המועמד
      },
      include: {
        tags: true  // כלול תגיות בתשובה
      }
    })

    return NextResponse.json(candidate, { status: 201 })
  } catch (error) {
    console.error("Error creating candidate:", error)
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    )
  }
}
