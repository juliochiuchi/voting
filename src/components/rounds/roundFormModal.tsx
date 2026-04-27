import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Plus, Save } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { AppModal } from "@/components/modal/appModal"
import { NumericInput } from "@/components/forms/numericInput"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Election } from "@/types/election"
import type { Round } from "@/types/round"

const roundStatusOptions = ["OPEN", "COMPLETED", "CANCELLED"] as const

const roundFormSchema = z.object({
  electionId: z.string().min(1, "A eleição é obrigatória"),
  roundNumber: z
    .string()
    .min(1, "O número da rodada é obrigatório")
    .refine((value) => /^\d+$/.test(value), "Apenas números são permitidos"),
  status: z.enum(roundStatusOptions).optional(),
  totalVotesPerRound: z
    .string()
    .min(1, "O total de votos por rodada é obrigatório")
    .refine((value) => /^\d+$/.test(value), "Apenas números são permitidos"),
  maximumVotesPerBallot: z
    .string()
    .min(1, "O máximo de votos por cédula é obrigatório")
    .refine((value) => /^\d+$/.test(value), "Apenas números são permitidos"),
})

type RoundFormValues = z.infer<typeof roundFormSchema>

export type RoundFormSubmitPayload = {
  id_election: string
  round_number: number
  total_numbers_votes_per_round: number
  maximum_number_votes_per_ballot: number
  status: string
}

export function RoundFormModal({
  open,
  onOpenChange,
  elections,
  mode,
  round,
  isSaving,
  isCreateDisabled,
  disableOpenStatusOption = false,
  onSubmit,
  onCancelCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  elections: Election[]
  mode: "create" | "edit"
  round?: Round | null
  isSaving: boolean
  isCreateDisabled: boolean
  disableOpenStatusOption?: boolean
  onSubmit: (payload: RoundFormSubmitPayload) => Promise<void>
  onCancelCreate?: () => void
}) {
  const form = useForm<RoundFormValues>({
    resolver: zodResolver(roundFormSchema),
    defaultValues: {
      electionId: round?.id_election ?? "",
      roundNumber: round ? String(round.round_number) : "",
      status: (round?.status?.toUpperCase() as RoundFormValues["status"]) ?? "OPEN",
      totalVotesPerRound: round ? String(round.total_numbers_votes_per_round) : "",
      maximumVotesPerBallot: round ? String(round.maximum_number_votes_per_ballot) : "",
    },
  })

  const isCreateMode = mode === "create"
  const selectedElectionId = form.watch("electionId")

  const selectedElectionTotalVoters = React.useMemo(() => {
    const election = elections.find((item) => item.id === selectedElectionId) ?? null
    if (!election) return null
    const total = Number(election.total_number_voters)
    return Number.isFinite(total) ? total : null
  }, [elections, selectedElectionId])

  React.useEffect(() => {
    if (!open) return
    form.reset({
      electionId: round?.id_election ?? "",
      roundNumber: round ? String(round.round_number) : "",
      status: (round?.status?.toUpperCase() as RoundFormValues["status"]) ?? "OPEN",
      totalVotesPerRound: round ? String(round.total_numbers_votes_per_round) : "",
      maximumVotesPerBallot: round ? String(round.maximum_number_votes_per_ballot) : "",
    })
  }, [form, open, round])

  React.useEffect(() => {
    if (!open) return
    if (!isCreateMode) return
    if (selectedElectionTotalVoters === null) return

    form.setValue("totalVotesPerRound", String(selectedElectionTotalVoters), {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    })
  }, [form, isCreateMode, open, selectedElectionTotalVoters])

  return (
    <AppModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSaving) return
        onOpenChange(nextOpen)
        if (!nextOpen && isCreateMode) onCancelCreate?.()
      }}
      title={isCreateMode ? "Nova rodada" : "Editar rodada"}
      description={
        isCreateMode
          ? "Cadastre uma rodada vinculada a uma eleição aberta."
          : "Atualize os dados da rodada."
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
              onOpenChange(false)
              if (isCreateMode) onCancelCreate?.()
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-2xl px-5"
            disabled={isSaving || (isCreateMode && isCreateDisabled)}
            form="round-form"
          >
            {isCreateMode ? <Plus /> : <Save />}
            {isCreateMode ? "Criar" : "Salvar"}
          </Button>
        </>
      }
    >
      <form
        id="round-form"
        className="flex flex-col gap-3"
        onSubmit={form.handleSubmit(async (values) => {
          const totalVotesPerRound =
            isCreateMode && selectedElectionTotalVoters !== null
              ? selectedElectionTotalVoters
              : Number.parseInt(values.totalVotesPerRound, 10)

          const payload: RoundFormSubmitPayload = {
            id_election: values.electionId,
            round_number: Number.parseInt(values.roundNumber, 10),
            total_numbers_votes_per_round: totalVotesPerRound,
            maximum_number_votes_per_ballot: Number.parseInt(values.maximumVotesPerBallot, 10),
            status: isCreateMode ? "OPEN" : (values.status ?? "OPEN"),
          }
          await onSubmit(payload)
        })}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-[1.6] flex-col gap-1.5">
            <Label>Eleição</Label>
            <Controller
              control={form.control}
              name="electionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a eleição" />
                  </SelectTrigger>
                  <SelectContent>
                    {elections.map((election) => (
                      <SelectItem key={election.id} value={election.id}>
                        {election.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <div className="min-h-4 text-xs text-destructive">
              {form.formState.errors.electionId?.message}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Número da rodada</Label>
            <Controller
              control={form.control}
              name="roundNumber"
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Somente números"
                  maxLength={30}
                />
              )}
            />
            <div className="min-h-4 text-xs text-destructive">
              {form.formState.errors.roundNumber?.message}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Total de votos por rodada</Label>
            <Controller
              control={form.control}
              name="totalVotesPerRound"
              render={({ field }) => (
                <NumericInput
                  value={
                    isCreateMode && selectedElectionTotalVoters !== null
                      ? String(selectedElectionTotalVoters)
                      : field.value
                  }
                  onValueChange={field.onChange}
                  placeholder="Automático"
                  maxLength={30}
                  disabled
                />
              )}
            />
            <div className="text-xs text-muted-foreground">
              Este valor é carregado da eleição (total de votantes) e não pode ser alterado.
            </div>
            <div className="min-h-4 text-xs text-destructive">
              {form.formState.errors.totalVotesPerRound?.message}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Máximo de votos por cédula</Label>
            <Controller
              control={form.control}
              name="maximumVotesPerBallot"
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Somente números"
                  maxLength={30}
                />
              )}
            />
            <div className="min-h-4 text-xs text-destructive">
              {form.formState.errors.maximumVotesPerBallot?.message}
            </div>
          </div>
        </div>

        {!isCreateMode ? (
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value ?? "OPEN"} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN" disabled={disableOpenStatusOption}>
                      Aberta
                    </SelectItem>
                    <SelectItem value="COMPLETED">Concluída</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {disableOpenStatusOption ? (
              <div className="text-xs text-muted-foreground">
                Já existe uma rodada aberta. Conclua ou cancele a rodada em andamento
                para reabrir outra.
              </div>
            ) : null}
            <div className="min-h-4 text-xs text-destructive">
              {form.formState.errors.status?.message}
            </div>
          </div>
        ) : null}
      </form>
    </AppModal>
  )
}
