export function getTotalFromContentRange(value: string | null | undefined) {
  if (!value) return null
  const parts = value.split("/")
  if (parts.length !== 2) return null
  const totalRaw = parts[1]
  if (!totalRaw || totalRaw === "*") return null
  const total = Number(totalRaw)
  return Number.isFinite(total) ? total : null
}

export function buildRangeHeaders({
  page,
  pageSize,
}: {
  page: number
  pageSize: number
}) {
  const safePage = Math.max(1, Math.floor(page))
  const safePageSize = Math.max(1, Math.floor(pageSize))
  const offset = (safePage - 1) * safePageSize
  const end = offset + safePageSize - 1

  return {
    offset,
    end,
    headers: {
      Prefer: "count=exact",
      "Range-Unit": "items",
      Range: `${offset}-${end}`,
    },
  }
}

