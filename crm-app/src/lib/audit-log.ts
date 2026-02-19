import { prisma } from '@/lib/prisma'

// 🔐 מערכת Audit Log - שמירת היסטוריית שינויים
// =====================================================

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'SEND_EMAIL' | 'SEND_SMS' | 'STATUS_CHANGE'

export type EntityType = 'CANDIDATE' | 'POSITION' | 'EMPLOYER' | 'USER' | 'APPLICATION' | 'INTERVIEW' | 'TAG' | 'DOCUMENT' | 'NOTIFICATION' | 'EMAIL'

interface AuditLogData {
  action: AuditAction
  entityType: EntityType
  entityId?: string
  entityName?: string
  changes?: Record<string, { old: unknown; new: unknown }>
  userId?: string
  userName?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * יוצר רשומת Audit Log חדשה
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        userId: data.userId,
        userName: data.userName,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    })
  } catch (error) {
    // לא נכשיל את הפעולה הראשית אם ה-audit log נכשל
    console.error('Failed to create audit log:', error)
  }
}

/**
 * מחשב הבדלים בין שני אובייקטים
 */
export function calculateChanges(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  fieldsToTrack?: string[]
): Record<string, { old: unknown; new: unknown }> | null {
  const changes: Record<string, { old: unknown; new: unknown }> = {}
  
  const fields = fieldsToTrack || Object.keys({ ...oldObj, ...newObj })
  
  for (const field of fields) {
    const oldValue = oldObj[field]
    const newValue = newObj[field]
    
    // התעלם משדות שלא השתנו
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      // התעלם משדות מסוימים
      if (['updatedAt', 'createdAt', 'password'].includes(field)) continue
      
      changes[field] = {
        old: oldValue,
        new: newValue
      }
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : null
}

/**
 * יוצר Audit Log לעדכון מועמד
 */
export async function auditCandidateUpdate(
  candidateId: string,
  candidateName: string,
  changes: Record<string, { old: unknown; new: unknown }>,
  userId?: string,
  userName?: string
): Promise<void> {
  await createAuditLog({
    action: 'UPDATE',
    entityType: 'CANDIDATE',
    entityId: candidateId,
    entityName: candidateName,
    changes,
    userId,
    userName
  })
}

/**
 * יוצר Audit Log ליצירת מועמד
 */
export async function auditCandidateCreate(
  candidateId: string,
  candidateName: string,
  userId?: string,
  userName?: string
): Promise<void> {
  await createAuditLog({
    action: 'CREATE',
    entityType: 'CANDIDATE',
    entityId: candidateId,
    entityName: candidateName,
    userId,
    userName
  })
}

/**
 * יוצר Audit Log למחיקת מועמד
 */
export async function auditCandidateDelete(
  candidateId: string,
  candidateName: string,
  userId?: string,
  userName?: string
): Promise<void> {
  await createAuditLog({
    action: 'DELETE',
    entityType: 'CANDIDATE',
    entityId: candidateId,
    entityName: candidateName,
    userId,
    userName
  })
}

/**
 * יוצר Audit Log לשינוי סטטוס
 */
export async function auditStatusChange(
  entityType: EntityType,
  entityId: string,
  entityName: string,
  oldStatus: string,
  newStatus: string,
  userId?: string,
  userName?: string
): Promise<void> {
  await createAuditLog({
    action: 'STATUS_CHANGE',
    entityType,
    entityId,
    entityName,
    changes: {
      status: { old: oldStatus, new: newStatus }
    },
    userId,
    userName
  })
}

/**
 * יוצר Audit Log לשליחת מייל
 */
export async function auditEmailSent(
  recipientEmail: string,
  subject: string,
  candidateId?: string,
  candidateName?: string,
  userId?: string,
  userName?: string
): Promise<void> {
  await createAuditLog({
    action: 'SEND_EMAIL',
    entityType: 'EMAIL',
    entityId: candidateId,
    entityName: `${candidateName || 'Unknown'} - ${subject}`,
    changes: {
      to: { old: null, new: recipientEmail },
      subject: { old: null, new: subject }
    },
    userId,
    userName
  })
}

/**
 * מחזיר היסטוריית שינויים לישות
 */
export async function getEntityAuditHistory(
  entityType: EntityType,
  entityId: string,
  limit = 50
) {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

/**
 * מחזיר את כל הפעולות של משתמש
 */
export async function getUserAuditHistory(userId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}
