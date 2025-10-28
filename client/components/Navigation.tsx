'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  BarChart3, 
  MessageSquare, 
  Package, 
  Settings, 
  Home,
  Menu,
  X,
  Zap,
  UserX,
  Shield,
  LogOut,
  Users,
  User,
  FileText,
  ShoppingBag
} from 'lucide-react'
import { getAdminUser, logout, isOwner as checkIsOwner } from '@/lib/auth'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Reactions', href: '/reactions', icon: BarChart3 },
  { name: 'Comments', href: '/comments', icon: MessageSquare },
  { name: 'Ban Management', href: '/ban-management', icon: Shield },
  { name: 'Banned Users', href: '/banned-users', icon: UserX },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Products', href: '/products', icon: ShoppingBag },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [adminUser, setAdminUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const user = getAdminUser()
    setAdminUser(user)
    setIsOwner(checkIsOwner())
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-lg bg-white border border-gray-300 shadow-md hover:shadow-lg transition-shadow"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          className="lg:hidden fixed inset-0 z-50 bg-white"
        >
          <div className="h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold gradient-text">Navigation</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
              
              {/* Owner Only Links */}
              {isOwner && (
                <>
                  <Link
                    href="/webhooks"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      pathname === '/webhooks'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                    <span className="font-medium">Webhooks</span>
                    <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded">OWNER</span>
                  </Link>
                  
                  <Link
                    href="/admin-management"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      pathname === '/admin-management'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Admin Management</span>
                    <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded">OWNER</span>
                  </Link>

                  <Link
                    href="/api-docs"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      pathname === '/api-docs'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">API Docs</span>
                    <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded">OWNER</span>
                  </Link>

                </>
              )}

              {/* Settings - Available for all */}
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  pathname === '/settings'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>

              {/* User Info & Logout */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                {adminUser && (
                  <div className="px-4 py-2 mb-2 bg-gray-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{adminUser.username}</span>
                    </div>
                    <span className="text-xs text-gray-500">{adminUser.role}</span>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </motion.div>
      )}

      {/* Desktop sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 z-30 overflow-y-auto"
      >
        <div className="p-6 min-h-full flex flex-col">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold gradient-text">SocialHub</h2>
          </div>
          
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
            
            {/* Owner Only Links */}
            {isOwner && (
              <>
                <Link
                  href="/webhooks"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    pathname === '/webhooks'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Webhooks</span>
                  <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded">OWNER</span>
                </Link>
                
                <Link
                  href="/admin-management"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    pathname === '/admin-management'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Admin Management</span>
                  <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded">OWNER</span>
                </Link>

                <Link
                  href="/api-docs"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    pathname === '/api-docs'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">API Docs</span>
                  <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded">OWNER</span>
                </Link>

              </>
            )}

            {/* Settings - Available for all */}
            <Link
              href="/settings"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                pathname === '/settings'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>

            {/* User Info & Logout */}
            <div className="pt-4 mt-auto border-t border-gray-200">
              {adminUser && (
                <div className="px-4 py-2 mb-2 bg-gray-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{adminUser.username}</span>
                  </div>
                  <span className="text-xs text-gray-500">{adminUser.role}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </motion.div>

      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-40"
        />
      )}
    </>
  )
}
