import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { TopNavbar } from "@/components/top-navbar"
import { Sidebar } from "@/components/sidebar"
import { AvigdorAiPanel } from "@/components/avigdor-ai-panel"

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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        <TopNavbar />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 relative"
          style={{ background: '#EEF2F7' }}
        >
          {/* רקע אריה גדול ושקוף - מיתוג 22JOBS מאחורי כל התוכן, בדיוק כמו בדוגמה */}
          <div
            className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 w-[80%] max-w-[820px] aspect-square bg-center bg-contain bg-no-repeat opacity-[0.14] z-0"
            style={{ backgroundImage: "url(/avigdor-lion.png)" }}
          />
          <div className="max-w-[1400px] mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>

      {/* פאנל AI פנימי - אביגדור, זמין מכל עמוד */}
      <AvigdorAiPanel />
    </div>
  )
}
