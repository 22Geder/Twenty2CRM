// Verify FREESBEE positions: tag count >= 40 AND city tag present
import { buildFreesbeeTags } from '../src/lib/freesbee-tags'

type Variant = 'SALES' | 'PRODUCT'
type Brand = 'רנו' | "צ'רי" | 'ניסאן' | 'XPENG'

const positions: Array<{
  label: string
  role: Variant
  brand: Brand
  city: string
  isUrgent?: boolean
  isDiscreet?: boolean
  extraTags?: string[]
}> = [
  { label: 'Renault Netanya (Eden)',          role: 'SALES',   brand: 'רנו',    city: 'נתניה' },
  { label: 'Chery Sorek (Odelle, discreet)',  role: 'SALES',   brand: "צ'רי",  city: 'שורק',         isDiscreet: true, extraTags: ['דיסקרטי'] },
  { label: 'Nissan Raanana (Odelle)',         role: 'SALES',   brand: 'ניסאן',  city: 'רעננה' },
  { label: 'Chery Modiin (Odelle)',           role: 'SALES',   brand: "צ'רי",  city: 'מודיעין' },
  { label: 'Chery Ashdod (Odelle, urgent)',   role: 'SALES',   brand: "צ'רי",  city: 'אשדוד',        isUrgent: true,   extraTags: ['דחוף'] },
  { label: 'XPENG Sorek RLZ (Shahd)',         role: 'SALES',   brand: 'XPENG',  city: 'ראשון לציון',  extraTags: ['שורק', 'מומחה עסקה'] },
  { label: 'XPENG Herzliya Sales (Shahd)',    role: 'SALES',   brand: 'XPENG',  city: 'הרצליה',       extraTags: ['מומחה עסקה'] },
  { label: 'XPENG Herzliya Product (Shahd)',  role: 'PRODUCT', brand: 'XPENG',  city: 'הרצליה',       extraTags: ['מומחה מוצר', 'יועץ רכב'] },
]

let allOk = true
for (const p of positions) {
  const tags = buildFreesbeeTags({
    role: p.role,
    brand: p.brand,
    city: p.city,
    isDiscreet: p.isDiscreet,
    isUrgent: p.isUrgent,
    extraTags: p.extraTags,
  })
  const cityIn = tags.includes(p.city)
  const enough = tags.length >= 40
  const ok = enough && cityIn
  if (!ok) allOk = false
  console.log(
    `[${ok ? 'OK  ' : 'FAIL'}] ${p.label.padEnd(40)} | tags=${String(tags.length).padStart(3)} | city='${p.city}' ${cityIn ? 'present' : 'MISSING'}`
  )
}

console.log('\n' + (allOk ? 'ALL PASS - every position has >=40 tags AND city tag present' : 'SOME FAILED'))
process.exit(allOk ? 0 : 1)
