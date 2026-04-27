import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import * as React from "react"

import { RuleAlert } from "@/components/alerts/ruleAlert"
import { RoundCard } from "@/components/rounds/roundCard"
import { ScreenShell } from "@/components/layout/screenShell"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthUser } from "@/contexts/authUserContext"
import { listElections } from "@/services/electionsService"
import { listRoundsByElectionId } from "@/services/roundsService"
import {
  listRoundIdsVotedByMember,
  listVotingRecordRoundIdsByElection,
} from "@/services/votingRecordsService"
import type { Election } from "@/types/election"
import type { Round } from "@/types/round"

export const Route = createFileRoute("/_app/rounds/$electionId")({
  component: RoundsByElection,
})

function normalizeStatus(value: unknown) {
  const normalized = String(value ?? "").toUpperCase()
  if (normalized === "CANCELELD") return "CANCELLED"
  return normalized
}

const roundStatusFilterOptions = ["ALL", "OPEN", "COMPLETED", "CANCELLED"] as const

const roundStatusLabelByValue: Record<string, string> = {
  ALL: "Todos",
  OPEN: "Aberta",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
}

type RoundStatusFilter = (typeof roundStatusFilterOptions)[number]

const roundStatusFilterOptionSet = new Set<string>(roundStatusFilterOptions)

function parseRoundStatusFilter(value: string): RoundStatusFilter {
  if (roundStatusFilterOptionSet.has(value)) {
    return value as RoundStatusFilter
  }
  return "ALL"
}

function RoundsByElection() {
  const navigate = useNavigate()
  const { electionId } = Route.useParams()
  const { user } = useAuthUser()

  const [isRulesAlertVisible, setIsRulesAlertVisible] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(true)
  const [elections, setElections] = React.useState<Election[]>([])
  const [rounds, setRounds] = React.useState<Round[]>([])
  const [statusFilter, setStatusFilter] =
    React.useState<RoundStatusFilter>("ALL")

  const [memberVotedRoundIds, setMemberVotedRoundIds] = React.useState<Set<string>>(
    () => new Set(),
  )
  const [votesCountByRoundId, setVotesCountByRoundId] = React.useState<
    Map<string, number>
  >(() => new Map())

  const openElections = React.useMemo(() => {
    return elections.filter((election) => normalizeStatus(election.status) === "OPEN")
  }, [elections])

  const selectedElection = React.useMemo(() => {
    return openElections.find((election) => election.id === electionId) ?? null
  }, [electionId, openElections])

  React.useEffect(() => {
    if (!user) {
      navigate({ to: "/login", replace: true })
      return
    }
    if (user.accessType !== "member" && user.accessType !== "staff") {
      navigate({ to: "/", replace: true })
    }
  }, [navigate, user])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        try {
          const nextElections = await listElections()
          setElections(nextElections)
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  React.useEffect(() => {
    if (!user) return
    if (!selectedElection) return

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        try {
          const nextRounds = await listRoundsByElectionId(selectedElection.id)
          setRounds(nextRounds)

          if (user.accessType === "member") {
            const votedRoundIds = await listRoundIdsVotedByMember({
              electionId: selectedElection.id,
              cpf: user.cpf ?? "",
            })
            setMemberVotedRoundIds(new Set(votedRoundIds))
            setVotesCountByRoundId(new Map())
            return
          }

          const votedRoundIds = await listVotingRecordRoundIdsByElection({
            electionId: selectedElection.id,
          })
          const nextCounts = new Map<string, number>()
          for (const roundId of votedRoundIds) {
            nextCounts.set(roundId, (nextCounts.get(roundId) ?? 0) + 1)
          }
          setVotesCountByRoundId(nextCounts)
          setMemberVotedRoundIds(new Set())
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [selectedElection, user])

  const filteredRounds = React.useMemo(() => {
    if (statusFilter === "ALL") return rounds
    return rounds.filter((round) => normalizeStatus(round.status) === statusFilter)
  }, [rounds, statusFilter])

  function isRoundNavigable(round: Round) {
    if (!user) return false
    if (normalizeStatus(round.status) !== "OPEN") return false

    if (user.accessType === "member") {
      if (!user.cpf) return false
      return !memberVotedRoundIds.has(round.id)
    }

    if (user.accessType === "staff") {
      const expectedVotes = Number(round.total_numbers_votes_per_round)
      const currentVotes = votesCountByRoundId.get(round.id) ?? 0
      if (!Number.isFinite(expectedVotes)) return false
      return currentVotes < expectedVotes
    }

    return false
  }

  return (
    <ScreenShell>
      <main className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Rodadas</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Selecione a eleição e escolha a rodada.
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-[280px]">
              <Select
                value={selectedElection?.id ?? ""}
                onValueChange={(nextElectionId) => {
                  navigate({
                    to: "/rounds/$electionId",
                    params: { electionId: nextElectionId },
                    replace: true,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a eleição" />
                </SelectTrigger>
                <SelectContent>
                  {openElections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-[220px]">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(parseRoundStatusFilter(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {roundStatusFilterOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {roundStatusLabelByValue[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-11 rounded-2xl bg-background/15 px-5 hover:bg-background/25"
              onClick={() => navigate({ to: "/begin", replace: true })}
            >
              <ArrowLeft />
              Retornar ao início
            </Button>
          </div>
        </div>

        {isRulesAlertVisible ? (
          <RuleAlert
            title="Aviso"
            description={
              <>
                Membros só podem acessar uma rodada se ainda não tiverem votado. Staff
                só pode acessar enquanto a rodada ainda estiver recebendo votos.
              </>
            }
            onDismiss={() => setIsRulesAlertVisible(false)}
          />
        ) : null}

        {isLoading ? (
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="min-h-[232px] w-full rounded-3xl lg:w-[calc(50%-0.5rem)] 2xl:w-[calc(33.333%-0.667rem)]"
              >
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-44 rounded-full" />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : !selectedElection ? (
          <Card className="w-full rounded-3xl">
            <CardHeader>
              <CardTitle>Nenhuma eleição aberta</CardTitle>
              <CardDescription>
                Não há eleições abertas disponíveis para selecionar.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : filteredRounds.length === 0 ? (
          <Card className="w-full rounded-3xl">
            <CardHeader>
              <CardTitle>Nenhuma rodada encontrada</CardTitle>
              <CardDescription>
                Não há rodadas cadastradas para esta eleição com o filtro atual.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            {filteredRounds.map((round) => {
              const normalizedRoundStatus = normalizeStatus(round.status)
              const isNavigable = isRoundNavigable(round)
              const footerText = isNavigable
                ? "Clique para continuar."
                : normalizedRoundStatus !== "OPEN"
                  ? "Apenas rodadas abertas podem ser selecionadas."
                  : user?.accessType === "member"
                    ? "Você já votou nesta rodada."
                    : "Rodada finalizada para recebimento de votos."

              return (
                <RoundCard
                  key={round.id}
                  round={round}
                  electionName={selectedElection.name}
                  onClick={() => {
                    navigate({
                      to: "/vote/$electionId/$roundId",
                      params: { electionId: selectedElection.id, roundId: round.id },
                    })
                  }}
                  isDisabled={!isNavigable}
                  showChevron
                  footerText={footerText}
                />
              )
            })}
          </div>
        )}
      </main>
    </ScreenShell>
  )
}
