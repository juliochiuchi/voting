import { createFileRoute } from "@tanstack/react-router"

import { BlankDashboardSection } from "@/components/dashboard/blankSection"

export const Route = createFileRoute("/_auth/dashboard/votes")({
  component: Votes,
})

function Votes() {
  return <BlankDashboardSection title="Votos" />
}
