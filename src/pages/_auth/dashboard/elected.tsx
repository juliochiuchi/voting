import { createFileRoute } from "@tanstack/react-router"

import { BlankDashboardSection } from "@/components/dashboard/blankSection"

export const Route = createFileRoute("/_auth/dashboard/elected")({
  component: Elected,
})

function Elected() {
  return <BlankDashboardSection title="Eleitos" />
}
