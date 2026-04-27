import { Outlet, createRootRoute } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  React.useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return <Outlet />
}
