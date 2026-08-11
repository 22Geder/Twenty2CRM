import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { TopNavbar } from "@/components/top-navbar"
import { Sidebar } from "@/components/sidebar"

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
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Left sidebar - hidden on mobile */}
      <Sidebar />
      
      {/* Main content area - shifts right to make room for sidebar on desktop */}
      <div className="lg:ml-[240px] flex flex-col min-h-screen transition-all duration-300">
        <TopNavbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
