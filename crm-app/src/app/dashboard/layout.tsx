import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { TopNavbar } from "@/components/top-navbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100" dir="rtl">
      <TopNavbar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
