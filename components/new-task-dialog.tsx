"use client"

import React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "./date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Task } from "@/types"
import { RichTextEditor } from "./rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { userStore, taskStore } from "@/lib/local-store"

interface NewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStatus?: string
  initialDate?: Date
  onTaskCreated?: (task: Task) => void
}

export function NewTaskDialog({ open, onOpenChange, initialStatus, initialDate, onTaskCreated }: NewTaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const { toast } = useToast()
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: "",
    description: "",
    priority: "medium",
    tags: [],
    status: initialStatus || "todo",
    assignees: [],
    start_date: null,
    end_date: initialDate ? format(initialDate, "yyyy-MM-dd") : null,
    actual_start_date: null,
    actual_end_date: null,
    order: 0,
    archived: false,
    committed: false,
    dependencies: "",
  })

  // Fetch tasks and users when the dialog opens
  React.useEffect(() => {
    if (open) {
      const fetchData = () => {
        try {
          const allTasks = taskStore.getAll()
          setAllTasks(allTasks.filter(task => !task.archived))
          
          // Get available users from local storage
          const users = userStore.getAll()
          setAvailableUsers(users)
        } catch (error) {
          console.error("Error fetching data:", error)
        }
      }

      fetchData()

      // Reset the form with the initial status
      setNewTask({
        name: "",
        description: "",
        priority: "medium",
        tags: [],
        status: initialStatus || "todo",
        assignees: [],
        start_date: null,
        end_date: initialDate ? format(initialDate, "yyyy-MM-dd") : null,
        actual_start_date: null,
        actual_end_date: null,
        order: 0,
        archived: false,
        committed: false,
        dependencies: "",
      })
    }
  }, [open, initialStatus, initialDate])

  const handleAssigneesChange = (value: string) => {
    const names = value.split(',').map(name => name.trim()).filter(Boolean)
    setNewTask({ ...newTask, assignees: names })
  }

  const handleAssigneesBlur = () => {
    // Only add complete names when user finishes typing
    const names = newTask.assignees || []
    names.forEach(name => {
      if (name && !availableUsers.includes(name)) {
        userStore.add(name)
        setAvailableUsers(prev => [...prev, name])
      }
    })
  }

  const handleQuickAddUser = (userName: string) => {
    const currentNames = newTask.assignees || []
    
    // Don't add if already in the list
    if (!currentNames.includes(userName)) {
      setNewTask({ ...newTask, assignees: [...currentNames, userName] })
    }
  }

  const verifyAuthAndSession = async () => {
    // Always return true for local version
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!await verifyAuthAndSession()) return;
    
    setLoading(true);
  
    try {
      // Get the count of tasks in the column to determine order
      const tasksInStatus = allTasks.filter(task => task.status === newTask.status)
      const order = tasksInStatus.length
  
      const taskToCreate = {
        ...newTask,
        title: newTask.name || newTask.title || "",
        assignees: newTask.assignees || [],
        order: order,
        // Set important fields
        user_id: "local-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Create task using local store
      const createdTask = taskStore.create(taskToCreate);
  
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
  
      if (onTaskCreated) {
        onTaskCreated(createdTask);
      }
  
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Task Name
            </label>
            <Input
              id="name"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              placeholder="Enter task name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <RichTextEditor
              content={newTask.description || ""}
              onChange={(html) => setNewTask({ ...newTask, description: html })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                <SelectTrigger id="priority">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium">
              Proposed Start Date
              </label>
              <DatePicker
                date={newTask.start_date ? new Date(newTask.start_date) : undefined}
                onSelect={(date) =>
                  setNewTask({
                    ...newTask,
                    start_date: date ? format(date, "yyyy-MM-dd") : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium">
              Proposed End Date
              </label>
              <DatePicker
                date={newTask.end_date ? new Date(newTask.end_date) : undefined}
                onSelect={(date) =>
                  setNewTask({
                    ...newTask,
                    end_date: date ? format(date, "yyyy-MM-dd") : null,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="assignees" className="text-sm font-medium">
              Assignees
            </label>
            <Input
              id="assignees"
              value={Array.isArray(newTask.assignees) ? newTask.assignees.join(', ') : ''}
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
                      const currentNames = newTask.assignees || []
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
              <div className="text-xs text-gray-500">
                Previously used: {availableUsers
                  .filter(user => user !== "Local User")
                  .slice(-3)
                  .join(', ')}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="tags"
              value={newTask.tags?.join(", ")}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  tags: e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Enter tags (comma separated)"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dependencies" className="text-sm font-medium">
              Dependencies
            </label>
            <Select
              onValueChange={(value) => {
                const currentDeps = newTask.dependencies
                  ? newTask.dependencies
                      .split(",")
                      .map((d) => d.trim())
                      .filter(Boolean)
                  : []
                if (!currentDeps.includes(value)) {
                  const newDeps = [...currentDeps, value].join(", ")
                  setNewTask({ ...newTask, dependencies: newDeps })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add dependency" />
              </SelectTrigger>
              <SelectContent>
                {allTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name || t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {newTask.dependencies && (
              <div className="mt-2 space-y-1">
                {newTask.dependencies.split(",").map((depId) => {
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
                          const newDeps = (newTask.dependencies || "")
                            .split(",")
                            .map((d) => d.trim())
                            .filter((d) => d !== depId_trimmed)
                            .join(", ")
                          setNewTask({ ...newTask, dependencies: newDeps })
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
