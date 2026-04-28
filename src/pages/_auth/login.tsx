import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { LoaderCircle, KeyRound, Users, User, IdCard, BadgeCheck } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  authenticateKeypassUser,
  createMemberUser,
  getMemberIdentityByCpf,
} from "@/controllers/authenticationController"
import { useAuthUser } from "@/contexts/authUserContext"
import { useToast } from "@/contexts/toastContext"
import { formatCpf } from "@/lib/cpf"
import { cn } from "@/lib/utils"
import { ScreenShell } from "@/components/layout/screenShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const Route = createFileRoute("/_auth/login")({
  component: Login,
})

const loginSchema = z.discriminatedUnion("accessType", [
  z.object({
    accessType: z.literal("owner"),
    keypass: z.string().min(1, "A chave de acesso é obrigatória"),
    cpf: z.string().optional(),
  }),
  z.object({
    accessType: z.literal("member"),
    cpf: z
      .string()
      .min(1, "O CPF é obrigatório")
      .transform((value) => value.replace(/\D/g, ""))
      .refine((value) => value.length === 11, "O CPF deve ter 11 dígitos"),
    keypass: z.string().optional(),
  }),
])

type LoginFormValues = z.infer<typeof loginSchema>

function Login() {
  const navigate = useNavigate()
  const { user, setUser, clearUser } = useAuthUser()
  const { toast } = useToast()

  const [memberConfirmOpen, setMemberConfirmOpen] = React.useState(false)
  const [pendingMember, setPendingMember] = React.useState<{
    cpf: string
    name: string | null
    firstName: string | null
  } | null>(null)
  const [isConfirmingMember, setIsConfirmingMember] = React.useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      accessType: "owner",
      keypass: "",
      cpf: "",
    },
  })

  const accessType = form.watch("accessType")
  const cpfRegister = form.register("cpf")

  React.useEffect(() => {
    if (user?.hasAuthentication) {
      navigate({ to: "/elected", replace: true })
      return
    }
    if (user?.accessType === "member" || user?.accessType === "staff") {
      navigate({ to: "/begin", replace: true })
    }
  }, [navigate, user])

  async function onSubmit(values: LoginFormValues) {
    try {
      if (values.accessType === "owner") {
        const authenticatedUser = await authenticateKeypassUser(values.keypass)
        setUser(authenticatedUser)
        toast({
          title: "Autenticado",
          description:
            authenticatedUser.hasAuthentication
              ? "Acesso administrativo validado com sucesso."
              : "Acesso de representante configurado com sucesso.",
        })
        navigate({
          to: authenticatedUser.hasAuthentication ? "/elected" : "/begin",
          replace: true,
        })
        return
      }

      const identity = await getMemberIdentityByCpf(values.cpf)
      if (!identity) {
        clearUser()
        form.setValue("cpf", "", {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        })
        toast({
          title: "CPF não encontrado",
          description: "Não identificamos esse CPF na base de membros.",
          variant: "destructive",
        })
        navigate({ to: "/login", replace: true })
        return
      }

      setPendingMember({
        cpf: values.cpf,
        name: identity.name,
        firstName: identity.firstName,
      })
      setMemberConfirmOpen(true)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Falha na autenticação",
        description: message,
        variant: "destructive",
      })
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <ScreenShell>
      <main className="mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-6 py-14">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          <div className="hidden lg:block">
            <div className="max-w-md">
              <div className="text-sm font-medium text-muted-foreground">
                Votações da IPIM
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Acesso por ação.
                <br />
                Sem registro.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Selecione seu tipo de acesso e continue. O acesso de
                administrador é validado por uma chave de acesso. O acesso de
                membro só requer CPF.
              </p>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-lg">
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>Selecione como deseja entrar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label>Tipo de acesso</Label>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-background/10 p-1">
                    <button
                      type="button"
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                        accessType === "owner"
                          ? "bg-white/15 text-foreground ring-1 ring-white/10"
                          : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                      )}
                      onClick={() => {
                        form.setValue("accessType", "owner", {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                        form.setValue("keypass", "", {
                          shouldDirty: false,
                          shouldTouch: false,
                          shouldValidate: false,
                        })
                        form.setValue("cpf", "", {
                          shouldDirty: false,
                          shouldTouch: false,
                          shouldValidate: false,
                        })
                        form.clearErrors()
                      }}
                    >
                      <KeyRound className="size-4" />
                      <span className="sm:hidden">Admin/Staff</span>
                      <span className="hidden sm:inline">Administrativo/Staff</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                        accessType === "member"
                          ? "bg-white/15 text-foreground ring-1 ring-white/10"
                          : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                      )}
                      onClick={() => {
                        form.setValue("accessType", "member", {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                        form.setValue("keypass", "", {
                          shouldDirty: false,
                          shouldTouch: false,
                          shouldValidate: false,
                        })
                        form.setValue("cpf", "", {
                          shouldDirty: false,
                          shouldTouch: false,
                          shouldValidate: false,
                        })
                        form.clearErrors()
                      }}
                    >
                      <Users className="size-4" />
                      Membro
                    </button>
                  </div>
                </div>

                <form
                  className="grid gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {accessType === "owner" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="keypass">Chave de acesso</Label>
                      <Input
                        id="keypass"
                        type="password"
                        maxLength={30}
                        autoComplete="off"
                        placeholder="Digite sua chave de acesso"
                        {...form.register("keypass")}
                      />
                      {form.formState.errors.keypass?.message ? (
                        <div className="text-sm text-destructive">
                          {form.formState.errors.keypass.message}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={30}
                        autoComplete="off"
                        placeholder="Somente números"
                        {...cpfRegister}
                        onChange={(event) => {
                          const digitsOnlyValue = event.target.value.replace(
                            /\D/g,
                            "",
                          )
                          event.target.value = digitsOnlyValue
                          cpfRegister.onChange(event)
                        }}
                      />
                      {form.formState.errors.cpf?.message ? (
                        <div className="text-sm text-destructive">
                          {form.formState.errors.cpf.message}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="h-11 cursor-pointer rounded-2xl text-base disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        Carregando
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </form>

                <div className="text-xs text-muted-foreground">
                  O acesso administrativo/staff valida sua chave na API. O
                  acesso de membro não autentica mas é identificado.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog
        open={memberConfirmOpen}
        onOpenChange={(nextOpen) => {
          setMemberConfirmOpen(nextOpen)
          if (!nextOpen) setPendingMember(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>É você?</DialogTitle>
            <DialogDescription>
              Confirme sua identidade para continuar como membro.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 rounded-3xl border border-white/10 bg-background/10 p-4 shadow-[0_24px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <User className="size-5 text-foreground/90" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-base font-semibold tracking-tight">
                    {pendingMember?.name ?? pendingMember?.firstName ?? "Membro"}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    <IdCard className="size-3.5" />
                    {pendingMember?.cpf ? formatCpf(pendingMember.cpf) : "CPF"}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <BadgeCheck className="size-3.5" />
                  Se não for você, cancele e tente novamente.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isConfirmingMember}
              className="rounded-2xl bg-background/15 hover:bg-background/25"
              onClick={() => {
                setMemberConfirmOpen(false)
                setPendingMember(null)
                clearUser()
                toast({
                  title: "Login cancelado",
                  description: "Você pode tentar novamente com outro CPF.",
                })
                navigate({ to: "/login", replace: true })
              }}
            >
              Não sou eu
            </Button>
            <Button
              type="button"
              disabled={!pendingMember || isConfirmingMember}
              className="rounded-2xl"
              onClick={async () => {
                if (!pendingMember) return
                setIsConfirmingMember(true)
                try {
                  const memberUser = createMemberUser({
                    cpf: pendingMember.cpf,
                    name: pendingMember.name,
                    firstName: pendingMember.firstName,
                  })
                  setUser(memberUser)
                  setMemberConfirmOpen(false)
                  setPendingMember(null)
                  toast({
                    title: "Pronto",
                    description: "Acesso de membro configurado com sucesso.",
                  })
                  navigate({ to: "/begin", replace: true })
                } finally {
                  setIsConfirmingMember(false)
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScreenShell>
  )
}
