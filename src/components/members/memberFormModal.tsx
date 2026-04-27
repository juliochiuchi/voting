import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, Save, UserPlus } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { AppModal } from "@/components/modal/appModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Member } from "@/types/member"
import { formatCpf } from "@/lib/cpf"

const memberFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome é obrigatório")
    .max(70, "O nome deve ter no máximo 70 caracteres"),
  cpf: z
    .string()
    .trim()
    .min(1, "O CPF é obrigatório")
    .refine((value) => value.replace(/\D/g, "").length === 11, "CPF inválido"),
  status: z
    .string()
    .trim()
    .min(1, "O status é obrigatório")
    .refine((value) => {
      const normalized = value.trim().toUpperCase()
      return normalized === "ACTIVE" || normalized === "INACTIVE"
    }, "Selecione um status válido"),
})

type MemberFormValues = z.infer<typeof memberFormSchema>

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
}

function normalizeMemberStatus(value: string | null | undefined): MemberFormValues["status"] {
  const normalized = (value ?? "").trim().toUpperCase()
  return normalized === "INACTIVE" ? "INACTIVE" : "ACTIVE"
}

export function MemberFormModal({
  isOpen,
  title,
  description,
  initialMember,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  isOpen: boolean
  title: string
  description: string
  initialMember: Member | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: Omit<Member, "id">) => Promise<void>
}) {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: initialMember?.name ?? "",
      cpf: initialMember?.cpf ? formatCpf(initialMember.cpf) : "",
      status: normalizeMemberStatus(initialMember?.status),
    },
  })

  React.useEffect(() => {
    form.reset({
      name: initialMember?.name ?? "",
      cpf: initialMember?.cpf ? formatCpf(initialMember.cpf) : "",
      status: normalizeMemberStatus(initialMember?.status),
    })
  }, [form, initialMember, isOpen])

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => {
        if (isSaving) return
        onOpenChange(open)
      }}
      title={title}
      description={description}
    >
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            name: values.name.trim(),
            cpf: normalizeCpf(values.cpf),
            status: values.status.trim(),
          })
        })}
      >
        <div>
          <Label htmlFor="member-name">Nome</Label>
          <Input id="member-name" maxLength={70} {...form.register("name")} />
          <div className="min-h-2 text-xs text-destructive">
            {form.formState.errors.name?.message}
          </div>
        </div>

        <div>
          <Label htmlFor="member-cpf">CPF</Label>
          <Input
            id="member-cpf"
            inputMode="numeric"
            maxLength={14}
            value={form.watch("cpf")}
            onChange={(event) => {
              const nextDigits = normalizeCpf(event.target.value)
              form.setValue("cpf", formatCpf(nextDigits), { shouldValidate: true })
            }}
          />
          <div className="min-h-2 text-xs text-destructive">
            {form.formState.errors.cpf?.message}
          </div>
        </div>

        <div>
          <Label>Status</Label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (value !== "ACTIVE" && value !== "INACTIVE") return
                  field.onChange(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <div className="min-h-2 text-xs text-destructive">
            {form.formState.errors.status?.message}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 rounded-2xl px-5"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-2xl px-5 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Salvando...
              </>
            ) : initialMember ? (
              <>
                <Save className="size-4" />
                Salvar
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                Criar
              </>
            )}
          </Button>
        </div>
      </form>
    </AppModal>
  )
}
