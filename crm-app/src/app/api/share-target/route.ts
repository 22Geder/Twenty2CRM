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
    
    // Forward the file to the main upload API
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    const uploadResponse = await fetch(new URL('/api/upload', request.url).toString(), {
      method: 'POST',
      body: uploadFormData,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Share Target: Upload failed:', errorText);
      // Redirect with error
      return NextResponse.redirect(
        new URL(`/app?error=${encodeURIComponent('שגיאה בהעלאת הקובץ')}`, request.url)
      );
    }
    
    const result = await uploadResponse.json();
    console.log('✅ Share Target: Upload successful:', result.candidate?.name);
    
    // Redirect with success
    const successUrl = new URL('/app', request.url);
    successUrl.searchParams.set('success', 'true');
    if (result.candidate?.name) {
      successUrl.searchParams.set('name', result.candidate.name);
    }
    if (result.candidate?.id) {
      successUrl.searchParams.set('candidateId', result.candidate.id);
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
