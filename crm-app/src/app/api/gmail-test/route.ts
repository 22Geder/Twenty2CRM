import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'

// בדיקת חיבור Gmail API
export async function GET(request: NextRequest) {
  try {
    const keyPath = path.join(process.cwd(), 'service-account-key.json')
    
    // בדיקה אם קובץ קיים
    if (!fs.existsSync(keyPath)) {
      return NextResponse.json({
        status: 'error',
        message: 'Service account key file not found',
        path: keyPath
      }, { status: 500 })
    }

    // קריאת הקובץ
    const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf-8'))

    return NextResponse.json({
      status: 'configured',
      message: 'Service account key found',
      serviceAccountEmail: keyFile.client_email,
      projectId: keyFile.project_id,
      note: 'Service Account configured. For Gmail access with a personal Gmail account, OAuth 2.0 is required. For Google Workspace, Domain-Wide Delegation is needed.',
      nextSteps: [
        '1. Go to Google Cloud Console > APIs & Services > OAuth consent screen',
        '2. Complete OAuth setup and add test user',
        '3. Go to Gmail Setup page in CRM to complete OAuth flow',
        '4. Or if using Google Workspace: Enable Domain-Wide Delegation'
      ]
    })

  } catch (error) {
    console.error('Gmail test error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
