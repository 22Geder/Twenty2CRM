"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error?.message)
  }, [error])

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">שגיאה בטעינת הדף</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            אירעה שגיאה בלתי צפויה. אנא נסה שוב.
          </p>
          <div className="flex gap-3">
            <Button onClick={reset}>נסה שוב</Button>
            <Link href="/dashboard">
              <Button variant="outline">חזור ללוח בקרה</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
