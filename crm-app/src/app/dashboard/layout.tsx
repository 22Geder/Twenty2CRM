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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--app-bg)' }} dir="rtl">
      {/* Sidebar — part of flex flow, not fixed/overlay */}
      <Sidebar />
      
      {/* Main content — scrolls independently, never under the sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative" style={{ background: 'var(--app-bg)' }}>
        {/* רקע לוגו 22JOBS - לוגו יחיד גדול פרוס על כל שטח התוכן, שקוף ועדין, מאחורי הטקסט, מופיע בכל דף של ה-CRM */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.05] z-0"
          style={{
            backgroundImage: "url(/logo-22jobs-clean.png)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            backgroundPosition: "center",
          }}
        />
        <TopNavbar />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10"
          style={{ background: 'transparent' }}
        >
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
