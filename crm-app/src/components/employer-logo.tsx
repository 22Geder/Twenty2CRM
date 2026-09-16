"use client"

import { useState } from "react"
import { Building2, ImagePlus, Loader2, X } from "lucide-react"
import { isSafeCrmLogoSrc } from "@/lib/employer-logo-url"

const palettes = [
  { from: "#06B6D4", to: "#0891B2" },
  { from: "#6366F1", to: "#4F46E5" },
  { from: "#10B981", to: "#059669" },
  { from: "#F97316", to: "#EA580C" },
  { from: "#A855F7", to: "#7C3AED" },
  { from: "#3B82F6", to: "#2563EB" },
]

function nameToColor(name: string) {
  const idx = (name || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % palettes.length
  return palettes[idx]
}

const sizeMap = {
  sm: "w-11 h-11",
  md: "w-16 h-16",
  lg: "w-20 h-20",
  xl: "w-24 h-24",
} as const

export function EmployerLogo({
  name,
  logo,
  size = "md",
  className = "",
}: {
  name: string
  logo?: string | null
  size?: keyof typeof sizeMap
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = isSafeCrmLogoSrc(logo) ? logo! : null
  const { from, to } = nameToColor(name)
  const initial = (name || "?").trim().charAt(0) || "?"

  return (
    <div
      className={`${sizeMap[size]} rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}
      title={name}
    >
      {src && !failed ? (
        // לוגו פנימי ב-CRM בלבד; נתיב מאומת ב-isSafeCrmLogoSrc
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-1.5 bg-white"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
        >
          {initial ? (
            <span className="text-white font-bold text-lg leading-none">{initial}</span>
          ) : (
            <Building2 className="h-6 w-6 text-white" />
          )}
        </div>
      )}
    </div>
  )
}

export function EmployerLogoUploader({
  name,
  value,
  onChange,
}: {
  name: string
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError("")
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/employers/logo", { method: "POST", body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || typeof data.url !== "string") {
        setError("לא הצלחנו להעלות את הלוגו. נסה PNG / JPG / WEBP עד 2MB.")
        return
      }
      onChange(data.url)
    } catch {
      setError("שגיאה בהעלאת הלוגו")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <EmployerLogo name={name || "לקוח"} logo={value} size="lg" />
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {value ? "החלף לוגו" : "העלה לוגו"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                void handleFile(file)
              }}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
            >
              <X className="h-3 w-3" />
              הסר לוגו
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">לשימוש פנימי ב-CRM בלבד. לא ישותף לאתר או ללקוחות.</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
