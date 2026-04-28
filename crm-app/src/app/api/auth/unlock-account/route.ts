import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// 🔓 API לשחרור נעילת חשבון דרך קישור מהמייל
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  
  if (!token) {
    return new NextResponse(renderHTML('❌ שגיאה', 'קישור לא תקין - חסר טוקן.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  try {
    // מצא את המשתמש עם הטוקן
    const user = await prisma.user.findUnique({
      where: { lockToken: token }
    })

    if (!user) {
      return new NextResponse(renderHTML('❌ קישור לא תקין', 'הקישור לא נמצא או כבר שומש.', false), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // בדוק תוקף הטוקן
    if (user.lockTokenExpiresAt && new Date() > user.lockTokenExpiresAt) {
      return new NextResponse(renderHTML('⏰ קישור פג תוקף', 'הקישור פג תוקף. יש ליצור קשר עם מנהל המערכת.', false), {
        status: 410,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // 🔓 שחרר את הנעילה!
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lockedAt: null,
        lockToken: null,
        lockTokenExpiresAt: null,
        failedLoginAttempts: 0,
      }
    })

    console.log(`🔓 Account unlocked: ${user.email} by admin email link`)

    return new NextResponse(
      renderHTML(
        '✅ החשבון שוחרר בהצלחה!', 
        `החשבון של <strong>${user.name}</strong> (${user.email}) שוחרר מנעילה.<br/>המשתמש יכול כעת להתחבר מחדש.`,
        true
      ), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
  } catch (error) {
    console.error('❌ Unlock error:', error)
    return new NextResponse(renderHTML('❌ שגיאה', 'אירעה שגיאה בלתי צפויה. נסה שוב.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}

function renderHTML(title: string, message: string, success: boolean): string {
  const bgColor = success ? '#059669' : '#dc2626'
  const bgGradient = success 
    ? 'linear-gradient(135deg, #059669, #047857)' 
    : 'linear-gradient(135deg, #dc2626, #991b1b)'
  
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Twenty2CRM</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          background: linear-gradient(135deg, #1e293b, #0f172a);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          background: ${bgGradient};
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 { color: white; font-size: 28px; }
        .body { padding: 30px; text-align: center; }
        .body p { color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #00A8A8, #00D4D4);
          color: white;
          padding: 14px 32px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: bold;
          font-size: 16px;
          margin-top: 10px;
        }
        .footer { 
          background: #f3f4f6; 
          padding: 15px; 
          text-align: center; 
          color: #9ca3af; 
          font-size: 12px; 
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="body">
          <p>${message}</p>
          <a href="/login" class="btn">🔑 חזור לדף ההתחברות</a>
        </div>
        <div class="footer">
          <p>© Twenty2CRM - מערכת אבטחה</p>
        </div>
      </div>
    </body>
    </html>
  `
}
