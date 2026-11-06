// סקריפט חד-פעמי להרצה ידנית מקומית: פותח דפדפן אמיתי (headed) להתחברות לפייסבוק
// (כולל 2FA אם צריך), ואז שומר את ה-session (storageState) לקובץ מקומי.
// את תוכן הקובץ יש להדביק במסך "חיבור חשבון" ב-CRM (/dashboard/facebook-groups/connect).
//
// הרצה: node scripts/facebook-login-session.mjs
//
// אזהרה: הקובץ שנוצר מכיל cookies/session רגישים - אין להעלות אותו ל-git, ואין לשתף אותו.

import { chromium } from "playwright"
import { writeFileSync } from "node:fs"

const OUTPUT_FILE = "facebook-storage-state.json"

async function main() {
  console.log("פותח דפדפן להתחברות לפייסבוק...")
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto("https://www.facebook.com/login")

  console.log("")
  console.log("1. התחבר/י לחשבון הפייסבוק בחלון שנפתח (כולל אימות דו-שלבי אם מבוקש).")
  console.log("2. לאחר שאתה/את רואה את עמוד הבית של פייסבוק - חזור/י לכאן ולחץ/י Enter.")
  console.log("")

  await new Promise((resolve) => {
    process.stdin.resume()
    process.stdin.once("data", resolve)
  })

  const storageState = await context.storageState()
  writeFileSync(OUTPUT_FILE, JSON.stringify(storageState, null, 2), "utf8")

  console.log(`נשמר: ${OUTPUT_FILE}`)
  console.log('פתח/י את הקובץ, העתק/י את כל התוכן, והדבק/י אותו במסך "חיבור חשבון" ב-CRM.')
  console.log("לאחר ההעתקה - מומלץ למחוק את הקובץ המקומי הזה.")

  await browser.close()
  process.exit(0)
}

main().catch((error) => {
  console.error("שגיאה:", error)
  process.exit(1)
})
