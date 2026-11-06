// עטיפת שימוש ב-Playwright למודול "פרסום בקבוצות פייסבוק".
// הערה: הסלקטורים מול facebook.com הם best-effort (מבוססי role/aria-label, לא class names שבירים) -
// אך ה-DOM של פייסבוק משתנה בלי הודעה מראש. יש לצפות לצורך בכוונון לאחר חיבור חשבון אמיתי (Phase 8 QA).

import { chromium, type Browser, type BrowserContext } from "playwright"
import { execSync } from "node:child_process"

// מזהה סימנים ב-URL שמעידים על checkpoint/login/captcha/דו-שלבי - עצירה מיידית אם מופיעים.
const BLOCKED_URL_PATTERNS = [/\/checkpoint\//i, /\/login\//i, /captcha/i, /two_factor/i, /two_step_verification/i]

export function isBlockedIndicatorUrl(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url))
}

// שהיה אקראית בין פעולות - מחקה קצב אנושי ולא קבוע (ברירות מחדל מ-FacebookModuleSettings).
export function randomDelayMs(minSeconds: number, maxSeconds: number): number {
  const min = Math.max(0, Math.min(minSeconds, maxSeconds))
  const max = Math.max(minSeconds, maxSeconds)
  return Math.floor(min * 1000 + Math.random() * (max - min) * 1000)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// מאתר בינארי Chromium מערכתי (חבילת ה-Nix ב-Railway) ברצף; אם לא נמצא - Playwright ישתמש בדפדפן המובנה שלו
// (לוקאלית, אחרי `npx playwright install chromium`).
function resolveChromiumExecutablePath(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  if (process.platform !== "linux") return undefined
  try {
    const resolved = execSync("which chromium || which chromium-browser", { encoding: "utf8" }).trim()
    return resolved || undefined
  } catch {
    return undefined
  }
}

export async function launchFacebookBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    executablePath: resolveChromiumExecutablePath(),
    args: ["--disable-blink-features=AutomationControlled"],
  })
}

export async function createFacebookContext(browser: Browser, storageStateJson: string): Promise<BrowserContext> {
  const storageState = JSON.parse(storageStateJson)
  return browser.newContext({
    storageState,
    viewport: { width: 1280, height: 900 },
    locale: "he-IL",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  })
}

export type ScrapedGroup = {
  facebookGroupId: string
  name: string
  url: string
  memberCount?: number
}

// שולף את רשימת הקבוצות שחשבון הפייסבוק המחובר חבר בהן.
export async function scrapeJoinedGroups(context: BrowserContext): Promise<ScrapedGroup[]> {
  const page = await context.newPage()
  try {
    await page.goto("https://www.facebook.com/groups/joins/?nav_source=tab", { waitUntil: "domcontentloaded" })
    if (isBlockedIndicatorUrl(page.url())) throw new Error("BLOCKED_INDICATOR")

    // גלילה הדרגתית לטעינת כל הקבוצות (lazy-loaded feed)
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 2000)
      await page.waitForTimeout(600)
    }

    const groupLinks = page.locator('a[href*="/groups/"][role="link"]')
    const count = await groupLinks.count()
    const seen = new Map<string, ScrapedGroup>()

    for (let i = 0; i < count; i++) {
      const link = groupLinks.nth(i)
      const href = await link.getAttribute("href")
      if (!href) continue
      const match = href.match(/\/groups\/([^/?]+)/)
      if (!match) continue
      const facebookGroupId = match[1]
      if (seen.has(facebookGroupId)) continue
      const name = (await link.innerText().catch(() => ""))?.trim()
      if (!name) continue
      seen.set(facebookGroupId, {
        facebookGroupId,
        name,
        url: `https://www.facebook.com/groups/${facebookGroupId}/`,
      })
    }

    return [...seen.values()]
  } finally {
    await page.close()
  }
}

export type PublishResult = { success: boolean; blocked?: boolean; error?: string }

// מפרסם פוסט טקסטואלי (+ מדיה אופציונלית) לקבוצה בודדת.
export async function publishPostToGroup(
  context: BrowserContext,
  groupUrl: string,
  content: string,
  mediaFilePaths: string[] = []
): Promise<PublishResult> {
  const page = await context.newPage()
  try {
    await page.goto(groupUrl, { waitUntil: "domcontentloaded" })
    if (isBlockedIndicatorUrl(page.url())) return { success: false, blocked: true, error: "BLOCKED_INDICATOR" }

    // "מה בא לך לכתוב?" / "Write something..." - פותח את חלון יצירת הפוסט
    const composerTrigger = page.getByText(/מה בא לך לכתוב|write something/i).first()
    await composerTrigger.click({ timeout: 15_000 })

    const editor = page.getByRole("textbox").first()
    await editor.click()
    await editor.fill(content)

    if (mediaFilePaths.length > 0) {
      const fileInput = page.locator('input[type="file"]').first()
      await fileInput.setInputFiles(mediaFilePaths)
      await page.waitForTimeout(2_000)
    }

    const postButton = page.getByRole("button", { name: /^(פרסם|post)$/i }).last()
    await postButton.click({ timeout: 15_000 })
    await page.waitForTimeout(3_000)

    if (isBlockedIndicatorUrl(page.url())) return { success: false, blocked: true, error: "BLOCKED_INDICATOR" }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }
  } finally {
    await page.close()
  }
}
