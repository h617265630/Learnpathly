import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NavBar } from './components/layout/NavBar'
import { AppFooter } from './components/layout/AppFooter'
import { useAuthStore } from './stores/auth'
import { setAnalyticsUser } from './utils/analytics'

const AUTH_PAGES = ['login', 'register']

function AppLayout() {
  const location = useLocation()
  const auth = useAuthStore()

  const isAuthPage = AUTH_PAGES.some(name => location.pathname.includes(name))

  useEffect(() => {
    auth.fetchProfile().catch((error: unknown) => {
      console.warn('Failed to initialize user profile:', error)
    })
  }, [])

  useEffect(() => {
    if (auth.user) {
      setAnalyticsUser(auth.user)
    }
  }, [auth.user])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavBar />
      <main className={`flex-1 ${isAuthPage ? '' : 'pt-16 py-6'}`}>
        {isAuthPage ? (
          <div className="px-4 py-6">
            <Outlet />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-7xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  )
}

export default AppLayout
