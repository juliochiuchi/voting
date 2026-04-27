import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { LoaderCircle, KeyRound, Users } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  authenticateOwner,
  createMemberUser,
} from "@/controllers/authenticationController"
import { useAuthUser } from "@/contexts/authUserContext"
import { useToast } from "@/contexts/toastContext"
import { cn } from "@/lib/utils"
import { ScreenShell } from "@/components/layout/screenShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { user, setUser } = useAuthUser()
  const { toast } = useToast()

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
      navigate({ to: "/dashboard", replace: true })
      return
    }
    if (user?.accessType === "member") {
      navigate({ to: "/begin", replace: true })
    }
  }, [navigate, user])

  async function onSubmit(values: LoginFormValues) {
    try {
      if (values.accessType === "owner") {
        const authenticatedUser = await authenticateOwner(values.keypass)
        setUser(authenticatedUser)
        toast({
          title: "Autenticado",
          description: "Acesso de administrador validado com sucesso.",
        })
        navigate({ to: "/dashboard", replace: true })
        return
      }

      const memberUser = createMemberUser(values.cpf)
      setUser(memberUser)
      toast({
        title: "Pronto",
        description: "Acesso de membro configurado com sucesso.",
      })
      navigate({ to: "/begin", replace: true })
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
                Inspirado na Apple TV
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Acesso suave.
                <br />
                Sem atrito.
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
                      Administrador
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
                  O acesso de administrador valida sua chave no Supabase. O
                  acesso de membro não autentica.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </ScreenShell>
  )
}
