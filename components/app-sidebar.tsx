'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useSidebarStore } from '@/lib/stores/sidebarStore'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Building2, 
  Users2,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Waves,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()
  const { isCollapsed, toggleSidebar } = useSidebarStore()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/dashboard',
      gradient: 'from-purple-500 to-purple-600',
      iconColor: 'text-purple-600',
      bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      activeBg: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    { 
      icon: FolderKanban, 
      label: 'Projects', 
      href: '/projects',
      gradient: 'from-sky-500 to-blue-600',
      iconColor: 'text-sky-600',
      bgHover: 'hover:bg-sky-50 dark:hover:bg-sky-900/20',
      activeBg: 'bg-gradient-to-r from-sky-500 to-blue-600'
    },
    { 
      icon: Building2, 
      label: 'Departments', 
      href: '/departments',
      gradient: 'from-emerald-500 to-teal-600',
      iconColor: 'text-emerald-600',
      bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      activeBg: 'bg-gradient-to-r from-emerald-500 to-teal-600'
    },
    { 
      icon: Users2, 
      label: 'Users', 
      href: '/users',
      gradient: 'from-orange-500 to-pink-600',
      iconColor: 'text-orange-600',
      bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
      activeBg: 'bg-gradient-to-r from-orange-500 to-pink-600'
    },
  ]

  if (user?.role === 'admin') {
    navItems.push({ 
      icon: SettingsIcon, 
      label: 'Settings', 
      href: '/settings',
      gradient: 'from-amber-500 to-yellow-600',
      iconColor: 'text-amber-600',
      bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
      activeBg: 'bg-gradient-to-r from-amber-500 to-yellow-600'
    })
  }

  return (
    <aside
      className={cn(
        'h-screen bg-white dark:bg-gray-900 border-r-2 border-gray-100 dark:border-gray-800',
        'flex flex-col transition-all duration-300 relative flex-shrink-0 shadow-2xl',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-4 top-10 h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50",
          "hover:scale-110 hover:shadow-2xl transition-all duration-200",
          "hover:border-purple-300 dark:hover:border-purple-600"
        )}
      >
        {isCollapsed ? 
          <ChevronRight className="h-4 w-4 text-purple-600" strokeWidth={3} /> : 
          <ChevronLeft className="h-4 w-4 text-purple-600" strokeWidth={3} />
        }
      </Button>

      {/* Compact Header */}
      <div className={cn(
        "p-4 border-b border-gray-200 dark:border-gray-800 flex items-center",
        isCollapsed ? "justify-center px-3" : "gap-2.5"
      )}>
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-lg">
            <Waves className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
            <Sparkles className="w-2 h-2 text-white" strokeWidth={3} />
          </div>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-fade-in">
            <h2 className="text-base font-black bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              Task Wave
            </h2>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase">Workspace</p>
          </div>
        )}
      </div>

      {/* Modern Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                'w-full transition-all duration-200 group animate-slide-in',
                isCollapsed ? 'justify-center px-0 h-14' : 'justify-start h-14 px-4',
                isActive
                  ? `${item.activeBg} text-white shadow-xl hover:shadow-2xl font-bold scale-105`
                  : `text-gray-700 dark:text-gray-300 ${item.bgHover} hover:scale-105 font-semibold border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700`,
                'rounded-2xl'
              )}
              onClick={() => router.push(item.href)}
              title={isCollapsed ? item.label : undefined}
              style={{animationDelay: `${index * 50}ms`}}
            >
              <div className={cn(
                "flex items-center",
                !isCollapsed && "w-full"
              )}>
                <div className={cn(
                  "flex items-center justify-center",
                  !isCollapsed && "mr-3"
                )}>
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      isActive ? 'text-white scale-110' : item.iconColor,
                      'group-hover:scale-110'
                    )} 
                    strokeWidth={isActive ? 3 : 2.5}
                  />
                </div>
                {!isCollapsed && (
                  <span className="text-base">{item.label}</span>
                )}
              </div>
            </Button>
          )
        })}
      </nav>

      {/* Modern Footer */}
      <div className={cn(
        "p-4 border-t-2 border-gray-100 dark:border-gray-800 space-y-3"
      )}>
        {user && !isCollapsed && (
          <div className="mx-2 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-2 border-purple-200/50 dark:border-purple-700/30 animate-fade-in shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm">{user.full_name?.[0] || user.email[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 capitalize font-bold">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className={cn(
          "flex gap-2",
          isCollapsed && "flex-col items-center"
        )}>
          <ThemeToggle />
          <Button
            variant="outline"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "border-2 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-xl font-bold",
              isCollapsed ? "w-full" : "flex-1"
            )}
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 text-red-600" strokeWidth={2.5} />
            {!isCollapsed && <span className="ml-2 text-red-600">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
