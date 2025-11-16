import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/groups', label: 'Groups', icon: '👥' },
    { to: '/chat', label: 'Chat', icon: '💬' },
    { to: '/marketplace', label: 'Marketplace', icon: '🛒' },
    { to: '/nft', label: 'NFT', icon: '🎨' },
    { to: '/infrastructure', label: 'Infrastructure', icon: '☁️' },
    { to: '/revenue', label: 'Revenue', icon: '💰' },
    { to: '/wallets', label: 'Wallets', icon: '🔐' },
    { to: '/admin', label: 'Admin', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo and Navigation */}
            <div className="flex items-center flex-1 min-w-0">
              <Link to="/" className="flex items-center space-x-2 px-2 py-2 flex-shrink-0">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AIForge
                </span>
                <span className="hidden sm:inline text-xs text-gray-500 font-medium">Network</span>
              </Link>
              
              {/* Desktop Navigation - Scrollable */}
              <div className="hidden lg:flex lg:items-center lg:ml-6 lg:space-x-1 overflow-x-auto flex-1 min-w-0">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      isActive(link.to)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-1.5">{link.icon}</span>
                    <span className="hidden xl:inline">{link.label}</span>
                    <span className="xl:hidden">{link.label.split(' ')[0]}</span>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Right: User Info and Actions */}
            <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
              {user ? (
                <>
                  {/* User Info - Hidden on small screens */}
                  <div className="hidden md:flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden lg:block text-right">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                        {user?.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[120px]">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 flex-shrink-0"
                aria-label="Toggle menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium ${
                    isActive(link.to)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3 text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main className="min-h-[calc(100vh-4rem)] overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}

