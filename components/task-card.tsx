"use client"

import { useState } from "react"
import { format, differenceInDays, isAfter, isBefore, startOfDay } from "date-fns"
import { Tag,  Users, Link2, Archive } from "lucide-react"
import type { Task } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { mockUser } from "@/lib/local-store"

interface TaskCardProps {
  task: Task
  showDetails?: boolean
  readOnly?: boolean
  onClick?: () => void
}

export function TaskCard({ task, showDetails = false, readOnly = false, onClick }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const user = mockUser

  const formatStatusLabel = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'review': 'Review',
      'completed': 'Completed'
    }
    return statusMap[status] || status
  }

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase()
    switch (priorityLower) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed'

  // Calculate timeline progress
  const getTimelineProgress = () => {
    if (!task.start_date || !task.end_date) return null
    
    const start = startOfDay(new Date(task.start_date))
    const end = startOfDay(new Date(task.end_date))
    const today = startOfDay(new Date())
    
    const totalDays = differenceInDays(end, start)
    const elapsedDays = differenceInDays(today, start)
    
    if (totalDays <= 0) return null
    
    let progress = (elapsedDays / totalDays) * 100
    
    // Clamp progress between 0 and 100
    progress = Math.max(0, Math.min(100, progress))
    
    return {
      progress,
      totalDays,
      elapsedDays,
      isOverdue: isAfter(today, end) && task.status !== 'completed',
      isNotStarted: isBefore(today, start)
    }
  }

  const timelineData = getTimelineProgress()

  return (
    <Card 
      className={cn(
        "transition-all duration-200 cursor-pointer border-2 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg",
        isHovered && "border-gray-300 dark:border-gray-600 shadow-xl",
        isOverdue && "border-red-300 dark:border-red-700",
        readOnly && "opacity-75"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold line-clamp-2 flex-1 pr-2">
            {task.title || task.name}
          </CardTitle>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {task.archived && (
              <Archive className="h-4 w-4 text-gray-400" />
            )}
            <div className="flex flex-wrap gap-1 justify-end">
              <Badge className={cn(
                "text-sm px-2 py-1 group transition-colors duration-150",
                getPriorityColor(task.priority),
                task.priority.toLowerCase() === 'high' && 'hover:bg-red-200 dark:hover:bg-red-800',
                task.priority.toLowerCase() === 'medium' && 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
                task.priority.toLowerCase() === 'low' && 'hover:bg-green-200 dark:hover:bg-green-800',
                task.priority.toLowerCase() === 'critical' && 'hover:bg-red-300 dark:hover:bg-red-900',
                !['high','medium','low','critical'].includes(task.priority.toLowerCase()) && 'hover:bg-gray-200 dark:hover:bg-gray-800'
              )}>
                {task.priority}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm px-2 py-1 group transition-colors duration-150 hover:bg-red-200 dark:hover:bg-red-800">
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {task.description.replace(/<[^>]*>/g, '')}
          </p>
        )}

        {/* Timeline Progress Bar */}
        {timelineData && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                {task.status === 'completed' ? 'Completed' :
                 timelineData.isNotStarted ? 'Not started' : 
                 timelineData.isOverdue ? 'Overdue' : 
                 `${Math.round(timelineData.progress)}% complete`}
              </span>
              <span className="text-sm">
                {format(new Date(task.start_date!), "MMM d")} - {format(new Date(task.end_date!), "MMM d")}
              </span>
            </div>
            <Progress 
              value={timelineData.progress} 
              className={cn(
                "h-2",
                timelineData.isOverdue && "bg-red-100 dark:bg-red-900/30",
                timelineData.isNotStarted && "bg-gray-100 dark:bg-gray-700"
              )}
            />
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{timelineData.totalDays} days total</span>
              <span>
                {task.status === 'completed' ? 'Task completed' :
                 timelineData.isNotStarted ? 'Starts soon' :
                 timelineData.isOverdue ? `${Math.abs(timelineData.elapsedDays - timelineData.totalDays)} days overdue` :
                 `${timelineData.totalDays - timelineData.elapsedDays} days left`}
              </span>
            </div>
          </div>
        )}

        {/* Compact metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {task.assignees && (
            Array.isArray(task.assignees) ? 
              task.assignees.length > 0 && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1.5" />
                  {task.assignees.length}
                </div>
              )
            : 
              task.assignees && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1.5" />
                  {task.assignees.split(',').length}
                </div>
              )
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1.5" />
              {task.tags.length}
            </div>
          )}

          {task.dependencies && (
            <div className="flex items-center">
              <Link2 className="h-4 w-4 mr-1.5" />
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  )
}
