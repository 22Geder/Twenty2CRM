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
    <div className="flex h-screen overflow-hidden" style={{ background: '#EEF2F7' }} dir="rtl">
      {/* Sidebar — part of flex flow, not fixed/overlay */}
      <Sidebar />
      
      {/* Main content — scrolls independently, never under the sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
