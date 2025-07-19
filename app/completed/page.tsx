"use client"

import { useState, useEffect } from "react"
import { TaskCard } from "@/components/task-card"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { TaskDetailsDialog } from "@/components/task-details-dialog"
import { taskStore } from "@/lib/local-store"
import type { Task } from "@/types"

export default function CompletedPage() {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    const fetchCompletedTasks = () => {
      try {
        const allTasks = taskStore.getAll()
        const completed = allTasks.filter(task => task.status === 'completed' && !task.archived)
        setCompletedTasks(completed)
      } catch (error) {
        console.error('Error fetching completed tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompletedTasks()
  }, [])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDetailsOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Completed Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400">
                View all your completed tasks and projects
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  showDetails 
                  onClick={() => handleTaskClick(task)}
                />
              ))}

              {completedTasks.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No completed tasks</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Complete some tasks to see them here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onTaskUpdated={(updatedTask) => {
            // Refresh the completed tasks when a task is updated
            const allTasks = taskStore.getAll()
            const completed = allTasks.filter(task => task.status === 'completed' && !task.archived)
            setCompletedTasks(completed)
          }}
        />
      )}
    </div>
  )
}
