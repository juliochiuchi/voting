import { createFileRoute } from "@tanstack/react-router"

import { RoundsDashboard } from "@/components/rounds/roundsDashboard"

export const Route = createFileRoute("/_auth/_dashboard/round")({
  component: Round,
})

function Round() {
  return <RoundsDashboard />
}
