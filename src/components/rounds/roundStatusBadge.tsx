import { cn } from "@/lib/utils"

const roundStatusLabelByValue: Record<string, string> = {
  OPEN: "Aberta",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
}

function normalizeRoundStatus(status: unknown) {
  const normalized = String(status ?? "").toUpperCase()
  if (normalized === "CANCELELD") return "CANCELLED"
  return normalized
}

export function RoundStatusBadge({ status }: { status: string }) {
  const normalizedStatus = normalizeRoundStatus(status)
  const label = roundStatusLabelByValue[normalizedStatus] ?? normalizedStatus

  return (
    <div
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium",
        normalizedStatus === "CANCELLED"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : normalizedStatus === "OPEN"
            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
            : "border-white/10 bg-white/6 text-muted-foreground",
      )}
    >
      {label}
    </div>
  )
}
