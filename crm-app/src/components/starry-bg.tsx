import React from "react"

// ✨ רקע דקורטיבי של נקודות תכלת מרחפות ומנצנצות - מחייה את הרקע הכחול של הפאנלים.
// הנקודות נוצרות דטרמיניסטית (seed קבוע) כדי למנוע אי-התאמה בין השרת ללקוח (hydration).

function seededDots(count: number) {
  // מחולל פסאודו-אקראי דטרמיניסטי (LCG) - אותה תוצאה בשרת ובלקוח
  let seed = 20220812
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  return Array.from({ length: count }, () => {
    const size = 1.5 + rnd() * 2.5
    return {
      top: `${(rnd() * 100).toFixed(2)}%`,
      left: `${(rnd() * 100).toFixed(2)}%`,
      size: `${size.toFixed(2)}px`,
      twinkleDur: `${(2.5 + rnd() * 4).toFixed(2)}s`,
      driftDur: `${(9 + rnd() * 12).toFixed(2)}s`,
      delay: `${(rnd() * 6).toFixed(2)}s`,
      bright: rnd() > 0.72,
      hue: rnd(),
    }
  })
}

const DOTS = seededDots(46)

// פלטת ברירת מחדל - תכלת עדין (כמו שהיה)
const DEFAULT_PALETTE: { dot: string; glow: string }[] = [
  { dot: "#38BDF8", glow: "rgba(56,189,248,0.5)" },
]

export function StarryBg({
  count = 46,
  palette,
}: {
  count?: number
  // פלטת צבעים עדינה לנקודות; אם לא סופקה - תכלת כמו קודם
  palette?: { dot: string; glow: string }[]
}) {
  const dots = count === 46 ? DOTS : DOTS.slice(0, count)
  const colors = palette && palette.length > 0 ? palette : DEFAULT_PALETTE
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
      {dots.map((d, i) => {
        const c = colors[Math.floor(d.hue * colors.length) % colors.length]
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              top: d.top,
              left: d.left,
              width: d.size,
              height: d.size,
              background: c.dot,
              boxShadow: d.bright
                ? `0 0 6px 1px ${c.glow}`
                : `0 0 4px 1px ${c.glow}`,
              opacity: d.bright ? 0.95 : 0.7,
              animation: `t22-twinkle ${d.twinkleDur} ease-in-out ${d.delay} infinite, t22-drift ${d.driftDur} ease-in-out ${d.delay} infinite`,
            }}
          />
        )
      })}
    </div>
  )
}
