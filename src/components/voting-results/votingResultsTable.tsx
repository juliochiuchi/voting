import { Crown, FileText, ShieldCheck, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type VotingResultRow = {
  memberId: string
  memberName: string
  votesReceived: number
  isPreElected: boolean
  confirmationStatus: string | null
  isConfirmAvailable: boolean
}

function getConfirmationLabel(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === "ELECTED") return "Eleito"
  if (normalized === "DESERTER") return "Recusou"
  return status
}

export function VotingResultsTable({
  title = "Apuração",
  rows,
  isLoading,
  showConfirmButtons,
  onConfirmClick,
}: {
  title?: string
  rows: VotingResultRow[]
  isLoading: boolean
  showConfirmButtons: boolean
  onConfirmClick: (memberId: string) => void
}) {
  return (
    <Card className="w-full rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              <span>Ordenado do mais votado para o menos votado.</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[76px]">#</TableHead>
              <TableHead>Membro</TableHead>
              <TableHead className="w-[140px] text-right">Votos</TableHead>
              <TableHead className="w-[210px]">Status</TableHead>
              {showConfirmButtons ? (
                <TableHead className="w-[160px] text-right">Ação</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-10 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-56 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 rounded-full" />
                  </TableCell>
                  {showConfirmButtons ? (
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-10 w-28 rounded-2xl" />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showConfirmButtons ? 5 : 4}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5">
                      <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">Nenhum voto registrado</div>
                    <div className="text-xs text-muted-foreground">
                      Aguarde os votos para visualizar a apuração.
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.memberId}>
                  <TableCell className="text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      {index === 0 ? (
                        <div className="grid size-7 place-items-center rounded-2xl bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20">
                          <Crown className="size-4" />
                        </div>
                      ) : (
                        <div className="grid size-7 place-items-center rounded-2xl bg-white/5 text-muted-foreground ring-1 ring-white/10">
                          <span className="text-xs tabular-nums">{index + 1}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="truncate">{row.memberName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {row.votesReceived}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
                          row.isPreElected
                            ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                            : "border-white/10 bg-white/5 text-muted-foreground",
                        )}
                      >
                        {row.isPreElected ? "Pré-eleito" : "Não pré-eleito"}
                      </div>
                      {row.confirmationStatus ? (
                        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
                          {getConfirmationLabel(row.confirmationStatus)}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  {showConfirmButtons ? (
                    <TableCell className="text-right">
                      {row.isConfirmAvailable ? (
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-2xl"
                          onClick={() => onConfirmClick(row.memberId)}
                        >
                          Confirmar
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

