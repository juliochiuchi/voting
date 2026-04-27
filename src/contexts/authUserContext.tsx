import * as React from "react"

import type { AuthenticatedUser } from "@/types/authUser"

type AuthUserContextValue = {
  user: AuthenticatedUser | null
  setUser: (user: AuthenticatedUser | null) => void
  clearUser: () => void
}

const AuthUserContext = React.createContext<AuthUserContextValue | undefined>(
  undefined,
)

const localStorageKey = "voting.authUser"

function readPersistedUser(): AuthenticatedUser | null {
  try {
    const rawValue = window.localStorage.getItem(localStorageKey)
    if (!rawValue) return null
    return JSON.parse(rawValue) as AuthenticatedUser
  } catch {
    return null
  }
}

function persistUser(user: AuthenticatedUser | null) {
  try {
    if (!user) {
      window.localStorage.removeItem(localStorageKey)
      return
    }
    window.localStorage.setItem(localStorageKey, JSON.stringify(user))
  } catch {
    return
  }
}

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<AuthenticatedUser | null>(() => {
    if (typeof window === "undefined") return null
    return readPersistedUser()
  })

  const setUser = React.useCallback((nextUser: AuthenticatedUser | null) => {
    setUserState(nextUser)
    if (typeof window !== "undefined") persistUser(nextUser)
  }, [])

  const clearUser = React.useCallback(() => {
    setUser(null)
  }, [setUser])

  const value = React.useMemo<AuthUserContextValue>(
    () => ({
      user,
      setUser,
      clearUser,
    }),
    [user, setUser, clearUser],
  )

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>
}

export function useAuthUser() {
  const value = React.useContext(AuthUserContext)
  if (!value) {
    throw new Error("useAuthUser must be used within AuthUserProvider")
  }
  return value
}

