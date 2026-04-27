import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

import { ScreenShell } from "@/components/layout/screenShell"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_app/watch")({
  component: Watch,
})

function Watch() {
  const navigate = useNavigate()

  return (
    <ScreenShell>
      <main className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 py-14">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 rounded-2xl bg-background/15 px-6 text-base hover:bg-background/25"
            onClick={() => navigate({ to: "/begin", replace: true })}
          >
            <ArrowLeft />
            Retornar ao início
          </Button>
        </div>
      </main>
    </ScreenShell>
  )
}

