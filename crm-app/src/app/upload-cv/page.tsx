'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// סוגי סטטוס
type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error'

// מבנה תוצאת ניתוח
interface AnalysisResult {
  name?: string
  phone?: string
  email?: string
  experience?: string[]
  skills?: string[]
  candidateId?: string
  message?: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function MobileUploadPage() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>('')
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // PWA Install states
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [sharedSuccess, setSharedSuccess] = useState<{name?: string, candidateId?: string} | null>(null)

  // PWA Install detection
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone === true)
    
    if (!isStandalone) {
      // Show banner after 2 seconds
      const timer = setTimeout(() => setShowInstallBanner(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Handle share target redirect results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    // Check for success from share target
    if (urlParams.get('success') === 'true') {
      const name = urlParams.get('name')
      const candidateId = urlParams.get('candidateId')
      setSharedSuccess({ name: name || undefined, candidateId: candidateId || undefined })
      setStatus('success')
      setResult({
        name: name || undefined,
        candidateId: candidateId || undefined,
        message: 'קורות החיים הועלו בהצלחה מהשיתוף!'
      })
      // Clean URL
      window.history.replaceState({}, '', '/upload-cv')
    }
    
    // Check for error from share target
    const errorParam = urlParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      setStatus('error')
      // Clean URL
      window.history.replaceState({}, '', '/upload-cv')
    }
  }, [])

  // Handle shared files from other apps (Web Share Target API)
  useEffect(() => {
    const handleSharedFile = async () => {
      // Check for file from launchQueue (File Handling API)
      if ('launchQueue' in window && (window as any).launchQueue) {
        (window as any).launchQueue.setConsumer(async (launchParams: any) => {
          if (launchParams.files && launchParams.files.length > 0) {
            const fileHandle = launchParams.files[0]
            const file = await fileHandle.getFile()
            handleFile(file)
          }
        })
      }
    }
    
    handleSharedFile()
  }, [])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      window.location.href = '/install'
      return
    }
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstallBanner(false)
      }
    }
  }

  // טיפול בגרירה
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // טיפול בשחרור קובץ
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }, [])

  // פתיחת בורר קבצים
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  // טיפול בבחירת קובץ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  // בדיקה וטיפול בקובץ
  const handleFile = (file: File) => {
    // בדיקת סוג קובץ - כולל תמונות!
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // 🆕 תמיכה בתמונות (קורות חיים סרוקים)
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
    ]
    
    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.txt',
      // 🆕 סיומות תמונה
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'
    ]
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('קובץ לא נתמך. אנא העלו PDF, Word, תמונה או TXT')
      return
    }
    
    // בדיקת גודל (מקסימום 20MB לתמונות גדולות)
    if (file.size > 20 * 1024 * 1024) {
      setError('הקובץ גדול מדי. מקסימום 20MB')
      return
    }
    
    setSelectedFile(file)
    setError('')
  }

  // העלאת הקובץ
  const uploadFile = async () => {
    if (!selectedFile) return
    
    setStatus('uploading')
    setProgress(0)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      // סימולציית התקדמות
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 40) {
            clearInterval(progressInterval)
            return 40
          }
          return prev + 10
        })
      }, 200)
      
      // העלאה לשרת
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      clearInterval(progressInterval)
      setProgress(60)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'שגיאה בהעלאת הקובץ')
      }
      
      setStatus('analyzing')
      setProgress(80)
      
      const data = await response.json()
      
      setProgress(100)
      setStatus('success')
      
      // 🆕 תיקון - candidateId נמצא ברמה העליונה, לא בתוך candidate
      const candidateId = data.candidateId || data.candidate?.id
      console.log('✅ Upload success:', { candidateId, name: data.candidate?.name })
      
      setResult({
        name: data.candidate?.name,
        phone: data.candidate?.phone,
        email: data.candidate?.email,
        experience: data.candidate?.experience ? [data.candidate.experience] : [],
        skills: data.tags?.map((t: any) => t.name) || [],
        candidateId: candidateId,
        message: data.createdCandidate ? 'מועמד חדש נוצר בהצלחה!' : 'מועמד קיים עודכן בהצלחה!'
      })
      
      // 🆕 הפעלת אירוע רענון לדף המועמדים
      window.dispatchEvent(new Event('candidates-updated'))
      localStorage.setItem('lastCandidateAdded', Date.now().toString())
      
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'שגיאה בהעלאת הקובץ')
    }
  }

  // איפוס הכל
  const resetUpload = () => {
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setError('')
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mobile-upload-container" dir="rtl">
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="install-banner">
          <div className="install-banner-content">
            <span className="install-icon">📲</span>
            <div className="install-text">
              <strong>התקינו את האפליקציה!</strong>
              <span>גישה מהירה מהמסך הראשי</span>
            </div>
          </div>
          <div className="install-actions">
            <button className="install-btn-small" onClick={handleInstall}>
              התקן
            </button>
            <button className="dismiss-btn" onClick={() => setShowInstallBanner(false)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mobile-header">
        <div className="logo-section">
          <img 
            src="/logo.jpeg" 
            alt="Twenty2Jobs" 
            className="mobile-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="logo-text">
            <h1>Twenty2Jobs</h1>
            <p>המרכז לעובדים ולמעסיקים</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="upload-main">
        <div className="upload-card">
          <h2 className="upload-title">
            <span className="icon">📄</span>
            שליחת קורות חיים
          </h2>
          <p className="upload-subtitle">
            העלו קובץ קורות חיים והמערכת תנתח אותו אוטומטית
          </p>

          {/* Upload Zone */}
          {status === 'idle' && (
            <div 
              className={`upload-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFilePicker}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={handleFileSelect}
                className="file-input"
              />
              
              {selectedFile ? (
                <div className="selected-file">
                  <div className="file-icon">
                    {selectedFile.name.endsWith('.pdf') ? '📕' : 
                     selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx') ? '📘' :
                     selectedFile.type?.startsWith('image/') || ['.jpg','.jpeg','.png','.gif','.webp','.heic'].some(ext => selectedFile.name.toLowerCase().endsWith(ext)) ? '🖼️' : '📄'}
                  </div>
                  <div className="file-info">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button 
                    className="remove-file"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="upload-prompt">
                  <div className="upload-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="upload-text">לחצו כאן או גררו קובץ</p>
                  <p className="upload-hint">PDF, Word או TXT (עד 10MB)</p>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {(status === 'uploading' || status === 'analyzing') && (
            <div className="progress-section">
              <div className="progress-icon">
                {status === 'uploading' ? '⬆️' : '🔍'}
              </div>
              <div className="progress-text">
                {status === 'uploading' ? 'מעלה קובץ...' : 'מנתח קורות חיים...'}
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-percent">{progress}%</div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && result && (
            <div className="success-section">
              <div className="success-icon">✅</div>
              <h3 className="success-title">
                {sharedSuccess ? '🔗 קו"ח התקבל מהשיתוף!' : 'קורות החיים הועלו בהצלחה!'}
              </h3>
              
              {result.name && (
                <div className="result-item">
                  <span className="result-label">שם:</span>
                  <span className="result-value">{result.name}</span>
                </div>
              )}
              
              {result.phone && (
                <div className="result-item">
                  <span className="result-label">טלפון:</span>
                  <span className="result-value">{result.phone}</span>
                </div>
              )}
              
              {result.email && (
                <div className="result-item">
                  <span className="result-label">אימייל:</span>
                  <span className="result-value">{result.email}</span>
                </div>
              )}
              
              {result.skills && result.skills.length > 0 && (
                <div className="result-skills">
                  <span className="result-label">תגיות:</span>
                  <div className="skills-list">
                    {result.skills.slice(0, 5).map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {sharedSuccess && (
                <div className="shared-tip">
                  <span>💡</span>
                  <p>טיפ: תוכלו לשתף קבצים נוספים ישירות מוואטסאפ!</p>
                </div>
              )}
              
              <button className="upload-another-btn" onClick={resetUpload}>
                <span>📄</span>
                להעלות קובץ נוסף
              </button>
            </div>
          )}

          {/* Error */}
          {(status === 'error' || error) && (
            <div className="error-section">
              <div className="error-icon">❌</div>
              <p className="error-text">{error}</p>
              <button className="retry-btn" onClick={resetUpload}>
                נסו שוב
              </button>
            </div>
          )}

          {/* Upload Button */}
          {status === 'idle' && selectedFile && (
            <button className="upload-btn" onClick={uploadFile}>
              <span>🚀</span>
              שלח קורות חיים
            </button>
          )}
        </div>

        {/* Features */}
        <div className="features-section">
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <span className="feature-text">ניתוח AI אוטומטי</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">תוצאות מיידיות</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span className="feature-text">מאובטח ופרטי</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mobile-footer">
        <p>© 2026 Twenty2Jobs - כל הזכויות שמורות</p>
      </footer>

      <style jsx>{`
        .mobile-upload-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%);
          font-family: 'Segoe UI', 'Rubik', 'Heebo', -apple-system, sans-serif;
        }

        /* Install Banner */
        .install-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: linear-gradient(135deg, #FF8C00 0%, #E67300 100%);
          color: white;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .install-banner-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .install-icon {
          font-size: 24px;
        }

        .install-text {
          display: flex;
          flex-direction: column;
        }

        .install-text strong {
          font-size: 14px;
        }

        .install-text span {
          font-size: 12px;
          opacity: 0.9;
        }

        .install-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .install-btn-small {
          padding: 8px 16px;
          background: white;
          color: #E67300;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .dismiss-btn {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 14px;
          cursor: pointer;
        }

        /* Header */
        .mobile-header {
          background: linear-gradient(135deg, #00A8A8 0%, #008080 100%);
          padding: 16px 20px;
          box-shadow: 0 4px 20px rgba(0, 168, 168, 0.3);
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .logo-text h1 {
          color: white;
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .logo-text p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          margin: 0;
        }

        /* Main */
        .upload-main {
          flex: 1;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .upload-card {
          background: white;
          border-radius: 24px;
          padding: 28px 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04);
        }

        .upload-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .upload-subtitle {
          color: #6b7280;
          font-size: 15px;
          margin: 0 0 24px 0;
        }

        /* Upload Zone */
        .upload-zone {
          border: 3px dashed #d1d5db;
          border-radius: 20px;
          padding: 40px 20px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
          background: #fafbfc;
        }

        .upload-zone:hover, .upload-zone.drag-active {
          border-color: #00A8A8;
          background: #e0f7f7;
          transform: scale(1.02);
        }

        .upload-zone.has-file {
          border-style: solid;
          border-color: #00A8A8;
          background: #e0f7f7;
          padding: 20px;
        }

        .file-input {
          display: none;
        }

        .upload-icon {
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .upload-zone:hover .upload-icon,
        .upload-zone.drag-active .upload-icon {
          color: #00A8A8;
        }

        .upload-text {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .upload-hint {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
        }

        /* Selected File */
        .selected-file {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 12px;
          text-align: right;
        }

        .file-icon {
          font-size: 36px;
          flex-shrink: 0;
        }

        .file-info {
          flex: 1;
          overflow: hidden;
        }

        .file-name {
          display: block;
          font-weight: 600;
          color: #1a1a2e;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 13px;
          color: #6b7280;
        }

        .remove-file {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #fee2e2;
          color: #ef4444;
          font-size: 16px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .remove-file:hover {
          background: #ef4444;
          color: white;
        }

        /* Progress */
        .progress-section {
          text-align: center;
          padding: 40px 20px;
        }

        .progress-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .progress-text {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 20px;
        }

        .progress-bar-container {
          height: 12px;
          background: #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #00A8A8 0%, #00D4D4 100%);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .progress-percent {
          font-size: 16px;
          font-weight: 600;
          color: #00A8A8;
        }

        /* Success */
        .success-section {
          text-align: center;
          padding: 20px 0;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .success-title {
          font-size: 20px;
          font-weight: 700;
          color: #10b981;
          margin: 0 0 24px 0;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f0fdf4;
          border-radius: 12px;
          margin-bottom: 10px;
        }

        .result-label {
          color: #6b7280;
          font-weight: 500;
        }

        .result-value {
          color: #1a1a2e;
          font-weight: 600;
        }

        .result-skills {
          padding: 16px;
          background: #f0fdf4;
          border-radius: 12px;
          margin-bottom: 10px;
        }

        .result-skills .result-label {
          display: block;
          margin-bottom: 10px;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-tag {
          padding: 6px 14px;
          background: linear-gradient(135deg, #00A8A8 0%, #008080 100%);
          color: white;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .shared-tip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
          border-radius: 12px;
          margin-top: 16px;
          border: 1px solid #93c5fd;
        }

        .shared-tip span {
          font-size: 24px;
        }

        .shared-tip p {
          margin: 0;
          font-size: 14px;
          color: #1e40af;
          text-align: right;
        }

        .upload-another-btn {
          margin-top: 24px;
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #00A8A8 0%, #008080 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(0, 168, 168, 0.4);
          transition: all 0.3s ease;
        }

        .upload-another-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 168, 168, 0.5);
        }

        /* Error */
        .error-section {
          text-align: center;
          padding: 40px 20px;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .error-text {
          font-size: 16px;
          color: #ef4444;
          margin: 0 0 20px 0;
        }

        .retry-btn {
          padding: 14px 32px;
          background: #fee2e2;
          color: #ef4444;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-btn:hover {
          background: #ef4444;
          color: white;
        }

        /* Upload Button */
        .upload-btn {
          margin-top: 20px;
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #FF8C00 0%, #E67300 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 6px 20px rgba(255, 140, 0, 0.4);
          transition: all 0.3s ease;
        }

        .upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 140, 0, 0.5);
        }

        .upload-btn:active {
          transform: translateY(0);
        }

        /* Features */
        .features-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .feature {
          background: white;
          padding: 16px 12px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .feature-icon {
          font-size: 28px;
          display: block;
          margin-bottom: 8px;
        }

        .feature-text {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        /* Footer */
        .mobile-footer {
          background: #1a1a2e;
          padding: 20px;
          text-align: center;
        }

        .mobile-footer p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          margin: 0;
        }

        /* Responsive */
        @media (min-width: 640px) {
          .upload-main {
            max-width: 500px;
            margin: 0 auto;
            padding: 32px 20px;
          }
          
          .upload-card {
            padding: 36px 28px;
          }
          
          .upload-title {
            font-size: 28px;
          }
        }

        /* iOS safe areas */
        @supports (padding-top: env(safe-area-inset-top)) {
          .mobile-header {
            padding-top: calc(16px + env(safe-area-inset-top));
          }
          
          .mobile-footer {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  )
}
