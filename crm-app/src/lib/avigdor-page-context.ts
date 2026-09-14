export type AvigdorPageContext = { type: "candidate" | "position"; id: string }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function pageContextFromPath(
  pathname: string | null | undefined
): AvigdorPageContext | null {
  if (!pathname) return null
  const candidate = pathname.match(/^\/dashboard\/candidates\/([^/]+)/)
  if (candidate?.[1] && candidate[1] !== "new" && UUID_RE.test(candidate[1])) {
    return { type: "candidate", id: candidate[1] }
  }
  const position = pathname.match(/^\/dashboard\/positions\/([^/]+)/)
  if (
    position?.[1] &&
    position[1] !== "new" &&
    position[1] !== "bulk-upload" &&
    UUID_RE.test(position[1])
  ) {
    return { type: "position", id: position[1] }
  }
  return null
}
