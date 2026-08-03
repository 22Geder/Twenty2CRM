"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PositionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Position page error:", error)
  }, [error])

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">שגיאה בטעינת המשרה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            אירעה שגיאה בעת טעינת פרטי המשרה. אנא נסה שוב.
          </p>
          {error?.message && (
            <p className="text-xs text-red-500 bg-red-50 p-2 rounded font-mono">
              {error.message}
            </p>
          )}
          <div className="flex gap-3">
            <Button onClick={reset}>נסה שוב</Button>
            <Link href="/dashboard/positions">
              <Button variant="outline">חזור לרשימת משרות</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
