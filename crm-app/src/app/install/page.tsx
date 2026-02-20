'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function MobileInstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // זיהוי מכשיר
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    
    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)
    
    // בדיקה אם כבר מותקן
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone === true)
    setIsStandalone(isRunningStandalone)

    // האזנה לאירוע beforeinstallprompt (לאנדרואיד)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    }
  }

  return (
    <div className="install-container" dir="rtl">
      {/* Header */}
      <header className="install-header">
        <img 
          src="/logo.jpeg" 
          alt="Twenty2Jobs" 
          className="install-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <h1>Twenty2Jobs</h1>
        <p>המרכז לעובדים ולמעסיקים בישראל</p>
      </header>

      {/* Main Content */}
      <main className="install-main">
        {isStandalone ? (
          <div className="already-installed">
            <div className="success-icon">✅</div>
            <h2>האפליקציה מותקנת!</h2>
            <p>תהנו מהגישה המהירה לשליחת קורות חיים</p>
            <a href="/upload-cv" className="start-btn">
              <span>🚀</span>
              התחל להשתמש
            </a>
          </div>
        ) : (
          <>
            <div className="app-preview">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-icon">
                    <span className="icon-22">22</span>
                  </div>
                  <p>Twenty2Jobs</p>
                </div>
              </div>
            </div>

            <h2 className="install-title">התקינו את האפליקציה</h2>
            <p className="install-subtitle">
              גישה מהירה מהמסך הראשי שלכם
            </p>

            <div className="features">
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <div>
                  <strong>מהיר</strong>
                  <p>נפתח מיד מהמסך הראשי</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <div>
                  <strong>כמו אפליקציה</strong>
                  <p>חוויה מלאה ללא דפדפן</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">📄</span>
                <div>
                  <strong>שליחת קו"ח</strong>
                  <p>העלאה קלה ומהירה</p>
                </div>
              </div>
            </div>

            {/* Android Install Button */}
            {isAndroid && deferredPrompt && (
              <button className="install-btn" onClick={handleInstallClick}>
                <span>📥</span>
                התקן עכשיו
              </button>
            )}

            {/* iOS Instructions Button */}
            {isIOS && (
              <button className="install-btn ios" onClick={handleInstallClick}>
                <span>📲</span>
                הוסף למסך הבית
              </button>
            )}

            {/* Desktop fallback */}
            {!isIOS && !isAndroid && (
              <div className="desktop-message">
                <p>📱 לחוויה הטובה ביותר, פתחו בטלפון</p>
                <a href="/upload-cv" className="upload-link">
                  או הכנסו לדף העלאת קורות חיים ←
                </a>
              </div>
            )}

            {/* iOS Instructions Modal */}
            {showIOSInstructions && (
              <div className="ios-modal-backdrop" onClick={() => setShowIOSInstructions(false)}>
                <div className="ios-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="close-btn" onClick={() => setShowIOSInstructions(false)}>✕</button>
                  <h3>הוספה למסך הבית באייפון</h3>
                  <div className="ios-steps">
                    <div className="step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <p>לחצו על כפתור השיתוף</p>
                        <div className="share-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <p>גללו ובחרו "הוסף למסך הבית"</p>
                        <div className="add-icon">➕ הוסף למסך הבית</div>
                      </div>
                    </div>
                    <div className="step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <p>לחצו "הוסף" בפינה העליונה</p>
                        <button className="demo-add-btn">הוסף</button>
                      </div>
                    </div>
                  </div>
                  <button className="got-it-btn" onClick={() => setShowIOSInstructions(false)}>
                    הבנתי, תודה! 👍
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Quick Access Link */}
      {!isStandalone && (
        <div className="quick-access">
          <a href="/upload-cv">
            <span>📄</span>
            המשך לשליחת קורות חיים בינתיים
          </a>
        </div>
      )}

      {/* Footer */}
      <footer className="install-footer">
        <p>© 2026 Twenty2Jobs - כל הזכויות שמורות</p>
        <p>עובד על Galaxy, iPhone ומחשב</p>
      </footer>

      <style jsx>{`
        .install-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #00A8A8 0%, #006666 100%);
          font-family: 'Segoe UI', 'Rubik', 'Heebo', -apple-system, sans-serif;
        }

        /* Header */
        .install-header {
          text-align: center;
          padding: 40px 20px 30px;
          color: white;
        }

        .install-logo {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          object-fit: cover;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          margin-bottom: 16px;
        }

        .install-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .install-header p {
          font-size: 16px;
          opacity: 0.9;
          margin-top: 8px;
        }

        /* Main */
        .install-main {
          flex: 1;
          background: white;
          border-radius: 32px 32px 0 0;
          padding: 32px 24px;
          margin-top: -10px;
        }

        /* App Preview */
        .app-preview {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .phone-mockup {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .phone-screen {
          text-align: center;
        }

        .app-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #00A8A8 0%, #008080 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
          box-shadow: 0 4px 15px rgba(0, 168, 168, 0.4);
        }

        .icon-22 {
          color: white;
          font-size: 24px;
          font-weight: bold;
        }

        .phone-screen p {
          font-size: 11px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        /* Titles */
        .install-title {
          text-align: center;
          font-size: 26px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 8px 0;
        }

        .install-subtitle {
          text-align: center;
          color: #6b7280;
          font-size: 16px;
          margin: 0 0 28px 0;
        }

        /* Features */
        .features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 16px;
        }

        .feature-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .feature strong {
          display: block;
          font-size: 16px;
          color: #1a1a2e;
          margin-bottom: 2px;
        }

        .feature p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        /* Install Button */
        .install-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #FF8C00 0%, #E67300 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 8px 25px rgba(255, 140, 0, 0.4);
          transition: all 0.3s ease;
        }

        .install-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(255, 140, 0, 0.5);
        }

        .install-btn.ios {
          background: linear-gradient(135deg, #007AFF 0%, #0055B3 100%);
          box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
        }

        .install-btn.ios:hover {
          box-shadow: 0 12px 35px rgba(0, 122, 255, 0.5);
        }

        /* Desktop Message */
        .desktop-message {
          text-align: center;
          padding: 24px;
          background: #f0f9ff;
          border-radius: 16px;
        }

        .desktop-message p {
          font-size: 18px;
          color: #374151;
          margin: 0 0 12px 0;
        }

        .upload-link {
          color: #00A8A8;
          font-weight: 600;
          text-decoration: none;
        }

        .upload-link:hover {
          text-decoration: underline;
        }

        /* Already Installed */
        .already-installed {
          text-align: center;
          padding: 40px 20px;
        }

        .success-icon {
          font-size: 72px;
          margin-bottom: 20px;
        }

        .already-installed h2 {
          font-size: 28px;
          color: #10b981;
          margin: 0 0 12px 0;
        }

        .already-installed p {
          color: #6b7280;
          font-size: 16px;
          margin: 0 0 32px 0;
        }

        .start-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #00A8A8 0%, #008080 100%);
          color: white;
          text-decoration: none;
          border-radius: 14px;
          font-size: 18px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(0, 168, 168, 0.4);
          transition: all 0.3s ease;
        }

        .start-btn:hover {
          transform: translateY(-2px);
        }

        /* iOS Modal */
        .ios-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .ios-modal {
          background: white;
          border-radius: 24px;
          padding: 28px 24px;
          max-width: 360px;
          width: 100%;
          position: relative;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .close-btn {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #f3f4f6;
          font-size: 16px;
          cursor: pointer;
        }

        .ios-modal h3 {
          text-align: center;
          font-size: 20px;
          color: #1a1a2e;
          margin: 0 0 24px 0;
        }

        .ios-steps {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .step {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #007AFF 0%, #0055B3 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content p {
          margin: 0 0 8px 0;
          font-size: 15px;
          color: #374151;
        }

        .share-icon {
          display: inline-flex;
          padding: 8px 16px;
          background: #f3f4f6;
          border-radius: 8px;
          color: #007AFF;
        }

        .add-icon {
          display: inline-block;
          padding: 8px 16px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 14px;
          color: #333;
        }

        .demo-add-btn {
          padding: 8px 20px;
          background: #007AFF;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
        }

        .got-it-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #007AFF 0%, #0055B3 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Quick Access */
        .quick-access {
          padding: 16px 24px;
          background: #f9fafb;
        }

        .quick-access a {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #00A8A8;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
        }

        /* Footer */
        .install-footer {
          background: #1a1a2e;
          padding: 20px;
          text-align: center;
        }

        .install-footer p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          margin: 4px 0;
        }

        /* iOS safe areas */
        @supports (padding-top: env(safe-area-inset-top)) {
          .install-header {
            padding-top: calc(40px + env(safe-area-inset-top));
          }
          
          .install-footer {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }

        /* Larger screens */
        @media (min-width: 640px) {
          .install-main {
            max-width: 500px;
            margin: -10px auto 0;
            border-radius: 32px;
          }
        }
      `}</style>
    </div>
  )
}
