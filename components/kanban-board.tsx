"use client"

import { useState, useEffect } from "react"
import { Plus, MoreVertical, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import { NewTaskDialog } from "./new-task-dialog"
import { TaskDetailsDialog } from "./task-details-dialog"
import type { Task } from "@/types"
import { taskStore } from "@/lib/local-store"
import { mockUser } from "@/lib/local-store"

const statuses = [
  { id: 'todo', label: 'To Do', color: 'text-slate-700 dark:text-slate-300', bgColor: 'bg-slate-50 dark:bg-slate-900/50' },
  { id: 'in-progress', label: 'In Progress', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
  { id: 'review', label: 'Review', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
  { id: 'completed', label: 'Completed', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30' }
]

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newTaskStatus, setNewTaskStatus] = useState<string>("todo")
  const user = mockUser

  useEffect(() => {
    const fetchTasks = () => {
      try {
        const allTasks = taskStore.getAll()
        setTasks(allTasks)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDetailsOpen(true)
  }

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter(task => task.status === status && !task.archived)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  const getStatusColor = (status: string) => {
    const statusConfig = statuses.find(s => s.id === status)
    return statusConfig?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const statusConfig = statuses.find(s => s.id === status)
    return statusConfig?.label || status
  }

  const getAddTaskHoverColors = (status: string) => {
    switch (status) {
      case 'todo':
        return 'hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
      case 'in-progress':
        return 'hover:text-blue-700 hover:bg-blue-100 dark:hover:text-blue-300 dark:hover:bg-blue-900/40'
      case 'review':
        return 'hover:text-purple-700 hover:bg-purple-100 dark:hover:text-purple-300 dark:hover:bg-purple-900/40'
      case 'completed':
        return 'hover:text-emerald-700 hover:bg-emerald-100 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/40'
      default:
        return 'hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800/60'
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">


      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-auto">
        {statuses.map((status) => {
          const columnTasks = getTasksByStatus(status.id)
          
          return (
            <div key={status.id} className="flex flex-col h-full min-h-0">
              <div className={`
                flex items-center justify-between p-4 rounded-t-lg border-2 border-b-0 transition-colors bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                border-gray-200 dark:border-gray-700 shadow-sm
              `}>
                <div className="flex items-center gap-3">
                  <h3 className={`text-lg font-semibold ${status.color}`}>
                    {status.label}
                  </h3>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                {/* <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                  <MoreVertical className="h-4 w-4" />
                </Button> */}
              </div>

              <div className={`
                flex-1 flex flex-col min-h-0 p-4 rounded-b-lg border-2 border-t-0 transition-colors ${status.bgColor}
                border-gray-200 dark:border-gray-700
              `}>
                <div className="flex-1 space-y-4 overflow-y-auto min-h-0 pr-2">
                  {columnTasks.map((task, index) => (
                    <div key={task.id} className="transition-transform">
                      <TaskCard 
                        task={task} 
                        showDetails 
                        onClick={() => handleTaskClick(task)}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Sticky "Add Task" Button at bottom of each column - hidden the completed status */}
                {status.id !== 'completed' && (
                  <div className="sticky bottom-0 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 bg-inherit">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`w-full text-gray-500 dark:text-gray-400 transition-all duration-200 rounded-lg ${getAddTaskHoverColors(status.id)}`}
                      onClick={() => {
                        setNewTaskStatus(status.id)
                        setIsNewTaskOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <NewTaskDialog 
        open={isNewTaskOpen} 
        onOpenChange={setIsNewTaskOpen}
        initialStatus={newTaskStatus}
        onTaskCreated={(newTask) => {
          setTasks(prev => [...prev, newTask])
          setIsNewTaskOpen(false)
        }}
      />

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onTaskUpdated={(updatedTask) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
          }}
        />
      )}
    </div>
  )
}
