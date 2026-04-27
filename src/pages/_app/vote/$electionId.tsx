import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import * as React from "react"

import { ScreenShell } from "@/components/layout/screenShell"
import { useAuthUser } from "@/contexts/authUserContext"

export const Route = createFileRoute("/_app/vote/$electionId")({
  component: VoteLayout,
})

function VoteLayout() {
  const navigate = useNavigate()
  const { user } = useAuthUser()

  React.useEffect(() => {
    if (!user) {
      navigate({ to: "/login", replace: true })
      return
    }
    if (user.accessType !== "member" && user.accessType !== "staff") {
      navigate({ to: "/", replace: true })
      return
    }
  }, [navigate, user])

  return (
    <ScreenShell>
      <Outlet />
    </ScreenShell>
  )
}
