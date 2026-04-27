import { BadgeCheck, BadgeX, Hash, User } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatCpf } from "@/lib/cpf"

function getStatusPresentation(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === "ELECTED") {
    return { label: "Eleito", icon: BadgeCheck, className: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100" }
  }
  if (normalized === "DESERTER") {
    return { label: "Desistiu", icon: BadgeX, className: "border-red-400/25 bg-red-500/10 text-red-100" }
  }
  return { label: status, icon: BadgeCheck, className: "border-white/10 bg-white/5 text-muted-foreground" }
}

export function ElectedMemberCard({
  memberName,
  memberCpf,
  status,
  votesReceived,
  roundNumberLabel,
}: {
  memberName: string
  memberCpf: string
  status: string
  votesReceived: number
  roundNumberLabel: string
}) {
  const presentation = getStatusPresentation(status)
  const StatusIcon = presentation.icon

  return (
    <Card className="rounded-3xl bg-background/10 ring-1 ring-white/10 transition-colors hover:bg-card/40">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="size-3.5" />
              <span>Eleito confirmado</span>
            </div>
            <div className="mt-2 truncate text-base font-semibold tracking-tight">
              {memberName || "—"}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                {memberCpf ? formatCpf(memberCpf) : "CPF não informado"}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                <Hash className="size-3.5" />
                {roundNumberLabel}
              </div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                {`${votesReceived} voto(s)`}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
              presentation.className,
            )}
          >
            <StatusIcon className="size-3.5" />
            {presentation.label}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

