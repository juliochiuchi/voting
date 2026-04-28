import { createFileRoute } from "@tanstack/react-router"
import { Fingerprint, Hash, ShieldCheck } from "lucide-react"
import * as React from "react"

import { TableFilterInput } from "@/components/tables/tableFilterInput"
import { TablePaginationControls } from "@/components/tables/tablePaginationControls"
import { VotingRecordsTable } from "@/components/voting-records/votingRecordsTable"
import { useToast } from "@/contexts/toastContext"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { listVotingRecordsForAdmin } from "@/services/votingRecordsAdminService"
import type { VotingRecordListItem } from "@/types/votingRecord"

export const Route = createFileRoute("/_auth/_dashboard/vote-registry")({
  component: VoteRegistry,
})

function VoteRegistry() {
  const { toast } = useToast()

  const [cpfFilter, setCpfFilter] = React.useState("")
  const [electionNameFilter, setElectionNameFilter] = React.useState("")
  const [roundNumberFilter, setRoundNumberFilter] = React.useState("")

  const debouncedCpfFilter = useDebouncedValue(cpfFilter.trim(), 350)
  const debouncedElectionNameFilter = useDebouncedValue(electionNameFilter.trim(), 350)
  const debouncedRoundNumberFilter = useDebouncedValue(roundNumberFilter.trim(), 350)

  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const [isLoading, setIsLoading] = React.useState(true)
  const [records, setRecords] = React.useState<VotingRecordListItem[]>([])
  const [totalRecords, setTotalRecords] = React.useState(0)

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

  React.useEffect(() => {
    setPage(1)
  }, [debouncedCpfFilter, debouncedElectionNameFilter, debouncedRoundNumberFilter])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        try {
          const response = await listVotingRecordsForAdmin({
            page,
            pageSize,
            cpfFilter: debouncedCpfFilter || undefined,
            electionNameFilter: debouncedElectionNameFilter || undefined,
            roundNumberFilter: debouncedRoundNumberFilter || undefined,
          })
          setRecords(response.items)
          setTotalRecords(response.total)
        } catch {
          setRecords([])
          setTotalRecords(0)
          toast({
            title: "Não foi possível carregar o registro de votos",
            description: "Tente novamente em alguns instantes.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [debouncedCpfFilter, debouncedElectionNameFilter, debouncedRoundNumberFilter, page, toast])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Registro de votos</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Consulte os registros de votos por CPF, eleição e rodada.
          </div>
        </div>

        <div className="grid w-full gap-3 lg:grid-cols-3">
          <TableFilterInput
            value={cpfFilter}
            onChange={setCpfFilter}
            placeholder="Filtrar por CPF"
            icon={Fingerprint}
            maxLength={30}
          />
          <TableFilterInput
            value={electionNameFilter}
            onChange={setElectionNameFilter}
            placeholder="Filtrar por nome da eleição"
            icon={ShieldCheck}
            maxLength={60}
          />
          <TableFilterInput
            value={roundNumberFilter}
            onChange={setRoundNumberFilter}
            placeholder="Filtrar por rodada"
            icon={Hash}
            maxLength={20}
          />
        </div>
      </div>

      <VotingRecordsTable records={records} isLoading={isLoading} />

      <TablePaginationControls
        page={page}
        totalPages={totalPages}
        totalItems={totalRecords}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </main>
  )
}
