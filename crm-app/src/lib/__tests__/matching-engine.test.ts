import { describe, expect, it } from 'vitest'
import {
  assessMatchingReadiness, compareEvidenceMatches, curatedSkillTerms, evaluateCandidatePosition, evaluatePreparedMatch, isSuggestedMatch,
  prepareMatchingCandidate, prepareMatchingPosition, type MatchingCandidate, type MatchingPosition,
} from '../matching-engine'

const candidate: MatchingCandidate = { city: 'תל אביב', currentTitle: 'מחסנאי', resume: 'מגורים: תל אביב\n2017–2025 מחסנאי. ליקוט הזמנות, ספירות מלאי, Priority, Excel', tags: [] }
const job: MatchingPosition = { title: 'מחסנאי', location: 'תל אביב', description: 'ניהול מלאי במחסן', requirements: 'ניסיון בפריוריטי - חובה\nאקסל - יתרון', active: true }

describe('דירוג מקצועי ולא עיר בלבד', () => {
  it('תפקיד נכון בעיר קרובה קודם לתפקיד לא קשור באותה עיר', () => {
    const good = evaluateCandidatePosition(candidate, { ...job, location: 'רמת גן' })
    const wrong = evaluateCandidatePosition(candidate, { title: 'מפתח Java', location: 'תל אביב', requirements: 'ניסיון ב-Java - חובה' })
    expect(isSuggestedMatch(good)).toBe(true)
    expect(isSuggestedMatch(wrong)).toBe(false)
    expect(compareEvidenceMatches(good, wrong)).toBeLessThan(0)
    expect(good.score).toBeGreaterThan(wrong.score)
  })

  it.each(['אילת', 'חיפה', 'ירושלים', 'באר שבע', null])('משרה ארצית אינה נפסלת בשל עיר %s', city => {
    const result = evaluateCandidatePosition({ ...candidate, city }, { ...job, location: 'כל הארץ' })
    expect(result.location.isNationwide).toBe(true)
    expect(result.location.eligible).toBe(true)
    expect(isSuggestedMatch(result)).toBe(true)
  })

  it('ארצית אינה פוטרת מהתאמה מקצועית', () => {
    const result = evaluateCandidatePosition(candidate, { title: 'מהנדס חשמל', location: 'ארצי' })
    expect(result.location.eligible).toBe(true)
    expect(result.status).toBe('insufficient_evidence')
  })

  it('משרת מכירות שטח מקומית אינה ארצית אוטומטית', () => {
    expect(evaluateCandidatePosition({ city: 'אילת', currentTitle: 'מכירות שטח' }, { title: 'מכירות שטח', location: 'חיפה' }).status).toBe('ineligible')
  })

  it.each([{ active: false }, { closedAt: new Date('2026-01-01') }])('משרה לא פתוחה אינה מומלצת: %o', closed => {
    expect(evaluateCandidatePosition(candidate, { ...job, ...closed }).status).toBe('ineligible')
  })

  it('בודק קורות חיים גם ללא תגיות ובלי השמטת סוף המסמך', () => {
    const resume = 'מידע נוסף\n'.repeat(1200) + '\nמחסנאי עם ניסיון באקסל ובפריוריטי'
    const result = evaluateCandidatePosition({ resume, city: 'תל אביב', tags: [] }, job)
    expect(result.roleMatch).toBe('direct')
    expect(result.coverage.candidateCharacters).toBe(resume.length)
    expect(result.evidence.some(item => item.start > 10000)).toBe(true)
    expect(result.coverage.candidateTextTruncated).toBe(false)
  })

  it('לא מנפח ציון בכפילויות', () => {
    const one = evaluateCandidatePosition(candidate, job)
    const many = evaluateCandidatePosition({ ...candidate, resume: candidate.resume!.repeat(5), tags: [{ name: 'מחסנאי' }, { name: 'מחסנאי' }] }, { ...job, requirements: `${job.requirements}\n${job.requirements}` })
    expect(many.score).toBe(one.score)
  })

  it('שומר סדר דטרמיניסטי ומפריד חוסר מידע מכשל', () => {
    const a = evaluateCandidatePosition({}, job)
    const b = evaluateCandidatePosition({}, job)
    expect(a).toEqual(b)
    expect(a.eligible).toBeNull()
    expect(a.status).toBe('insufficient_evidence')
    expect(a.shouldProceed).toBe(false)
  })
})

describe('דרישות סף אינן תגיות או השערות', () => {
  it.each(['מלגזן', 'ג׳ירפה', 'היגש', 'ניסיון בהפעלת מלגזה'])('מיומנות %s לא מוכיחה רישיון', resume => {
    const result = evaluateCandidatePosition({ ...candidate, resume, currentTitle: 'מלגזן' }, { title: 'מלגזן', location: 'תל אביב', requirements: 'רישיון מלגזה - חובה' })
    expect(result.requirements[0].status).toBe('unknown')
    expect(result.status).toBe('review')
  })

  it('רישיון חסר שונה מרישיון שנשלל במפורש', () => {
    const position = { title: 'מלגזן', location: 'תל אביב', requirements: 'רישיון מלגזה - חובה' }
    const unknown = evaluateCandidatePosition({ ...candidate, currentTitle: 'מלגזן' }, position)
    const denied = evaluateCandidatePosition({ ...candidate, currentTitle: 'מלגזן', resume: 'ללא רישיון מלגזה' }, position)
    expect(unknown.eligible).toBeNull()
    expect(denied.eligible).toBe(false)
    expect(denied.requirements[0].status).toBe('contradicted')
  })

  it('שלילה של יתרון אינה פוסלת', () => {
    const result = evaluateCandidatePosition({ ...candidate, resume: 'מחסנאי. ללא רישיון מלגזה' }, { ...job, requirements: 'רישיון מלגזה - יתרון' })
    expect(result.eligible).toBe(true)
  })

  it('תגית מיובאת אינה הוכחה לתעודה או רישיון', () => {
    const result = evaluateCandidatePosition({ ...candidate, tags: [{ name: 'רישיון מלגזה' }] }, { ...job, requirements: 'רישיון מלגזה - חובה' })
    expect(result.requirements[0].status).toBe('unknown')
  })

  it.each(['לומד לתואר ראשון', 'סטודנט לתואר ראשון', 'אוניברסיטת חיפה', 'חשמלאי מוסמך'])('לא ממציא תואר שהושלם: %s', resume => {
    const result = evaluateCandidatePosition({ city: 'תל אביב', currentTitle: 'בנקאי', resume }, { title: 'בנקאי', location: 'תל אביב', requirements: 'תואר אקדמי - חובה' })
    expect(result.requirements[0].status).toBe('unknown')
    expect(result.shouldProceed).toBe(false)
  })

  it('תואר ראשון מתועד מספק תואר כללי, לא תואר פיננסי', () => {
    const qualified = { city: 'תל אביב', currentTitle: 'בנקאי', resume: 'השכלה: תואר ראשון במדעי המחשב, 2020' }
    const result = evaluateCandidatePosition(qualified, { title: 'בנקאי', location: 'תל אביב', requirements: 'תואר אקדמי - חובה' })
    expect(result.requirements[0].status).toBe('met')
    expect(evaluateCandidatePosition(qualified, { title: 'בנקאי', location: 'תל אביב', requirements: 'תואר פיננסי - חובה' }).requirements[0].status).toBe('unknown')
  })

  it('לא מסנן בנקאי כשלא נדרש תואר', () => {
    expect(evaluateCandidatePosition({ city: 'תל אביב', currentTitle: 'בנקאי' }, { title: 'בנקאי', location: 'תל אביב' }).status).toBe('matched')
  })

  it('שומר דרישה שאינה נתמכת במילון כלא ידועה', () => {
    const result = evaluateCandidatePosition(candidate, { ...job, requirements: 'הסמכת מתקן ספציפי - חובה' })
    expect(result.requirements[0].text).toBe('הסמכת מתקן ספציפי - חובה')
    expect(result.requirements[0].status).toBe('unknown')
    expect(result.coverage.unsupportedRequirements).toBe(1)
  })

  it('ראיות סותרות לא הופכות לאישור', () => {
    const result = evaluateCandidatePosition({ ...candidate, resume: 'רישיון מלגזה\nאין רישיון מלגזה' }, { ...job, requirements: 'רישיון מלגזה - חובה' })
    expect(result.requirements[0].status).toBe('unknown')
  })

  it('או בין דרישות אינו וגם', () => {
    const result = evaluateCandidatePosition(candidate, { ...job, requirements: 'Priority או SAP - חובה' })
    expect(result.requirements[0].status).toBe('met')
    expect(evaluateCandidatePosition(candidate, { ...job, requirements: 'Priority וגם SAP - חובה' }).requirements[0].status).toBe('unknown')
  })

  it('מפריד חובה ויתרון באותה שורה ומכבד כותרת דרישות חובה', () => {
    const result = evaluateCandidatePosition(candidate, { ...job, requirements: 'רישיון מלגזה - חובה, Excel - יתרון' })
    expect(result.requirements.map(item => item.importance)).toEqual(['mandatory', 'preferred'])
    expect(result.status).toBe('review')
    expect(evaluateCandidatePosition(candidate, { ...job, requirements: 'דרישות חובה:\nרישיון מלגזה' }).requirements[0].importance).toBe('mandatory')
  })

  it('אזכור כישור אינו מאמת תנאי נוסף לא מפורש במילון', () => {
    const result = evaluateCandidatePosition(candidate, { ...job, requirements: 'ניסיון ב-Priority עם הרשאת מנהל מאושרת - חובה' })
    expect(result.requirements[0].status).toBe('unknown')
  })

  it('ניסיון כללי אינו שנות ניסיון רלוונטי', () => {
    const result = evaluateCandidatePosition({ ...candidate, resume: 'מחסנאי\n20 שנות ניסיון במכירות', yearsOfExperience: 20 }, { ...job, requirements: '5 שנות ניסיון במחסנאות - חובה' })
    expect(result.requirements[0].status).toBe('unknown')
  })

  it('תאריכים רלוונטיים חופפים אינם נספרים פעמיים', () => {
    const result = evaluateCandidatePosition({ ...candidate, resume: '01/2020–01/2023 מחסנאי\n01/2021–01/2024 מחסנאי' }, { ...job, requirements: '5 שנות ניסיון במחסנאות - חובה' }, { asOf: new Date('2026-01-01') })
    expect(result.requirements[0].status).toBe('unknown')
    expect(evaluateCandidatePosition({ ...candidate, resume: '01/2020–01/2024 מחסנאי' }, { ...job, requirements: '3 שנות ניסיון במחסנאות - חובה' }, { asOf: new Date('2026-01-01') }).requirements[0].status).toBe('met')
  })
})

describe('בטיחות, כיסוי וביצועים', () => {
  it('שם, דירוג ופרטי קשר אינם כישורים', () => {
    expect(evaluateCandidatePosition({ name: 'מחסנאי', resume: 'מחסנאי\nטלפון: 0500000000', city: 'תל אביב' }, job).professionalEvidence).toBe(false)
    expect(evaluateCandidatePosition({ city: 'תל אביב', resume: 'מגורים: תל אביב\n0500000000' }, job).professionalEvidence).toBe(false)
  })

  it('קורות חיים לא קריאים מסומנים ולא מקבלים ראיות מתוך שברי טקסט', () => {
    const result = evaluateCandidatePosition({ city: 'תל אביב', resume: '\uFFFD'.repeat(120) + 'מחסנאי' }, job)
    expect(result.coverage.resumeQuality).toBe('unreadable')
    expect(result.professionalEvidence).toBe(false)
  })

  it('דרישות מאפיינים אישיים אינן מנוקדות', () => {
    const result = evaluateCandidatePosition(candidate, { ...job, requirements: 'גיל 25-35\nאישיות חרוצה' })
    expect(result.requirements.every(check => check.status === 'not_scored')).toBe(true)
  })

  it('כל ציטוט מצביע למקור המדויק', () => {
    const result = evaluateCandidatePosition(candidate, job)
    for (const item of result.evidence) {
      const source = candidate[item.source]
      expect(typeof source).toBe('string')
      expect((source as string).slice(item.start, item.end)).toBe(item.quote)
    }
    expect(Object.values(result.breakdown).reduce((sum, value) => sum + value, 0)).toBe(result.score)
  })

  it('פרופיל מוכן מאפשר סריקה חוזרת של כל המשרות ללא שינוי קלט', () => {
    const frozen = Object.freeze({ ...candidate, tags: Object.freeze([]) })
    const prepared = prepareMatchingCandidate(frozen)
    const position = prepareMatchingPosition(job)
    const expected = evaluatePreparedMatch(prepared, position)
    for (let i = 0; i < 250; i++) {
      const result = evaluatePreparedMatch(prepared, position)
      expect(result).toEqual(expected)
      expect(Number.isFinite(result.score)).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    }
  })
})

describe('מילות מפתח שתויגו במשרה הופכות לראיות כישור', () => {
  const tagged: MatchingPosition = {
    ...job, keywords: ['מסופון', 'ניהול צוות', 'קמעונאות', 'משרה מלאה', 'יחסי אנוש', 'EMG', 'UMI_AVIS_2026_09_17', 'תל אביב', '40 ₪', 'ועד עובדים', 'ספירות מלאי', 'Office'],
    tags: [{ name: 'שרינקים' }, { name: 'תודעת שירות' }],
  }

  it('מסנן תנאים, מעסיקים, ערים ומזהים ושומר כישורים אמיתיים בלבד', () => {
    expect(curatedSkillTerms(tagged)).toEqual(['ניהול צוות', 'שרינקים'])
  })

  it('כישור מתויג שנמצא במקור מעלה את ציון הכישורים ומופיע כראיה', () => {
    const withTags = evaluateCandidatePosition({ ...candidate, resume: `${candidate.resume}\nעבודה עם שרינקים וניהול צוות של 4 עובדים` }, tagged)
    const missing = evaluateCandidatePosition(candidate, tagged)
    expect(withTags.breakdown.skills).toBeGreaterThan(missing.breakdown.skills)
    expect(withTags.matchingTerms).toEqual(expect.arrayContaining(['שרינקים', 'ניהול צוות', 'בקרת מלאי']))
    expect(withTags.evidence.some(item => item.quote === 'שרינקים' && item.source === 'resume')).toBe(true)
  })

  it('כישור מתויג שנשלל במקור אינו נספר', () => {
    const result = evaluateCandidatePosition({ ...candidate, resume: `${candidate.resume}\nללא ניסיון בניהול צוות` }, { ...job, keywords: ['ניהול צוות'] })
    expect(result.matchingTerms).not.toContain('ניהול צוות')
  })
})

describe('מוכנות משרה להתאמה (בעת העלאה/עריכה)', () => {
  it('משרה מלאה מוכנה: מקצוע, עיר מדידה ודרישות מסומנות', () => {
    const readiness = assessMatchingReadiness({ ...job, keywords: ['שרינקים', 'משרה מלאה'] })
    expect(readiness).toMatchObject({ ready: true, roleRecognized: true, roleLabels: ['מחסנאות'], requirementsTotal: 2, requirementsMarked: 2, skillTerms: ['שרינקים'], issues: [] })
    expect(readiness.geography).toMatchObject({ ok: true, measurableCities: ['תל אביב'], nationwide: false, radiusKm: 12 })
  })

  it('מדווח בדיוק מה חסר בלי לפסול את המשרה', () => {
    const readiness = assessMatchingReadiness({ title: 'סג/נית אחראי', location: 'מרכז שירות (אזור – לפרט בתיאום)', requirements: 'ניסיון בתחום\nיחסי אנוש טובים' })
    expect(readiness.ready).toBe(false)
    expect(readiness.roleRecognized).toBe(false)
    expect(readiness.geography.ok).toBe(false)
    expect(readiness.requirementsMarked).toBe(0)
    expect(readiness.issues).toHaveLength(3)
    expect(readiness.issues.join(' ')).toMatch(/מקצוע/)
    expect(readiness.issues.join(' ')).toMatch(/עיר/)
    expect(readiness.issues.join(' ')).toMatch(/חובה\/יתרון/)
  })

  it('משרה ארצית או מרחוק נחשבת מדידה גם בלי עיר', () => {
    expect(assessMatchingReadiness({ ...job, location: 'פריסה ארצית' }).geography).toMatchObject({ ok: true, nationwide: true })
    expect(assessMatchingReadiness({ ...job, location: 'עבודה מהבית' }).geography).toMatchObject({ ok: true, remote: true })
    expect(assessMatchingReadiness({ ...job, location: 'בני דרום - שמעון גרינבוים 1' }).geography).toMatchObject({ ok: true, measurableCities: ['בני דרום'] })
  })
})