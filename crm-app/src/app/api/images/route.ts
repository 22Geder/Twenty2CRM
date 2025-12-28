import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from 'fs'
import path from 'path'

// מערכת העלאת תמונות משופרת עבור פייסבוק ומיילים
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const type = formData.get('type') as string || 'general' // 'facebook', 'email', 'general'
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    // וודא שתיקיית העלאה קיימת
    try {
      await fs.access(uploadDir)
    } catch {
      await fs.mkdir(uploadDir, { recursive: true })
    }

    const uploadedFiles = []

    for (const file of files) {
      // בדוק סוג קובץ
      if (!isValidFileType(file, type)) {
        continue
      }

      // צור שם קובץ ייחודי
      const timestamp = new Date().getTime()
      const originalName = file.name.replace(/[^a-zA-Z0-9\u05D0-\u05EA.\-_]/g, '_')
      const filename = `${timestamp}_${originalName}`
      const filepath = path.join(uploadDir, filename)

      // שמור קובץ
      const bytes = await file.arrayBuffer()
      await fs.writeFile(filepath, Buffer.from(bytes))

      uploadedFiles.push({
        originalName: file.name,
        filename: filename,
        url: `/uploads/${filename}`,
        size: file.size,
        type: file.type,
        uploadType: type
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    )
  }
}

// בדיקת סוג קובץ תקין
function isValidFileType(file: File, uploadType: string): boolean {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  
  if (uploadType === 'facebook') {
    // לפייסבוק - רק תמונות
    return imageTypes.includes(file.type.toLowerCase())
  }
  
  if (uploadType === 'email') {
    // למיילים - מסמכים ותמונות
    return imageTypes.includes(file.type.toLowerCase()) || 
           documentTypes.includes(file.type.toLowerCase())
  }
  
  // כללי - הכל
  return imageTypes.includes(file.type.toLowerCase()) || 
         documentTypes.includes(file.type.toLowerCase())
}

// מחיקת קובץ
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 })
    }

    const filepath = path.join(process.cwd(), 'public', 'uploads', filename)
    
    try {
      await fs.unlink(filepath)
      return NextResponse.json({ success: true, message: "File deleted" })
    } catch (error) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    )
  }
}

// רשימת קבצים
export async function GET(request: NextRequest) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    try {
      const files = await fs.readdir(uploadDir)
      const fileList = []
      
      for (const file of files) {
        const filepath = path.join(uploadDir, file)
        const stats = await fs.stat(filepath)
        
        fileList.push({
          name: file,
          url: `/uploads/${file}`,
          size: stats.size,
          modified: stats.mtime.toISOString()
        })
      }

      return NextResponse.json({
        success: true,
        files: fileList,
        count: fileList.length
      })
      
    } catch (error) {
      return NextResponse.json({
        success: true,
        files: [],
        count: 0
      })
    }

  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json(
      { error: "Failed to get files" },
      { status: 500 }
    )
  }
}