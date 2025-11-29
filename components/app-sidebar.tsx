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
  Sparkles
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
      color: 'icon-lavender',
      gradient: 'from-purple-400 to-purple-500'
    },
    { 
      icon: FolderKanban, 
      label: 'Projects', 
      href: '/projects',
      color: 'icon-sky',
      gradient: 'from-sky-400 to-blue-500'
    },
    { 
      icon: Building2, 
      label: 'Departments', 
      href: '/departments',
      color: 'icon-mint',
      gradient: 'from-emerald-400 to-teal-500'
    },
    { 
      icon: Users2, 
      label: 'Users', 
      href: '/users',
      color: 'icon-coral',
      gradient: 'from-orange-400 to-pink-500'
    },
  ]

  if (user?.role === 'admin') {
    navItems.push({ 
      icon: SettingsIcon, 
      label: 'Settings', 
      href: '/settings',
      color: 'icon-yellow',
      gradient: 'from-yellow-400 to-amber-500'
    })
  }

  return (
    <aside
      className={cn(
        'h-screen bg-gradient-to-b from-sidebar via-sidebar/98 to-sidebar/95',
        'border-r border-sidebar-border flex flex-col transition-all duration-300 relative flex-shrink-0',
        'shadow-lg',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-8 h-7 w-7 rounded-full border-2 bg-card shadow-lg z-10",
          "hover:bg-accent hover:scale-110 transition-all duration-200",
          "border-border"
        )}
      >
        {isCollapsed ? 
          <ChevronRight className="h-4 w-4 text-primary" /> : 
          <ChevronLeft className="h-4 w-4 text-primary" />
        }
      </Button>

      {/* Header */}
      <div className={cn(
        "p-6 border-b border-sidebar-border/50 flex items-center",
        isCollapsed ? "justify-center px-3" : "gap-3"
      )}>
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Waves className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-fade-in">
            <h2 className="font-bold text-lg text-sidebar-foreground tracking-tight">
              Task Wave
            </h2>
            <p className="text-xs text-sidebar-foreground/60 font-medium">Project Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto thin-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                'w-full transition-all duration-200 group',
                isCollapsed ? 'justify-center px-2 h-12' : 'justify-start h-11',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
              onClick={() => router.push(item.href)}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={cn(
                "flex items-center",
                !isCollapsed && "w-full"
              )}>
                <div className={cn(
                  "flex items-center justify-center",
                  isActive ? 'scale-110' : 'scale-100',
                  'transition-transform duration-200'
                )}>
                  <Icon 
                    className={cn(
                      "h-5 w-5",
                      !isCollapsed && "mr-3",
                      isActive ? item.color : 'text-sidebar-foreground/60',
                      'transition-colors duration-200'
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </div>
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-3 border-t border-sidebar-border/50",
        isCollapsed ? "space-y-2" : "space-y-3"
      )}>
        {user && !isCollapsed && (
          <div className="mx-1 px-3 py-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border border-purple-200/50 dark:border-purple-700/30 animate-fade-in">
            <p className="font-semibold text-sm text-sidebar-foreground truncate">
              {user.full_name || user.email}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize mt-0.5 font-medium">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        )}
        <div className={cn(
          "flex",
          isCollapsed ? "flex-col gap-2 items-center" : "gap-2"
        )}>
          <ThemeToggle />
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium">Sign Out</span>
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
