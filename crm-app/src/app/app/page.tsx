'use client'

import { useState, useRef, useEffect } from 'react'

type AppScreen = 'home' | 'upload' | 'success' | 'history'

interface UploadedCV {
  id: string
  name: string
  date: string
  status: 'pending' | 'processed'
}

export default function MobileApp() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lastUpload, setLastUpload] = useState<{name?: string, id?: string} | null>(null)
  const [history, setHistory] = useState<UploadedCV[]>([])
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // בדיקה אם הגיע קובץ משיתוף
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('shared') === 'true') {
      setScreen('upload')
    }
    if (params.get('success') === 'true') {
      setLastUpload({
        name: params.get('name') || undefined,
        id: params.get('candidateId') || undefined
      })
      setScreen('success')
      window.history.replaceState({}, '', '/app')
    }
    if (params.get('error')) {
      setError(decodeURIComponent(params.get('error') || ''))
      window.history.replaceState({}, '', '/app')
    }
  }, [])

  // טעינת היסטוריה מ-localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cv-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
        setError('קובץ לא נתמך. PDF, Word או TXT בלבד')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('הקובץ גדול מדי (מקס׳ 10MB)')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const uploadFile = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    setProgress(0)
    setError('')
    
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 15, 85))
    }, 300)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(interval)
      setProgress(100)
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'שגיאה בהעלאה')
      }
      
      const data = await res.json()
      
      // שמירה בהיסטוריה
      const newEntry: UploadedCV = {
        id: data.candidate?.id || Date.now().toString(),
        name: data.candidate?.name || selectedFile.name,
        date: new Date().toLocaleDateString('he-IL'),
        status: 'processed'
      }
      const newHistory = [newEntry, ...history].slice(0, 20)
      setHistory(newHistory)
      localStorage.setItem('cv-history', JSON.stringify(newHistory))
      
      setLastUpload({
        name: data.candidate?.name,
        id: data.candidate?.id
      })
      setSelectedFile(null)
      setScreen('success')
      
    } catch (err: any) {
      clearInterval(interval)
      setError(err.message)
      setUploading(false)
      setProgress(0)
    }
  }

  // מסך הבית
  const HomeScreen = () => (
    <div className="screen home-screen">
      <div className="welcome-section">
        <div className="app-icon">📋</div>
        <h1>Twenty2Jobs</h1>
        <p>העלאת קורות חיים חכמה</p>
      </div>
      
      <div className="action-buttons">
        <button className="main-action" onClick={() => setScreen('upload')}>
          <span className="btn-icon">📤</span>
          <span className="btn-text">העלאת קו״ח</span>
          <span className="btn-arrow">←</span>
        </button>
        
        <button className="secondary-action" onClick={() => setScreen('history')}>
          <span className="btn-icon">📁</span>
          <span className="btn-text">היסטוריה</span>
          <span className="btn-badge">{history.length}</span>
        </button>
      </div>
      
      <div className="quick-tip">
        <span className="tip-icon">💡</span>
        <p>קיבלת קו״ח בוואטסאפ? לחץ שיתוף ובחר Twenty2Jobs!</p>
      </div>
    </div>
  )

  // מסך העלאה
  const UploadScreen = () => (
    <div className="screen upload-screen">
      <button className="back-btn" onClick={() => { setScreen('home'); setSelectedFile(null); setError(''); }}>
        → חזרה
      </button>
      
      <div className="upload-header">
        <div className="upload-icon">📄</div>
        <h2>העלאת קורות חיים</h2>
        <p>PDF, Word או קובץ טקסט</p>
      </div>
      
      {error && (
        <div className="error-box">
          <span>⚠️</span> {error}
        </div>
      )}
      
      {!uploading ? (
        <>
          <div 
            className={`drop-zone ${selectedFile ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              hidden
            />
            
            {selectedFile ? (
              <div className="file-preview">
                <span className="file-icon">
                  {selectedFile.name.endsWith('.pdf') ? '📕' : '📘'}
                </span>
                <div className="file-details">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="drop-content">
                <span className="drop-icon">📁</span>
                <span className="drop-text">לחץ לבחירת קובץ</span>
              </div>
            )}
          </div>
          
          {selectedFile && (
            <button className="upload-btn" onClick={uploadFile}>
              <span>🚀</span> העלה עכשיו
            </button>
          )}
        </>
      ) : (
        <div className="uploading-state">
          <div className="spinner"></div>
          <p>מעלה ומנתח...</p>
          <div className="progress-track">
            <div className="progress-fill" style={{width: `${progress}%`}}></div>
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}
    </div>
  )

  // מסך הצלחה
  const SuccessScreen = () => (
    <div className="screen success-screen">
      <div className="success-animation">
        <div className="check-circle">✓</div>
      </div>
      
      <h2>הועלה בהצלחה!</h2>
      
      {lastUpload?.name && (
        <div className="result-box">
          <span className="result-label">שם המועמד:</span>
          <span className="result-value">{lastUpload.name}</span>
        </div>
      )}
      
      <div className="success-actions">
        <button className="primary-btn" onClick={() => { setScreen('upload'); setUploading(false); setProgress(0); }}>
          <span>📤</span> העלה עוד
        </button>
        <button className="secondary-btn" onClick={() => setScreen('home')}>
          <span>🏠</span> מסך ראשי
        </button>
      </div>
    </div>
  )

  // מסך היסטוריה
  const HistoryScreen = () => (
    <div className="screen history-screen">
      <button className="back-btn" onClick={() => setScreen('home')}>
        → חזרה
      </button>
      
      <h2>היסטוריית העלאות</h2>
      
      {history.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>עדיין לא העלית קורות חיים</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <span className="item-icon">📄</span>
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-date">{item.date}</span>
              </div>
              <span className="item-status">✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="mobile-app" dir="rtl">
      {screen === 'home' && <HomeScreen />}
      {screen === 'upload' && <UploadScreen />}
      {screen === 'success' && <SuccessScreen />}
      {screen === 'history' && <HistoryScreen />}
      
      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={screen === 'home' ? 'active' : ''}
          onClick={() => setScreen('home')}
        >
          <span>🏠</span>
          <label>ראשי</label>
        </button>
        <button 
          className={screen === 'upload' ? 'active' : ''}
          onClick={() => { setScreen('upload'); setUploading(false); setProgress(0); setError(''); }}
        >
          <span>📤</span>
          <label>העלאה</label>
        </button>
        <button 
          className={screen === 'history' ? 'active' : ''}
          onClick={() => setScreen('history')}
        >
          <span>📁</span>
          <label>היסטוריה</label>
        </button>
      </nav>

      <style jsx>{`
        .mobile-app {
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
          padding-bottom: 80px;
        }

        .screen {
          flex: 1;
          padding: 24px 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Home Screen */
        .welcome-section {
          text-align: center;
          padding: 40px 0 32px;
        }

        .app-icon {
          font-size: 64px;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }

        .welcome-section h1 {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px;
          letter-spacing: -1px;
        }

        .welcome-section p {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .main-action {
          display: flex;
          align-items: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #00A8A8 0%, #008B8B 100%);
          border: none;
          border-radius: 20px;
          color: white;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(0, 168, 168, 0.35);
          transition: all 0.2s;
        }

        .main-action:active {
          transform: scale(0.98);
        }

        .btn-icon {
          font-size: 28px;
          margin-left: 16px;
        }

        .btn-text {
          flex: 1;
          text-align: right;
        }

        .btn-arrow {
          font-size: 24px;
          opacity: 0.8;
        }

        .secondary-action {
          display: flex;
          align-items: center;
          padding: 18px 24px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          color: #334155;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-action:active {
          transform: scale(0.98);
          background: #f8fafc;
        }

        .btn-badge {
          background: #00A8A8;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
        }

        .quick-tip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 16px;
          border: 1px solid #fbbf24;
        }

        .tip-icon {
          font-size: 24px;
        }

        .quick-tip p {
          margin: 0;
          font-size: 14px;
          color: #92400e;
          font-weight: 500;
          line-height: 1.4;
        }

        /* Upload Screen */
        .back-btn {
          background: none;
          border: none;
          color: #00A8A8;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 24px;
        }

        .upload-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .upload-header .upload-icon {
          font-size: 56px;
          margin-bottom: 12px;
        }

        .upload-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px;
        }

        .upload-header p {
          font-size: 15px;
          color: #64748b;
          margin: 0;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .drop-zone {
          border: 3px dashed #cbd5e1;
          border-radius: 24px;
          padding: 48px 24px;
          text-align: center;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .drop-zone:active {
          border-color: #00A8A8;
          background: #f0fdfa;
        }

        .drop-zone.has-file {
          border-style: solid;
          border-color: #00A8A8;
          padding: 20px;
        }

        .drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .drop-icon {
          font-size: 48px;
          opacity: 0.7;
        }

        .drop-text {
          font-size: 17px;
          font-weight: 600;
          color: #64748b;
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .file-preview .file-icon {
          font-size: 44px;
        }

        .file-details {
          flex: 1;
          text-align: right;
        }

        .file-name {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
          word-break: break-all;
        }

        .file-size {
          font-size: 13px;
          color: #64748b;
        }

        .remove-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #fee2e2;
          color: #ef4444;
          font-size: 18px;
          cursor: pointer;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          margin-top: 24px;
          padding: 18px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
        }

        .upload-btn:active {
          transform: scale(0.98);
        }

        .uploading-state {
          text-align: center;
          padding: 40px 0;
        }

        .spinner {
          width: 56px;
          height: 56px;
          border: 4px solid #e2e8f0;
          border-top-color: #00A8A8;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .uploading-state p {
          font-size: 18px;
          font-weight: 600;
          color: #334155;
          margin: 0 0 20px;
        }

        .progress-track {
          height: 10px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00A8A8 0%, #14b8a6 100%);
          border-radius: 10px;
          transition: width 0.3s;
        }

        .progress-text {
          font-size: 16px;
          font-weight: 700;
          color: #00A8A8;
        }

        /* Success Screen */
        .success-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding-top: 60px;
        }

        .success-animation {
          margin-bottom: 24px;
        }

        .check-circle {
          width: 96px;
          height: 96px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
          animation: popIn 0.4s ease;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
        }

        @keyframes popIn {
          0% { transform: scale(0); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .success-screen h2 {
          font-size: 28px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 24px;
        }

        .result-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px 32px;
          background: #ecfdf5;
          border-radius: 16px;
          margin-bottom: 32px;
        }

        .result-label {
          font-size: 13px;
          color: #64748b;
        }

        .result-value {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 300px;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: linear-gradient(135deg, #00A8A8 0%, #008B8B 100%);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
        }

        .secondary-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          color: #334155;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
        }

        /* History Screen */
        .history-screen h2 {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 20px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 0;
        }

        .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state p {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .item-icon {
          font-size: 32px;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .item-date {
          font-size: 13px;
          color: #64748b;
        }

        .item-status {
          width: 28px;
          height: 28px;
          background: #dcfce7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16a34a;
          font-size: 14px;
          font-weight: bold;
        }

        /* Bottom Navigation */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          background: white;
          border-top: 1px solid #e2e8f0;
          padding: 8px 0;
          padding-bottom: max(8px, env(safe-area-inset-bottom));
          box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        }

        .bottom-nav button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          transition: color 0.2s;
        }

        .bottom-nav button span {
          font-size: 24px;
        }

        .bottom-nav button label {
          font-size: 11px;
          font-weight: 600;
        }

        .bottom-nav button.active {
          color: #00A8A8;
        }

        .bottom-nav button.active span {
          transform: scale(1.1);
        }

        /* Safe areas for iOS */
        @supports (padding-top: env(safe-area-inset-top)) {
          .mobile-app {
            padding-top: env(safe-area-inset-top);
          }
        }
      `}</style>
    </div>
  )
}
