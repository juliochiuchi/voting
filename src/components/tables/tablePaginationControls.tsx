import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function TablePaginationControls({
  page,
  totalPages,
  totalItems,
  isLoading,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalItems: number
  isLoading: boolean
  onPageChange: (page: number) => void
}) {
  const safeTotalPages = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotalPages)
  const canGoPrevious = safePage > 1
  const canGoNext = safePage < safeTotalPages

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="order-2 text-left text-xs text-muted-foreground sm:order-1 sm:text-left">
        {isLoading ? "Carregando..." : `${totalItems} registro(s) encontrado(s)`}
      </div>

      <div className="order-1 flex items-center justify-between gap-3 sm:order-2 sm:justify-end">
        <div className="text-xs text-muted-foreground">
          Página {safePage} de {safeTotalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-2xl"
            disabled={!canGoPrevious || isLoading}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-2xl"
            disabled={!canGoNext || isLoading}
            onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
            aria-label="Próxima página"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
