'use client'

import { usePathname } from 'next/navigation'
import Navigation from './Navigation'
import ProtectedRoute from './ProtectedRoute'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Login page doesn't need protection or navigation
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Check if this is owner-only page
  const requireOwner = pathname === '/admin-management' || pathname === '/webhooks' || pathname === '/api-docs'

  // All other pages need authentication
  return (
    <ProtectedRoute requireOwner={requireOwner}>
      <Navigation />
      <div className="pt-16 lg:pt-0 lg:ml-64 min-h-screen">
        {children}
      </div>
    </ProtectedRoute>
  )
}

