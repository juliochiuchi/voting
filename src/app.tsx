import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { AuthUserProvider } from './contexts/authUserContext'
import { ToastProvider } from './contexts/toastContext'

export const App = () => {
  return (
    <ToastProvider>
      <AuthUserProvider>
        <RouterProvider router={router} />
      </AuthUserProvider>
    </ToastProvider>
  )
}
