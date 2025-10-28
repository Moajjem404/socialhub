'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifySession, isOwner as checkIsOwner } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOwner?: boolean
}

export default function ProtectedRoute({ children, requireOwner = false }: ProtectedRouteProps) {
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verify = async () => {
      const authenticated = await verifySession()
      
      if (!authenticated) {
        router.push('/login')
        return
      }

      if (requireOwner && !checkIsOwner()) {
        router.push('/')
        return
      }

      setIsVerified(true)
      setIsLoading(false)
    }

    verify()
  }, [router, requireOwner])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner w-12 h-12"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isVerified) {
    return null
  }

  return <>{children}</>
}

