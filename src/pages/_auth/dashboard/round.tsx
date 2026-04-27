import { createFileRoute } from "@tanstack/react-router"

import { BlankDashboardSection } from "@/components/dashboard/blankSection"

export const Route = createFileRoute("/_auth/dashboard/round")({
  component: Round,
})

function Round() {
  return <BlankDashboardSection title="Rodada" />
}
