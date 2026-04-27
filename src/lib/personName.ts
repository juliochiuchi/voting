export function getFirstNameFromName(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const [firstPart] = trimmed.split(/\s+/)
  return firstPart || null
}

type UnknownRecord = Record<string, unknown>

export function getBestNameFromRow(row: UnknownRecord) {
  const candidates = [
    row.first_name,
    row.firstName,
    row.name,
    row.full_name,
    row.fullName,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return null
}

