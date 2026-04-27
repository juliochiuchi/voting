import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { DoorClosed, Play } from "lucide-react"

import { ScreenShell } from "@/components/layout/screenShell"
import { Button } from "@/components/ui/button"
import { useAuthUser } from "@/contexts/authUserContext"

export const Route = createFileRoute("/_app/begin")({
  component: Begin,
})

function Begin() {
  const navigate = useNavigate()
  const { clearUser } = useAuthUser()

  return (
    <ScreenShell>
      <main className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-2xl px-6 text-base shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]"
          >
            <Play />
            Iniciar
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 rounded-2xl px-6 text-base bg-background/20 hover:bg-background/30"
            onClick={() => {
              clearUser()
              navigate({ to: "/login", replace: true })
            }}
          >
            <DoorClosed />
            Encerrar
          </Button>
        </div>
      </main>
    </ScreenShell>
  )
}
