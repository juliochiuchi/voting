import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { DoorClosed, EyeOff, Play } from "lucide-react"
import * as React from "react"

import { ScreenShell } from "@/components/layout/screenShell"
import { ConfirmActionModal } from "@/components/modal/confirmActionModal"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuthUser } from "@/contexts/authUserContext"

export const Route = createFileRoute("/_app/begin")({
  component: Begin,
})

function Begin() {
  const navigate = useNavigate()
  const { user, clearUser } = useAuthUser()
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false)

  const memberName =
    user?.accessType === "member" ? (user.firstName ?? user.name ?? null) : null

  React.useEffect(() => {
    if (user && user.accessType !== "member") {
      navigate({ to: "/", replace: true })
    }
    if (!user) {
      navigate({ to: "/login", replace: true })
    }
  }, [navigate, user])

  return (
    <ScreenShell>
      <main className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 py-14">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-muted-foreground">
                  Acesso de membro
                </div>
                <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight">
                  {memberName ? `Olá, ${memberName}` : "Olá"}
                </h1>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl bg-background/15 px-5 hover:bg-background/25"
                onClick={() => setIsLogoutConfirmOpen(true)}
              >
                <DoorClosed />
                Encerrar
              </Button>
            </div>

            <Alert>
              <EyeOff className="size-4" />
              <AlertTitle>Seu voto continua secreto</AlertTitle>
              <AlertDescription>
                Seu voto será registrado para contabilização, mas não ficará
                associado ao seu nome.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                size="lg"
                className="h-12 rounded-2xl px-6 text-base shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]"
              >
                <Play />
                Iniciar
              </Button>
            </div>
          </div>
        </div>
      </main>

      <ConfirmActionModal
        open={isLogoutConfirmOpen}
        onOpenChange={setIsLogoutConfirmOpen}
        title="Encerrar sessão"
        description="Tem certeza que deseja encerrar a sessão e voltar para o login?"
        cancelLabel="Cancelar"
        confirmLabel="Encerrar"
        confirmVariant="destructive"
        onConfirm={() => {
          clearUser()
          navigate({ to: "/login", replace: true })
        }}
      />
    </ScreenShell>
  )
}
