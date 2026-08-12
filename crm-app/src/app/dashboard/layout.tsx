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
    <div className="flex h-screen overflow-hidden" style={{ background: '#F1F5F9' }} dir="rtl">
      {/* Sidebar — part of flex flow, not fixed/overlay */}
      <Sidebar />
      
      {/* Main content — scrolls independently, never under the sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative" style={{ background: '#F1F5F9' }}>
        {/* רקע לוגו הבוט - שקוף, פרוס על כל שטח התוכן בין הצדדים הכחולים, קבוע ומופיע בכל דף של ה-CRM */}
        <div
          className="pointer-events-none absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.06] z-0"
          style={{ backgroundImage: "url(/logo-bot.png)" }}
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
