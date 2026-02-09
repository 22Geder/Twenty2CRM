import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { getUploadsBasePath } from '@/lib/storage-config';

// Content-Type mapping
const contentTypes: { [key: string]: string } = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    // בניית הנתיב המלא
    const relativePath = pathSegments.join('/');
    const uploadsBase = getUploadsBasePath();
    const fullPath = join(uploadsBase, relativePath);

    // אבטחה: וודא שהנתיב לא יוצא מתיקיית ה-uploads
    if (!fullPath.startsWith(uploadsBase)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    // בדוק אם הקובץ קיים
    try {
      await stat(fullPath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // קרא את הקובץ
    const fileBuffer = await readFile(fullPath);
    
    // קבע את ה-Content-Type
    const ext = '.' + (relativePath.split('.').pop()?.toLowerCase() || '');
    const contentType = contentTypes[ext] || 'application/octet-stream';

    // החזר את הקובץ
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${pathSegments[pathSegments.length - 1]}"`,
        'Cache-Control': 'public, max-age=31536000', // cache לשנה
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
