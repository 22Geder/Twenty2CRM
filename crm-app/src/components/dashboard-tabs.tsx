"use client"

import { useState } from "react"
import { BarChart2, Zap, Clock3, BrainCircuit } from "lucide-react"

const TABS = [
  { id: "overview", label: "מבט על", icon: BarChart2 },
  { id: "actions", label: "מרכז פעולה", icon: Zap, badge: (alertCount: number) => alertCount > 0 ? alertCount : null },
  { id: "activity", label: "פעילות אחרונה", icon: Clock3 },
  { id: "ai", label: "תובנות AI", icon: BrainCircuit },
]

interface DashboardTabsProps {
  alertCount: number
  overviewContent: React.ReactNode
  actionsContent: React.ReactNode
  activityContent: React.ReactNode
  aiContent: React.ReactNode
}

export function DashboardTabs({
  alertCount,
  overviewContent,
  actionsContent,
  activityContent,
  aiContent,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const contentMap: Record<string, React.ReactNode> = {
    overview: overviewContent,
    actions: actionsContent,
    activity: activityContent,
    ai: aiContent,
  }

  return (
    <div>
      {/* Floating Pill Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center bg-white rounded-2xl shadow-md border border-slate-200/80 p-1.5 gap-1">
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
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
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
