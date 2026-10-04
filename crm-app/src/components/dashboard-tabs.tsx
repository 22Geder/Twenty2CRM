"use client"

import { useState } from "react"
import { BarChart2, Zap, Clock3, BrainCircuit, Target } from "lucide-react"

const TABS = [
  { id: "overview", label: "מבט על", icon: BarChart2 },
  { id: "recruiters", label: "מגייסים", icon: Target },
  { id: "actions", label: "מרכז פעולה", icon: Zap, badge: (alertCount: number) => alertCount > 0 ? alertCount : null },
  { id: "activity", label: "פעילות אחרונה", icon: Clock3 },
  { id: "ai", label: "תובנות AI", icon: BrainCircuit },
]

interface DashboardTabsProps {
  alertCount: number
  overviewContent: React.ReactNode
  recruitersContent: React.ReactNode
  actionsContent: React.ReactNode
  activityContent: React.ReactNode
  aiContent: React.ReactNode
}

export function DashboardTabs({
  alertCount,
  overviewContent,
  recruitersContent,
  actionsContent,
  activityContent,
  aiContent,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const contentMap: Record<string, React.ReactNode> = {
    overview: overviewContent,
    recruiters: recruitersContent,
    actions: actionsContent,
    activity: activityContent,
    ai: aiContent,
  }

  return (
    <div>
      {/* Floating Pill Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950 p-1.5">
          {TABS.map(tab => {
            const Icon = tab.icon
            const badgeCount = tab.badge ? tab.badge(alertCount) : null
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                {badgeCount && (
                  <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive ? "bg-orange-400 text-white" : "bg-red-500 text-white"
                  }`}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content with fade animation */}
      <div key={activeTab} className="animate-in fade-in duration-200">
        {contentMap[activeTab]}
      </div>
    </div>
  )
}
