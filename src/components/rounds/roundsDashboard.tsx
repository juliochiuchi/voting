import dayjs from "dayjs"
import "dayjs/locale/pt-br"
import { LoaderCircle, Plus } from "lucide-react"
import * as React from "react"

import { RuleAlert } from "@/components/alerts/ruleAlert"
import { ConfirmActionModal } from "@/components/modal/confirmActionModal"
import { RoundCard } from "@/components/rounds/roundCard"
import { RoundFormModal, type RoundFormSubmitPayload } from "@/components/rounds/roundFormModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/contexts/toastContext"
import { cn } from "@/lib/utils"
import { listElections } from "@/services/electionsService"
import { createRound, deleteRound, listRounds, updateRound } from "@/services/roundsService"
import type { Election } from "@/types/election"
import type { Round } from "@/types/round"

dayjs.locale("pt-br")

function normalizeStatus(value: unknown) {
  const normalized = String(value ?? "").toUpperCase()
  if (normalized === "CANCELELD") return "CANCELLED"
  return normalized
}

function canCreateNewRound(rounds: Round[]) {
  if (rounds.length === 0) return true
  return rounds.every((round) => {
    const status = normalizeStatus(round.status)
    return status === "COMPLETED" || status === "CANCELLED"
  })
}

export function RoundsDashboard() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const [rounds, setRounds] = React.useState<Round[]>([])
  const [elections, setElections] = React.useState<Election[]>([])
  const [selectedElectionId, setSelectedElectionId] = React.useState<string>("ALL")

  const [isRulesAlertVisible, setIsRulesAlertVisible] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingRound, setEditingRound] = React.useState<Round | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [roundPendingDelete, setRoundPendingDelete] = React.useState<Round | null>(
    null,
  )

  const refreshData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [nextRounds, nextElections] = await Promise.all([
        listRounds(),
        listElections(),
      ])
      setRounds(nextRounds)
      setElections(nextElections)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Falha ao carregar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [refreshData])

  const electionNameById = React.useMemo(() => {
    return new Map(elections.map((election) => [election.id, election.name]))
  }, [elections])

  const openElections = React.useMemo(() => {
    return elections.filter((election) => normalizeStatus(election.status) === "OPEN")
  }, [elections])

  const filterOptions = React.useMemo(() => {
    return elections.map((election) => ({
      id: election.id,
      name: election.name,
    }))
  }, [elections])

  const effectiveSelectedElectionId = React.useMemo(() => {
    if (selectedElectionId === "ALL") return "ALL"
    if (!elections.some((election) => election.id === selectedElectionId)) return "ALL"
    return selectedElectionId
  }, [elections, selectedElectionId])

  const filteredRounds = React.useMemo(() => {
    if (effectiveSelectedElectionId === "ALL") return rounds
    return rounds.filter((round) => round.id_election === effectiveSelectedElectionId)
  }, [effectiveSelectedElectionId, rounds])

  const disableOpenStatusOption = React.useMemo(() => {
    if (!editingRound) return false
    const isEditingCompletedOrCancelled = ["COMPLETED", "CANCELLED"].includes(
      normalizeStatus(editingRound.status),
    )
    if (!isEditingCompletedOrCancelled) return false
    const hasAnotherOpen = rounds.some(
      (round) => round.id !== editingRound.id && normalizeStatus(round.status) === "OPEN",
    )
    return hasAnotherOpen
  }, [editingRound, rounds])

  const isCreateAllowed = React.useMemo(() => canCreateNewRound(rounds), [rounds])
  const isCreateDisabled = !isCreateAllowed || openElections.length === 0

  async function handleSubmit(payload: RoundFormSubmitPayload) {
    if (isSaving) return
    setIsSaving(true)

    try {
      const normalizedNextStatus = normalizeStatus(payload.status)

      if (!editingRound) {
        if (!isCreateAllowed) {
          toast({
            title: "Não é possível criar",
            description:
              "Uma nova rodada só pode ser criada quando todas as rodadas estiverem CONCLUÍDAS ou CANCELADAS.",
            variant: "destructive",
          })
          return
        }

        if (openElections.length === 0) {
          toast({
            title: "Sem eleições abertas",
            description:
              "Crie ou abra uma eleição para conseguir cadastrar uma rodada.",
            variant: "destructive",
          })
          return
        }

        const createdRound = await createRound({
          id_election: payload.id_election,
          round_number: payload.round_number,
          total_numbers_votes_per_round: payload.total_numbers_votes_per_round,
          maximum_number_votes_per_ballot: payload.maximum_number_votes_per_ballot,
          status: "OPEN",
        })
        if (createdRound) {
          setRounds((current) => [createdRound, ...current])
        }

        toast({
          title: "Rodada criada",
          description: "A rodada foi cadastrada com status ABERTA.",
        })
        setIsModalOpen(false)
        return
      }

      if (normalizedNextStatus === "OPEN") {
        const hasAnotherOpen = rounds.some(
          (round) =>
            round.id !== editingRound.id && normalizeStatus(round.status) === "OPEN",
        )

        if (hasAnotherOpen) {
          toast({
            title: "Não é possível reabrir",
            description:
              "Para reabrir uma rodada, não pode existir outra rodada ABERTA.",
            variant: "destructive",
          })
          return
        }
      }

      const updatedRound = await updateRound(editingRound.id, {
        id_election: payload.id_election,
        round_number: payload.round_number,
        total_numbers_votes_per_round: payload.total_numbers_votes_per_round,
        maximum_number_votes_per_ballot: payload.maximum_number_votes_per_ballot,
        status: normalizedNextStatus,
      })
      if (updatedRound) {
        setRounds((current) =>
          current.map((round) => (round.id === updatedRound.id ? updatedRound : round)),
        )
      }

      toast({
        title: "Rodada atualizada",
        description: "As alterações foram salvas com sucesso.",
      })
      setIsModalOpen(false)
      setEditingRound(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Falha ao salvar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteRound(roundToDelete: Round) {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await deleteRound(roundToDelete.id)
      setRounds((current) => current.filter((round) => round.id !== roundToDelete.id))
      toast({
        title: "Rodada excluída",
        description: "A rodada foi removida com sucesso.",
      })
      setIsDeleteModalOpen(false)
      setRoundPendingDelete(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Falha ao excluir",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const modalElections = React.useMemo(() => {
    if (!editingRound) return openElections
    const currentElection =
      elections.find((election) => election.id === editingRound.id_election) ?? null
    if (!currentElection) return openElections
    if (openElections.some((election) => election.id === currentElection.id)) {
      return openElections
    }
    return [currentElection, ...openElections]
  }, [editingRound, elections, openElections])

  return (
    <div className="min-h-dvh p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Rodadas</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Crie e gerencie rodadas.
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-[260px]">
              <Select
                value={effectiveSelectedElectionId}
                onValueChange={setSelectedElectionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por eleição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as eleições</SelectItem>
                  {filterOptions.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              size="lg"
              className="h-11 rounded-2xl px-5"
              disabled={isCreateDisabled}
              onClick={() => {
                setEditingRound(null)
                setIsModalOpen(true)
              }}
            >
              <Plus />
              Nova rodada
            </Button>
          </div>
        </div>

        {
          isRulesAlertVisible && (
            <RuleAlert
              title="Regra de criação de rodada"
              description={
                <>
                  Uma nova rodada só poderá ser criada quando a rodada em andamento (ABERTA)
                  estiver CONCLUÍDA ou CANCELADA.
                </>
              }
              onDismiss={() => setIsRulesAlertVisible(false)}
            />
          )
        }

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
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Skeleton className="h-[68px] flex-1 rounded-2xl" />
                    <Skeleton className="h-[68px] flex-1 rounded-2xl" />
                    <Skeleton className="h-[68px] flex-1 rounded-2xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rounds.length === 0 ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Nenhuma rodada ainda</CardTitle>
              <CardDescription>Crie a primeira rodada para começar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                size="lg"
                disabled={isCreateDisabled}
                className={cn("h-11 rounded-2xl px-5 mt-4")}
                onClick={() => {
                  setEditingRound(null)
                  setIsModalOpen(true)
                }}
              >
                {isSaving ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Carregando
                  </>
                ) : (
                  <>
                    <Plus />
                    Nova rodada
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : filteredRounds.length === 0 ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Nenhuma rodada para este filtro</CardTitle>
              <CardDescription>Tente outra eleição ou limpe o filtro.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 rounded-2xl px-5 mt-4"
                onClick={() => setSelectedElectionId("ALL")}
              >
                Limpar filtro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            {filteredRounds.map((round) => (
              <RoundCard
                key={round.id}
                round={round}
                electionName={electionNameById.get(round.id_election) ?? "Eleição"}
                onClick={() => {
                  setEditingRound(round)
                  setIsModalOpen(true)
                }}
                showChevron={false}
                showDelete
                onDelete={() => {
                  setRoundPendingDelete(round)
                  setIsDeleteModalOpen(true)
                }}
              />
            ))}
          </div>
        )}

        <ConfirmActionModal
          open={isDeleteModalOpen}
          onOpenChange={(open) => {
            if (isDeleting) return
            setIsDeleteModalOpen(open)
            if (!open) setRoundPendingDelete(null)
          }}
          title="Excluir rodada?"
          description="Esta ação remove a rodada permanentemente e não pode ser desfeita."
          cancelLabel="Cancelar"
          confirmLabel={isDeleting ? "Excluindo" : "Excluir"}
          confirmVariant="destructive"
          onConfirm={async () => {
            if (!roundPendingDelete) return
            await handleDeleteRound(roundPendingDelete)
          }}
        />

        <RoundFormModal
          open={isModalOpen}
          onOpenChange={(open) => {
            if (isSaving) return
            setIsModalOpen(open)
            if (!open) setEditingRound(null)
          }}
          elections={modalElections}
          mode={editingRound ? "edit" : "create"}
          round={editingRound}
          isSaving={isSaving}
          isCreateDisabled={isCreateDisabled}
          disableOpenStatusOption={disableOpenStatusOption}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
