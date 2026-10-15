import { describe, expect, it } from 'vitest'
import { createMatchingTextIndex, extractMatchingConcepts, findTermEvidence, getMatchingRoleFamilies, matchingTermsEquivalent, normalizeMatchingText } from '../matching-text'

describe('מונחים מקצועיים וגבולות מילים', () => {
  it.each([
    ['מחסנאית', 'warehouse worker'], ['מלקט', 'order picker'], ['פריוריטי', 'Priority'],
    ['אקסל', 'Excel'], ['יועץ שירות מוסך', 'service advisor'], ['מנהל/ת חשבונות', 'bookkeeper'],
    ['חשבת שכר', 'payroll specialist'], ['מכירות שטח', 'outside sales'], ['נציגת שירות', 'customer service'],
    ['ג׳ירפה', 'reach truck'], ['רישיון C1', 'c1 license'], ['מְחַסְנָאִי', 'מחסנאי'],
  ])('מזהה שקילות מפורשת: %s / %s', (left, right) => {
    expect(matchingTermsEquivalent(left, right)).toBe(true)
    expect(findTermEvidence(`ניסיון: ${left}`, right)?.assertion).toBe('positive')
  })

  it.each([
    ['JavaScript', 'Java'], ['NoSQL', 'SQL'], ['מנהג', 'נהג'], ['C++', 'C#'], ['C', 'C#'],
    ['רישיון C', 'רישיון C1'], ['רישיון B', 'רישיון C'], ['מלגזן', 'רישיון מלגזה'],
    ['היגש', 'רישיון מלגזה'], ['הנדסאי חשמל', 'מהנדס חשמל'], ['מוסמך', 'תואר שני'],
    ['מנהל חשבונות', 'רואה חשבון'], ['בנקאי', 'טלר'], ['מאבטח', 'ממונה בטיחות'],
    ['מנהל', 'מחסנאי'], ['מנהל מכירות', 'מכירות שטח'], ['מזכירה', 'נהג'],
  ])('לא ממציא שקילות: %s / %s', (left, right) => {
    expect(matchingTermsEquivalent(left, right)).toBe(false)
    expect(findTermEvidence(left, right)).toBeNull()
  })

  it('שומר סימנים טכניים', () => {
    expect(normalizeMatchingText('C# C++ .NET Node.js JavaScript')).toBe('c# c++ .net node.js javascript')
    expect(findTermEvidence('פיתוח ב-C# וב-Node.js', 'C#')?.quote).toBe('C#')
  })

  it('תפקיד ספציפי גובר על ביטוי גנרי הכלול בו', () => {
    expect(extractMatchingConcepts('מכירות שטח')).toHaveLength(1)
    expect(getMatchingRoleFamilies('מנהל חשבונות')).toEqual(['finance'])
    expect(getMatchingRoleFamilies('אין ניסיון במכירות')).toEqual([])
  })
})

describe('ראיות, שלילה ושאיפות', () => {
  it.each([
    ['אין ניסיון באקסל', 'Excel', 'negated'], ['ללא רישיון מלגזה', 'forklift license', 'negated'],
    ['לא יודע Java', 'Java', 'negated'], ['no experience with SQL', 'SQL', 'negated'],
    ['I do not have a forklift license', 'רישיון מלגזה', 'negated'],
    ['מעוניין להיות מחסנאי', 'warehouse worker', 'aspiration'], ['מחפשת עבודה כמנהלת חשבונות', 'bookkeeper', 'aspiration'],
    ['seeking a job as a developer', 'developer', 'aspiration'],
    ['סטודנט לתואר ראשון', 'תואר ראשון', 'in_progress'], ['pursuing a bachelor degree', 'תואר ראשון', 'in_progress'],
  ])('מסווג %s בלי להעניק ניסיון לא מוכח', (text, term, assertion) => {
    expect(findTermEvidence(text, term)?.assertion).toBe(assertion)
  })

  it('שלילה במשפט אחד לא מוחקת ניסיון במשפט אחר', () => {
    expect(findTermEvidence('אין ניסיון ב-SQL. ניסיון ב-Java', 'Java')?.assertion).toBe('positive')
    expect(findTermEvidence('אין ניסיון באקסל. לאחר מכן עברתי הכשרה באקסל', 'Excel')?.assertion).toBe('positive')
  })

  it('שומר גם ראיות סותרות לבדיקת הדרישות', () => {
    const index = createMatchingTextIndex('רישיון מלגזה\nללא רישיון מלגזה')
    expect(index.byConcept.get('forklift_license')?.map(item => item.assertion)).toEqual(['positive', 'negated'])
  })

  it('קורא עד סוף הטקסט ושומר אופסטים מדויקים בטקסט המקורי', () => {
    const text = 'טקסט רקע\n'.repeat(1600) + 'ניסיון ב-\u200fפְּרִיוֹרִיטִי ובאקסל'
    const found = findTermEvidence(text, 'Priority')!
    expect(found.start).toBeGreaterThan(10000)
    expect(text.slice(found.start, found.end)).toBe(found.quote)
    expect(found.assertion).toBe('positive')
    expect(extractMatchingConcepts(`${text}\nPriority Priority`).filter(item => item.concept === 'priority')).toHaveLength(1)
  })

  it('אין התאמה בין שורות נפרדות או מתוך כתובת דואר', () => {
    expect(findTermEvidence('רישיון\nמלגזה', 'רישיון מלגזה')).toBeNull()
    expect(findTermEvidence('java@example.invalid', 'Java')).toBeNull()
    expect(matchingTermsEquivalent('', '')).toBe(false)
  })

  it('לא מעניק כישורים מרשימה שלילית', () => {
    expect(findTermEvidence('אין ניסיון ב-Java, SQL ו-Python', 'SQL')?.assertion).toBe('negated')
    expect(findTermEvidence('אין ניסיון ב-Java, ניסיון ב-SQL', 'SQL')?.assertion).toBe('positive')
  })
})