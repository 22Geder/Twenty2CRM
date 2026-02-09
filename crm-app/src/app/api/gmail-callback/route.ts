import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>שגיאה באישור</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          .error {
            color: #dc2626;
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 1rem;
          }
          p {
            color: #6b7280;
            margin-bottom: 2rem;
          }
          button {
            background: #667eea;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s;
          }
          button:hover {
            background: #5568d3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">❌</div>
          <h1>שגיאה באישור</h1>
          <p>אירעה שגיאה בעת האישור עם Google. אנא נסה שוב.</p>
          <button onclick="window.close()">סגור חלון</button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  if (!code) {
    return new NextResponse('Missing authorization code', { status: 400 })
  }

  return new NextResponse(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>קוד אישור - Gmail Setup</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
        }
        .container {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 600px;
        }
        .success {
          color: #10b981;
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          color: #1f2937;
          margin-bottom: 1rem;
        }
        .code-box {
          background: #f3f4f6;
          border: 2px solid #667eea;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 2rem 0;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          word-break: break-all;
          color: #1f2937;
        }
        .instructions {
          text-align: right;
          background: #eff6ff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-top: 2rem;
          color: #1e40af;
        }
        .instructions ol {
          margin: 1rem 0 0 0;
          padding-right: 1.5rem;
        }
        .instructions li {
          margin-bottom: 0.5rem;
        }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s;
          margin-top: 1rem;
        }
        button:hover {
          background: #5568d3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅</div>
        <h1>הצלחה! קוד האישור נוצר</h1>
        <p>העתק את הקוד הבא והדבק אותו בדף ההגדרות:</p>
        
        <div class="code-box" id="authCode">${code}</div>
        
        <button onclick="copyCode()">📋 העתק קוד</button>
        <button onclick="window.close()" style="background: #6b7280; margin-right: 1rem;">סגור חלון</button>

        <div class="instructions">
          <strong>השלבים הבאים:</strong>
          <ol>
            <li>העתק את הקוד למעלה (לחץ על כפתור "העתק קוד")</li>
            <li>חזור לדף ההגדרות</li>
            <li>הדבק את הקוד בשדה "Authorization Code"</li>
            <li>לחץ על "צור Refresh Token"</li>
          </ol>
        </div>
      </div>

      <script>
        function copyCode() {
          const code = document.getElementById('authCode').textContent;
          navigator.clipboard.writeText(code).then(() => {
            alert('✅ הקוד הועתק ללוח!');
          });
        }
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
