import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// Force Node.js runtime (not Edge) - bcrypt requires Node.js
export const runtime = 'nodejs'

// 🔒 מספר ניסיונות מקסימלי לפני נעילה
const MAX_LOGIN_ATTEMPTS = 3

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          // תעד ניסיון כושל גם אם המשתמש לא קיים
          try {
            await prisma.loginAttempt.create({
              data: {
                email: credentials.email,
                success: false,
              }
            })
          } catch {}
          throw new Error("Invalid credentials")
        }

        // 🔒 בדוק אם החשבון נעול
        if (user.lockedAt) {
          throw new Error("ACCOUNT_LOCKED")
        }

        // ⛔ בדוק אם המשתמש לא פעיל
        if (user.active === false) {
          throw new Error("ACCOUNT_INACTIVE")
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isCorrectPassword) {
          // עדכן מונה ניסיונות כושלים
          const newFailedAttempts = (user.failedLoginAttempts || 0) + 1
          
          // תעד ניסיון כושל
          try {
            await prisma.loginAttempt.create({
              data: {
                email: credentials.email,
                userId: user.id,
                success: false,
              }
            })
          } catch {}
          
          if (newFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
            // 🔒 נעל את החשבון!
            const lockToken = crypto.randomUUID()
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newFailedAttempts,
                lockedAt: new Date(),
                lockToken: lockToken,
                lockTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 שעות
              }
            })
            
            // 📧 שלח מייל לאדמין עם קישור שחרור
            try {
              await sendLockoutEmail(user.email, user.name, lockToken)
            } catch (emailError) {
              console.error('❌ Failed to send lockout email:', emailError)
            }
            
            throw new Error("ACCOUNT_LOCKED")
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: newFailedAttempts }
            })
            
            const remaining = MAX_LOGIN_ATTEMPTS - newFailedAttempts
            throw new Error(`FAILED_ATTEMPT_${remaining}`)
          }
        }

        // ✅ התחברות מוצלחת - אפס מונה
        const previousLoginAt = user.lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
          },
        })

        // תעד ניסיון מוצלח
        try {
          await prisma.loginAttempt.create({
            data: {
              email: credentials.email,
              userId: user.id,
              success: true,
            }
          })
        } catch {}

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLoginAt: previousLoginAt ? previousLoginAt.toISOString() : null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as any).role,
          lastLoginAt: (user as any).lastLoginAt || null,
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id as string,
            role: token.role as string,
            lastLoginAt: token.lastLoginAt as string | null,
          }
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// 📧 שליחת מייל נעילה לאדמין
async function sendLockoutEmail(lockedEmail: string, lockedName: string, lockToken: string) {
  const nodemailer = await import('nodemailer')
  
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
  if (!process.env.SMTP_USER || !smtpPassword) {
    console.error('❌ SMTP not configured for lockout emails')
    return
  }

  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPassword,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://twenty2crm.up.railway.app'
  const unlockUrl = `${baseUrl}/api/auth/unlock-account?token=${lockToken}`

  await transporter.sendMail({
    from: `"🔒 Twenty2CRM אבטחה" <${process.env.SMTP_USER}>`,
    to: 'office@hr22group.com',
    subject: `🚨 התראת אבטחה - חשבון ננעל: ${lockedEmail}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔒 התראת אבטחה</h1>
          <p style="color: #fecaca; margin: 10px 0 0;">Twenty2CRM מערכת</p>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #dc2626; margin-top: 0;">חשבון ננעל אוטומטית!</h2>
          
          <div style="background: #fef2f2; border-right: 4px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>שם משתמש:</strong> ${lockedName}</p>
            <p style="margin: 5px 0 0;"><strong>אימייל:</strong> ${lockedEmail}</p>
            <p style="margin: 5px 0 0;"><strong>זמן:</strong> ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>
            <p style="margin: 5px 0 0;"><strong>סיבה:</strong> ${MAX_LOGIN_ATTEMPTS} ניסיונות כושלים</p>
          </div>
          
          <p style="color: #374151;">מישהו ניסה להתחבר לחשבון זה ${MAX_LOGIN_ATTEMPTS} פעמים עם סיסמה שגויה. החשבון ננעל אוטומטית להגנה.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${unlockUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: white; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: bold;">
              ✅ שחרר נעילה
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 13px;">הקישור תקף ל-24 שעות בלבד. אם לא את/ה ביקשת - מומלץ לשנות סיסמה מיד.</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 16px 16px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© Twenty2CRM - מערכת אבטחה אוטומטית</p>
        </div>
      </div>
    `,
  })
  
  console.log(`📧 Lockout email sent to office@hr22group.com for account: ${lockedEmail}`)
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
