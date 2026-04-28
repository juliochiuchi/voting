import { createFileRoute, useNavigate } from "@tanstack/react-router"
import * as React from "react"

import { ScreenShell } from "@/components/layout/screenShell"
import { VotingWatchView } from "@/components/voting-results/votingWatchView"
import { useAuthUser } from "@/contexts/authUserContext"

export const Route = createFileRoute("/_app/watch")({
  component: Watch,
})

function Watch() {
  const navigate = useNavigate()
  const { user } = useAuthUser()

  const hasManagementAccess = user?.accessType === "staff"
  const accessChipLabel = hasManagementAccess
    ? "Acesso staff: confirmações habilitadas"
    : "Acesso membro: visualização"

  React.useEffect(() => {
    if (!user) {
      navigate({ to: "/login", replace: true })
      return
    }
    if (user.accessType !== "member" && user.accessType !== "staff") {
      navigate({ to: "/", replace: true })
    }
  }, [navigate, user])

  return (
    <ScreenShell>
      <VotingWatchView
        title="Assistir votação"
        description="Acompanhe a apuração em tempo real."
        hasManagementAccess={hasManagementAccess}
        accessChipLabel={accessChipLabel}
        backTo="/begin"
        backLabel="Retornar ao início"
      />
    </ScreenShell>
  )
}

