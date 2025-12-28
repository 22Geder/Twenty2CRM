import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import mammoth from 'mammoth';

// Helper to extract text from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const mod: any = await import('pdf-parse');
    const parser = mod?.default ?? mod;
    const data = await parser(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return '';
  }
}

// Helper to extract text from DOCX
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return '';
  }
}

// AI-powered text analysis to extract candidate info
function analyzeCVText(text: string): any {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract email
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : '';

  // Extract phone (Israeli format)
  const phoneRegex = /0(?:5[0-9]|[2-4]|[7-9])[0-9]{7,8}/g;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Extract name (usually first line or after certain keywords)
  let name = '';
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 50 && !line.includes('@') && !line.match(/\d{5,}/)) {
      const words = line.trim().split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        name = line.trim();
        break;
      }
    }
  }

  // Extract city (Israeli cities)
  const israeliCities = [
    'תל אביב', 'תל-אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה',
    'אשדוד', 'נתניה', 'באר שבע', 'בני ברק', 'חולון', 'רמת גן', 'רעננה',
    'אשקלון', 'רחובות', 'הרצליה', 'כפר סבא', 'חדרה', 'מודיעין', 'נצרת',
    'לוד', 'רמלה', 'נהריה', 'טבריה', 'קריית אתא', 'קריית גת', 'קריית מוצקין'
  ];
  
  let city = '';
  const textLower = text.toLowerCase();
  for (const cityName of israeliCities) {
    if (textLower.includes(cityName.toLowerCase())) {
      city = cityName;
      break;
    }
  }

  // Extract current title and all matching job titles (comprehensive)
  const jobTitles = [
    // Management
    'מנהל', 'מנכ"ל', 'סמנכ"ל', 'רכז', 'רכזת', 'מנהל צוות', 'מנהל פרויקטים',
    'מנהל מוצר', 'מנהל מכירות', 'מנהל שיווק', 'מנהל משאבי אנוש',
    // Tech & IT
    'מפתח', 'תוכניתן', 'מתכנת', 'Full Stack', 'Front End', 'Back End',
    'DevOps', 'מהנדס תוכנה', 'ארכיטקט תוכנה', 'QA', 'בודק תוכנה',
    'מנהל מערכות', 'אנליסט', 'Data Scientist', 'מדען נתונים',
    // Sales & Marketing
    'איש מכירות', 'אשת מכירות', 'נציג מכירות', 'סוכן', 'משווק',
    'מנהל לקוחות', 'Account Manager', 'איש שיווק דיגיטלי',
    // Customer Service
    'נציג שירות', 'נציגת שירות', 'שירות לקוחות', 'טלמרקטר',
    'מוקדן', 'מוקדנית', 'תמיכה טכנית', 'Help Desk',
    // Warehouse & Logistics
    'מלגזן', 'מלגזנית', 'מחסנאי', 'מחסנאית', 'מפעיל מלגזה',
    'עובד מחסן', 'עובדת מחסן', 'איש לוגיסטיקה', 'מתכנן משלוחים', 'נהג',
    // Medical & Healthcare
    'אח', 'אחות', 'אחות מוסמכת', 'מטפל', 'מטפלת', 'רופא', 'רופאה',
    'פיזיותרפיסט', 'ריפוי בעיסוק', 'רוקח', 'רוקחת', 'מיילדת',
    // Education
    'מורה', 'מחנך', 'מחנכת', 'גננת', 'מדריך', 'מדריכה', 'מרצה',
    // Finance & Accounting
    'חשב', 'חשבת', 'רואה חשבון', 'כלכלן', 'כלכלנית', 'מנהל כספים',
    'בקר', 'בקרת', 'אנליסט כספי',
    // HR & Recruitment
    'גייס', 'גייסת', 'מגייס', 'מגייסת', 'איש משאבי אנוש', 'HR',
    'מנהל גיוס', 'שותף עסקי', 'Business Partner', 'כוח אדם',
    // Engineering
    'מהנדס', 'מהנדסת', 'הנדסאי', 'הנדסאית', 'טכנאי', 'טכנאית',
    'מהנדס מכונות', 'מהנדס אלקטרוניקה', 'מהנדס חשמל', 'מהנדס בניין',
    // Design & Creative
    'מעצב', 'מעצבת', 'גרפיקאי', 'גרפיקאית', 'מעצב UI/UX', 'עורך וידאו',
    // Legal
    'עורך דין', 'עורכת דין', 'יועץ משפטי', 'יועצת משפטית', 'פקיד',
    // Construction
    'קבלן', 'קבלנית', 'אדריכל', 'אדריכלית', 'בנאי', 'חשמלאי', 'שרברב',
    'צבע', 'גבסן', 'רצפן', 'פועל בניין',
    // Security
    'מאבטח', 'מאבטחת', 'קצין ביטחון', 'שומר', 'שומרת',
    // Hospitality
    'מלצר', 'מלצרית', 'ברמן', 'ברמנית', 'שף', 'טבח', 'טבחית',
    // General
    'עוזר', 'עוזרת', 'מזכיר', 'מזכירה', 'רכז מינהלי', 'פקיד', 'פקידה', 'יועץ', 'מנתח', 'מפעיל'
  ];

  // Extract all matching job titles
  const foundTitles: string[] = [];
  let currentTitle = '';
  for (const title of jobTitles) {
    if (text.includes(title)) {
      foundTitles.push(title);
      if (!currentTitle) currentTitle = title; // Set first as primary
    }
  }

  // Extract skills - comprehensive list
  const skills: string[] = [];
  const skillKeywords = [
    // Office & Tools
    'Excel', 'Word', 'PowerPoint', 'Outlook', 'SAP', 'Priority', 'מחשוב',
    // Languages
    'אנגלית', 'עברית', 'רוסית', 'ערבית', 'צרפתית', 'ספרדית',
    // Management
    'ניהול', 'מנהיגות', 'ניהול פרויקטים', 'ניהול צוותים', 'ניהול זמן',
    // Customer Service & Sales
    'שירות לקוחות', 'מכירות', 'טלמרקטינג', 'שיווק', 'פרזנטציה',
    // Technical
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby',
    'React', 'Angular', 'Vue', 'Node.js', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'Linux', 'Windows',
    // Warehouse & Logistics
    'מלגזן', 'ניהול מלאי', 'לוגיסטיקה', 'תחזוקה', 'בטיחות', 'מחסנאות',
    'הובלה', 'אריזה', 'משלוחים', 'ספקים',
    // Engineering & Technical
    'הנדסה', 'אלקטרוניקה', 'מכניקה', 'חשמל', 'אוטומציה', 'בקרה',
    'תיקון', 'אחזקה', 'תכנון', 'עיצוב',
    // Medical & Healthcare
    'רפואה', 'סיעוד', 'פיזיותרפיה', 'ריפוי בעיסוק', 'רוקחות', 'אח/ות',
    // Education
    'הוראה', 'חינוך', 'הדרכה', 'הכשרה', 'הנחיה',
    // Finance & Accounting
    'חשבונאות', 'הנהלת חשבונות', 'כספים', 'בנקאות', 'ביטוח', 'משכורות',
    // HR & Recruitment
    'משאבי אנוש', 'גיוס', 'ניהול כוח אדם', 'העסקה',
    // Design & Creative
    'עיצוב גרפי', 'Photoshop', 'Illustrator', 'InDesign', 'Figma', 'Adobe',
    'UI/UX', 'אנימציה', 'וידאו', 'מולטימדיה',
    // Legal
    'משפטים', 'עורך דין', 'יועץ משפטי', 'חוזים', 'ייצוג',
    // Construction
    'בניין', 'קבלן', 'אדריכל', 'הנדסאי בניין', 'פיקוח', 'תכנון בניין'
  ];

  for (const skill of skillKeywords) {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }

  // Extract years of experience
  const experienceRegex = /(\d+)\s*(שנ[יה]|years?)/gi;
  const expMatch = text.match(experienceRegex);
  const experience = expMatch ? expMatch[0] : '';

  // Auto-match positions based on title and city
  const matchedPositions: string[] = [];
  if (currentTitle && city) {
    if (currentTitle.includes('מחסנאי')) {
      matchedPositions.push(`משרת מחסנאי - ${city}`);
    }
    if (currentTitle.includes('נהג')) {
      matchedPositions.push(`משרת נהג - ${city}`);
    }
    if (currentTitle.includes('טכנאי')) {
      matchedPositions.push(`משרת טכנאי - ${city}`);
    }
  }

  // Collect all tags: skills + job titles + city + experience level
  const allTags: string[] = [];
  
  // Add all skills found
  allTags.push(...skills);
  
  // Add all job titles found
  allTags.push(...foundTitles);
  
  // Add city if found
  if (city) allTags.push(city);
  
  // Add experience level based on years
  if (experience) {
    const yearsMatch = experience.match(/\d+/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[0]);
      if (years >= 0 && years <= 2) allTags.push('מתחיל');
      else if (years >= 3 && years <= 5) allTags.push('בעל ניסיון');
      else if (years >= 6) allTags.push('ותיק');
    }
  }

  return {
    name: name || 'לא זוהה',
    email: email || 'לא זוהה',
    phone: phone || 'לא זוהה',
    city: city || 'לא זוהה',
    currentTitle: currentTitle || 'לא זוהה',
    skills: skills.length > 0 ? skills : ['לא זוהו'],
    experience: experience || 'לא זוהה',
    matchedPositions: matchedPositions.length > 0 ? matchedPositions : ['ללא התאמה אוטומטית'],
    tags: allTags.filter(Boolean) // Return all extracted tags
  };
}

function isLikelyEmail(value: unknown): value is string {
  return typeof value === 'string' && value.includes('@') && value.includes('.') && value.length <= 254;
}

function parseYearsOfExperience(experienceText: unknown): number | null {
  if (typeof experienceText !== 'string') return null;
  const match = experienceText.match(/(\d{1,2})/);
  if (!match) return null;
  const years = parseInt(match[1], 10);
  return Number.isFinite(years) ? years : null;
}

function normalizeMaybeValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'לא זוהה' || trimmed === 'לא זוהו') return null;
  return trimmed;
}

function extractKeywordTags(text: string, maxTags: number): string[] {
  const stopwords = new Set([
    // Hebrew
    'של', 'עם', 'על', 'אל', 'את', 'אני', 'אנחנו', 'הוא', 'היא', 'הם', 'הן',
    'זה', 'זו', 'אלה', 'כמו', 'גם', 'או', 'אם', 'כי', 'אבל', 'יותר', 'פחות',
    'ניסיון', 'שנים', 'שנה', 'תפקיד', 'תפקידים', 'עבודה', 'עובד', 'עובדת',
    'אחריות', 'אחראי', 'אחראית', 'ידע', 'יכולת', 'משרה', 'משרות', 'פרטים',
    'טלפון', 'מייל', 'דוא"ל', 'כתובת', 'לינקדאין', 'linkedin',
    // English
    'and', 'or', 'the', 'a', 'an', 'to', 'in', 'for', 'with', 'on', 'of', 'as',
    'experience', 'years', 'year', 'skills', 'skill', 'work', 'role', 'roles',
  ]);

  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !stopwords.has(t));

  const counts = new Map<string, number>();
  for (const tok of tokens) {
    counts.set(tok, (counts.get(tok) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([word]) => word);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text based on file type
    let text = '';
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'pdf') {
      text = await extractTextFromPDF(buffer);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      text = await extractTextFromDOCX(buffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PDF or DOCX' },
        { status: 400 }
      );
    }

    // Analyze the extracted text
    const candidateData = analyzeCVText(text);

    // Save file to uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true });
    
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Persist candidate into DB (so it appears in the general Candidates list)
    const resumeUrl = `/uploads/resumes/${fileName}`;
    let createdCandidate = false;
    let candidateId: string | null = null;

    const normalizedEmail = isLikelyEmail(candidateData?.email) ? (candidateData.email as string) : null;
    const phone = normalizeMaybeValue(candidateData?.phone);
    const name = normalizeMaybeValue(candidateData?.name) || 'מועמד מהעלאה';
    const city = normalizeMaybeValue(candidateData?.city);
    const currentTitle = normalizeMaybeValue(candidateData?.currentTitle);
    const yearsOfExperience = parseYearsOfExperience(candidateData?.experience);
    const skills = Array.isArray(candidateData?.skills)
      ? candidateData.skills.filter((s: unknown) => typeof s === 'string' && s !== 'לא זוהו')
      : [];

    let candidateRecord: { id: string } | null = null;

    if (normalizedEmail) {
      const existing = await prisma.candidate.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      createdCandidate = !existing;

      candidateRecord = await prisma.candidate.upsert({
        where: { email: normalizedEmail },
        create: {
          name,
          email: normalizedEmail,
          phone,
          city,
          currentTitle,
          yearsOfExperience,
          skills: skills.length ? skills.join(', ') : null,
          resumeUrl,
          source: 'UPLOAD',
          notes: `נוצר אוטומטית מהעלאת קובץ: ${file.name}`,
        },
        update: {
          name,
          phone: phone ?? undefined,
          city: city ?? undefined,
          currentTitle: currentTitle ?? undefined,
          yearsOfExperience: yearsOfExperience ?? undefined,
          skills: skills.length ? skills.join(', ') : undefined,
          resumeUrl,
        },
        select: { id: true },
      });
    } else {
      // No email: best-effort dedupe by phone
      const existingByPhone = phone
        ? await prisma.candidate.findFirst({ where: { phone }, select: { id: true }, orderBy: { updatedAt: 'desc' } })
        : null;

      if (existingByPhone) {
        createdCandidate = false;
        candidateRecord = await prisma.candidate.update({
          where: { id: existingByPhone.id },
          data: {
            name,
            phone,
            city,
            currentTitle,
            yearsOfExperience,
            skills: skills.length ? skills.join(', ') : undefined,
            resumeUrl,
          },
          select: { id: true },
        });
      } else {
        createdCandidate = true;
        
        // Generate unique email placeholder if no email found
        const placeholderEmail = `no-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@twenty2jobs.local`;
        
        candidateRecord = await prisma.candidate.create({
          data: {
            name,
            email: placeholderEmail,
            phone,
            city,
            currentTitle,
            yearsOfExperience,
            skills: skills.length ? skills.join(', ') : null,
            resumeUrl,
            source: 'UPLOAD',
            notes: `נוצר אוטומטית מהעלאת קובץ: ${file.name} (ללא אימייל)`,
          },
          select: { id: true },
        });
      }
    }

    candidateId = candidateRecord?.id ?? null;

    // Create + attach tags derived from the CV text (all extracted tags)
    if (candidateId && Array.isArray(candidateData?.tags)) {
      const tagMap = new Map<string, string>();

      // Process all extracted tags from analyzeCVText
      for (const tag of candidateData.tags) {
        if (typeof tag === 'string' && tag.trim() && tag !== 'לא זוהה') {
          const tagName = tag.trim();
          
          // Categorize tags intelligently
          let category = 'general';
          
          // Check if it's a skill
          if (skills.includes(tagName)) {
            category = 'skill';
          }
          // Check if it's a city
          else if (city && tagName === city) {
            category = 'city';
          }
          // Check if it's a job title
          else if (currentTitle && tagName === currentTitle) {
            category = 'title';
          }
          // Check for experience level indicators
          else if (['מתחיל', 'בעל ניסיון', 'ותיק', 'Junior', 'Senior', 'Lead'].some(exp => tagName.includes(exp))) {
            category = 'experience';
          }
          // Check for technology keywords
          else if (['JavaScript', 'Python', 'Java', 'SQL', 'React', 'Node', 'AWS', 'Azure', 'Docker'].some(tech => tagName.includes(tech))) {
            category = 'technology';
          }
          
          tagMap.set(tagName, category);
        }
      }

      // Add top keywords from the CV (limited to avoid too many tags)
      const keywordTags = extractKeywordTags(text, 10);
      for (const kw of keywordTags) {
        if (!tagMap.has(kw)) tagMap.set(kw, 'keyword');
      }

      const tagNames = [...tagMap.keys()].slice(0, 50); // Increased limit to capture more tags
      if (tagNames.length) {
        // Get existing tags
        const existingTags = await prisma.tag.findMany({
          where: { name: { in: tagNames } },
          select: { id: true, name: true },
        });

        const existingTagNames = new Set(existingTags.map(t => t.name));
        const newTagNames = tagNames.filter(name => !existingTagNames.has(name));

        // Create only new tags
        if (newTagNames.length > 0) {
          await prisma.tag.createMany({
            data: newTagNames.map((t) => ({ name: t, category: tagMap.get(t) || 'general' })),
          });
        }

        // Get all tag IDs (existing + newly created)
        const allTags = await prisma.tag.findMany({
          where: { name: { in: tagNames } },
          select: { id: true },
        });

        // Connect tags to candidate
        await prisma.candidate.update({
          where: { id: candidateId },
          data: {
            tags: {
              connect: allTags.map((t) => ({ id: t.id })),
            },
          },
        });
      }
    }

    // Return extracted data
    return NextResponse.json({
      success: true,
      fileName: fileName,
      resumeUrl,
      candidate: candidateData,
      candidateId,
      createdCandidate,
      extractedText: text.substring(0, 500) // First 500 chars for preview
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
