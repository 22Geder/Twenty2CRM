export default function ShareAgentPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Share Agent</h1>
        <p className="text-sm text-slate-500">
          ניתוח שיחות גיוס מ-WhatsApp — טעויות, תיקונים וסקריפט עבודה
        </p>
      </div>
      <iframe
        src="/shareagent.html"
        title="TWENTY2 Share Agent"
        className="w-full h-[calc(100vh-10rem)] min-h-[640px] rounded-xl border border-slate-200 bg-black"
      />
    </div>
  )
}
