import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

// Temporary endpoint to reset Dor's password
// DELETE THIS FILE after use!

export async function GET(request: NextRequest) {
  const email = 'office@hr22group.com'
  const password = 'avigdor22'
  const name = 'Dor Twito'
  
  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          name: name
        }
      })
      return NextResponse.json({ 
        success: true, 
        message: `Password updated for ${email}. You can now login!` 
      })
    } else {
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      return NextResponse.json({ 
        success: true, 
        message: `User created: ${email}. You can now login!` 
      })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
