import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 📧 Unsubscribe Endpoint - הסרה מרשימת תפוצה
 * 
 * נשלח למועמדים כלינק בתחתית המיילים.
 * GET /api/unsubscribe?email=xxx@xxx.com
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return new NextResponse(
        generateHtmlPage('שגיאה', 'חסר כתובת מייל', 'error'),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // חיפוש המועמד
    const candidate = await prisma.candidate.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!candidate) {
      return new NextResponse(
        generateHtmlPage('לא נמצא', 'כתובת המייל לא נמצאה במערכת שלנו', 'warning'),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // עדכון סטטוס הסרה
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        unsubscribed: true,
        unsubscribedAt: new Date(),
        notes: candidate.notes 
          ? `${candidate.notes}\n---\n🔕 ${new Date().toLocaleDateString('he-IL')} - ביקש הסרה מרשימת התפוצה (Email)`
          : `🔕 ${new Date().toLocaleDateString('he-IL')} - ביקש הסרה מרשימת התפוצה (Email)`
      }
    })

    console.log(`✅ Email unsubscribed: ${candidate.name} (${email})`)

    return new NextResponse(
      generateHtmlPage('הוסרת בהצלחה! ✅', `${candidate.name}, הוסרת מרשימת התפוצה שלנו. לא תקבל/י יותר מיילים מאיתנו.`, 'success'),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )

  } catch (error) {
    console.error("Unsubscribe error:", error)
    return new NextResponse(
      generateHtmlPage('שגיאה', 'אירעה שגיאה. אנא נסה שוב מאוחר יותר.', 'error'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

function generateHtmlPage(title: string, message: string, type: 'success' | 'error' | 'warning'): string {
  const colors = {
    success: { bg: '#d4edda', border: '#28a745', text: '#155724', emoji: '✅' },
    error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24', emoji: '❌' },
    warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404', emoji: '⚠️' }
  }
  
  const c = colors[type]

  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - 2טו-גדר</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: linear-gradient(135deg, #00A8A8 0%, #006666 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 50px;
      max-width: 500px;
      text-align: center;
    }
    .icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      color: ${c.text};
      font-size: 28px;
      margin-bottom: 20px;
    }
    .message-box {
      background: ${c.bg};
      border: 2px solid ${c.border};
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    p {
      color: #333;
      font-size: 18px;
      line-height: 1.6;
    }
    .footer {
      margin-top: 30px;
      color: #666;
      font-size: 14px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #00A8A8;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${c.emoji}</div>
    <h1>${title}</h1>
    <div class="message-box">
      <p>${message}</p>
    </div>
    <div class="footer">
      <p>תודה על ההתעניינות!</p>
      <div class="logo">🏢 2טו-גדר</div>
    </div>
  </div>
</body>
</html>
`
}
