import { Trash2, Users, Vote } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCpf } from "@/lib/cpf"
import type { Member } from "@/types/member"

export function SelectedVotesCard({
  selectedMembers,
  maximumVotesPerBallot,
  isSubmitting,
  onRemoveMember,
  onConfirm,
}: {
  selectedMembers: Member[]
  maximumVotesPerBallot: number
  isSubmitting: boolean
  onRemoveMember: (memberId: string) => void
  onConfirm: () => void
}) {
  const selectedCount = selectedMembers.length
  const isConfirmDisabled = isSubmitting || selectedCount !== maximumVotesPerBallot

  return (
    <Card className="sticky top-6 w-full rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Seleção</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              <span>{`${selectedCount}/${maximumVotesPerBallot} escolhidos`}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {selectedCount === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
            {`Selecione ${maximumVotesPerBallot} membro(s) para habilitar a confirmação.`}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{member.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {member.cpf ? formatCpf(member.cpf) : "CPF não informado"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-2xl bg-background/15 hover:bg-background/25"
                  onClick={() => onRemoveMember(member.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          size="lg"
          disabled={isConfirmDisabled}
          className="mt-4 h-12 w-full rounded-2xl text-base shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]"
          onClick={onConfirm}
        >
          <Vote />
          Confirmar e assistir votação
        </Button>
      </CardContent>
    </Card>
  )
}
