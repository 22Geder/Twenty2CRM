import { after } from "next/server"

const pending = new Set<Promise<void>>()

// בבקשת Next העבודה רצה אחרי התשובה. בבדיקות אין request scope,
// ואז after זורק — במקרה הזה מריצים מיד כדי לא להפיל את השמירה.
export function runAfterResponse(task: () => Promise<void>): void {
  const run = () => task().catch((taskError) => {
    console.error("Background task failed:", taskError)
  })
  try {
    after(run)
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (!message.includes("outside a request scope")) throw error
    const promise = run()
    pending.add(promise)
    void promise.finally(() => pending.delete(promise))
  }
}

export function waitForBackgroundTasks(): Promise<void> {
  return Promise.all([...pending]).then(() => undefined)
}
