import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 📥 SMS Webhook - קבלת הודעות SMS נכנסות
 * 
 * Twilio שולח לכאן את כל ההודעות הנכנסות.
 * אם מישהו שולח "1" - מסיר אותו מרשימת התפוצה.
 * 
 * להגדרה ב-Twilio:
 * 1. היכנס ל-Console > Phone Numbers
 * 2. בחר את המספר שלך
 * 3. ב-Messaging > A MESSAGE COMES IN
 * 4. הגדר Webhook URL: https://your-domain.com/api/sms-webhook
 */

export async function POST(request: NextRequest) {
  try {
    // Twilio שולח form-urlencoded
    const formData = await request.formData()
    
    const from = formData.get('From')?.toString() || ''
    const body = formData.get('Body')?.toString().trim() || ''
    
    console.log(`📥 SMS received from ${from}: "${body}"`)

    // נרמול מספר טלפון
    let normalizedPhone = from.replace(/[^0-9]/g, '')
    
    // הסרת קידומת 972 אם קיימת
    if (normalizedPhone.startsWith('972')) {
      normalizedPhone = '0' + normalizedPhone.substring(3)
    }
    
    // בדיקה אם זו בקשת הסרה (1)
    if (body === '1' || body.toLowerCase() === 'stop' || body === 'הסר' || body === 'הסרה') {
      // חיפוש המועמד לפי טלפון
      const candidate = await prisma.candidate.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: { contains: normalizedPhone.slice(-9) } },
            { alternatePhone: normalizedPhone },
            { alternatePhone: { contains: normalizedPhone.slice(-9) } }
          ]
        }
      })

      if (candidate) {
        // עדכון סטטוס הסרה
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            unsubscribed: true,
            unsubscribedAt: new Date(),
            notes: candidate.notes 
              ? `${candidate.notes}\n---\n🔕 ${new Date().toLocaleDateString('he-IL')} - ביקש הסרה מרשימת התפוצה (SMS)`
              : `🔕 ${new Date().toLocaleDateString('he-IL')} - ביקש הסרה מרשימת התפוצה (SMS)`
          }
        })

        console.log(`✅ Unsubscribed: ${candidate.name} (${normalizedPhone})`)

        // תגובה ל-Twilio (TwiML)
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>הוסרת בהצלחה מרשימת התפוצה. לא תקבל/י יותר הודעות מאיתנו. תודה! 🙏</Message>
</Response>`,
          {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          }
        )
      } else {
        console.log(`⚠️ Candidate not found for phone: ${normalizedPhone}`)
        
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>קיבלנו את בקשתך. אם יש לך שאלות, פנה אלינו ישירות.</Message>
</Response>`,
          {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
          }
        )
      }
    }

    // הודעה שאינה בקשת הסרה - שמירה ללוג
    console.log(`📨 Regular SMS from ${from}: ${body}`)

    // אפשר להוסיף כאן לוגיקה לטיפול בהודעות אחרות

    // תגובה ריקה (ללא הודעה חוזרת)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    )

  } catch (error) {
    console.error("SMS Webhook error:", error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    )
  }
}

// GET for Twilio webhook verification
export async function GET() {
  return NextResponse.json({ status: "SMS webhook is active" })
}
