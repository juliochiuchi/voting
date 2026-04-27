import { ChevronRight, Hash, Trash2, Vote } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Round } from "@/types/round"
import { RoundStatusBadge } from "@/components/rounds/roundStatusBadge"

function normalizeRoundStatus(status: unknown) {
  const normalized = String(status ?? "").toUpperCase()
  if (normalized === "CANCELELD") return "CANCELLED"
  return normalized
}

export function RoundCard({
  round,
  electionName,
  onClick,
  showChevron = false,
  onDelete,
  showDelete = false,
}: {
  round: Round
  electionName: string
  onClick: () => void
  showChevron?: boolean
  onDelete?: () => void
  showDelete?: boolean
}) {
  const normalizedStatus = normalizeRoundStatus(round.status)

  return (
    <Card
      role="button"
      tabIndex={0}
      className="group relative flex min-h-[232px] w-full cursor-pointer flex-col rounded-3xl transition-colors hover:bg-card/40 lg:w-[calc(50%-0.5rem)] 2xl:w-[calc(33.333%-0.667rem)]"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{`Rodada ${round.round_number}`}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                <Hash className="size-3.5" />
                <span className="text-foreground/90">{electionName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RoundStatusBadge status={round.status} />
            {showDelete && normalizedStatus === "CANCELLED" && onDelete ? (
              <Button
                type="button"
                size="icon-lg"
                variant="destructive"
                aria-label="Excluir rodada"
                className="rounded-2xl"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
            {showChevron ? (
              <div
                className={cn(
                  "grid size-9 place-items-center rounded-2xl bg-white/5 text-muted-foreground transition-colors",
                  "group-hover:bg-white/10 group-hover:text-foreground",
                )}
              >
                <ChevronRight className="size-4" />
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-muted-foreground">
                Total por rodada
              </div>
              <div className="mt-1 text-base font-semibold tabular-nums">
                {round.total_numbers_votes_per_round}
              </div>
            </div>
            <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-muted-foreground">
                Máx. por cédula
              </div>
              <div className="mt-1 text-base font-semibold tabular-nums">
                {round.maximum_number_votes_per_ballot}
              </div>
            </div>
            <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-muted-foreground">Votos</div>
              <div className="mt-1 inline-flex items-center gap-2 text-base font-semibold tabular-nums">
                <Vote className="size-4 text-muted-foreground" />
                {round.total_numbers_votes_per_round}
              </div>
            </div>
          </div>
          <div className="mt-auto text-xs text-muted-foreground">
            Clique no card para editar.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
