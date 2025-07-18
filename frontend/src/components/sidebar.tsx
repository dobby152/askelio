"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  Download,
  HelpCircle,
  X,
  Zap,
  BarChart3,
  Users,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Přidej onExportClick prop do interface
interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  onExportClick?: () => void
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Dokumenty", href: "/documents", icon: FileText },
  { name: "Statistiky", href: "/statistics", icon: BarChart3 },
  { name: "Uživatelé", href: "/users", icon: Users },
]

const quickActions = [
  { name: "Nový dokument", href: "/documents/new", icon: FileText },
  { name: "Správa kreditů", href: "/credits", icon: CreditCard },
  { name: "Nastavení", href: "/settings", icon: Settings },
  { name: "Export dat", href: "#", icon: Download, onClick: true }, // Přidej onClick: true
  { name: "Nápověda", href: "/help", icon: HelpCircle },
]

// Aktualizuj komponentu aby přijímala onExportClick
export function Sidebar({ open, setOpen, onExportClick }: SidebarProps) {
  const pathname = usePathname()
  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Askelio</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-8">
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Navigace
              </h3>
              <div className="mt-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-active={isActive}
                      data-pathname={pathname}
                      data-href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "!bg-blue-50 dark:!bg-blue-900/50 !text-blue-700 dark:!text-blue-200"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                      )}
                      style={isActive ? {
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8'
                      } : {}}
                    >
                      <item.icon className="mr-3 w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rychlé akce
              </h3>
              <div className="mt-3 space-y-1">
                {quickActions.map((item) =>
                  item.onClick ? (
                    <button
                      key={item.name}
                      // V quickActions onClick handleru:
                      onClick={() => onExportClick?.()}
                      className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left"
                    >
                      <item.icon className="mr-3 w-5 h-5" />
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <item.icon className="mr-3 w-5 h-5" />
                      {item.name}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Pro plán</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">2,450 kreditů zbývá</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
