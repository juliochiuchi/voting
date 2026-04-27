import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router"
import * as React from "react"

import { useAuthUser } from "@/contexts/authUserContext"

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
})

function AuthLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const { user } = useAuthUser()

  const isLoginRoute = pathname === "/login"
  const isAuthenticated = user?.hasAuthentication === true

  React.useEffect(() => {
    if (!isLoginRoute && !isAuthenticated) {
      navigate({ to: "/login", replace: true })
    }
  }, [isLoginRoute, isAuthenticated, navigate])

  if (!isLoginRoute && !isAuthenticated) return null

  return <Outlet />
}
