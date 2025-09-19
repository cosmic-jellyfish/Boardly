"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { format, differenceInDays, isPast, formatDistanceToNow } from "date-fns"
import { Clock, Tag, Calendar, Users, Link2, Archive, CheckCircle, Trash2 } from "lucide-react"
import type { Task, ActivityLog } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "./date-picker"
import { ProgressBar } from "./progress-bar"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor, RichTextRenderer } from "./rich-text-editor"
import { taskApi } from "@/api/tasks"
import { activityApi } from "@/api/activity"
import { mockUser, taskStore, userStore } from "@/lib/local-store"

interface TaskDetailsDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: (updatedTask: Task) => void
}

export function TaskDetailsDialog({ task, open, onOpenChange, onTaskUpdated }: TaskDetailsDialogProps) {
  // Early return if no task is provided
  if (!task) {
    return null
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Task>(task)
  const [childTasks, setChildTasks] = useState<Task[]>([])
  const [dependencyTasks, setDependencyTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const { toast } = useToast()
  const dependenciesRef = useRef<HTMLDivElement>(null)
  const user = mockUser  // Use mock user instead of auth

  useEffect(() => {
    const fetchData = async () => {
      if (!task) return
      
      setLoading(true)
      setDependencyTasks([])
      setChildTasks([])
      setActivityLogs([])
      
      try {
        if (open) {
          const [
            tasksData,
            activityLogsData
          ] = await Promise.all([
            taskApi.getAllTasks(),
            activityApi.getActivityByTaskId(task.id)
          ])

          setAllTasks(tasksData)
          setActivityLogs(activityLogsData)
          
          // Get available users from local storage
          const users = userStore.getAll()
          setAvailableUsers(users)

          // Get child and dependency tasks
          const childTasksList = await taskApi.getChildTasks(task.id)
          setChildTasks(childTasksList)

          // Process dependencies using the fresh tasksData
          if (task.dependencies) {
            const dependencyIds = task.dependencies
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean)
            if (dependencyIds.length > 0) {
              const dependenciesData = tasksData.filter(t => dependencyIds.includes(t.id))
              setDependencyTasks(dependenciesData)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching task data:", error)
        toast({
          title: "Error",
          description: "Failed to load task data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    setEditedTask(task) // Reset edited task when dialog opens
  }, [task, open, toast, user])

  // Reset edit state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setDependencyTasks([])
      setChildTasks([])
      setActivityLogs([])
      setAllTasks([])
    }
  }, [open])

  // Calculate progress based on dates
  const calculateProgress = () => {
    if (!task || !task.start_date || !task.end_date) {
      return { value: 0, max: 1, showBar: false }
    }

    const startDate = new Date(task.start_date)
    const endDate = new Date(task.end_date)
    const today = new Date()

    // If the task hasn't started yet
    if (today < startDate) {
      return { value: 0, max: 100, showBar: true }
    }

    // If the task is past due date
    if (today > endDate) {
      return { value: 100, max: 100, showBar: true }
    }

    // Calculate progress
    const totalDuration = differenceInDays(endDate, startDate)
    const elapsedDuration = differenceInDays(today, startDate)
    const progress = Math.min(Math.max((elapsedDuration / totalDuration) * 100, 0), 100)

    return { value: Math.round(progress), max: 100, showBar: true }
  }

  const progress = calculateProgress()
  const isOverdue = task.end_date && isPast(new Date(task.end_date))

  const handleSave = async () => {
    try {
      // Only include fields that have actually changed
      const changes: any = {}
      Object.keys(editedTask).forEach(key => {
        const taskKey = key as keyof Task
        const oldValue = task[taskKey]
        const newValue = editedTask[taskKey]
        
        // Handle arrays (like assignees)
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[taskKey] = newValue
          }
        }
        // Handle other types
        else if (oldValue !== newValue) {
          changes[taskKey] = newValue
        }
      })
      
      // Update the task in the store with only changed fields
      await taskStore.update(task.id, changes)
      
      // Update the task in the API with only changed fields
      await taskApi.updateTask(task.id, changes)
      
      // Update the local state
      Object.assign(task, editedTask)
      
      // Notify parent component about the update
      if (onTaskUpdated) {
        onTaskUpdated(editedTask)
      }
      
      setIsEditing(false)
      
      toast({
        title: "Success",
        description: "Task updated successfully.",
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Replace archive with delete
  const handleDeleteTask = async () => {
    try {
      // Remove from local store
      await taskStore.delete(task.id)
      // Optionally, remove from API as well
      await taskApi.deleteTask?.(task.id)
      toast({
        title: "Deleted",
        description: "Task deleted successfully.",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      })
    }
  }

  const formatStatusLabel = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'todo': 'To Do',
      'review': 'Review',
      'up-next': 'Up Next',
      'in-progress': 'In Progress'
    }
    return statusMap[status] || status
  }

  const isRichText = (text: string | undefined): boolean => {
    return text ? text.includes('<') && text.includes('>') : false
  }

  const isHtmlContent = (text: string | undefined): boolean => {
    return text ? text.includes('<') && text.includes('>') : false
  }

  const formatChangeDescription = (eventType: string, changes: any) => {
    switch (eventType) {
      case 'Status Changed':
        return `Status changed from "${changes.old_status || 'Unknown'}" to "${changes.new_status || 'Unknown'}"`
      case 'Priority Changed':
        return `Priority changed from "${changes.old_priority || 'Unknown'}" to "${changes.new_priority || 'Unknown'}"`
      case 'Due Date Changed':
        const oldDate = changes.old_due_date ? format(new Date(changes.old_due_date), "MMM d, yyyy") : 'Not set'
        const newDate = changes.new_due_date ? format(new Date(changes.new_due_date), "MMM d, yyyy") : 'Not set'
        return `Due date changed from "${oldDate}" to "${newDate}"`
      case 'Start Date Changed':
        const oldStartDate = changes.old_start_date ? format(new Date(changes.old_start_date), "MMM d, yyyy") : 'Not set'
        const newStartDate = changes.new_start_date ? format(new Date(changes.new_start_date), "MMM d, yyyy") : 'Not set'
        return `Start date changed from "${oldStartDate}" to "${newStartDate}"`
      case 'Assignee Changed':
        return `Assignee changed from "${changes.old_assignee || 'Unassigned'}" to "${changes.new_assignee || 'Unassigned'}"`
      case 'Assignee Added':
        return `Assignee(s) added: ${Array.isArray(changes.assignees_added) ? changes.assignees_added.join(', ') : changes.assignees_added}`
      case 'Assignee Removed':
        return `Assignee(s) removed: ${Array.isArray(changes.assignees_removed) ? changes.assignees_removed.join(', ') : changes.assignees_removed}`
      case 'Task Archived':
        return 'Task was archived'
      case 'Task Created':
        return 'Task was created'
      case 'Task Deleted':
        return 'Task was deleted'
      case 'Task Name Changed':
        return `Task name changed from "${changes.old_name || 'Unknown'}" to "${changes.new_name || 'Unknown'}"`
      case 'Description Updated':
        return 'Task description was updated'
      case 'Task Updated':
        return `Field "${changes.field}" was updated`
      default:
        return eventType
    }
  }

  const renderFormattedChanges = (changes: any) => {
    if (!changes || typeof changes !== 'object') {
      return <div className="text-xs text-gray-500">No detailed changes available</div>
    }

    const changeItems = Object.entries(changes).map(([key, value]) => {
      if (key.startsWith('old_') || key.startsWith('new_')) return null
      
      let displayValue = value
      if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No'
      } else if (value === null || value === undefined) {
        displayValue = 'Not set'
      } else if (typeof value === 'object') {
        // Handle objects by converting to string
        displayValue = JSON.stringify(value)
      } else if (typeof value === 'string' && value.includes('T')) {
        // Try to format as date
        try {
          displayValue = format(new Date(value), "MMM d, yyyy")
        } catch {
          // If it's not a valid date, keep as is
        }
      }

      return (
        <div key={key} className="flex justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400 capitalize">
            {key.replace(/_/g, ' ')}:
          </span>
          <span className="text-gray-800 dark:text-gray-200 font-medium">
            {String(displayValue)}
          </span>
        </div>
      )
    }).filter(Boolean)

    if (changeItems.length === 0) {
      return <div className="text-xs text-gray-500">No detailed changes available</div>
    }

    return (
      <div className="space-y-1 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
        {changeItems}
      </div>
    )
  }

  const getInitials = (name: string | undefined): string => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const statusColors = {
    todo: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "up-next": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
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

  const handleAssigneesChange = (value: string) => {
    setEditedTask({ ...editedTask, assignees: value })
  }

  const handleAssigneesBlur = () => {
    // Only add complete names when user finishes typing
    const assigneesString = Array.isArray(editedTask.assignees) ? editedTask.assignees.join(', ') : editedTask.assignees || ''
    const names = assigneesString.split(',').map((name: string) => name.trim()).filter(Boolean)
    names.forEach((name: string) => {
      if (name && !availableUsers.includes(name)) {
        userStore.add(name)
        setAvailableUsers(prev => [...prev, name])
      }
    })
  }

  const handleQuickAddUser = (userName: string) => {
    const currentAssignees = Array.isArray(editedTask.assignees) 
      ? editedTask.assignees.join(', ') 
      : editedTask.assignees || ""
    
    const currentNames = currentAssignees.split(',').map(name => name.trim()).filter(Boolean)
    
    // Don't add if already in the list
    if (!currentNames.includes(userName)) {
      const newAssignees = currentNames.length > 0 
        ? `${currentAssignees}, ${userName}`
        : userName
      
      setEditedTask({ ...editedTask, assignees: newAssignees })
    }
  }

  const completedChildTasks = 0 // No completed status anymore
  const totalChildTasks = childTasks.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[35vw] w-[55vw] max-h-[65vh] p-0 overflow-hidden flex flex-col h-[65vh]">
        <div className="flex min-h-0 h-full flex-1">
          {/* Main content area */}
          <div className="flex-1 flex flex-col min-h-0 h-full">
            <DialogHeader className="shrink-0 p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <Input
                      value={editedTask.name || editedTask.title}
                      onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value, title: e.target.value })}
                      className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                      placeholder="Enter task name..."
                    />
                  ) : (
                    <DialogTitle className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                      {task.name || task.title}
                    </DialogTitle>
                  )}
                  
                  {/* Integrated status and priority in a clean row */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        task.status === 'in-progress' ? 'bg-blue-500' :
                        task.status === 'up-next' ? 'bg-orange-500' :
                        task.status === 'review' ? 'bg-purple-500' :
                        'bg-gray-400'
                      )}></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {formatStatusLabel(task.status)}
                      </span>
                    </div>
                    
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        task.priority?.toLowerCase() === 'critical' ? 'bg-red-500' :
                        task.priority?.toLowerCase() === 'high' ? 'bg-red-400' :
                        task.priority?.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      )}></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {/* Show assignees count */}
                    {task.assignees && (() => {
                      const assigneesList = Array.isArray(task.assignees) 
                        ? task.assignees 
                        : task.assignees.split(',').map(name => name.trim()).filter(Boolean)
                      
                      return assigneesList.length > 0 ? (
                        <>
                          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {assigneesList.length} assigned
                            </span>
                          </div>
                        </>
                      ) : null
                    })()}

                    {/* Show committed status */}
                    {task.committed && (
                      <>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            Committed
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Make only this area scrollable */}
            <div className="space-y-6 flex-1 overflow-y-auto p-6 min-h-0">
              {/* Description with more prominence */}
              <div className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    Description
                  </h3>
                  {isEditing ? (
                    <RichTextEditor 
                      content={editedTask.description || ""}
                      onChange={(html) => setEditedTask({ ...editedTask, description: html })}
                    />
                  ) : (
                    <div className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert prose-sm max-w-none">
                      {isRichText(task.description) ? (
                        <RichTextRenderer content={task.description || ""} />
                      ) : (
                        task.description ? <p>{task.description}</p> : 
                      <p className="text-gray-400 italic">No description provided.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Improved grid layout with cards for sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline section */}
                <div className="space-y-4 bg-gray-50/50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline
                  </h3>
                  
                  {progress.showBar && (
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{progress.value}%</span>
                      </div>
                      <ProgressBar value={progress.value} max={progress.max} />
                    </div>
                  )}
                  
                  {/* Modified grid layout for editing mode */}
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</h4>
                        <div className="w-full">
                          <DatePicker
                            date={editedTask.start_date ? new Date(editedTask.start_date) : undefined}
                            onSelect={(date) =>
                              setEditedTask({
                                ...editedTask,
                                start_date: date ? format(date, "yyyy-MM-dd") : null,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</h4>
                        <div className="w-full">
                          <DatePicker
                            date={editedTask.end_date ? new Date(editedTask.end_date) : undefined}
                            onSelect={(date) =>
                              setEditedTask({
                                ...editedTask,
                                end_date: date ? format(date, "yyyy-MM-dd") : null,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actual Start</h4>
                        <div className="w-full">
                          <DatePicker
                            date={editedTask.actual_start_date ? new Date(editedTask.actual_start_date) : undefined}
                            onSelect={(date) =>
                              setEditedTask({
                                ...editedTask,
                                actual_start_date: date ? format(date, "yyyy-MM-dd") : null,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</h4>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {task.start_date ? format(new Date(task.start_date), "MMM d, yyyy") : "Not set"}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</h4>
                        <div>
                          <p className={cn(
                            "text-sm font-medium",
                            isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
                          )}>
                            {task.end_date 
                              ? format(new Date(task.end_date), "MMM d, yyyy")
                              : "Not set"}
                          </p>
                          {isOverdue && (
                            <span className="inline-flex items-center text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 mt-1 rounded-md font-medium">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </div>

                      {task.actual_start_date && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actual Start</h4>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(task.actual_start_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Team & Details section */}
                <div className="space-y-4 bg-gray-50/50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team & Details
                  </h3>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</h4>
                        <Select
                          value={editedTask.status}
                          onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="up-next">Up Next</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</h4>
                        <Select
                          value={editedTask.priority}
                          onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <h4 className="text-xs uppercase text-gray-500 mb-1">Assignees</h4>
                        <Input
                          value={Array.isArray(editedTask.assignees) ? editedTask.assignees.join(', ') : editedTask.assignees || ""}
                          onChange={(e) => handleAssigneesChange(e.target.value)}
                          onBlur={handleAssigneesBlur}
                          placeholder="Enter assignee names (comma separated)"
                        />
                        
                        {/* Quick Add Buttons */}
                        {availableUsers.filter(user => user !== "Local User").length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">Quick add:</div>
                            <div className="flex flex-wrap gap-1">
                              {availableUsers
                                .filter(user => user !== "Local User")
                                .slice(-5) // Show last 5 users for quick add
                                .map((user) => {
                                  const currentAssignees = Array.isArray(editedTask.assignees) 
                                    ? editedTask.assignees.join(', ') 
                                    : editedTask.assignees || ""
                                  const currentNames = currentAssignees.split(',').map(name => name.trim()).filter(Boolean)
                                  const isAlreadyAdded = currentNames.includes(user)
                                  
                                  return (
                                    <Badge
                                      key={user}
                                      variant={isAlreadyAdded ? "secondary" : "outline"}
                                      className={cn(
                                        "cursor-pointer text-xs px-2 py-1",
                                        isAlreadyAdded 
                                          ? "opacity-50 cursor-not-allowed" 
                                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                      )}
                                      onClick={() => !isAlreadyAdded && handleQuickAddUser(user)}
                                    >
                                      {user}
                                    </Badge>
                                  )
                                })}
                            </div>
                          </div>
                        )}
                        
                        {/* Previously used hint */}
                        {availableUsers.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Previously used: {availableUsers
                              .filter(user => user !== "Local User")
                              .slice(-3)
                              .join(', ')}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs uppercase text-gray-500 mb-1">Tags</h4>
                        <Input
                          value={editedTask.tags?.join(", ") || ""}
                          onChange={(e) => setEditedTask({ 
                            ...editedTask, 
                            tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
                          })}
                          placeholder="Enter tags separated by commas..."
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dependencies</h4>
                        <Select
                          value=""
                          onValueChange={(taskId) => {
                            if (taskId && taskId !== editedTask.id) {
                              const currentDeps = editedTask.dependencies || ""
                              const depIds = currentDeps.split(",").map(d => d.trim()).filter(Boolean)
                              if (!depIds.includes(taskId)) {
                                const newDeps = depIds.length > 0 ? `${currentDeps}, ${taskId}` : taskId
                                setEditedTask({ ...editedTask, dependencies: newDeps })
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a task to depend on..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allTasks
                              .filter(t => t.id !== editedTask.id && !t.archived)
                              .map((task) => (
                                <SelectItem key={task.id} value={task.id}>
                                  {task.name || task.title} ({formatStatusLabel(task.status)})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        {editedTask.dependencies && (
                          <div className="mt-2 space-y-1">
                            {editedTask.dependencies.split(",").map((depId) => {
                              const depId_trimmed = depId.trim()
                              if (!depId_trimmed) return null
                              const depTask = allTasks.find((t) => t.id === depId_trimmed)
                              return (
                                <div
                                  key={depId_trimmed}
                                  className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded"
                                >
                                  <span className="text-sm">{depTask?.name || depTask?.title || depId_trimmed}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1"
                                    onClick={() => {
                                      const newDeps = (editedTask.dependencies || "")
                                        .split(",")
                                        .map((d) => d.trim())
                                        .filter((d) => d !== depId_trimmed)
                                        .join(", ")
                                      setEditedTask({ ...editedTask, dependencies: newDeps })
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commitment</h4>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="committed"
                            checked={editedTask.committed || false}
                            onCheckedChange={(checked) => setEditedTask({ ...editedTask, committed: checked as boolean })}
                          />
                          <label htmlFor="committed" className="text-sm text-gray-700 dark:text-gray-300">
                            Committed to timeline
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Mark this task as committed to ensure it's completed within the specified timeline
                        </p>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {task.committed && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commitment Status</h4>
                        <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-lg border border-orange-200 dark:border-orange-700">
                          <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full"></div>
                          Committed to timeline
                        </div>
                      </div>
                    )}

                    {task.assignees && (() => {
                      const assigneesList = Array.isArray(task.assignees) 
                        ? task.assignees 
                        : task.assignees.split(',').map(name => name.trim()).filter(Boolean)
                      
                      return assigneesList.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assignees</h4>
                          <div className="flex flex-wrap gap-2">
                            {assigneesList.map((assignee, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                                {assignee}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    })()}

                      {task.tags && task.tags.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {task.tags.map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-md border border-blue-200 dark:border-blue-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dependencies section */}
              {!isEditing && dependencyTasks.length > 0 && (
                <div className="bg-gray-50/50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-4">
                    <Link2 className="h-5 w-5" />
                    Dependencies ({dependencyTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {dependencyTasks.map((depTask) => (
                      <div 
                        key={depTask.id} 
                        className="p-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{depTask.name || depTask.title}</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              statusColors[depTask.status as keyof typeof statusColors] || statusColors.todo,
                            )}
                          >
                            {formatStatusLabel(depTask.status)}
                          </Badge>
                        </div>
                        {depTask.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {isHtmlContent(depTask.description) ? (
                              <RichTextRenderer content={depTask.description} />
                            ) : (
                              <p>{depTask.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Child Tasks with improved design */}
              {!isEditing && childTasks.length > 0 && (
                <div className="bg-gray-50/50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Dependent Tasks ({childTasks.length})
                    </h3>
                    
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {completedChildTasks}/{totalChildTasks} completed
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {childTasks.map((childTask) => (
                      <div 
                        key={childTask.id} 
                        className="p-3 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-medium text-sm">{childTask.name || childTask.title}</h4>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              statusColors[childTask.status as keyof typeof statusColors] || statusColors.todo,
                            )}
                          >
                            {formatStatusLabel(childTask.status)}
                          </Badge>
                        </div>
                        {isHtmlContent(childTask.description) ? (
                          <div className="text-xs text-gray-500 line-clamp-2">
                            <RichTextRenderer content={childTask.description || ""} />
                          </div>
                        ) : (
                          childTask.description ? 
                            <p className="text-xs text-gray-500 line-clamp-2">{childTask.description}</p> :
                            <p className="text-xs text-gray-400 italic">No description</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar with improved styling */}
          <div className="w-[260px] border-l bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col min-h-0">
            {/* Static Activity label */}
            <div className="mx-2 mt-8 mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300 select-none cursor-default">
              Activity
            </div>
            <div className="w-full h-1  bg-blue-500 mb-2" />
            {/* Activity log content */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full" />
                  </div>
                ) : activityLogs.length > 0 ? (
                  activityLogs.map((log) => {
                    const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
                    const changeDescription = formatChangeDescription(log.event_type, changes);
                    
                    // Determine icon based on event type
                    let IconComponent = Clock;
                    let iconBgColor = "bg-blue-100 dark:bg-blue-900/50";
                    let iconColor = "text-blue-600 dark:text-blue-400";
                    
                    if (log.event_type.includes("Status")) {
                      IconComponent = Clock;
                    } else if (log.event_type.includes("Priority")) {
                      IconComponent = Tag;
                      iconBgColor = "bg-yellow-100 dark:bg-yellow-900/50";
                      iconColor = "text-yellow-600 dark:text-yellow-400";
                    } else if (log.event_type.includes("Date") || log.event_type.includes("due")) {
                      IconComponent = Calendar;
                      iconBgColor = "bg-green-100 dark:bg-green-900/50";
                      iconColor = "text-green-600 dark:text-green-400";
                    } else if (log.event_type.includes("Archived")) {
                      IconComponent = Archive;
                      iconBgColor = "bg-red-100 dark:bg-red-900/50";
                      iconColor = "text-red-600 dark:text-red-400";
                    } else if (log.event_type.includes("Assignee")) {
                      IconComponent = Users;
                      iconBgColor = "bg-purple-100 dark:bg-purple-900/50";
                      iconColor = "text-purple-600 dark:text-purple-400";
                    } else if (log.event_type.includes("Created")) {
                      IconComponent = CheckCircle;
                      iconBgColor = "bg-green-100 dark:bg-green-900/50";
                      iconColor = "text-green-600 dark:text-green-400";
                    } else if (log.event_type.includes("Deleted")) {
                      IconComponent = Archive;
                      iconBgColor = "bg-red-100 dark:bg-red-900/50";
                      iconColor = "text-red-600 dark:text-red-400";
                    } else if (log.event_type.includes("Name")) {
                      IconComponent = Tag;
                      iconBgColor = "bg-blue-100 dark:bg-blue-900/50";
                      iconColor = "text-blue-600 dark:text-blue-400";
                    } else if (log.event_type.includes("Description")) {
                      IconComponent = Tag;
                      iconBgColor = "bg-indigo-100 dark:bg-indigo-900/50";
                      iconColor = "text-indigo-600 dark:text-indigo-400";
                    }

                    return (
                      <div key={log.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex gap-3">
                          <div className={`h-8 w-8 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className={`h-4 w-4 ${iconColor}`} />
                          </div>
                          <div className="flex-1">
                            {/* Changed order to: 1. Content 2. Who 3. When */}
                            <p className="text-sm font-medium">
                              {changeDescription}
                            </p>
                            
                            {log.users && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                <span className="font-medium">Updated by {log.users.name || log.users.email}</span>
                              </p>
                            )}
                            
                            <p className="text-xs text-gray-400">
                              {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ""}
                            </p>
                            {/* Added a button to toggle visibility of changes - kinda obsolete 
                              <button 
                                onClick={() => {
                                  const el = document.getElementById(`task-changes-${log.id}`);
                                  if (el) el.classList.toggle('hidden');
                                }}
                                className="text-xs text-blue-500 hover:text-blue-700 mt-1 flex items-center"
                              >
                                <span>View details</span>
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </button> */}
                            <div id={`task-changes-${log.id}`} className="hidden mt-2">
                              {renderFormattedChanges(changes)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <Clock className="h-10 w-10 mb-2 mx-auto text-gray-400" />
                    <p className="text-sm">No activity recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with improved styling - moved outside scrollable area */}
        <DialogFooter className="p-4 border-t shrink-0 bg-white dark:bg-gray-900">
          {isEditing ? (
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full justify-between">
              <Button variant="destructive" onClick={handleDeleteTask}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
