'use client'

import { useState, useRef, useEffect } from 'react'

type Screen = 'home' | 'candidates' | 'positions' | 'employers' | 'upload' | 'candidate-detail' | 'position-detail'

interface Candidate {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  createdAt: string
  tags: { name: string }[]
}

interface Position {
  id: string
  title: string
  location: string | null
  salary: string | null
  employer: { name: string } | null
  status: string
  createdAt: string
}

interface Employer {
  id: string
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  _count?: { positions: number }
}

interface Stats {
  candidates: number
  positions: number
  employers: number
  newToday: number
}

export default function MobileApp() {
  const [screen, setScreen] = useState<Screen>('home')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({ candidates: 0, positions: 0, employers: 0, newToday: 0 })
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [employers, setEmployers] = useState<Employer[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<{name?: string, id?: string} | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // טעינת נתונים ראשונית
  useEffect(() => {
    loadStats()
  }, [])

  // בדיקת פרמטרים מ-URL (שיתוף)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      setUploadResult({
        name: params.get('name') || undefined,
        id: params.get('candidateId') || undefined
      })
      setScreen('upload')
      window.history.replaceState({}, '', '/app')
    }
    if (params.get('error')) {
      setError(decodeURIComponent(params.get('error') || ''))
      window.history.replaceState({}, '', '/app')
    }
  }, [])

  const loadStats = async () => {
    try {
      const [candRes, posRes, empRes] = await Promise.all([
        fetch('/api/candidates?limit=1'),
        fetch('/api/positions?limit=1'),
        fetch('/api/employers?limit=1')
      ])
      
      const candData = await candRes.json().catch(() => ({}))
      const posData = await posRes.json().catch(() => ({}))
      const empData = await empRes.json().catch(() => ({}))
      
      setStats({
        candidates: candData.total || candData.candidates?.length || 0,
        positions: posData.total || posData.positions?.length || posData.length || 0,
        employers: empData.total || empData.employers?.length || empData.length || 0,
        newToday: 0
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const loadCandidates = async (search?: string) => {
    setLoading(true)
    try {
      const url = search ? `/api/candidates?search=${encodeURIComponent(search)}&limit=50` : '/api/candidates?limit=50'
      const res = await fetch(url)
      const data = await res.json()
      setCandidates(data.candidates || [])
    } catch (err) {
      console.error('Error loading candidates:', err)
    }
    setLoading(false)
  }

  const loadPositions = async (search?: string) => {
    setLoading(true)
    try {
      const url = search ? `/api/positions?search=${encodeURIComponent(search)}&limit=50` : '/api/positions?limit=50'
      const res = await fetch(url)
      const data = await res.json()
      setPositions(data.positions || data || [])
    } catch (err) {
      console.error('Error loading positions:', err)
    }
    setLoading(false)
  }

  const loadEmployers = async (search?: string) => {
    setLoading(true)
    try {
      const url = search ? `/api/employers?search=${encodeURIComponent(search)}&limit=50` : '/api/employers?limit=50'
      const res = await fetch(url)
      const data = await res.json()
      setEmployers(data.employers || data || [])
    } catch (err) {
      console.error('Error loading employers:', err)
    }
    setLoading(false)
  }

  const handleSearch = () => {
    if (screen === 'candidates') loadCandidates(searchQuery)
    else if (screen === 'positions') loadPositions(searchQuery)
    else if (screen === 'employers') loadEmployers(searchQuery)
  }

  const navigateTo = (newScreen: Screen) => {
    setScreen(newScreen)
    setSearchQuery('')
    setError('')
    if (newScreen === 'candidates') loadCandidates()
    else if (newScreen === 'positions') loadPositions()
    else if (newScreen === 'employers') loadEmployers()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
        setError('קובץ לא נתמך')
        return
      }
      setSelectedFile(file)
      setError('')
      setUploadResult(null)
    }
  }

  const uploadFile = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadProgress(0)
    
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 15, 85))
    }, 300)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      
      clearInterval(interval)
      setUploadProgress(100)
      
      if (!res.ok) throw new Error('שגיאה בהעלאה')
      
      const data = await res.json()
      setUploadResult({ name: data.candidate?.name, id: data.candidate?.id })
      setSelectedFile(null)
      loadStats()
    } catch (err: any) {
      setError(err.message)
    }
    clearInterval(interval)
    setUploading(false)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'חדש': '#3b82f6',
      'בטיפול': '#f59e0b', 
      'נשלח ללקוח': '#8b5cf6',
      'ראיון': '#10b981',
      'התקבל': '#22c55e',
      'לא מתאים': '#ef4444',
      'פעיל': '#10b981',
      'פעילה': '#10b981',
      'סגור': '#6b7280',
      'סגורה': '#6b7280'
    }
    return colors[status] || '#6b7280'
  }

  // === SCREENS ===

  const HomeScreen = () => (
    <div className="screen">
      <div className="home-header">
        <h1>Twenty2Jobs</h1>
        <p>מערכת ניהול גיוס</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigateTo('candidates')}>
          <span className="stat-icon">👥</span>
          <span className="stat-number">{stats.candidates}</span>
          <span className="stat-label">מועמדים</span>
        </div>
        <div className="stat-card" onClick={() => navigateTo('positions')}>
          <span className="stat-icon">💼</span>
          <span className="stat-number">{stats.positions}</span>
          <span className="stat-label">משרות</span>
        </div>
        <div className="stat-card" onClick={() => navigateTo('employers')}>
          <span className="stat-icon">🏢</span>
          <span className="stat-number">{stats.employers}</span>
          <span className="stat-label">לקוחות</span>
        </div>
        <div className="stat-card highlight" onClick={() => navigateTo('upload')}>
          <span className="stat-icon">📤</span>
          <span className="stat-number">+</span>
          <span className="stat-label">העלה קו"ח</span>
        </div>
      </div>

      <div className="quick-actions">
        <button className="action-btn primary" onClick={() => navigateTo('upload')}>
          <span>📤</span> העלאת קו"ח חדש
        </button>
        <button className="action-btn" onClick={() => navigateTo('candidates')}>
          <span>👥</span> צפה במועמדים
        </button>
        <button className="action-btn" onClick={() => navigateTo('positions')}>
          <span>💼</span> צפה במשרות
        </button>
      </div>

      <div className="tip-box">
        <span>💡</span>
        <p>קיבלת קו"ח בוואטסאפ? לחץ שיתוף ← בחר Twenty2Jobs</p>
      </div>
    </div>
  )

  const CandidatesScreen = () => (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')}>→</button>
        <h2>👥 מועמדים</h2>
        <span className="count-badge">{candidates.length}</span>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="חיפוש לפי שם, טלפון, מייל..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>טוען מועמדים...</p>
        </div>
      ) : (
        <div className="list">
          {candidates.map((c) => (
            <div key={c.id} className="list-item" onClick={() => { setSelectedCandidate(c); setScreen('candidate-detail'); }}>
              <div className="item-avatar">👤</div>
              <div className="item-info">
                <span className="item-name">{c.name}</span>
                <span className="item-sub">{c.phone || c.email || 'אין פרטים'}</span>
                {c.tags?.length > 0 && (
                  <div className="item-tags">
                    {c.tags.slice(0, 2).map(t => <span key={t.name} className="tag">{t.name}</span>)}
                  </div>
                )}
              </div>
              <span className="item-status" style={{background: getStatusColor(c.status)}}>{c.status}</span>
            </div>
          ))}
          {candidates.length === 0 && <div className="empty">לא נמצאו מועמדים</div>}
        </div>
      )}
    </div>
  )

  const PositionsScreen = () => (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')}>→</button>
        <h2>💼 משרות</h2>
        <span className="count-badge">{positions.length}</span>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="חיפוש משרה..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>טוען משרות...</p>
        </div>
      ) : (
        <div className="list">
          {positions.map((p) => (
            <div key={p.id} className="list-item" onClick={() => { setSelectedPosition(p); setScreen('position-detail'); }}>
              <div className="item-avatar">💼</div>
              <div className="item-info">
                <span className="item-name">{p.title}</span>
                <span className="item-sub">{p.employer?.name || 'לא משויך'} • {p.location || 'לא צוין'}</span>
                {p.salary && <span className="item-salary">💰 {p.salary}</span>}
              </div>
              <span className="item-status" style={{background: getStatusColor(p.status)}}>{p.status}</span>
            </div>
          ))}
          {positions.length === 0 && <div className="empty">לא נמצאו משרות</div>}
        </div>
      )}
    </div>
  )

  const EmployersScreen = () => (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('home')}>→</button>
        <h2>🏢 לקוחות</h2>
        <span className="count-badge">{employers.length}</span>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="חיפוש לקוח..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>טוען לקוחות...</p>
        </div>
      ) : (
        <div className="list">
          {employers.map((e) => (
            <div key={e.id} className="list-item">
              <div className="item-avatar">🏢</div>
              <div className="item-info">
                <span className="item-name">{e.name}</span>
                <span className="item-sub">{e.contactPerson || 'אין איש קשר'}</span>
                <span className="item-sub">{e.phone || e.email || ''}</span>
              </div>
              <span className="item-count">{e._count?.positions || 0} משרות</span>
            </div>
          ))}
          {employers.length === 0 && <div className="empty">לא נמצאו לקוחות</div>}
        </div>
      )}
    </div>
  )

  const CandidateDetailScreen = () => (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('candidates')}>→</button>
        <h2>פרטי מועמד</h2>
      </div>

      {selectedCandidate && (
        <div className="detail-card">
          <div className="detail-header">
            <div className="detail-avatar">👤</div>
            <h3>{selectedCandidate.name}</h3>
            <span className="detail-status" style={{background: getStatusColor(selectedCandidate.status)}}>
              {selectedCandidate.status}
            </span>
          </div>

          <div className="detail-section">
            {selectedCandidate.phone && (
              <a href={`tel:${selectedCandidate.phone}`} className="detail-row clickable">
                <span className="detail-icon">📞</span>
                <span>{selectedCandidate.phone}</span>
              </a>
            )}
            {selectedCandidate.email && (
              <a href={`mailto:${selectedCandidate.email}`} className="detail-row clickable">
                <span className="detail-icon">📧</span>
                <span>{selectedCandidate.email}</span>
              </a>
            )}
            <div className="detail-row">
              <span className="detail-icon">📅</span>
              <span>נוצר: {new Date(selectedCandidate.createdAt).toLocaleDateString('he-IL')}</span>
            </div>
          </div>

          {selectedCandidate.tags?.length > 0 && (
            <div className="detail-section">
              <h4>תגיות</h4>
              <div className="tags-list">
                {selectedCandidate.tags.map(t => <span key={t.name} className="tag">{t.name}</span>)}
              </div>
            </div>
          )}

          <div className="detail-actions">
            {selectedCandidate.phone && (
              <a href={`https://wa.me/972${selectedCandidate.phone.replace(/^0/, '').replace(/-/g, '')}`} className="action-btn whatsapp" target="_blank">
                <span>💬</span> וואטסאפ
              </a>
            )}
            {selectedCandidate.phone && (
              <a href={`tel:${selectedCandidate.phone}`} className="action-btn">
                <span>📞</span> התקשר
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const PositionDetailScreen = () => (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setScreen('positions')}>→</button>
        <h2>פרטי משרה</h2>
      </div>

      {selectedPosition && (
        <div className="detail-card">
          <div className="detail-header">
            <div className="detail-avatar">💼</div>
            <h3>{selectedPosition.title}</h3>
            <span className="detail-status" style={{background: getStatusColor(selectedPosition.status)}}>
              {selectedPosition.status}
            </span>
          </div>

          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-icon">🏢</span>
              <span>{selectedPosition.employer?.name || 'לא משויך'}</span>
            </div>
            {selectedPosition.location && (
              <div className="detail-row">
                <span className="detail-icon">📍</span>
                <span>{selectedPosition.location}</span>
              </div>
            )}
            {selectedPosition.salary && (
              <div className="detail-row">
                <span className="detail-icon">💰</span>
                <span>{selectedPosition.salary}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-icon">📅</span>
              <span>נוצר: {new Date(selectedPosition.createdAt).toLocaleDateString('he-IL')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const UploadScreen = () => (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => { setScreen('home'); setUploadResult(null); setSelectedFile(null); }}>→</button>
        <h2>📤 העלאת קו"ח</h2>
      </div>

      {error && <div className="error-box">⚠️ {error}</div>}

      {uploadResult ? (
        <div className="success-box">
          <div className="success-icon">✓</div>
          <h3>הועלה בהצלחה!</h3>
          {uploadResult.name && <p>שם: {uploadResult.name}</p>}
          <button className="action-btn primary" onClick={() => { setUploadResult(null); setSelectedFile(null); }}>
            העלה עוד
          </button>
        </div>
      ) : uploading ? (
        <div className="upload-progress">
          <div className="spinner"></div>
          <p>מעלה ומנתח...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${uploadProgress}%`}}></div>
          </div>
        </div>
      ) : (
        <>
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileSelect} hidden />
            {selectedFile ? (
              <div className="file-selected">
                <span className="file-icon">{selectedFile.name.endsWith('.pdf') ? '📕' : '📘'}</span>
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{(selectedFile.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <>
                <span className="upload-icon">📁</span>
                <p>לחץ לבחירת קובץ</p>
                <span className="hint">PDF, Word, TXT</span>
              </>
            )}
          </div>

          {selectedFile && (
            <button className="action-btn primary full" onClick={uploadFile}>
              <span>🚀</span> העלה עכשיו
            </button>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="app" dir="rtl">
      {screen === 'home' && <HomeScreen />}
      {screen === 'candidates' && <CandidatesScreen />}
      {screen === 'positions' && <PositionsScreen />}
      {screen === 'employers' && <EmployersScreen />}
      {screen === 'candidate-detail' && <CandidateDetailScreen />}
      {screen === 'position-detail' && <PositionDetailScreen />}
      {screen === 'upload' && <UploadScreen />}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className={screen === 'home' ? 'active' : ''} onClick={() => setScreen('home')}>
          <span>🏠</span><label>ראשי</label>
        </button>
        <button className={screen === 'candidates' || screen === 'candidate-detail' ? 'active' : ''} onClick={() => navigateTo('candidates')}>
          <span>👥</span><label>מועמדים</label>
        </button>
        <button className={screen === 'upload' ? 'active' : ''} onClick={() => navigateTo('upload')}>
          <span>📤</span><label>העלאה</label>
        </button>
        <button className={screen === 'positions' || screen === 'position-detail' ? 'active' : ''} onClick={() => navigateTo('positions')}>
          <span>💼</span><label>משרות</label>
        </button>
        <button className={screen === 'employers' ? 'active' : ''} onClick={() => navigateTo('employers')}>
          <span>🏢</span><label>לקוחות</label>
        </button>
      </nav>

      <style jsx>{`
        .app {
          min-height: 100vh;
          min-height: 100dvh;
          background: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding-bottom: 70px;
        }

        .screen {
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Home Screen */
        .home-header {
          text-align: center;
          padding: 24px 0;
          background: linear-gradient(135deg, #00A8A8, #008B8B);
          margin: -16px -16px 20px;
          color: white;
        }

        .home-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
        }

        .home-header p {
          margin: 4px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .stat-card:active {
          transform: scale(0.96);
        }

        .stat-card.highlight {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid #86efac;
        }

        .stat-icon {
          font-size: 28px;
          display: block;
        }

        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          display: block;
          margin: 4px 0;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          background: white;
          color: #334155;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          text-decoration: none;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #00A8A8, #008B8B);
          color: white;
          box-shadow: 0 4px 12px rgba(0,168,168,0.3);
        }

        .action-btn.whatsapp {
          background: #25D366;
          color: white;
        }

        .action-btn.full {
          margin-top: 16px;
        }

        .action-btn:active {
          transform: scale(0.98);
        }

        .tip-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
          background: #fef3c7;
          border-radius: 12px;
          border: 1px solid #fbbf24;
        }

        .tip-box p {
          margin: 0;
          font-size: 13px;
          color: #92400e;
        }

        /* Screen Header */
        .screen-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .back-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #f1f5f9;
          border-radius: 10px;
          font-size: 18px;
          cursor: pointer;
        }

        .screen-header h2 {
          flex: 1;
          margin: 0;
          font-size: 20px;
          color: #0f172a;
        }

        .count-badge {
          background: #00A8A8;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        /* Search */
        .search-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .search-bar input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          outline: none;
        }

        .search-bar input:focus {
          border-color: #00A8A8;
        }

        .search-bar button {
          width: 48px;
          border: none;
          background: #00A8A8;
          color: white;
          border-radius: 12px;
          font-size: 18px;
          cursor: pointer;
        }

        /* List */
        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: white;
          border-radius: 14px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          cursor: pointer;
        }

        .list-item:active {
          background: #f8fafc;
        }

        .item-avatar {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-name {
          display: block;
          font-weight: 600;
          color: #0f172a;
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-sub {
          display: block;
          font-size: 13px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-salary {
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }

        .item-tags {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }

        .tag {
          padding: 3px 8px;
          background: #e0f2fe;
          color: #0369a1;
          border-radius: 6px;
          font-size: 11px;
        }

        .item-status {
          padding: 4px 10px;
          border-radius: 8px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .item-count {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        .loading .spinner {
          margin: 0 auto 12px;
        }

        .empty {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        /* Detail Screen */
        .detail-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }

        .detail-header {
          text-align: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }

        .detail-avatar {
          width: 64px;
          height: 64px;
          background: #f1f5f9;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 12px;
        }

        .detail-header h3 {
          margin: 0 0 8px;
          font-size: 22px;
          color: #0f172a;
        }

        .detail-status {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 20px;
          color: white;
          font-size: 13px;
          font-weight: 600;
        }

        .detail-section {
          margin-bottom: 16px;
        }

        .detail-section h4 {
          margin: 0 0 10px;
          font-size: 14px;
          color: #64748b;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          font-size: 15px;
        }

        .detail-row.clickable {
          text-decoration: none;
          color: #0369a1;
        }

        .detail-icon {
          font-size: 18px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tags-list .tag {
          padding: 6px 12px;
          font-size: 13px;
        }

        .detail-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .detail-actions .action-btn {
          flex: 1;
        }

        /* Upload Screen */
        .upload-zone {
          border: 3px dashed #cbd5e1;
          border-radius: 20px;
          padding: 40px 20px;
          text-align: center;
          background: white;
          cursor: pointer;
        }

        .upload-zone:active {
          border-color: #00A8A8;
          background: #f0fdfa;
        }

        .upload-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }

        .upload-zone p {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: #334155;
        }

        .hint {
          font-size: 13px;
          color: #94a3b8;
        }

        .file-selected {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .file-icon {
          font-size: 44px;
        }

        .file-name {
          font-weight: 600;
          color: #0f172a;
          word-break: break-all;
        }

        .file-size {
          font-size: 13px;
          color: #64748b;
        }

        .upload-progress {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #00A8A8;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .progress-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 16px;
        }

        .progress-fill {
          height: 100%;
          background: #00A8A8;
          transition: width 0.3s;
        }

        .success-box {
          text-align: center;
          padding: 40px 20px;
          background: white;
          border-radius: 20px;
        }

        .success-icon {
          width: 72px;
          height: 72px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          color: white;
          margin: 0 auto 16px;
        }

        .success-box h3 {
          margin: 0 0 8px;
          color: #10b981;
          font-size: 22px;
        }

        .success-box p {
          margin: 0 0 20px;
          color: #64748b;
        }

        .error-box {
          padding: 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          margin-bottom: 16px;
          font-size: 14px;
        }

        /* Bottom Nav */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          background: white;
          border-top: 1px solid #e2e8f0;
          padding: 6px 0;
          padding-bottom: max(6px, env(safe-area-inset-bottom));
          box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
        }

        .bottom-nav button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 4px;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .bottom-nav button span {
          font-size: 22px;
        }

        .bottom-nav button label {
          font-size: 10px;
          font-weight: 600;
        }

        .bottom-nav button.active {
          color: #00A8A8;
        }

        /* Safe areas */
        @supports (padding-top: env(safe-area-inset-top)) {
          .home-header {
            padding-top: calc(24px + env(safe-area-inset-top));
            margin-top: calc(-16px - env(safe-area-inset-top));
          }
        }
      `}</style>
    </div>
  )
}
