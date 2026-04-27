import { createFileRoute } from "@tanstack/react-router"

import { BlankDashboardSection } from "@/components/dashboard/blankSection"

export const Route = createFileRoute("/_auth/dashboard/vote-registry")({
  component: VoteRegistry,
})

function VoteRegistry() {
  return <BlankDashboardSection title="Registro de votos" />
}
