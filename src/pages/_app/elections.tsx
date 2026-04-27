import { createFileRoute, useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"
import "dayjs/locale/pt-br"
import { CalendarDays, ChevronRight, User } from "lucide-react"
import * as React from "react"

import { RuleAlert } from "@/components/alerts/ruleAlert"
import { ScreenShell } from "@/components/layout/screenShell"
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
import { useAuthUser } from "@/contexts/authUserContext"
import { cn } from "@/lib/utils"
import { listElections } from "@/services/electionsService"
import { listElectionTypes } from "@/services/electionTypesService"
import type { Election } from "@/types/election"
import type { ElectionType } from "@/types/electionType"

export const Route = createFileRoute("/_app/elections")({
  component: Elections,
})

dayjs.locale("pt-br")

const electionStatusLabelByValue: Record<string, string> = {
  OPEN: "Aberta",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  CLOSED: "Fechada",
  DRAFT: "Rascunho",
}

function Elections() {
  const navigate = useNavigate()
  const { user } = useAuthUser()

  const [isLoading, setIsLoading] = React.useState(true)
  const [elections, setElections] = React.useState<Election[]>([])
  const [electionTypes, setElectionTypes] = React.useState<ElectionType[]>([])
  const [selectedYear, setSelectedYear] = React.useState<string>("ALL")

  React.useEffect(() => {
    if (user && user.accessType !== "member" && user.accessType !== "staff") {
      navigate({ to: "/", replace: true })
    }
    if (!user) {
      navigate({ to: "/login", replace: true })
    }
  }, [navigate, user])

  const typeLabelById = React.useMemo(() => {
    return new Map(electionTypes.map((type) => [type.id, type.type]))
  }, [electionTypes])

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
    const parsedYear = Number.parseInt(selectedYear, 10)
    if (Number.isNaN(parsedYear)) return "ALL"
    if (!availableYears.includes(parsedYear)) return "ALL"
    return selectedYear
  }, [availableYears, selectedYear])

  const filteredElections = React.useMemo(() => {
    if (effectiveSelectedYear === "ALL") return elections
    const parsedYear = Number.parseInt(effectiveSelectedYear, 10)
    if (Number.isNaN(parsedYear)) return elections
    return elections.filter((election) => {
      const parsed = election.date ? dayjs(election.date) : null
      return parsed?.isValid() ? parsed.year() === parsedYear : false
    })
  }, [effectiveSelectedYear, elections])

  const refreshElections = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [nextElections, nextElectionTypes] = await Promise.all([
        listElections(),
        listElectionTypes(),
      ])
      setElections(nextElections)
      setElectionTypes(nextElectionTypes)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshElections()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refreshElections])

  return (
    <ScreenShell>
      <main className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">
              Escolha a eleição
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Apenas eleições abertas podem ser selecionadas.
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-[220px]">
              <Select value={effectiveSelectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
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
              variant="outline"
              className="h-11 rounded-2xl bg-background/15 px-5 hover:bg-background/25"
              onClick={() => navigate({ to: "/begin", replace: true })}
            >
              Retornar ao início
            </Button>
          </div>
        </div>

        <RuleAlert
          title="Regra de seleção"
          description={<>Apenas eleições abertas (ABERTA) podem ser selecionadas para votação.</>}
        />

        {isLoading ? (
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="min-h-[168px] w-full rounded-3xl lg:w-[calc(50%-0.5rem)] 2xl:w-[calc(33.333%-0.667rem)]"
              >
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-44 rounded-full" />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-3 w-36 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : elections.length === 0 ? (
          <Card className="max-w-3xl rounded-3xl">
            <CardHeader>
              <CardTitle>Nenhuma eleição encontrada</CardTitle>
              <CardDescription>
                Não há eleições cadastradas no momento.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : filteredElections.length === 0 ? (
          <Card className="max-w-3xl rounded-3xl">
            <CardHeader>
              <CardTitle>Nenhuma eleição para este ano</CardTitle>
              <CardDescription>Tente outro ano ou limpe o filtro.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 rounded-2xl bg-background/15 px-5 hover:bg-background/25"
                onClick={() => setSelectedYear("ALL")}
              >
                Limpar filtro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            {filteredElections.map((election) => {
              const normalizedStatus = String(election.status ?? "").toUpperCase()
              const isOpen = normalizedStatus === "OPEN"
              const statusLabel =
                electionStatusLabelByValue[normalizedStatus] ?? normalizedStatus
              const electionTypeLabel =
                typeLabelById.get(String(election.type_election)) ?? "Desconhecido"
              const formattedDate = election.date
                ? dayjs(election.date).format("DD/MM/YYYY")
                : "—"
              const yearLabel = election.date ? String(dayjs(election.date).year()) : ""

              return (
                <Card
                  key={election.id}
                  role={isOpen ? "button" : undefined}
                  tabIndex={isOpen ? 0 : -1}
                  className={cn(
                    "group relative w-full rounded-3xl transition-colors lg:w-[calc(50%-0.5rem)] 2xl:w-[calc(33.333%-0.667rem)]",
                    isOpen
                      ? "cursor-pointer hover:bg-card/40"
                      : "cursor-not-allowed opacity-70",
                  )}
                  onClick={() => {
                    if (!isOpen) return
                    navigate({ to: "/vote/$electionId", params: { electionId: election.id } })
                  }}
                  onKeyDown={(event) => {
                    if (!isOpen) return
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      navigate({ to: "/vote/$electionId", params: { electionId: election.id } })
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
                            normalizedStatus === "OPEN"
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                              : "border-white/10 bg-white/6 text-muted-foreground",
                          )}
                        >
                          {statusLabel}
                        </div>
                        {isOpen ? (
                          <div className="grid size-9 place-items-center rounded-2xl bg-white/5 text-muted-foreground transition-colors group-hover:bg-white/10 group-hover:text-foreground">
                            <ChevronRight className="size-4" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground">
                      {isOpen
                        ? "Clique para continuar."
                        : "Apenas eleições abertas podem ser selecionadas."}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </ScreenShell>
  )
}
