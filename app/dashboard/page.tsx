"use client"
import { TaskCard } from "@/components/task-card"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { PlusCircle, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, addDays } from "date-fns"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TaskDetailsDialog } from "@/components/task-details-dialog"
import type { Task } from "@/types"
import { taskStore, activityStore } from "@/lib/local-store"

export default function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [highPriorityTasks, setHighPriorityTasks] = useState<Task[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    try {
      const allTasks = taskStore.getAll()
      const allActivities = activityStore.getAll()

      // Get recent tasks (last 5 updated)
      const recent = allTasks
        .filter(task => !task.archived)
        .sort((a, b) => new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime())
        .slice(0, 5)

      // Get upcoming tasks (due in next 30 days)
      const upcoming = allTasks
        .filter(task => 
          !task.archived && 
          task.end_date && 
          new Date(task.end_date) >= new Date() &&
          new Date(task.end_date) <= addDays(new Date(), 30)
        )
        .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
        .slice(0, 5)

      // Get High priority tasks
      const highPriority = allTasks
        .filter(task => 
          !task.archived && 
          task.priority === "High" && 
          task.status !== "completed"
        )
        .sort((a, b) => {
          if (a.end_date && b.end_date) {
            return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
          }
          return 0
        })
        .slice(0, 5)

      // Get recent activity
      const recentActivity = allActivities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)

      setRecentTasks(recent)
      setUpcomingTasks(upcoming)
      setHighPriorityTasks(highPriority)
      setActivityLogs(recentActivity)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDetailsOpen(true)
  }

  useEffect(() => {
    fetchData()
  }, [])

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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Activity Overview</h1>
              <Link href="/board">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="h-[400px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Upcoming Tasks
                  </CardTitle>
                  <div className="text-xs text-gray-500">
                    Tasks due in the next 30 days
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {upcomingTasks && upcomingTasks.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                        >
                          <div className="font-medium text-sm">{task.name}</div>
                          <div className="text-xs text-gray-500">
                            Due: {task.end_date ? format(new Date(task.end_date), "MMM d, yyyy") : "No due date"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No tasks due in the next 30 days</div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-[400px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    High Priority
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {highPriorityTasks && highPriorityTasks.length > 0 ? (
                    <div className="space-y-2">
                      {highPriorityTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                        >
                          <div className="font-medium text-sm">{task.name}</div>
                          <div className="text-xs text-gray-500">
                            Status: {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Due: {task.end_date ? format(new Date(task.end_date), "MMM d, yyyy") : "No due date"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No high priority tasks</div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-[400px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pr-2">
                  {activityLogs && activityLogs.length > 0 ? (
                    <div className="space-y-2">
                      {activityLogs.map((log) => {
                        const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
                        
                        // Create a descriptive message based on the event type
                        let description = log.event_type;
                        if (log.event_type === 'Status Changed' && changes.old_status && changes.new_status) {
                          description = `Status changed from "${changes.old_status}" to "${changes.new_status}"`;
                        } else if (log.event_type === 'Priority Changed' && changes.old_priority && changes.new_priority) {
                          description = `Priority changed from "${changes.old_priority}" to "${changes.new_priority}"`;
                        } else if (log.event_type === 'Due Date Changed' && changes.old_due_date && changes.new_due_date) {
                          const oldDate = format(new Date(changes.old_due_date), "MMM d");
                          const newDate = format(new Date(changes.new_due_date), "MMM d");
                          description = `Due date changed from ${oldDate} to ${newDate}`;
                        } else if (log.event_type === 'Task Created') {
                          description = `Created task "${log.task_name}"`;
                        } else if (log.event_type === 'Task Archived') {
                          description = `Archived task "${log.task_name}"`;
                        } else if (log.event_type === 'Task Name Changed' && changes.old_name && changes.new_name) {
                          description = `Renamed task from "${changes.old_name}" to "${changes.new_name}"`;
                        } else if (log.event_type === 'Assignee Added' && changes.assignees_added) {
                          description = `Added assignee(s): ${Array.isArray(changes.assignees_added) ? changes.assignees_added.join(', ') : changes.assignees_added}`;
                        } else if (log.event_type === 'Assignee Removed' && changes.assignees_removed) {
                          description = `Removed assignee(s): ${Array.isArray(changes.assignees_removed) ? changes.assignees_removed.join(', ') : changes.assignees_removed}`;
                        }
                        
                        return (
                          <div
                            key={log.id}
                            className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-md transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <span className="font-medium text-sm break-words">{description}</span>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium">{log.task_name}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {log.created_at ? format(new Date(log.created_at), "MMM d, h:mm a") : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No recent activity</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentTasks?.map((task) => (
                  <TaskCard key={task.id} task={task} showDetails />
                ))}

                {(!recentTasks || recentTasks.length === 0) && (
                  <div className="col-span-3 text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Create your first task to get started.</p>
                  </div>
                )}
              </div>
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
            // Refresh the data when a task is updated
            fetchData()
          }}
        />
      )}
    </div>
  )
} 