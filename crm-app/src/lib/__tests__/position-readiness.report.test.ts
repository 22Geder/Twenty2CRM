// דוח מוכנות משרות להתאמה — קריאה בלבד, רץ רק כשמוגדר READINESS_EMPLOYER או READINESS_IDS.
// שימוש: $env:READINESS_EMPLOYER="שם מעסיק"; npx vitest run src/lib/__tests__/position-readiness.report.test.ts --reporter=verbose
import { describe, expect, it } from 'vitest'
import { assessMatchingReadiness } from '../matching-engine'

const employer = process.env.READINESS_EMPLOYER?.trim()
const ids = process.env.READINESS_IDS?.split(',').map(value => value.trim()).filter(Boolean) ?? []
const enabled = !!employer || ids.length > 0

describe.skipIf(!enabled)('דוח מוכנות משרות (DB אמיתי, קריאה בלבד)', () => {
  it('מדפיס מוכנות לכל משרה ואינו משנה דבר', async () => {
    if (!process.env.DATABASE_URL) {
      try { process.loadEnvFile('.env') } catch { /* .env לא קיים; Prisma ידווח */ }
    }
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    try {
      const rows = await prisma.position.findMany({
        where: ids.length ? { id: { in: ids } } : { employer: { name: { contains: employer!, mode: 'insensitive' } } },
        select: { id: true, title: true, location: true, description: true, requirements: true, keywords: true, workHours: true, transportation: true, active: true, closedAt: true, employer: { select: { name: true } }, tags: { select: { id: true, name: true } } },
        orderBy: { title: 'asc' },
      })
      expect(rows.length, 'לא נמצאו משרות לפרמטרים שניתנו').toBeGreaterThan(0)
      const lines: string[] = [`\n=== מוכנות להתאמה: ${rows.length} משרות ===`]
      let notReady = 0
      for (const row of rows) {
        const readiness = assessMatchingReadiness(row)
        if (!readiness.ready) notReady++
        const geo = readiness.geography.nationwide ? 'ארצי' : readiness.geography.remote ? 'מרחוק' : readiness.geography.measurableCities.join(', ') || '✗ לא מדיד'
        lines.push(
          `${readiness.ready ? 'READY' : 'FIX: '} | ${row.title} | ${row.employer.name} | ${row.active && !row.closedAt ? 'פעילה' : 'לא פעילה'}`,
          `       מקצוע: ${readiness.roleRecognized ? readiness.roleLabels.join(', ') : '✗ לא זוהה'} | עיר (${readiness.geography.radiusKm} ק"מ): ${geo} | דרישות מסומנות: ${readiness.requirementsMarked}/${readiness.requirementsTotal} | כישורים מתויגים: ${readiness.skillTerms.join(', ') || '—'}`,
          ...readiness.issues.map(issue => `       → ${issue}`),
        )
      }
      lines.push(`=== ${rows.length - notReady} מוכנות, ${notReady} לתיקון ===\n`)
      console.log(lines.join('\n'))
    } finally {
      await prisma.$disconnect()
    }
  }, 60_000)
})
