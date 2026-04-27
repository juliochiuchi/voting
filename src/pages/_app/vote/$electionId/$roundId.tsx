import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { useAuthUser } from "@/contexts/authUserContext"

export const Route = createFileRoute("/_app/vote/$electionId/$roundId")({
  component: Vote,
})

function Vote() {
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
    <main className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 py-14">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 rounded-2xl bg-background/15 px-6 text-base hover:bg-background/25"
          onClick={() => navigate({ to: "/begin", replace: true })}
        >
          <ArrowLeft />
          Retornar ao início
        </Button>
      </div>
    </main>
  )
}
