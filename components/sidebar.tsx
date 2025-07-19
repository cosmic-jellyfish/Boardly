"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { LayoutGrid, Calendar, PlusCircle, ChevronRight, Home, Layers, Clock, CheckCircle2, FileText, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChangelogDialog } from "./changelog-dialog"

export function Sidebar({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(true)
  const [isChangelogOpen, setIsChangelogOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <motion.div
        className={cn(
          "h-screen bg-white dark:bg-gray-950 border-r flex flex-col",
          expanded ? "w-64" : "w-20",
          className,
        )}
        animate={{ width: expanded ? 256 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="p-4 flex items-center justify-between border-b">
          <motion.div
            animate={{ opacity: expanded ? 1 : 0, scale: expanded ? 1 : 0.5 }}
            transition={{ duration: 0.2 }}
            className={cn("flex items-center gap-2", !expanded && "hidden")}
          >
            <Layers className="h-6 w-6 text-blue-500" />
            <span className="font-semibold text-lg">Boardly</span>
          </motion.div>
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="rounded-full">
            <ChevronRight className={cn("h-5 w-5 transition-transform", !expanded && "rotate-180")} />
          </Button>
        </div>

        <div className="flex-1 py-4 overflow-auto">
          <nav className="space-y-2 px-2">
            <NavItem href="/dashboard" icon={<Home />} label="Dashboard" expanded={expanded} active={pathname === "/dashboard"} />
            <NavItem href="/board" icon={<LayoutGrid />} label="Kanban Board" expanded={expanded} active={pathname === "/board"} />
            <NavItem
              href="#"
              icon={<Calendar />}
              label="Calendar"
              expanded={expanded}
              disabled
              comingSoon
            />
            <NavItem
              href="#"
              icon={<Clock />}
              label="Timeline"
              expanded={expanded}
              disabled
              comingSoon
            />
            <NavItem
              href="/completed"
              icon={<CheckCircle2 />}
              label="Completed"
              expanded={expanded}
              active={pathname === "/completed"}
            />
          </nav>
        </div>

        <div className="p-4 border-t space-y-2">
        
          <Button
            variant="ghost"
            size={expanded ? "default" : "icon"}
            onClick={() => setIsChangelogOpen(true)}
            className={cn("w-full justify-start gap-2", !expanded && "justify-center p-2")}
          >
            <FileText className="h-5 w-5" />
            {expanded && <span>Changelog</span>}
          </Button>
        </div>
      </motion.div>

      <ChangelogDialog 
        open={isChangelogOpen} 
        onOpenChange={setIsChangelogOpen} 
      />
    </>
  )
}

function NavItem({
  href,
  icon,
  label,
  expanded,
  active,
  disabled,
  comingSoon,
}: {
  href: string
  icon: React.ReactNode
  label: string
  expanded: boolean
  active?: boolean
  disabled?: boolean
  comingSoon?: boolean
}) {
  return (
    <Link href={href} className={cn(disabled && "pointer-events-none")}>
      <Button
        variant={active ? "default" : "ghost"}
        className={cn(
          "w-full justify-start gap-2",
          !expanded && "justify-center p-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        size={expanded ? "default" : "icon"}
        disabled={disabled}
      >
        {icon}
        {expanded && (
          <div className="flex items-center gap-2">
            <span>{label}</span>
            {comingSoon && <span className="text-xs text-muted-foreground">(Coming Soon)</span>}
          </div>
        )}
      </Button>
    </Link>
  )
}
