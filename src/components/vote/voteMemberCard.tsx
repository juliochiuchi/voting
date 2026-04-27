import { Check, Plus, User } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatCpf } from "@/lib/cpf"
import type { Member } from "@/types/member"

export function VoteMemberCard({
  member,
  isSelected,
  isDisabled,
  onToggle,
}: {
  member: Member
  isSelected: boolean
  isDisabled: boolean
  onToggle: () => void
}) {
  return (
    <Card
      role={isDisabled ? undefined : "button"}
      tabIndex={isDisabled ? -1 : 0}
      className={cn(
        "group relative overflow-hidden rounded-3xl transition-colors",
        isDisabled ? "opacity-60" : "cursor-pointer hover:bg-card/40",
        isSelected
          ? "ring-1 ring-emerald-400/30 bg-emerald-500/5"
          : "ring-1 ring-white/10 bg-background/10",
      )}
      onClick={() => {
        if (isDisabled) return
        onToggle()
      }}
      onKeyDown={(event) => {
        if (isDisabled) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onToggle()
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute -left-10 -top-10 size-40 rounded-full bg-white/6 blur-2xl" />
        <div className="absolute -bottom-12 -right-12 size-44 rounded-full bg-white/4 blur-2xl" />
      </div>

      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="size-3.5" />
              <span>Membro</span>
            </div>
            <div className="mt-2 truncate text-base font-semibold tracking-tight">
              {member.name || "—"}
            </div>
            <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              {member.cpf ? formatCpf(member.cpf) : "CPF não informado"}
            </div>
          </div>

          <Button
            type="button"
            size="icon-lg"
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "rounded-2xl",
              isSelected
                ? "bg-emerald-500/15 text-foreground hover:bg-emerald-500/20 border-emerald-400/25"
                : "bg-background/15 hover:bg-background/25",
            )}
            disabled={isDisabled}
            aria-label={isSelected ? "Remover seleção" : "Selecionar membro"}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (isDisabled) return
              onToggle()
            }}
          >
            {isSelected ? <Check className="size-4" /> : <Plus className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
