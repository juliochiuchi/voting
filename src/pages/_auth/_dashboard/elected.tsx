import { createFileRoute } from "@tanstack/react-router"

import { VotingWatchView } from "@/components/voting-results/votingWatchView"

export const Route = createFileRoute("/_auth/_dashboard/elected")({
  component: Elected,
})

function Elected() {
  return (
    <VotingWatchView
      title="Eleitos"
      description="Acompanhe a apuração em tempo real."
      hasManagementAccess
      accessChipLabel="Acesso admin: confirmações habilitadas"
      backTo="/election"
      backLabel="Ir para eleições"
    />
  )
}
