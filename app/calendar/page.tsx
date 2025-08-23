"use client"
import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, Plus } from "lucide-react"
import { format, isSameDay, parseISO, startOfDay, endOfDay, isWithinInterval, addDays, subDays } from "date-fns"
import { taskStore } from "@/lib/local-store"
import { TaskDetailsDialog } from "@/components/task-details-dialog"
import { NewTaskDialog } from "@/components/new-task-dialog"
import { stripHtmlTags } from "@/lib/utils"
import type { Task } from "@/types"

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState<Task[]>([])

  useEffect(() => {
    const allTasks = taskStore.getAll().filter(task => !task.archived)
    setTasks(allTasks)
  }, [])

  useEffect(() => {
    if (selectedDate) {
      const tasksForDate = tasks.filter(task => {
        if (!task.end_date) return false
        return isSameDay(parseISO(task.end_date), selectedDate)
      })
      setTasksForSelectedDate(tasksForDate)
    }
  }, [selectedDate, tasks])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDetailsOpen(true)
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.end_date) return false
      return isSameDay(parseISO(task.end_date), date)
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const renderDayContent = (date: Date) => {
    const dayTasks = getTasksForDate(date)
    const isToday = isSameDay(date, new Date())
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    
    return (
      <div 
        className={`relative w-full h-full flex flex-col items-center justify-center p-1 rounded-md transition-colors ${
          isSelected ? 'bg-blue-100 text-blue-800 dark:bg-blue-100' : ''
        }`}
      >
        <span className={`text-sm ${isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
          {date.getDate()}
        </span>
        {dayTasks.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
            {dayTasks.slice(0, 4).map((task, index) => (
              <div
                key={`${task.id}-${index}`}
                className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                title={`${task.name || task.title} (${task.priority})`}
              />
            ))}
            {dayTasks.length > 4 && (
              <div className="w-2 h-2 rounded-full bg-gray-400" title={`+${dayTasks.length - 4} more tasks`} />
            )}
          </div>
        )}
      </div>
    )
  }

  const getUpcomingTasks = () => {
    const today = startOfDay(new Date())
    const nextWeek = addDays(today, 7)
    
    return tasks.filter(task => {
      if (!task.end_date || task.status.toLowerCase() === 'completed') return false
      const taskDate = parseISO(task.end_date)
      return isWithinInterval(taskDate, { start: today, end: nextWeek })
    }).sort((a, b) => parseISO(a.end_date!).getTime() - parseISO(b.end_date!).getTime())
  }

  const getOverdueTasks = () => {
    const today = startOfDay(new Date())
    
    return tasks.filter(task => {
      if (!task.end_date || task.status.toLowerCase() === 'completed') return false
      return parseISO(task.end_date) < today
    }).sort((a, b) => parseISO(a.end_date!).getTime() - parseISO(b.end_date!).getTime())
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold">Calendar View</h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Task Calendar</CardTitle>
                    <Button size="sm" onClick={() => setIsNewTaskOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Task
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-center mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date()
                            setSelectedDate(today)
                            setCurrentMonth(today)
                          }}
                          className="text-xs"
                        >
                          Today
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        onSelect={setSelectedDate}
                        className="w-full"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                          month: "space-y-4 w-full",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex w-full",
                          head_cell: "text-muted-foreground rounded-md flex-1 text-center font-normal text-[0.8rem] py-2",
                          row: "flex w-full mt-2",
                          cell: "flex-1 h-12 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-12 w-full p-0 font-normal aria-selected:opacity-100",
                          day_range_end: "day-range-end",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground",
                          day_outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                        components={{
                          DayContent: ({ date }) => renderDayContent(date)
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Selected Date Tasks */}
              <div className="flex flex-col h-full">
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4" />
                      {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {selectedDate && tasksForSelectedDate.length > 0 ? (
                      <div className="space-y-2">
                        {tasksForSelectedDate.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer border-l-4 border-blue-500"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {task.name || task.title}
                              </h4>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getStatusColor(task.status)}`}
                              >
                                {task.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                              <span className="text-xs text-gray-500 capitalize">{task.priority}</span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                {stripHtmlTags(task.description)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : selectedDate ? (
                      <div className="text-center py-4 text-gray-500">
                        <CalendarIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks due on this date</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setIsNewTaskOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">Select a date to view tasks</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</span>
                      <Badge variant="outline" className="text-xs">{tasks.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">High Priority</span>
                      <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                        {tasks.filter(t => t.priority.toLowerCase() === 'high').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Overdue</span>
                      <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                        {getOverdueTasks().length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                {getUpcomingTasks().length > 0 && (
                  <Card className="mt-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        Upcoming (Next 7 days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-3">
                      {getUpcomingTasks().slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                        >
                          <div className="font-medium text-sm">{task.name || task.title}</div>
                          <div className="text-xs text-gray-500">
                            Due: {format(parseISO(task.end_date!), "MMM d")}
                          </div>
                        </div>
                      ))}
                      {getUpcomingTasks().length > 2 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          +{getUpcomingTasks().length - 2} more tasks
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Overdue Tasks */}
                {getOverdueTasks().length > 0 && (
                  <Card className="mt-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Overdue
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-3">
                      {getOverdueTasks().slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-md transition-colors cursor-pointer border-l-2 border-red-500"
                        >
                          <div className="font-medium text-sm">{task.name || task.title}</div>
                          <div className="text-xs text-red-600 dark:text-red-400">
                            Overdue: {format(parseISO(task.end_date!), "MMM d")}
                          </div>
                        </div>
                      ))}
                      {getOverdueTasks().length > 2 && (
                        <div className="text-xs text-red-500 text-center pt-1">
                          +{getOverdueTasks().length - 2} more overdue tasks
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
            const allTasks = taskStore.getAll().filter(task => !task.archived)
            setTasks(allTasks)
          }}
        />
      )}

      <NewTaskDialog
        open={isNewTaskOpen}
        onOpenChange={setIsNewTaskOpen}
        initialDate={selectedDate}
        onTaskCreated={(newTask) => {
          const allTasks = taskStore.getAll().filter(task => !task.archived)
          setTasks(allTasks)
        }}
      />
    </div>
  )
}
