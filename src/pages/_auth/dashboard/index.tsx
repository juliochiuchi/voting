import { createFileRoute } from "@tanstack/react-router"
import { Play } from "lucide-react"

import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_auth/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Button
        type="button"
        size="lg"
        className="h-12 rounded-2xl px-6 text-base shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]"
      >
        <Play />
        Iniciar
      </Button>
    </main>
  )
}
