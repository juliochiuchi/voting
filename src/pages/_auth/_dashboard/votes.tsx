import { createFileRoute } from "@tanstack/react-router"
import { UserSearch } from "lucide-react"
import * as React from "react"

import { TableFilterInput } from "@/components/tables/tableFilterInput"
import { TablePaginationControls } from "@/components/tables/tablePaginationControls"
import { VotesTable } from "@/components/votes/votesTable"
import { useToast } from "@/contexts/toastContext"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { listVotesForAdmin } from "@/services/votesService"
import type { VoteListItem } from "@/types/vote"

export const Route = createFileRoute("/_auth/_dashboard/votes")({
  component: Votes,
})

function Votes() {
  const { toast } = useToast()

  const [memberNameFilter, setMemberNameFilter] = React.useState("")
  const debouncedMemberNameFilter = useDebouncedValue(memberNameFilter.trim(), 350)

  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const [isLoading, setIsLoading] = React.useState(true)
  const [votes, setVotes] = React.useState<VoteListItem[]>([])
  const [totalVotes, setTotalVotes] = React.useState(0)

  const totalPages = Math.max(1, Math.ceil(totalVotes / pageSize))

  React.useEffect(() => {
    setPage(1)
  }, [debouncedMemberNameFilter])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        try {
          const response = await listVotesForAdmin({
            page,
            pageSize,
            memberNameFilter: debouncedMemberNameFilter || undefined,
          })
          setVotes(response.items)
          setTotalVotes(response.total)
        } catch {
          setVotes([])
          setTotalVotes(0)
          toast({
            title: "Não foi possível carregar os votos",
            description: "Tente novamente em alguns instantes.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [debouncedMemberNameFilter, page, toast])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Votos</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Visualize os votos registrados e filtre pelo nome do membro.
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <div className="w-full sm:w-[360px]">
            <TableFilterInput
              value={memberNameFilter}
              onChange={setMemberNameFilter}
              placeholder="Filtrar por nome do membro"
              icon={UserSearch}
              maxLength={60}
            />
          </div>
        </div>
      </div>

      <VotesTable votes={votes} isLoading={isLoading} />

      <TablePaginationControls
        page={page}
        totalPages={totalPages}
        totalItems={totalVotes}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </main>
  )
}
