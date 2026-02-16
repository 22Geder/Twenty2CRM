import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface CandidateTag {
  id: string;
  label: string;
  color: string;
  icon: string;
}

interface CandidateDetails {
  name: string;
  phone: string;
  email: string;
  city: string;
  age: string;
  idNumber: string;
  experience: string[];
  education: string[];
  skills: string[];
  yearsOfExperience: number;
  tags: CandidateTag[];
  summary: string;
}

const AVAILABLE_TAGS: CandidateTag[] = [
  { id: 'sales', label: 'מכירות', color: 'bg-purple-500', icon: '💰' },
  { id: 'service', label: 'שירות לקוחות', color: 'bg-blue-500', icon: '🎧' },
  { id: 'banking', label: 'בנקאות', color: 'bg-green-600', icon: '🏦' },
  { id: 'management', label: 'ניהול', color: 'bg-amber-500', icon: '👔' },
  { id: 'maintenance', label: 'אחזקה', color: 'bg-orange-500', icon: '🔧' },
  { id: 'logistics', label: 'לוגיסטיקה', color: 'bg-cyan-500', icon: '📦' },
  { id: 'admin', label: 'מנהלה', color: 'bg-pink-500', icon: '📋' },
  { id: 'tech', label: 'הייטק', color: 'bg-indigo-500', icon: '💻' },
  { id: 'finance', label: 'פיננסים', color: 'bg-emerald-500', icon: '📊' },
  { id: 'hr', label: 'משאבי אנוש', color: 'bg-rose-500', icon: '👥' },
  { id: 'marketing', label: 'שיווק', color: 'bg-violet-500', icon: '📣' },
  { id: 'student', label: 'סטודנט', color: 'bg-sky-500', icon: '📚' },
  { id: 'degree', label: 'בעל תואר', color: 'bg-teal-500', icon: '🎓' },
  { id: 'experienced', label: 'מנוסה', color: 'bg-yellow-500', icon: '⭐' },
  { id: 'driver', label: 'רישיון נהיגה', color: 'bg-slate-500', icon: '🚗' },
  { id: 'english', label: 'אנגלית', color: 'bg-red-500', icon: '🌍' },
];

export async function POST(request: NextRequest) {
  try {
    const { cvText } = await request.json();

    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json(
        { error: 'CV text is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
אתה מומחה בניתוח קורות חיים בעברית. נתח את קורות החיים הבאים וחלץ את כל המידע.

קורות החיים:
"""
${cvText}
"""

החזר תשובה בפורמט JSON בלבד (ללא markdown, ללא קוד, רק JSON נקי):
{
  "name": "שם מלא של המועמד",
  "phone": "מספר טלפון בפורמט 050-000-0000",
  "email": "כתובת אימייל",
  "city": "עיר מגורים",
  "age": "גיל אם מופיע",
  "idNumber": "תעודת זהות אם מופיעה",
  "yearsOfExperience": מספר שנות ניסיון כמספר,
  "experience": ["תיאור ניסיון 1", "תיאור ניסיון 2"],
  "education": ["השכלה 1", "השכלה 2"],
  "skills": ["מיומנות 1", "מיומנות 2"],
  "detectedTags": ["sales", "service", "banking", "management", "maintenance", "logistics", "admin", "tech", "finance", "hr", "marketing", "student", "degree", "experienced", "driver", "english"]
}

תגיות אפשריות (הוסף רק מה שרלוונטי):
- sales: ניסיון במכירות
- service: ניסיון בשירות לקוחות
- banking: ניסיון בנקאי
- management: ניסיון ניהולי
- maintenance: ניסיון באחזקה/טכנאות
- logistics: ניסיון בלוגיסטיקה/מחסנאות
- admin: ניסיון מנהלתי/מזכירותי
- tech: ניסיון בהייטק/תכנות
- finance: ניסיון בכלכלה/חשבונאות
- hr: ניסיון במשאבי אנוש
- marketing: ניסיון בשיווק
- student: סטודנט פעיל
- degree: בעל תואר אקדמי
- experienced: 5+ שנות ניסיון
- driver: יש רישיון נהיגה
- english: אנגלית ברמה גבוהה

אם ערך לא נמצא, השאר מחרוזת ריקה או מערך ריק.
החזר רק JSON תקין!
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON
    let cleanJson = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);

    // Convert detected tags to full tag objects
    const tags: CandidateTag[] = [];
    if (parsed.detectedTags && Array.isArray(parsed.detectedTags)) {
      for (const tagId of parsed.detectedTags) {
        const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
        if (tag) {
          tags.push(tag);
        }
      }
    }

    // Build summary
    const tagLabels = tags.map(t => t.label).slice(0, 4);
    let summary = '';
    if (parsed.name && tagLabels.length > 0) {
      summary = `${parsed.name} - ${tagLabels.join(', ')}`;
      if (parsed.yearsOfExperience > 0) {
        summary += ` | ${parsed.yearsOfExperience} שנות ניסיון`;
      }
      if (parsed.city) {
        summary += ` | ${parsed.city}`;
      }
    } else if (parsed.name) {
      summary = parsed.name;
    }

    const details: CandidateDetails = {
      name: parsed.name || '',
      phone: parsed.phone || '',
      email: parsed.email || '',
      city: parsed.city || '',
      age: parsed.age || '',
      idNumber: parsed.idNumber || '',
      experience: parsed.experience || [],
      education: parsed.education || [],
      skills: parsed.skills || [],
      yearsOfExperience: parsed.yearsOfExperience || 0,
      tags,
      summary,
    };

    return NextResponse.json(details);
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze CV' },
      { status: 500 }
    );
  }
}


