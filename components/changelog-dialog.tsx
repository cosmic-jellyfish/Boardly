"use client"

import { useState } from "react"
import { format } from "date-fns"
import { 
  Sparkles, 
  Bug, 
  Zap, 
  Shield, 
  Star, 
  ExternalLink,
  Github
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ChangelogEntry {
  version: string
  date: string
  title: string
  description: string
  type: 'feature' | 'improvement' | 'bugfix' | 'security' | 'breaking' | 'initial'
  highlights?: string[]
}

const changelogData: ChangelogEntry[] = [
  {
    version: "1.0.2", 
    date: "2025-07-24",
    title: "Improvements",
    description: "Slight adjustments to the task details dialog and home dashboard.",
    type: "improvement",
    highlights: [
      "Improved activity log layout and readability",
      "Allowed clicking on \"Recent Tasks\" on the home dashboard",
      "Decided to remove the tags right under the title in the task details dialog for now (tags are still shown within the dialog area)"
    ]
  },
  {
    version: "1.0.1",
    date: "2025-07-20",
    title: "Bug Fixes and Improvements",
    description: "Fixed a bug where the default tasks were not being created for new users, and improved the onboarding experience.",
    type: "bugfix",
  },
    {
      version: "1.0.0",
      date: "2025-07-18",
      title: "Initial Release",
    description: "The first stable release of Boardly task management app. This is a simple task management app that allows you to create, edit, and delete tasks.",
    type: "initial",
    }
]

interface ChangelogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)

  const getTypeIcon = (type: ChangelogEntry['type']) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-4 w-4" />
      case 'improvement':
        return <Zap className="h-4 w-4" />
      case 'bugfix':
        return <Bug className="h-4 w-4" />
      case 'security':
        return <Shield className="h-4 w-4" />
      case 'breaking':
        return <Star className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: ChangelogEntry['type']) => {
    switch (type) {
      case 'feature':
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case 'improvement':
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case 'bugfix':
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
      case 'security':
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      case 'breaking':
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTypeLabel = (type: ChangelogEntry['type']) => {
    switch (type) {
      case 'feature':
        return "New Feature"
      case 'improvement':
        return "Improvement"
      case 'bugfix':
        return "Bug Fix"
      case 'security':
        return "Security"
      case 'breaking':
        return "Breaking Change"
      default:
        return "Update"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Changelog</DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The latest updates and improvements to Boardly
                </p>
              </div>
            </div>

          </div>
        </DialogHeader>

        <div className="flex gap-6 h-full overflow-hidden">
          {/* Version List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="space-y-2 pr-4">
              {changelogData.map((entry) => (
                <div
                  key={entry.version}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                    selectedVersion === entry.version
                      ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                  onClick={() => setSelectedVersion(entry.version)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                                             <Badge 
                         variant="secondary" 
                         className={cn("text-xs", getTypeColor(entry.type))}
                       >
                         {getTypeIcon(entry.type)}
                         <span className="ml-1">{getTypeLabel(entry.type)}</span>
                       </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(entry.date), "dd MMM, yyyy")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">v{entry.version}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {entry.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Version Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedVersion ? (
              (() => {
                const entry = changelogData.find(e => e.version === selectedVersion)
                if (!entry) return null
                
                return (
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <div className="flex items-center gap-3 mb-3">
                                                 <Badge 
                           variant="secondary" 
                           className={cn("text-sm", getTypeColor(entry.type))}
                         >
                           {getTypeIcon(entry.type)}
                           <span className="ml-1">{getTypeLabel(entry.type)}</span>
                         </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(entry.date), "dd MMM, yyyy")}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">v{entry.version}</h2>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {entry.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {entry.description}
                      </p>
                    </div>

                    {entry.highlights && (
                      <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          What's New
                        </h4>
                        <ul className="space-y-2">
                          {entry.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {highlight}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Select a Version
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose a version from the list to see what's new
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href="https://github.com/cosmic-jellyfish" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
              {/* buy meh a coffeh pls - i am deprived */}
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href="https://coff.ee/cosmicjellyfish" target="_blank" rel="noopener noreferrer">
                  <svg className="h-4 w-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 01-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 00-1.322-.238c-.826 0-1.491.284-2.26.613z"/>
                  </svg>
                  Buy me a coffee
                </a>
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              Latest version: v{changelogData[0].version}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 