import { NextRequest, NextResponse } from 'next/server';

// 📤 Share Target API - קבלת קבצים משיתוף (WhatsApp, Files וכו')
// ===================================================================

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Share Target: Received shared file request');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      console.log('⚠️ Share Target: No file in request');
      // Redirect to app page
      return NextResponse.redirect(new URL('/app?shared=true', request.url));
    }
    
    console.log('📄 Share Target: File received:', file.name, file.type, file.size);
    
    // Forward the file to the main upload API - WITH COOKIES for auth!
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    // 🔑 העברת cookies לשמירת הסשן
    const cookies = request.headers.get('cookie') || '';
    
    const uploadResponse = await fetch(new URL('/api/upload', request.url).toString(), {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Cookie': cookies,  // 🔑 העברת cookies לאימות
      },
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Share Target: Upload failed:', errorText);
      
      // אם הבעיה היא אימות - נפנה לדף התחברות
      if (uploadResponse.status === 401) {
        console.log('🔐 Share Target: Not authenticated, redirecting to login');
        return NextResponse.redirect(new URL('/login?redirect=/dashboard/upload', request.url));
      }
      
      // Redirect with error
      return NextResponse.redirect(
        new URL(`/app?error=${encodeURIComponent('שגיאה בהעלאת הקובץ')}`, request.url)
      );
    }
    
    const result = await uploadResponse.json();
    console.log('✅ Share Target: Upload successful:', {
      name: result.candidate?.name,
      candidateId: result.candidateId,
      createdCandidate: result.createdCandidate
    });
    
    // Redirect with success - לדשבורד המועמדים
    const successUrl = new URL('/dashboard/candidates', request.url);
    successUrl.searchParams.set('success', 'true');
    if (result.candidate?.name) {
      successUrl.searchParams.set('name', result.candidate.name);
    }
    // 🔧 תיקון - candidateId נמצא ברמה העליונה, לא בתוך candidate
    if (result.candidateId) {
      successUrl.searchParams.set('candidateId', result.candidateId);
    }
    
    return NextResponse.redirect(successUrl);
    
  } catch (error: any) {
    console.error('❌ Share Target Error:', error);
    return NextResponse.redirect(
      new URL(`/app?error=${encodeURIComponent(error.message || 'שגיאה לא צפויה')}`, request.url)
    );
  }
}

// Handle GET requests (direct navigation)
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/app', request.url));
}
