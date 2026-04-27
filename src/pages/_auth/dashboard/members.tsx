import { createFileRoute } from "@tanstack/react-router"

import { BlankDashboardSection } from "@/components/dashboard/blankSection"

export const Route = createFileRoute("/_auth/dashboard/members")({
  component: Members,
})

function Members() {
  return <BlankDashboardSection title="Membros" />
}
