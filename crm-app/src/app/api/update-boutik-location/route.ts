import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/update-boutik-location - עדכון מיקום משרות בוטיק הפיתה לכלול אשדוד
export async function GET() {
  try {
    // מציאת המעסיק
    const employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: "בוטיק הפיתה", mode: "insensitive" } },
          { email: { contains: "boutik-hapita", mode: "insensitive" } },
          { email: { contains: "butik-hapita", mode: "insensitive" } },
        ]
      }
    })

    if (!employer) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 })
    }

    // עדכון כל המשרות של בוטיק הפיתה לכלול אשדוד
    const updatedPositions = await prisma.position.updateMany({
      where: { employerId: employer.id },
      data: {
        location: "אשדוד, חיפה והסביבה"
      }
    })

    // קבלת רשימת המשרות המעודכנות
    const positions = await prisma.position.findMany({
      where: { employerId: employer.id },
      select: { id: true, title: true, location: true }
    })

    return NextResponse.json({
      success: true,
      employer: employer.name,
      updatedCount: updatedPositions.count,
      positions: positions,
      message: `✅ עודכנו ${updatedPositions.count} משרות - עכשיו יוצעו גם למועמדים מאשדוד!`
    })

  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json(
      { error: "Failed to update", details: String(error) },
      { status: 500 }
    )
  }
}
