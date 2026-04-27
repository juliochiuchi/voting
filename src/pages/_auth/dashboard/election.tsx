import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute } from "@tanstack/react-router"
import dayjs from "dayjs"
import "dayjs/locale/pt-br"
import {
  CalendarDays,
  Info,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { AppModal } from "@/components/modal/appModal"
import { NumericInput } from "@/components/forms/numericInput"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/contexts/toastContext"
import type { Election } from "@/types/election"
import type { ElectionType } from "@/types/electionType"
import {
  createElection,
  deleteElection,
  listElections,
  updateElection,
} from "@/services/electionsService"
import { listElectionTypes } from "@/services/electionTypesService"
import { listRoundsByElectionId } from "@/services/roundsService"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_auth/dashboard/election")({
  component: Election,
})

dayjs.locale("pt-br")

const electionStatusOptions = ["OPEN", "COMPLETED", "CANCELLED"] as const

const electionStatusLabelByValue = {
  OPEN: "Aberta",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
} satisfies Record<(typeof electionStatusOptions)[number], string>

const electionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome é obrigatório")
    .max(30, "O nome deve ter no máximo 30 caracteres"),
  date: z
    .date()
    .refine((value) => !Number.isNaN(value.getTime()), "A data é obrigatória"),
  typeElectionId: z.string().min(1, "O tipo é obrigatório"),
  status: z.string().optional(),
  numberVotesNeededElected: z
    .string()
    .min(1, "A quantidade de votos é obrigatória")
    .refine((value) => /^\d+$/.test(value), "Apenas números são permitidos"),
  totalNumberVoters: z
    .string()
    .min(1, "O total de votantes é obrigatório")
    .refine((value) => /^\d+$/.test(value), "Apenas números são permitidos"),
  numberCoro: z
    .string()
    .min(1, "O quórum é obrigatório")
    .refine((value) => /^\d+$/.test(value), "Apenas números são permitidos"),
})

type ElectionFormValues = z.infer<typeof electionFormSchema>

function Election() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingElectionTypes, setIsLoadingElectionTypes] =
    React.useState(true)
  const [elections, setElections] = React.useState<Election[]>([])
  const [electionTypes, setElectionTypes] = React.useState<ElectionType[]>([])
  const [selectedYear, setSelectedYear] = React.useState<string>("ALL")

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingElectionId, setEditingElectionId] = React.useState<string | null>(
    null,
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [electionPendingDelete, setElectionPendingDelete] =
    React.useState<Election | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isRulesAlertVisible, setIsRulesAlertVisible] = React.useState(true)
  const [editingElectionHasRounds, setEditingElectionHasRounds] =
    React.useState(false)
  const [isCheckingElectionRounds, setIsCheckingElectionRounds] =
    React.useState(false)

  const editingElection = React.useMemo(() => {
    if (!editingElectionId) return null
    return elections.find((election) => election.id === editingElectionId) ?? null
  }, [elections, editingElectionId])

  const availableYears = React.useMemo(() => {
    const years = new Set<number>()
    for (const election of elections) {
      const parsed = election.date ? dayjs(election.date) : null
      if (parsed && parsed.isValid()) years.add(parsed.year())
    }
    return Array.from(years).sort((a, b) => b - a)
  }, [elections])

  const effectiveSelectedYear = React.useMemo(() => {
    if (selectedYear === "ALL") return "ALL"
    const isStillAvailable = availableYears.some(
      (year) => String(year) === selectedYear,
    )
    return isStillAvailable ? selectedYear : "ALL"
  }, [availableYears, selectedYear])

  const filteredElections = React.useMemo(() => {
    if (effectiveSelectedYear === "ALL") return elections
    return elections.filter((election) => {
      const parsed = election.date ? dayjs(election.date) : null
      if (!parsed || !parsed.isValid()) return false
      return String(parsed.year()) === effectiveSelectedYear
    })
  }, [elections, effectiveSelectedYear])

  const hasElectionInProgress = React.useMemo(() => {
    return elections.some((election) => {
      const normalizedStatus = String(election.status ?? "").toUpperCase()
      return normalizedStatus === "OPEN"
    })
  }, [elections])

  const hasOpenElection = React.useMemo(() => {
    return elections.some((election) => {
      const normalizedStatus = String(election.status ?? "").toUpperCase()
      return normalizedStatus === "OPEN"
    })
  }, [elections])

  const isEditingCompletedOrCancelled = React.useMemo(() => {
    if (!editingElection) return false
    const normalizedStatus = String(editingElection.status ?? "").toUpperCase()
    return normalizedStatus === "COMPLETED" || normalizedStatus === "CANCELLED"
  }, [editingElection])

  const isEditLockedByRounds = Boolean(editingElection && editingElectionHasRounds)

  const isCreateElectionDisabled =
    isLoading || isLoadingElectionTypes || hasElectionInProgress

  const form = useForm<ElectionFormValues>({
    resolver: zodResolver(electionFormSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      typeElectionId: "",
      status: "OPEN",
      numberVotesNeededElected: "",
      totalNumberVoters: "",
      numberCoro: "",
    },
  })

  const typeLabelById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const electionType of electionTypes) {
      map.set(String(electionType.id), electionType.type)
    }
    return map
  }, [electionTypes])

  const loadElectionTypes = React.useCallback(async () => {
    setIsLoadingElectionTypes(true)
    try {
      const types = await listElectionTypes()
      setElectionTypes(types)

      return types
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Falha ao carregar tipos de eleição",
        description: message,
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoadingElectionTypes(false)
    }
  }, [toast])

  const refreshElections = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const electionsFromDatabase = await listElections()
      setElections(electionsFromDatabase)

      const years = new Set<number>()
      for (const election of electionsFromDatabase) {
        const parsed = election.date ? dayjs(election.date) : null
        if (parsed && parsed.isValid()) years.add(parsed.year())
      }
      setSelectedYear((previous) => {
        if (previous === "ALL") return previous
        const isSelectedYearAvailable = Array.from(years).some(
          (year) => String(year) === previous,
        )
        return isSelectedYearAvailable ? previous : "ALL"
      })
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
  }, [toast])

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    setIsLoadingElectionTypes(true)
    try {
      const [types, electionsFromDatabase] = await Promise.all([
        listElectionTypes(),
        listElections(),
      ])
      setElectionTypes(types)
      setElections(electionsFromDatabase)

      const years = new Set<number>()
      for (const election of electionsFromDatabase) {
        const parsed = election.date ? dayjs(election.date) : null
        if (parsed && parsed.isValid()) years.add(parsed.year())
      }
      setSelectedYear((previous) => {
        if (previous === "ALL") return previous
        const isSelectedYearAvailable = Array.from(years).some(
          (year) => String(year) === previous,
        )
        return isSelectedYearAvailable ? previous : "ALL"
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Falha ao carregar eleições",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsLoadingElectionTypes(false)
    }
  }, [toast])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  async function openCreateModal() {
    if (hasElectionInProgress) {
      toast({
        title: "Não é possível criar uma nova eleição",
        description:
          "Existe uma eleição em andamento (ABERTA ou PAUSADA). Conclua ou cancele antes de criar outra.",
        variant: "destructive",
      })
      return
    }
    if (electionTypes.length === 0) {
      const loaded = await loadElectionTypes()
      if (!loaded) return
    }
    setEditingElectionId(null)
    setEditingElectionHasRounds(false)
    setIsCheckingElectionRounds(false)
    form.reset({
      name: "",
      date: new Date(),
      typeElectionId: "",
      status: "OPEN",
      numberVotesNeededElected: "",
      totalNumberVoters: "",
      numberCoro: "",
    })
    setIsModalOpen(true)
  }

  async function openEditModal(election: Election) {
    if (electionTypes.length === 0) {
      const loaded = await loadElectionTypes()
      if (!loaded) return
    }
    setIsCheckingElectionRounds(true)
    setEditingElectionHasRounds(false)
    setEditingElectionId(election.id)
    form.reset({
      name: election.name ?? "",
      date: election.date ? dayjs(election.date).toDate() : new Date(),
      typeElectionId: String(election.type_election ?? ""),
      status: String(election.status ?? "").toUpperCase(),
      numberVotesNeededElected: String(election.number_votes_needed_elected ?? ""),
      totalNumberVoters: String(election.total_number_voters ?? ""),
      numberCoro: String(election.number_coro ?? ""),
    })
    setIsModalOpen(true)

    void (async () => {
      try {
        const rounds = await listRoundsByElectionId(election.id)
        setEditingElectionHasRounds(rounds.length > 0)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro inesperado"
        toast({
          title: "Falha ao verificar rodadas da eleição",
          description: message,
          variant: "destructive",
        })
        setEditingElectionHasRounds(true)
      } finally {
        setIsCheckingElectionRounds(false)
      }
    })()
  }

  async function onSubmit(values: ElectionFormValues) {
    setIsSaving(true)
    try {
      if (
        editingElection &&
        hasOpenElection &&
        isEditingCompletedOrCancelled &&
        values.status === "OPEN"
      ) {
        toast({
          title: "Status inválido",
          description:
            "Já existe uma eleição ABERTA. Não é permitido reabrir uma eleição concluída/cancelada enquanto houver uma eleição aberta.",
          variant: "destructive",
        })
        return
      }

      const statusToSend = editingElection
        ? values.status ?? String(editingElection.status ?? "").toUpperCase()
        : "OPEN"

      const fullPayload = {
        name: values.name,
        date: dayjs(values.date).format("YYYY-MM-DD"),
        type_election: values.typeElectionId,
        number_votes_needed_elected: Number(values.numberVotesNeededElected),
        total_number_voters: Number(values.totalNumberVoters),
        number_coro: Number(values.numberCoro),
        status: statusToSend,
      } satisfies Omit<Election, "id">

      if (editingElection) {
        const updatePayload = isEditLockedByRounds
          ? ({ name: values.name, status: statusToSend } satisfies Partial<Omit<Election, "id">>)
          : fullPayload

        const updated = await updateElection(editingElection.id, updatePayload)
        if (!updated) {
          throw new Error("A atualização da eleição não retornou a representação")
        }
        toast({
          title: "Eleição atualizada",
          description: "Alterações salvas com sucesso.",
        })
      } else {
        const created = await createElection(fullPayload)
        if (!created) {
          throw new Error("A criação da eleição não retornou a representação")
        }
        toast({
          title: "Eleição criada",
          description: "Eleição adicionada com sucesso.",
        })
      }

      setIsModalOpen(false)
      await refreshElections()
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

  function handleDelete(election: Election) {
    const normalizedStatus = String(election.status ?? "").toUpperCase()
    if (normalizedStatus !== "CANCELLED") return

    setElectionPendingDelete(election)
    setIsDeleteModalOpen(true)
  }

  async function confirmDelete() {
    if (!electionPendingDelete) return
    const normalizedStatus = String(electionPendingDelete.status ?? "").toUpperCase()
    if (normalizedStatus !== "CANCELLED") return

    setIsDeleting(true)
    try {
      await deleteElection(electionPendingDelete.id)
      toast({
        title: "Eleição excluída",
        description: "A eleição foi removida com sucesso.",
      })
      setIsDeleteModalOpen(false)
      setElectionPendingDelete(null)
      await refreshElections()
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

  return (
    <div className="min-h-dvh p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Eleições</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Crie e gerencie eleições.
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-[220px]">
              <Select
                value={effectiveSelectedYear}
                onValueChange={(value) => {
                  setSelectedYear(value)
                  void refreshElections()
                }}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os anos</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="lg"
              disabled={isCreateElectionDisabled}
              className="h-11 rounded-2xl px-5"
              onClick={() => {
                void openCreateModal()
              }}
            >
              {isLoadingElectionTypes ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Carregando
                </>
              ) : (
                <>
                  <Plus />
                  Nova eleição
                </>
              )}
            </Button>
          </div>
        </div>

        {isRulesAlertVisible && hasElectionInProgress ? (
          <Alert className="mb-6">
            <Info className="size-4" />
            <AlertTitle>Regra de criação de eleição</AlertTitle>
            <AlertDescription>
              Uma nova eleição só poderá ser criada quando a eleição em andamento
              (ABERTA ou PAUSADA) estiver CONCLUÍDA ou CANCELADA.
            </AlertDescription>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Fechar aviso"
              className="absolute right-2 top-2 rounded-xl text-muted-foreground hover:bg-white/8 hover:text-foreground"
              onClick={() => setIsRulesAlertVisible(false)}
            >
              <X className="size-4" />
            </Button>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="min-h-[232px] w-full rounded-3xl lg:w-[calc(50%-0.5rem)] 2xl:w-[calc(33.333%-0.667rem)]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-5 w-44 rounded-full" />
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Skeleton className="h-6 w-28 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-14 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-9 w-9 rounded-2xl" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-[68px] flex-1 rounded-2xl" />
                      <Skeleton className="h-[68px] flex-1 rounded-2xl" />
                      <Skeleton className="h-[68px] flex-1 rounded-2xl" />
                    </div>
                    <Skeleton className="h-3 w-28 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : elections.length === 0 ? (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Nenhuma eleição ainda</CardTitle>
              <CardDescription>
                Crie sua primeira eleição para começar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                size="lg"
                className="h-11 rounded-2xl px-5 mt-4"
                onClick={openCreateModal}
              >
                <Plus />
                Nova eleição
              </Button>
            </CardContent>
          </Card>
        ) : filteredElections.length === 0 ? (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Nenhuma eleição para este ano</CardTitle>
              <CardDescription>Tente outro ano ou limpe o filtro.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 rounded-2xl px-5 mt-4"
                onClick={() => {
                  setSelectedYear("ALL")
                  void refreshElections()
                }}
              >
                Limpar filtro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            {filteredElections.map((election) => {
              const normalizedStatus = String(election.status ?? "").toUpperCase()
              const electionTypeLabel =
                typeLabelById.get(String(election.type_election)) ?? "Desconhecido"
              const statusLabel =
                (electionStatusLabelByValue as Record<string, string>)[
                normalizedStatus
                ] ?? normalizedStatus
              const formattedDate = election.date
                ? dayjs(election.date).format("DD/MM/YYYY")
                : "—"
              const yearLabel = election.date
                ? String(dayjs(election.date).year())
                : ""

              return (
                <Card
                  key={election.id}
                  role="button"
                  tabIndex={0}
                  className="group relative flex min-h-[232px] w-full cursor-pointer flex-col rounded-3xl transition-colors hover:bg-card/40 lg:w-[calc(50%-0.5rem)] 2xl:w-[calc(33.333%-0.667rem)]"
                  onClick={() => void openEditModal(election)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      void openEditModal(election)
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate">{election.name}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                            <CalendarDays className="size-3.5" />
                            <span className="text-foreground/90">{formattedDate}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-foreground/90">
                            <User className="size-3.5" />
                            {electionTypeLabel}
                          </div>
                          {yearLabel ? (
                            <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                              {yearLabel}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
                          {statusLabel}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {normalizedStatus === "CANCELLED" ? (
                            <Button
                              type="button"
                              size="icon-lg"
                              variant="destructive"
                              aria-label="Excluir eleição"
                              className="rounded-2xl"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                void handleDelete(election)
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col pt-0">
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex gap-2">
                        <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="text-[11px] text-muted-foreground">
                            Votos necessários
                          </div>
                          <div className="mt-1 text-base font-semibold tabular-nums">
                            {election.number_votes_needed_elected}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="text-[11px] text-muted-foreground">
                            Total de votantes
                          </div>
                          <div className="mt-1 text-base font-semibold tabular-nums">
                            {election.total_number_voters}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="text-[11px] text-muted-foreground">
                            Quórum
                          </div>
                          <div className="mt-1 text-base font-semibold tabular-nums">
                            {election.number_coro}
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
            })}
          </div>
        )}
      </div>

      <AppModal
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          if (isDeleting) return
          setIsDeleteModalOpen(open)
          if (!open) setElectionPendingDelete(null)
        }}
        title="Excluir eleição?"
        description="Esta ação remove a eleição permanentemente e não pode ser desfeita."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 rounded-2xl px-5"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setElectionPendingDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="h-11 rounded-2xl px-5"
              onClick={() => void confirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Excluindo
                </>
              ) : (
                <>
                  <Trash2 />
                  Excluir
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1 text-sm">
          <div className="font-medium text-foreground">
            {electionPendingDelete?.name ?? "—"}
          </div>
          <div className="text-muted-foreground">
            {electionPendingDelete?.date
              ? dayjs(electionPendingDelete.date).format("DD/MM/YYYY")
              : "—"}
          </div>
        </div>
      </AppModal>

      <AppModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setEditingElectionHasRounds(false)
            setIsCheckingElectionRounds(false)
            form.reset()
          }
        }}
        title={editingElection ? "Editar eleição" : "Nova eleição"}
        description={
          editingElection
            ? "Atualize os detalhes da eleição."
            : "Crie uma nova eleição com as configurações necessárias."
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 rounded-2xl px-5"
              disabled={isSaving}
              onClick={() => {
                setIsModalOpen(false)
                form.reset()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSaving || isCheckingElectionRounds}
              form="election-form"
              className="h-11 rounded-2xl px-5"
            >
              {editingElection ? <Save /> : <Plus />}
              {isSaving ? "Salvando" : editingElection ? "Salvar" : "Criar"}
            </Button>
          </>
        }
      >
        <form
          id="election-form"
          className="flex flex-col gap-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Nome da eleição"
              autoComplete="off"
              maxLength={30}
              {...form.register("name")}
            />
            <div className="min-h-2 text-xs text-destructive">
              {form.formState.errors.name?.message ?? ""}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1.5">
                <Label>Data</Label>
                <Controller
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSaving || isCheckingElectionRounds || isEditLockedByRounds}
                          className="h-10 w-full justify-start gap-2 rounded-2xl bg-background/20 hover:bg-background/30"
                        >
                          <CalendarDays className="size-4" />
                          {field.value
                            ? dayjs(field.value).format("DD/MM/YYYY")
                            : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-2">
                        <Calendar
                          selected={field.value}
                          onSelect={(date) => field.onChange(date)}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                <div className="min-h-2 text-xs text-destructive">
                  {form.formState.errors.date?.message ?? ""}
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <Controller
                  control={form.control}
                  name="typeElectionId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      disabled={
                        isLoadingElectionTypes ||
                        isSaving ||
                        isCheckingElectionRounds ||
                        isEditLockedByRounds
                      }
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingElectionTypes
                              ? "Carregando..."
                              : "Selecione um tipo"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingElectionTypes ? (
                          <SelectItem value="__loading__" disabled>
                            Carregando...
                          </SelectItem>
                        ) : electionTypes.length === 0 ? (
                          <SelectItem value="__empty__" disabled>
                            Nenhum tipo disponível
                          </SelectItem>
                        ) : (
                          electionTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.type}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="min-h-2 text-xs text-destructive">
                  {form.formState.errors.typeElectionId?.message ?? ""}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Votos necessários</Label>
              <Controller
                control={form.control}
                name="numberVotesNeededElected"
                render={({ field }) => (
                  <NumericInput
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    placeholder="0"
                    disabled={isSaving || isCheckingElectionRounds || isEditLockedByRounds}
                  />
                )}
              />
              <div className="min-h-2 text-xs text-destructive">
                {form.formState.errors.numberVotesNeededElected?.message ?? ""}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Total de votantes</Label>
              <Controller
                control={form.control}
                name="totalNumberVoters"
                render={({ field }) => (
                  <NumericInput
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    placeholder="0"
                    disabled={isSaving || isCheckingElectionRounds || isEditLockedByRounds}
                  />
                )}
              />
              <div className="min-h-2 text-xs text-destructive">
                {form.formState.errors.totalNumberVoters?.message ?? ""}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Quórum</Label>
              <Controller
                control={form.control}
                name="numberCoro"
                render={({ field }) => (
                  <NumericInput
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    placeholder="0"
                    disabled={isSaving || isCheckingElectionRounds || isEditLockedByRounds}
                  />
                )}
              />
              <div className="min-h-2 text-xs text-destructive">
                {form.formState.errors.numberCoro?.message ?? ""}
              </div>
            </div>
          </div>

          {editingElection ? (
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "OPEN"}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {electionStatusOptions.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          disabled={
                            hasOpenElection &&
                            isEditingCompletedOrCancelled &&
                            status === "OPEN"
                          }
                        >
                          {electionStatusLabelByValue[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {hasOpenElection && isEditingCompletedOrCancelled ? (
                <div className="text-xs text-muted-foreground">
                  Já existe uma eleição aberta. Conclua ou cancele a eleição em andamento para reabrir outra.
                </div>
              ) : null}
              <div className="min-h-2 text-xs text-destructive">
                {form.formState.errors.status?.message ?? ""}
              </div>
            </div>
          ) : null}
        </form>
      </AppModal>
    </div>
  )
}
