import { createFileRoute } from "@tanstack/react-router"
import { Fingerprint, User, UserPlus } from "lucide-react"
import * as React from "react"

import { ConfirmActionModal } from "@/components/modal/confirmActionModal"
import { MemberFormModal } from "@/components/members/memberFormModal"
import { MembersTable } from "@/components/members/membersTable"
import { TableFilterInput } from "@/components/tables/tableFilterInput"
import { TablePaginationControls } from "@/components/tables/tablePaginationControls"
import { Button } from "@/components/ui/button"
import { useToast } from "@/contexts/toastContext"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import {
  createMemberForAdmin,
  deleteMemberForAdmin,
  listMembersForAdmin,
  updateMemberForAdmin,
} from "@/services/membersAdminService"
import type { Member } from "@/types/member"

export const Route = createFileRoute("/_auth/dashboard/members")({
  component: Members,
})

function Members() {
  const { toast } = useToast()

  const [nameFilter, setNameFilter] = React.useState("")
  const [cpfFilter, setCpfFilter] = React.useState("")
  const debouncedNameFilter = useDebouncedValue(nameFilter.trim(), 350)
  const debouncedCpfFilter = useDebouncedValue(cpfFilter.trim(), 350)

  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const [isLoading, setIsLoading] = React.useState(true)
  const [members, setMembers] = React.useState<Member[]>([])
  const [totalMembers, setTotalMembers] = React.useState(0)

  const totalPages = Math.max(1, Math.ceil(totalMembers / pageSize))

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false)
  const [editingMember, setEditingMember] = React.useState<Member | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const [memberPendingDelete, setMemberPendingDelete] = React.useState<Member | null>(
    null,
  )
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    if (page === 1) return
    const timeoutId = window.setTimeout(() => setPage(1), 0)
    return () => window.clearTimeout(timeoutId)
  }, [debouncedNameFilter, debouncedCpfFilter])

  function openCreateModal() {
    setEditingMember(null)
    setIsFormModalOpen(true)
  }

  function openEditModal(member: Member) {
    setEditingMember(member)
    setIsFormModalOpen(true)
  }

  function openDeleteModal(member: Member) {
    setMemberPendingDelete(member)
    setIsDeleteModalOpen(true)
  }

  const refreshMembers = React.useCallback(async (targetPage: number) => {
    setIsLoading(true)
    try {
      const response = await listMembersForAdmin({
        page: targetPage,
        pageSize,
        nameFilter: debouncedNameFilter || undefined,
        cpfFilter: debouncedCpfFilter || undefined,
      })
      setMembers(response.items)
      setTotalMembers(response.total)
    } catch {
      setMembers([])
      setTotalMembers(0)
      toast({
        title: "Não foi possível carregar os membros",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [debouncedCpfFilter, debouncedNameFilter, pageSize, toast])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshMembers(page)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [debouncedCpfFilter, debouncedNameFilter, page, refreshMembers])

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-4">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Membros</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Consulte, crie e gerencie membros cadastrados.
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-3 lg:max-w-3xl lg:grid-cols-2">
              <TableFilterInput
                value={nameFilter}
                onChange={setNameFilter}
                placeholder="Filtrar por nome"
                icon={User}
                maxLength={120}
              />
              <TableFilterInput
                value={cpfFilter}
                onChange={setCpfFilter}
                placeholder="Filtrar por CPF"
                icon={Fingerprint}
                maxLength={30}
              />
            </div>

            <Button
              type="button"
              size="lg"
              className="h-11 rounded-2xl px-5 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]"
              onClick={openCreateModal}
            >
              <UserPlus className="size-4" />
              Novo membro
            </Button>
          </div>
        </div>

        <MembersTable
          members={members}
          isLoading={isLoading}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />

        <TablePaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={totalMembers}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </main>

      <MemberFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        title={editingMember ? "Editar membro" : "Novo membro"}
        description={
          editingMember
            ? "Atualize as informações do membro."
            : "Cadastre um novo membro para votação."
        }
        initialMember={editingMember}
        isSaving={isSaving}
        onSubmit={async (input) => {
          setIsSaving(true)
          try {
            if (editingMember) {
              const updated = await updateMemberForAdmin(editingMember.id, input)
              if (!updated) throw new Error("Update failed")
              toast({ title: "Membro atualizado com sucesso" })
            } else {
              const created = await createMemberForAdmin(input)
              if (!created) throw new Error("Create failed")
              toast({ title: "Membro criado com sucesso" })
            }

            setIsFormModalOpen(false)
            await refreshMembers(1)
            setPage(1)
          } catch {
            toast({
              title: "Não foi possível salvar o membro",
              description: "Verifique os dados e tente novamente.",
              variant: "destructive",
            })
          } finally {
            setIsSaving(false)
          }
        }}
      />

      <ConfirmActionModal
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          if (isDeleting) return
          setIsDeleteModalOpen(open)
        }}
        title="Excluir membro"
        description={
          memberPendingDelete
            ? `Tem certeza que deseja excluir o membro "${memberPendingDelete.name}"?`
            : "Tem certeza que deseja excluir este membro?"
        }
        confirmLabel={isDeleting ? "Excluindo" : "Excluir"}
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!memberPendingDelete) return
          setIsDeleting(true)
          try {
            await deleteMemberForAdmin(memberPendingDelete.id)
            toast({ title: "Membro excluído com sucesso" })
            setIsDeleteModalOpen(false)
            setMemberPendingDelete(null)
            await refreshMembers(1)
            setPage(1)
          } catch {
            toast({
              title: "Não foi possível excluir o membro",
              description: "Tente novamente em alguns instantes.",
              variant: "destructive",
            })
          } finally {
            setIsDeleting(false)
          }
        }}
      />
    </>
  )
}
