'use client'

import { useState, useEffect } from 'react'

type Page = 'dashboard' | 'candidates' | 'positions' | 'employers' | 'upload'

const pages: Record<Page, { url: string; label: string; icon: string }> = {
  dashboard: { url: '/dashboard', label: 'דשבורד', icon: '🏠' },
  candidates: { url: '/dashboard/candidates', label: 'מועמדים', icon: '👥' },
  positions: { url: '/dashboard/positions', label: 'משרות', icon: '💼' },
  employers: { url: '/dashboard/employers', label: 'לקוחות', icon: '🏢' },
  upload: { url: '/upload-cv', label: 'העלאה', icon: '📤' },
}

export default function MobileShell() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [isLoading, setIsLoading] = useState(true)

  // Handle shared files from WhatsApp
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('shared') === 'true' || params.get('success') === 'true') {
      setCurrentPage('upload')
    }
  }, [])

  const handlePageChange = (page: Page) => {
    setIsLoading(true)
    setCurrentPage(page)
  }

  return (
    <div className="mobile-shell" dir="rtl">
      {/* Top Bar */}
      <header className="top-bar">
        <span className="logo">Twenty2Jobs</span>
        <span className="current-page">{pages[currentPage].icon} {pages[currentPage].label}</span>
      </header>

      {/* Main Content - iframe showing actual site */}
      <main className="content-frame">
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>טוען...</p>
          </div>
        )}
        <iframe
          src={pages[currentPage].url}
          className="site-frame"
          onLoad={() => setIsLoading(false)}
          title={pages[currentPage].label}
        />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {(Object.keys(pages) as Page[]).map((page) => (
          <button
            key={page}
            className={currentPage === page ? 'active' : ''}
            onClick={() => handlePageChange(page)}
          >
            <span className="nav-icon">{pages[page].icon}</span>
            <span className="nav-label">{pages[page].label}</span>
          </button>
        ))}
      </nav>

      <style jsx>{`
        .mobile-shell {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          background: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #00A8A8, #008B8B);
          color: white;
          padding-top: max(12px, env(safe-area-inset-top));
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
          z-index: 10;
        }

        .logo {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .current-page {
          font-size: 14px;
          opacity: 0.95;
          font-weight: 600;
        }

        /* Content Frame */
        .content-frame {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .site-frame {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #00A8A8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-overlay p {
          color: #64748b;
          font-size: 15px;
          margin: 0;
        }

        /* Bottom Navigation */
        .bottom-nav {
          display: flex;
          background: white;
          border-top: 1px solid #e2e8f0;
          padding: 6px 0;
          padding-bottom: max(6px, env(safe-area-inset-bottom));
          box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
          z-index: 10;
        }

        .bottom-nav button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 8px 4px;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.2s;
        }

        .bottom-nav button:active {
          transform: scale(0.95);
        }

        .bottom-nav button.active {
          color: #00A8A8;
        }

        .nav-icon {
          font-size: 22px;
        }

        .nav-label {
          font-size: 10px;
          font-weight: 600;
        }

        /* Make sure iframe content is touch-friendly */
        .site-frame {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  )
}
