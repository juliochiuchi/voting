import { createFileRoute, useNavigate } from "@tanstack/react-router"
import * as React from "react"

import { useAuthUser } from "@/contexts/authUserContext"

export const Route = createFileRoute("/_app/")({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const { user } = useAuthUser()

  React.useEffect(() => {
    if (user?.hasAuthentication) {
      navigate({ to: "/dashboard", replace: true })
      return
    }
    if (user?.accessType === "member") {
      navigate({ to: "/begin", replace: true })
      return
    }
    navigate({ to: "/login", replace: true })
  }, [navigate, user])

  return null
}
