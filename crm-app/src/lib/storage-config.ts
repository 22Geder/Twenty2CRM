// ========================================================================
// הגדרות אחסון קבועות - Twenty2CRM
// ========================================================================

import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * נתיב האחסון הקבוע לקבצים
 * ניתן לשנות דרך משתנה סביבה UPLOADS_PATH
 */
export function getUploadsBasePath(): string {
  // אם יש משתנה סביבה - השתמש בו (מומלץ לרשת משרדית)
  if (process.env.UPLOADS_PATH) {
    return process.env.UPLOADS_PATH;
  }
  
  // ברירת מחדל - תיקיית public/uploads בפרויקט
  return join(process.cwd(), 'public', 'uploads');
}

/**
 * קבלת נתיב לתיקיית קורות חיים
 */
export function getResumesPath(): string {
  return join(getUploadsBasePath(), 'resumes');
}

/**
 * קבלת נתיב לתיקיית מסמכי מועמדים
 */
export function getCandidateDocsPath(candidateId: string): string {
  return join(getUploadsBasePath(), 'candidates', candidateId);
}

/**
 * קבלת נתיב לתיקיית תמונות
 */
export function getImagesPath(): string {
  return join(getUploadsBasePath(), 'images');
}

/**
 * יצירת תיקייה אם לא קיימת
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * המרת נתיב מלא ל-URL יחסי
 */
export function filePathToUrl(filePath: string): string {
  const uploadsBase = getUploadsBasePath();
  
  // אם זה נתיב חיצוני (לא בתיקיית public)
  if (process.env.UPLOADS_PATH) {
    // צריך API endpoint לשרת את הקבצים
    const relativePath = filePath.replace(uploadsBase, '').replace(/\\/g, '/');
    return `/api/files${relativePath}`;
  }
  
  // אם זה בתיקיית public - URL ישיר
  const relativePath = filePath.replace(join(process.cwd(), 'public'), '').replace(/\\/g, '/');
  return relativePath;
}

/**
 * הגדרות מקסימום לקבצים
 */
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_RESUME_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

export default {
  getUploadsBasePath,
  getResumesPath,
  getCandidateDocsPath,
  getImagesPath,
  ensureDirectoryExists,
  filePathToUrl,
  FILE_LIMITS,
};
