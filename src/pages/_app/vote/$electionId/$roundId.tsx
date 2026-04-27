import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, ChevronDown, Search, Users } from "lucide-react"
import * as React from "react"
import { z } from "zod"

import { ScreenShell } from "@/components/layout/screenShell"
import { SelectedVotesCard } from "@/components/vote/selectedVotesCard"
import { VoteMemberCard } from "@/components/vote/voteMemberCard"
import { TableFilterInput } from "@/components/tables/tableFilterInput"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthUser } from "@/contexts/authUserContext"
import { useToast } from "@/contexts/toastContext"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { listActiveMembers } from "@/services/membersService"
import { findRoundByElectionAndId } from "@/services/roundsService"
import { submitBallot } from "@/services/voteBallotService"
import {
  listRoundIdsVotedByMember,
  listVotingRecordRoundIdsByElection,
} from "@/services/votingRecordsService"
import type { Member } from "@/types/member"
import type { Round } from "@/types/round"

export const Route = createFileRoute("/_app/vote/$electionId/$roundId")({
  component: Vote,
})

function normalizeStatus(value: unknown) {
  const normalized = String(value ?? "").toUpperCase()
  if (normalized === "CANCELELD") return "CANCELLED"
  return normalized
}

function parseInteger(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numericValue)) return null
  return Math.trunc(numericValue)
}

function createBallotSchema(maximumVotesPerBallot: number) {
  return z
    .object({
      memberIds: z
        .array(z.string().min(1))
        .length(
          maximumVotesPerBallot,
          `Selecione exatamente ${maximumVotesPerBallot} membro(s) para confirmar.`,
        ),
    })
    .superRefine((values, context) => {
      const uniqueCount = new Set(values.memberIds).size
      if (uniqueCount !== values.memberIds.length) {
        context.addIssue({
          code: "custom",
          message: "Remova seleções duplicadas e tente novamente.",
          path: ["memberIds"],
        })
      }
    })
}

function Vote() {
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const { toast } = useToast()
  const { electionId, roundId } = Route.useParams()

  const [nameFilter, setNameFilter] = React.useState("")
  const debouncedNameFilter = useDebouncedValue(nameFilter.trim(), 300)
  const [visibleMemberCount, setVisibleMemberCount] = React.useState(6)

  const [isLoading, setIsLoading] = React.useState(true)
  const [round, setRound] = React.useState<Round | null>(null)
  const [members, setMembers] = React.useState<Member[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!user) {
      navigate({ to: "/login", replace: true })
      return
    }
    if (user.accessType !== "member" && user.accessType !== "staff") {
      navigate({ to: "/", replace: true })
      return
    }
  }, [navigate, user])

  React.useEffect(() => {
    if (!user) return
    if (user.accessType !== "member" && user.accessType !== "staff") return

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        setSelectedMemberIds([])
        setNameFilter("")
        setVisibleMemberCount(6)
        try {
          const nextRound = await findRoundByElectionAndId({ electionId, roundId })
          if (!nextRound) {
            toast({
              title: "Rodada não encontrada",
              description: "Selecione a rodada novamente para continuar.",
              variant: "destructive",
            })
            navigate({
              to: "/rounds/$electionId",
              params: { electionId },
              replace: true,
            })
            return
          }

          if (normalizeStatus(nextRound.status) !== "OPEN") {
            toast({
              title: "Rodada indisponível",
              description: "Apenas rodadas abertas podem receber votação.",
              variant: "destructive",
            })
            navigate({
              to: "/rounds/$electionId",
              params: { electionId },
              replace: true,
            })
            return
          }

          if (user.accessType === "member") {
            if (!user.cpf) {
              toast({
                title: "CPF não identificado",
                description: "Faça login novamente para continuar.",
                variant: "destructive",
              })
              navigate({ to: "/login", replace: true })
              return
            }

            const votedRoundIds = await listRoundIdsVotedByMember({
              electionId,
              cpf: user.cpf,
            })
            if (votedRoundIds.includes(roundId)) {
              toast({
                title: "Voto já registrado",
                description: "Você já votou nesta rodada.",
              })
              navigate({
                to: "/rounds/$electionId",
                params: { electionId },
                replace: true,
              })
              return
            }
          }

          if (user.accessType === "staff") {
            const expectedVotes = parseInteger(nextRound.total_numbers_votes_per_round)
            const votedRoundIds = await listVotingRecordRoundIdsByElection({
              electionId,
            })
            const currentVotes = votedRoundIds.filter((id) => id === roundId).length
            if (expectedVotes !== null && currentVotes >= expectedVotes) {
              toast({
                title: "Rodada encerrada",
                description: "Esta rodada não está mais recebendo votos.",
              })
              navigate({
                to: "/rounds/$electionId",
                params: { electionId },
                replace: true,
              })
              return
            }
          }

          const nextMembers = await listActiveMembers()
          setRound(nextRound)
          setMembers(nextMembers)
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro inesperado"
          toast({
            title: "Falha ao carregar votação",
            description: message,
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [electionId, navigate, roundId, toast, user])

  const maximumVotesPerBallot = React.useMemo(() => {
    const rawValue = round?.maximum_number_votes_per_ballot
    const parsed = parseInteger(rawValue)
    return parsed && parsed > 0 ? parsed : 1
  }, [round?.maximum_number_votes_per_ballot])

  const memberById = React.useMemo(() => {
    const map = new Map<string, Member>()
    for (const member of members) map.set(member.id, member)
    return map
  }, [members])

  const selectedMembers = React.useMemo(() => {
    const selected: Member[] = []
    for (const memberId of selectedMemberIds) {
      const member = memberById.get(memberId)
      if (member) selected.push(member)
    }
    return selected
  }, [memberById, selectedMemberIds])

  const filteredMembers = React.useMemo(() => {
    const filterValue = debouncedNameFilter.trim().toLowerCase()
    if (!filterValue) return members
    return members.filter((member) => member.name.trim().toLowerCase().includes(filterValue))
  }, [debouncedNameFilter, members])

  const visibleMembers = React.useMemo(() => {
    return filteredMembers.slice(0, visibleMemberCount)
  }, [filteredMembers, visibleMemberCount])

  const canShowMoreMembers = visibleMemberCount < filteredMembers.length

  const isSelectionLocked = selectedMemberIds.length >= maximumVotesPerBallot

  const toggleMember = React.useCallback(
    (memberId: string) => {
      setSelectedMemberIds((current) => {
        if (current.includes(memberId)) {
          return current.filter((id) => id !== memberId)
        }
        if (current.length >= maximumVotesPerBallot) return current
        return [...current, memberId]
      })
    },
    [maximumVotesPerBallot],
  )

  const removeMember = React.useCallback((memberId: string) => {
    setSelectedMemberIds((current) => current.filter((id) => id !== memberId))
  }, [])

  const handleConfirm = React.useCallback(async () => {
    if (!user) return
    if (!round) return
    if (isSubmitting) return

    const ballotSchema = createBallotSchema(maximumVotesPerBallot)
    const validation = ballotSchema.safeParse({ memberIds: selectedMemberIds })
    if (!validation.success) {
      toast({
        title: "Seleção inválida",
        description: validation.error.issues[0]?.message ?? "Revise sua seleção e tente novamente.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await submitBallot({
        electionId,
        roundId,
        voterCpf: user.cpf,
        memberIds: validation.data.memberIds,
      })
      toast({
        title: "Voto confirmado",
        description: "Redirecionando para a tela de acompanhamento.",
      })
      navigate({ to: "/watch", replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Não foi possível confirmar a votação",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    electionId,
    isSubmitting,
    maximumVotesPerBallot,
    navigate,
    round,
    roundId,
    selectedMemberIds,
    toast,
    user,
  ])

  return (
    <ScreenShell>
      <main className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Votação</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {round
                ? `Rodada ${round.round_number} • Selecione ${maximumVotesPerBallot} membro(s) com status Ativo.`
                : "Carregando rodada..."}
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-11 rounded-2xl bg-background/15 px-5 hover:bg-background/25"
            onClick={() =>
              navigate({
                to: "/rounds/$electionId",
                params: { electionId },
                replace: true,
              })
            }
          >
            <ArrowLeft />
            Voltar
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <Card key={index} className="overflow-hidden rounded-3xl">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="mt-3 h-6 w-64 rounded-full" />
                    <Skeleton className="mt-3 h-6 w-40 rounded-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="rounded-3xl">
              <CardHeader>
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="mt-3 h-4 w-44 rounded-full" />
              </CardHeader>
              <div className="px-6 pb-6">
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            </Card>
          </div>
        ) : !round ? (
          <Card className="w-full rounded-3xl">
            <CardHeader>
              <CardTitle>Rodada indisponível</CardTitle>
              <CardDescription>
                Selecione a rodada novamente para continuar.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : members.length === 0 ? (
          <Card className="w-full rounded-3xl">
            <CardHeader>
              <CardTitle>Nenhum membro ativo encontrado</CardTitle>
              <CardDescription>
                No momento não há membros com status ACTIVE disponíveis para votação.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>{`${filteredMembers.length} membro(s) ativos`}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {isSelectionLocked
                    ? "Limite atingido. Remova uma seleção para escolher outro."
                    : `Você pode escolher mais ${maximumVotesPerBallot - selectedMemberIds.length}.`}
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:max-w-sm">
                  <TableFilterInput
                    value={nameFilter}
                    onChange={setNameFilter}
                    placeholder="Filtrar por nome"
                    icon={Search}
                    maxLength={120}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {`Mostrando ${Math.min(visibleMemberCount, filteredMembers.length)} de ${filteredMembers.length}`}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
                {visibleMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id)
                  const isCardDisabled =
                    isSubmitting || (!isSelected && isSelectionLocked)

                  return (
                    <VoteMemberCard
                      key={member.id}
                      member={member}
                      isSelected={isSelected}
                      isDisabled={isCardDisabled}
                      onToggle={() => toggleMember(member.id)}
                    />
                  )
                })}
              </div>

              {canShowMoreMembers ? (
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="h-11 rounded-2xl bg-background/15 px-5 hover:bg-background/25"
                    onClick={() => setVisibleMemberCount((current) => current + 6)}
                  >
                    <ChevronDown className="size-4" />
                    Exibir mais
                  </Button>
                </div>
              ) : null}
            </div>

            <SelectedVotesCard
              selectedMembers={selectedMembers}
              maximumVotesPerBallot={maximumVotesPerBallot}
              isSubmitting={isSubmitting}
              onRemoveMember={removeMember}
              onConfirm={handleConfirm}
            />
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          className="mt-10 h-11 rounded-2xl px-4 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => navigate({ to: "/begin", replace: true })}
        >
          <ArrowLeft />
          Retornar ao início
        </Button>
      </main>
    </ScreenShell>
  )
}
