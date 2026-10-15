import type { EvidenceMatch, RequirementCheck, SourcedEvidence } from '@/lib/matching-engine'

export type MatchingEvidenceView = {
  engineVersion?: string
  matchStatus?: EvidenceMatch['status']
  requirementChecks?: RequirementCheck[]
  evidence?: SourcedEvidence[]
  coverage?: EvidenceMatch['coverage']
  semanticReview?: EvidenceMatch['semanticReview']
  locationDetails?: EvidenceMatch['location']
  scoreBreakdown?: Partial<EvidenceMatch['breakdown']>
}

const STATUS_LABELS = {
  matched: 'התאמה מבוססת מידע', review: 'דורש בירור לפני הפניה',
  insufficient_evidence: 'חסר מידע מקצועי', ineligible: 'קיימת מגבלה להפניה',
}

export function MatchingStatusLabel({ status }: { status?: EvidenceMatch['status'] }) {
  return <span>{status ? STATUS_LABELS[status] : 'ציון עזר להתאמה'}</span>
}

export function MatchingEvidenceDetails({ match }: { match: MatchingEvidenceView }) {
  const components = [
    { key: 'role', label: 'תפקיד מתועד', max: 35 },
    { key: 'skills', label: 'כישורים', max: 25 },
    { key: 'requirements', label: 'דרישות', max: 25 },
    { key: 'location', label: 'מיקום', max: 15 },
  ] as const
  const checks = match.requirementChecks ?? []
  const sources = { resume: 'קורות חיים', currentTitle: 'תפקיד נוכחי', skills: 'כישורים מובנים', tags: 'תגיות — לא אימות' }
  const evidence = (match.evidence ?? []).filter(item => item.assertion === 'positive' && item.source !== 'tags')
  return (
    <section className="space-y-4 rounded-xl border border-border bg-background p-4 text-sm text-foreground" dir="rtl" aria-label="ראיות ופירוט התאמה">
      <div className="space-y-1">
        <h3 className="font-semibold"><MatchingStatusLabel status={match.matchStatus} /></h3>
        <p className="text-xs text-muted-foreground">ציון עזר מתוך 100, לא הסתברות קבלה. נדרשת בדיקת מגייס לפני הפניה.</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {components.map(component => (
          <div key={component.key} className="rounded-lg bg-muted p-2">
            <dt className="text-xs text-muted-foreground">{component.label}</dt>
            <dd className="mt-1 font-semibold tabular-nums" dir="ltr">{match.scoreBreakdown?.[component.key] ?? 0} / {component.max}</dd>
          </div>
        ))}
      </dl>
      {match.locationDetails && <p className="break-words text-xs">{match.locationDetails.reason}</p>}
      {match.semanticReview && <div className="space-y-2">
        <h4 className="font-semibold">קריאה סמנטית משלימה</h4>
        <p className="text-xs text-muted-foreground">{match.semanticReview.message}</p>
        {match.semanticReview.links.length > 0 && <ul className="space-y-3">
          {match.semanticReview.links.map((link, index) => <li key={index} className="space-y-1 border-s-2 border-border ps-3 break-words">
            <p className="text-xs text-muted-foreground">במידע המקצועי</p>
            <blockquote>{link.candidate.quote}</blockquote>
            <p className="text-xs text-muted-foreground">מול המשרה</p>
            <blockquote>{link.position.quote}</blockquote>
          </li>)}
        </ul>}
      </div>}
      {checks.length > 0 && (
        <div>
          <h4 className="mb-2 font-semibold">בדיקת דרישות</h4>
          <ul className="space-y-3">
            {checks.map((check, index) => (
              <li key={`${check.source}:${check.start}:${index}`} className="break-words border-s-2 border-border ps-3">
                <p className="font-semibold">{check.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {check.importance === 'mandatory' ? 'חובה' : check.importance === 'preferred' ? 'יתרון' : 'חשיבות לא צוינה'}
                  {' · '}{check.status === 'met' ? 'נמצאה עדות' : check.status === 'contradicted' ? 'נמצאה סתירה' : check.status === 'not_scored' ? 'לא נוקד' : 'לא אומת'}
                </p>
                <p className="mt-1 text-xs">{check.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {evidence.length > 0 && (
        <details className="rounded-lg border border-border p-3">
          <summary className="min-h-11 cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-ring">ציטוטים מהמידע המקורי ({evidence.length})</summary>
          <ul className="mt-2 space-y-3">
            {evidence.map((item, index) => (
              <li key={`${item.source}:${item.start}:${index}`}>
                <p className="text-xs text-muted-foreground">{item.term} · {sources[item.source]}</p>
                <blockquote className="mt-1 break-words border-s-2 border-border ps-3">{item.quote}</blockquote>
              </li>
            ))}
          </ul>
        </details>
      )}
      {match.coverage && (
        <p className="text-xs text-muted-foreground">
          אינדוקס מקומי של הטקסט המלא, לא הבטחה להבנת כל סעיף · {match.coverage.candidateCharacters.toLocaleString('he-IL')} תווי מועמד
          {' · '}{match.coverage.positionCharacters.toLocaleString('he-IL')} תווי משרה
          {match.coverage.resumeQuality === 'missing' && ' · טקסט קורות החיים חסר'}
          {match.coverage.resumeQuality === 'limited' && ' · טקסט קורות החיים קצר'}
          {match.coverage.resumeQuality === 'unreadable' && ' · נדרש חילוץ מחדש של קורות החיים'}
        </p>
      )}
    </section>
  )
}