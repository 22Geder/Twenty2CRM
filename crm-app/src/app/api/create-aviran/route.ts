import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

// Temporary endpoint to create Aviran Panker user
// DELETE THIS FILE after use!

export async function GET(request: NextRequest) {
  const email = '22geder@gmail.com'
  const password = 'aviran22'
  const name = 'אבירן פנקר'
  
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
          name: name,
          active: true
        }
      })
      return NextResponse.json({ 
        success: true, 
        message: `Password reset for ${email}. New password: ${password}` 
      })
    } else {
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'RECRUITER'
        }
      })
      return NextResponse.json({ 
        success: true, 
        message: `User created: ${email} / ${password}. Login at /login` 
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
