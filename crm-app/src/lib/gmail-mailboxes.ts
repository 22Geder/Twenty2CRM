import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { google } from "googleapis"

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
]

function secret(): Buffer {
  const value = process.env.NEXTAUTH_SECRET
  if (!value) throw new Error("Gmail mailbox encryption is not configured")
  return createHmac("sha256", value).update("twenty2crm-gmail-mailbox-v1").digest()
}

function redirectUri(): string {
  const origin = process.env.NEXTAUTH_URL
  if (!origin) throw new Error("NEXTAUTH_URL is not configured")
  return `${new URL(origin).origin}/api/gmail-callback`
}

function oauthClient(refreshToken?: string) {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim()
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) throw new Error("Gmail OAuth is not configured")
  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri())
  if (refreshToken) client.setCredentials({ refresh_token: refreshToken })
  return client
}

export function createGmailConnectUrl(userId: string): string {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000,
    nonce: randomBytes(16).toString("hex"),
  })).toString("base64url")
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url")
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state: `${payload}.${signature}`,
  })
}

export function verifyGmailState(state: string, userId: string): boolean {
  try {
    const [payload, signature] = state.split(".")
    if (!payload || !signature) return false
    const expected = createHmac("sha256", secret()).update(payload).digest()
    const received = Buffer.from(signature, "base64url")
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    return parsed.userId === userId && Number(parsed.expiresAt) > Date.now()
  } catch {
    return false
  }
}

export async function exchangeGmailCode(code: string): Promise<{ email: string; refreshToken: string }> {
  const auth = oauthClient()
  const { tokens } = await auth.getToken(code)
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token")
  auth.setCredentials(tokens)
  const profile = await google.oauth2({ version: "v2", auth }).userinfo.get()
  if (!profile.data.email) throw new Error("Google account email is unavailable")
  return { email: profile.data.email.toLowerCase(), refreshToken: tokens.refresh_token }
}

export function encryptGmailToken(token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", secret(), iv)
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".")
}

export function decryptGmailToken(value: string): string {
  const [version, iv, tag, encrypted] = value.split(".")
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Invalid Gmail token format")
  const decipher = createDecipheriv("aes-256-gcm", secret(), Buffer.from(iv, "base64url"))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

export function createGmailClient(encryptedRefreshToken: string) {
  const auth = oauthClient(decryptGmailToken(encryptedRefreshToken))
  return google.gmail({ version: "v1", auth })
}