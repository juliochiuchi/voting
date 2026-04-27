import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Eye, ShieldCheck } from "lucide-react"
import * as React from "react"

import { ScreenShell } from "@/components/layout/screenShell"
import { ConfirmActionModal } from "@/components/modal/confirmActionModal"
import { ElectedDecisionModal } from "@/components/voting-results/electedDecisionModal"
import { ElectedMemberCard } from "@/components/voting-results/electedMemberCard"
import { VotingResultsTable } from "@/components/voting-results/votingResultsTable"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthUser } from "@/contexts/authUserContext"
import { useToast } from "@/contexts/toastContext"
import { createElectedRecord, listElectedByElection, listElectedByElectionAndRound } from "@/services/electedService"
import { listElections, updateElection } from "@/services/electionsService"
import { listActiveMembers, listMembersByIds } from "@/services/membersService"
import { listRoundsByElectionId, updateRound } from "@/services/roundsService"
import { listVoteMemberIdsByElectionAndRound } from "@/services/votesTallyService"
import type { Election } from "@/types/election"
import type { Elected } from "@/types/elected"
import type { Member } from "@/types/member"
import type { Round } from "@/types/round"

export const Route = createFileRoute("/_app/watch")({
  component: Watch,
})

function normalizeStatus(value: unknown) {
  const normalized = String(value ?? "").toUpperCase()
  if (normalized === "CANCELELD") return "CANCELLED"
  return normalized
}

function computePreElectedThreshold(totalNumberVoters: unknown) {
  const numericValue =
    typeof totalNumberVoters === "number" ? totalNumberVoters : Number(totalNumberVoters)
  const safeTotal = Number.isFinite(numericValue) ? numericValue : 0
  return Math.floor(safeTotal / 2) + 1
}

function parseLastWatchSelection(): { electionId: string; roundId: string } | null {
  try {
    const raw = window.sessionStorage.getItem("voting:lastWatchSelection")
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const electionId = typeof parsed.electionId === "string" ? parsed.electionId : null
    const roundId = typeof parsed.roundId === "string" ? parsed.roundId : null
    if (!electionId || !roundId) return null
    return { electionId, roundId }
  } catch {
    return null
  }
}

function Watch() {
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = React.useState(true)
  const [elections, setElections] = React.useState<Election[]>([])
  const [rounds, setRounds] = React.useState<Round[]>([])
  const [selectedElectionId, setSelectedElectionId] = React.useState<string>("")
  const [selectedRoundId, setSelectedRoundId] = React.useState<string>("")
  const [electedByElection, setElectedByElection] = React.useState<Elected[]>([])
  const [electedMemberById, setElectedMemberById] = React.useState<Map<string, Member>>(
    () => new Map(),
  )

  const [voteCountsByMemberId, setVoteCountsByMemberId] = React.useState<Map<string, number>>(
    () => new Map(),
  )
  const [activeMemberNameById, setActiveMemberNameById] = React.useState<Map<string, string>>(
    () => new Map(),
  )
  const [electedStatusByMemberId, setElectedStatusByMemberId] = React.useState<Map<string, string>>(
    () => new Map(),
  )

  const [memberIdPendingDecision, setMemberIdPendingDecision] = React.useState<string | null>(
    null,
  )
  const [isSavingDecision, setIsSavingDecision] = React.useState(false)
  const [pendingCloseAction, setPendingCloseAction] = React.useState<
    "round" | "roundAndElection" | null
  >(null)
  const [isClosing, setIsClosing] = React.useState(false)

  const selectableElections = React.useMemo(() => {
    return elections.filter((election) => {
      const status = normalizeStatus(election.status)
      return status === "OPEN" || status === "COMPLETED"
    })
  }, [elections])

  const selectedElection = React.useMemo(() => {
    return selectableElections.find((election) => election.id === selectedElectionId) ?? null
  }, [selectableElections, selectedElectionId])

  const selectedRound = React.useMemo(() => {
    return rounds.find((round) => round.id === selectedRoundId) ?? null
  }, [rounds, selectedRoundId])

  const selectableRounds = React.useMemo(() => {
    return rounds.filter((round) => {
      const status = normalizeStatus(round.status)
      return status === "OPEN" || status === "COMPLETED"
    })
  }, [rounds])

  const isStaff = user?.accessType === "staff"

  const preElectedThreshold = React.useMemo(() => {
    return selectedElection ? computePreElectedThreshold(selectedElection.total_number_voters) : 0
  }, [selectedElection])

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

          const rememberedSelection = parseLastWatchSelection()
          if (rememberedSelection) {
            const rememberedElection = nextElections.find((election) => election.id === rememberedSelection.electionId) ?? null
            const rememberedElectionStatus = rememberedElection ? normalizeStatus(rememberedElection.status) : null
            const isRememberedElectionSelectable =
              rememberedElectionStatus === "OPEN" || rememberedElectionStatus === "COMPLETED"
            if (!isRememberedElectionSelectable) {
              window.sessionStorage.removeItem("voting:lastWatchSelection")
            } else {
              setSelectedElectionId(rememberedSelection.electionId)
              setSelectedRoundId(rememberedSelection.roundId)
              return
            }
          }

          const firstOpenElection = nextElections.find(
            (election) => normalizeStatus(election.status) === "OPEN",
          )
          const firstCompletedElection =
            nextElections.find((election) => normalizeStatus(election.status) === "COMPLETED") ??
            null
          setSelectedElectionId(firstOpenElection?.id ?? firstCompletedElection?.id ?? "")
          setSelectedRoundId("")
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro inesperado"
          toast({
            title: "Falha ao carregar eleições",
            description: message,
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  React.useEffect(() => {
    if (!selectedElectionId) {
      const timeoutId = window.setTimeout(() => {
        setRounds([])
        setSelectedRoundId("")
        setElectedByElection([])
        setElectedMemberById(new Map())
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        try {
          const nextRounds = await listRoundsByElectionId(selectedElectionId)
          setRounds(nextRounds)

          setSelectedRoundId((currentRoundId) => {
            const selectableRoundList = nextRounds.filter((round) => {
              const status = normalizeStatus(round.status)
              return status === "OPEN" || status === "COMPLETED"
            })

            if (currentRoundId && selectableRoundList.some((round) => round.id === currentRoundId)) {
              return currentRoundId
            }
            const firstOpenRound =
              selectableRoundList.find((round) => normalizeStatus(round.status) === "OPEN") ?? null
            return firstOpenRound?.id ?? selectableRoundList[0]?.id ?? ""
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro inesperado"
          toast({
            title: "Falha ao carregar rodadas",
            description: message,
            variant: "destructive",
          })
          setRounds([])
          setSelectedRoundId("")
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [selectedElectionId, toast])

  React.useEffect(() => {
    if (!selectedElectionId) return

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const electedRows = await listElectedByElection({ electionId: selectedElectionId })
          const memberIds = Array.from(new Set(electedRows.map((row) => row.id_member)))
          const members = await listMembersByIds(memberIds)
          const nextMemberById = new Map<string, Member>()
          for (const member of members) nextMemberById.set(member.id, member)
          setElectedByElection(electedRows)
          setElectedMemberById(nextMemberById)
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro inesperado"
          toast({
            title: "Falha ao carregar eleitos",
            description: message,
            variant: "destructive",
          })
          setElectedByElection([])
          setElectedMemberById(new Map())
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [selectedElectionId, toast])

  React.useEffect(() => {
    if (!selectedElectionId || !selectedRoundId) {
      const timeoutId = window.setTimeout(() => {
        setVoteCountsByMemberId(new Map())
        setActiveMemberNameById(new Map())
        setElectedStatusByMemberId(new Map())
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        try {
          const [memberIds, members, elected] = await Promise.all([
            listVoteMemberIdsByElectionAndRound({
              electionId: selectedElectionId,
              roundId: selectedRoundId,
            }),
            listActiveMembers(),
            listElectedByElectionAndRound({
              electionId: selectedElectionId,
              roundId: selectedRoundId,
            }),
          ])

          const nextVoteCounts = new Map<string, number>()
          for (const memberId of memberIds) {
            nextVoteCounts.set(memberId, (nextVoteCounts.get(memberId) ?? 0) + 1)
          }

          const nextMemberNameById = new Map<string, string>()
          for (const member of members) {
            nextMemberNameById.set(member.id, member.name)
          }

          const nextElectedStatusByMemberId = new Map<string, string>()
          for (const electedRow of elected) {
            nextElectedStatusByMemberId.set(electedRow.id_member, electedRow.status)
          }

          setVoteCountsByMemberId(nextVoteCounts)
          setActiveMemberNameById(nextMemberNameById)
          setElectedStatusByMemberId(nextElectedStatusByMemberId)
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro inesperado"
          toast({
            title: "Falha ao carregar apuração",
            description: message,
            variant: "destructive",
          })
          setVoteCountsByMemberId(new Map())
          setActiveMemberNameById(new Map())
          setElectedStatusByMemberId(new Map())
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [selectedElectionId, selectedRoundId, toast])

  const resultsRows = React.useMemo(() => {
    const rows = Array.from(activeMemberNameById.entries()).map(([memberId, memberName]) => {
      const votesReceived = voteCountsByMemberId.get(memberId) ?? 0
      const isPreElected = preElectedThreshold > 0 ? votesReceived >= preElectedThreshold : false
      const confirmationStatus = electedStatusByMemberId.get(memberId) ?? null
      const isConfirmAvailable = isStaff && isPreElected && !confirmationStatus

      return {
        memberId,
        memberName,
        votesReceived,
        isPreElected,
        confirmationStatus,
        isConfirmAvailable,
      }
    })

    return rows.sort((a, b) => {
      if (b.votesReceived !== a.votesReceived) return b.votesReceived - a.votesReceived
      return a.memberName.localeCompare(b.memberName)
    })
  }, [activeMemberNameById, electedStatusByMemberId, isStaff, preElectedThreshold, voteCountsByMemberId])

  const pendingMemberName =
    memberIdPendingDecision ? activeMemberNameById.get(memberIdPendingDecision) ?? "Membro" : "Membro"

  const pendingMemberVotes =
    memberIdPendingDecision ? voteCountsByMemberId.get(memberIdPendingDecision) ?? 0 : 0

  async function confirmElectedDecision(nextStatus: "ELECTED" | "DESERTER") {
    if (!selectedElection || !selectedRound) return
    if (!memberIdPendingDecision) return
    if (isSavingDecision) return

    setIsSavingDecision(true)
    try {
      const created = await createElectedRecord({
        id_election: selectedElection.id,
        id_round: selectedRound.id,
        id_member: memberIdPendingDecision,
        number_votes_received: pendingMemberVotes,
        status: nextStatus,
      })

      if (!created) {
        throw new Error("Não foi possível salvar a confirmação")
      }

      setElectedStatusByMemberId((current) => {
        const next = new Map(current)
        next.set(created.id_member, created.status)
        return next
      })
      setElectedByElection((current) => [created, ...current])
      toast({
        title: "Confirmação salva",
        description: nextStatus === "ELECTED" ? "Membro confirmado como eleito." : "Membro marcado como desistente.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Falha ao salvar confirmação",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSavingDecision(false)
    }
  }

  const confirmedElectedCards = React.useMemo(() => {
    const roundNumberById = new Map<string, string>()
    for (const round of rounds) {
      roundNumberById.set(round.id, round.round_number ? String(round.round_number) : "—")
    }

    return electedByElection.map((row) => {
      const member = electedMemberById.get(row.id_member) ?? null
      const roundNumber = roundNumberById.get(row.id_round) ?? "—"

      return {
        key: row.id,
        memberName: member?.name ?? activeMemberNameById.get(row.id_member) ?? "Membro",
        memberCpf: member?.cpf ?? "",
        status: row.status,
        votesReceived: row.number_votes_received,
        roundNumberLabel: `Rodada ${roundNumber}`,
      }
    })
  }, [activeMemberNameById, electedByElection, electedMemberById, rounds])

  const confirmedElectedCount = React.useMemo(() => {
    return electedByElection.filter((row) => String(row.status ?? "").toUpperCase() === "ELECTED").length
  }, [electedByElection])

  async function handleClose() {
    if (!selectedElection || !selectedRound) return
    if (!pendingCloseAction) return
    if (isClosing) return

    setIsClosing(true)
    try {
      if (pendingCloseAction === "round") {
        await updateRound(selectedRound.id, { status: "COMPLETED" })
      } else {
        await updateRound(selectedRound.id, { status: "COMPLETED" })
        await updateElection(selectedElection.id, { status: "COMPLETED" })
      }

      const [nextElections, nextRounds] = await Promise.all([
        listElections(),
        listRoundsByElectionId(selectedElection.id),
      ])
      setElections(nextElections)
      setRounds(nextRounds)
      toast({
        title: "Atualização concluída",
        description:
          pendingCloseAction === "round"
            ? "Rodada encerrada com sucesso."
            : "Rodada e eleição encerradas com sucesso.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Falha ao encerrar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsClosing(false)
      setPendingCloseAction(null)
    }
  }

  return (
    <ScreenShell>
      <main className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Assistir votação</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Acompanhe a apuração em tempo real.
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {isStaff && selectedElection && selectedRound ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-2xl bg-background/15 px-5 hover:bg-background/25"
                  disabled={isLoading || isClosing || normalizeStatus(selectedRound.status) !== "OPEN"}
                  onClick={() => setPendingCloseAction("round")}
                >
                  Encerrar rodada
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="h-11 rounded-2xl px-5 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]"
                  disabled={isLoading || isClosing || normalizeStatus(selectedRound.status) !== "OPEN"}
                  onClick={() => setPendingCloseAction("roundAndElection")}
                >
                  Encerrar rodada e eleição
                </Button>
              </>
            ) : null}
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

        {selectableElections.length === 0 ? (
          <Card className="w-full rounded-3xl">
            <CardHeader>
              <CardTitle>Nenhuma eleição disponível</CardTitle>
              <CardDescription>
                Não há eleições abertas ou concluídas disponíveis para acompanhar.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <Select
                  value={selectedElectionId}
                  onValueChange={(value) => {
                    setSelectedElectionId(value)
                    setSelectedRoundId("")
                    window.sessionStorage.setItem(
                      "voting:lastWatchSelection",
                      JSON.stringify({ electionId: value, roundId: "" }),
                    )
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a eleição" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableElections.map((election) => (
                      <SelectItem key={election.id} value={election.id}>
                        {election.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={selectedRoundId}
                  onValueChange={(value) => {
                    setSelectedRoundId(value)
                    window.sessionStorage.setItem(
                      "voting:lastWatchSelection",
                      JSON.stringify({ electionId: selectedElectionId, roundId: value }),
                    )
                  }}
                  disabled={!selectedElectionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a rodada" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableRounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {`Rodada ${round.round_number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-white/10 bg-background/10 px-5 py-4 shadow-[0_24px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <Eye className="size-5 text-foreground/90" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {selectedElection?.name ?? "Eleição"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedRound
                      ? `Rodada ${selectedRound.round_number} • Pré-eleito a partir de ${preElectedThreshold} voto(s).`
                      : "Selecione a rodada para acompanhar."}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                {isStaff ? "Acesso staff: confirmações habilitadas" : "Acesso membro: visualização"}
              </div>
            </div>

            <VotingResultsTable
              title="Apuração"
              rows={selectedElectionId && selectedRoundId ? resultsRows : []}
              isLoading={isLoading}
              showConfirmButtons={isStaff}
              onConfirmClick={(memberId) => setMemberIdPendingDecision(memberId)}
            />

            {selectedElectionId ? (
              <div className="mt-8">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold tracking-tight">Eleitos confirmados</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {`${confirmedElectedCount} membro(s) com status ELECTED nesta eleição.`}
                    </div>
                  </div>
                </div>

                {confirmedElectedCards.length === 0 ? (
                  <Card className="w-full rounded-3xl">
                    <CardHeader>
                      <CardTitle>Nenhuma confirmação registrada</CardTitle>
                      <CardDescription>
                        Assim que membros forem confirmados, eles aparecerão aqui.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {confirmedElectedCards.map((card) => (
                      <ElectedMemberCard
                        key={card.key}
                        memberName={card.memberName}
                        memberCpf={card.memberCpf}
                        status={card.status}
                        votesReceived={card.votesReceived}
                        roundNumberLabel={card.roundNumberLabel}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </main>

      <ConfirmActionModal
        open={pendingCloseAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingCloseAction(null)
        }}
        title={
          pendingCloseAction === "roundAndElection"
            ? "Encerrar rodada e eleição?"
            : "Encerrar rodada?"
        }
        description="Tem certeza que deseja concluir? Esta ação altera o status para COMPLETED."
        cancelLabel="Cancelar"
        confirmLabel={isClosing ? "Encerrando" : "Confirmar"}
        confirmVariant="destructive"
        onConfirm={() => void handleClose()}
      />

      <ElectedDecisionModal
        open={Boolean(memberIdPendingDecision)}
        onOpenChange={(open) => {
          if (!open) setMemberIdPendingDecision(null)
        }}
        isSaving={isSavingDecision}
        memberName={pendingMemberName}
        onDecline={() => confirmElectedDecision("DESERTER")}
        onAccept={() => confirmElectedDecision("ELECTED")}
      />
    </ScreenShell>
  )
}
