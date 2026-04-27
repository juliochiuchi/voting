import { FileText, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCpf } from "@/lib/cpf"
import type { Member } from "@/types/member"

function formatStatusLabel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return "—"
  const normalized = trimmed.toUpperCase()
  if (normalized === "ACTIVE") return "Ativo"
  if (normalized === "INACTIVE") return "Inativo"
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export function MembersTable({
  members,
  isLoading,
  onEdit,
  onDelete,
}: {
  members: Member[]
  isLoading: boolean
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
}) {
  return (
    <Card className="w-full rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Membros</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[170px]">CPF</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[140px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-56 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-44 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5">
                      <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">Nenhum membro encontrado</div>
                    <div className="text-xs text-muted-foreground">
                      Tente ajustar os filtros para localizar membros.
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.cpf ? formatCpf(member.cpf) : "—"}</TableCell>
                  <TableCell>{formatStatusLabel(member.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="icon-lg"
                        variant="outline"
                        className="rounded-2xl"
                        aria-label="Editar membro"
                        onClick={() => onEdit(member)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-lg"
                        variant="destructive"
                        className="rounded-2xl"
                        aria-label="Excluir membro"
                        onClick={() => onDelete(member)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
