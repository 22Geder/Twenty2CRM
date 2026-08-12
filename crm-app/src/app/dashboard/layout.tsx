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
          style={{
            background: 'linear-gradient(180deg, #0F172A 0%, #16213e 100%)',
            backgroundImage: 'url(/avigdor-lion.png)',
            backgroundRepeat: 'repeat',
            backgroundSize: '340px 340px',
            backgroundBlendMode: 'luminosity',
          }}
        >
          {/* שכבת כהות מעל התבנית החוזרת של האריה, כדי לשמור על ניגודיות לתוכן */}
          <div className="pointer-events-none absolute inset-0 z-0" style={{ background: 'rgba(13,21,38,0.94)' }} />
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
