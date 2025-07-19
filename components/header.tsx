"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { userStore } from "@/lib/local-store"
import Link from "next/link"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function Header() {
  const [showSearch, setShowSearch] = useState(false)
  const [user, setUser] = useState<{ name: string; avatar: string; avatarType: 'emoji' | 'upload' | 'url' } | null>(null)

  useEffect(() => {
    const currentUser = userStore.getCurrentUser()
    setUser(currentUser)
  }, [])

  return (
    <header className="h-16 border-b bg-white dark:bg-gray-950 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Task Manager</h1>
      </div>

      <div className="flex items-center gap-2">
        <motion.div
          initial={false}
          animate={{ width: showSearch ? 240 : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <Input placeholder="Not implemented yet..." className="w-full bg-gray-100 border-0 focus-visible:ring-1" />
        </motion.div>

        <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)} className="rounded-full">
          <Search className="h-5 w-5" />
        </Button>

        {user && (
          <div className="flex items-center gap-3 ml-4 pl-4 border-l">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 focus:outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full px-1 py-1">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium overflow-hidden">
                    {user.avatarType === 'emoji' ? (
                      <span className="text-lg">{user.avatar}</span>
                    ) : (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    )}
                    {user.avatarType !== 'emoji' && (
                      <span className="text-sm font-medium hidden">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                {/* Future: <DropdownMenuItem>Logout</DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  )
}
