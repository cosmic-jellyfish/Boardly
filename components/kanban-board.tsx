"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Plus, MoreVertical, Filter } from "lucide-react"
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  KeyboardSensor
} from "@dnd-kit/core"
import { 
  SortableContext, 
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable"
import { 
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import { NewTaskDialog } from "./new-task-dialog"
import { TaskDetailsDialog } from "./task-details-dialog"
import type { Task } from "@/types"
import { taskStore } from "@/lib/local-store"
import { mockUser } from "@/lib/local-store"
import { cn } from "@/lib/utils"
import React from "react"

const statuses = [
  { id: 'todo', label: 'To Do', color: 'text-slate-700 dark:text-slate-300', bgColor: 'bg-slate-50 dark:bg-slate-900/50' },
  { id: 'in-progress', label: 'In Progress', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
  { id: 'review', label: 'Review', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
  { id: 'completed', label: 'Completed', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30' }
]

// Sortable Task Card Component
const SortableTaskCard = React.memo(({ task, onClick, isOver }: { task: Task; onClick: () => void; isOver?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={cn(
        "transition-all duration-200 relative",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Drop indicator when hovering over this task */}
      {over && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg pointer-events-none z-10 bg-transparent shadow-none" />
      )}
      
      <TaskCard 
        task={task} 
        showDetails 
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  )
})

SortableTaskCard.displayName = 'SortableTaskCard'

// Sortable Column Component
const SortableColumn = React.memo(({ 
  status, 
  tasks, 
  onTaskClick, 
  onAddTask,
  isOver,
  isActive
}: { 
  status: typeof statuses[0]; 
  tasks: Task[]; 
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
  isOver: boolean;
  isActive: boolean;
}) => {
  const {
    setNodeRef,
  } = useSortable({ id: `column-${status.id}` })

  const getAddTaskHoverColors = useCallback((status: string) => {
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
  }, [])

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col h-full min-h-0 transition-all duration-200"
    >
      <div className="flex items-center justify-between p-4 rounded-t-lg transition-colors bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <h3 className={`text-lg font-semibold ${status.color}`}>
            {status.label}
          </h3>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-h-0 p-4 rounded-b-lg transition-colors ${status.bgColor}`}>
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 space-y-4 overflow-y-auto min-h-0 pr-2">
            {tasks.map((task) => (
              <SortableTaskCard 
                key={task.id} 
                task={task} 
                onClick={() => onTaskClick(task)}
                isOver={isOver}
              />
            ))}
            {/* Empty state with drop zone indicator */}
            {tasks.length === 0 && isOver && (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 transition-all duration-200">
                <div className="text-center">
                  <div className="text-blue-500 dark:text-blue-400 text-sm font-medium">
                    Drop task here
                  </div>
                  <div className="text-blue-400 dark:text-blue-500 text-xs">
                    Move to {status.label}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
        {/* Sticky "Add Task" Button at bottom of each column - hidden the completed status */}
        {status.id !== 'completed' && (
          <div className="sticky bottom-0 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 bg-inherit">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`w-full text-gray-500 dark:text-gray-400 transition-all duration-200 rounded-lg ${getAddTaskHoverColors(status.id)}`}
              onClick={onAddTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})

SortableColumn.displayName = 'SortableColumn'

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newTaskStatus, setNewTaskStatus] = useState<string>("todo")
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [virtualTasks, setVirtualTasks] = useState<Task[] | null>(null)
  const [originalTasks, setOriginalTasks] = useState<Task[] | null>(null)
  const [lastOverTarget, setLastOverTarget] = useState<string | null>(null)
  const [hoveredEmptyColumn, setHoveredEmptyColumn] = useState<string | null>(null)
  const user = mockUser

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

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

  const getTasksByStatus = useCallback((status: string) => {
    const source = virtualTasks ?? tasks
    return source
      .filter(task => task.status === status && !task.archived)
      .sort((a, b) => {
        // First, sort by overdue status (overdue tasks first)
        const aIsOverdue = a.end_date && new Date(a.end_date) < new Date() && a.status !== 'completed'
        const bIsOverdue = b.end_date && new Date(b.end_date) < new Date() && b.status !== 'completed'
        
        if (aIsOverdue && !bIsOverdue) return -1
        if (!aIsOverdue && bIsOverdue) return 1
        
        // If both are overdue or both are not overdue, sort by priority
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
        const aPriority = priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] || 0
        const bPriority = priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] || 0
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority // Higher priority first
        }
        
        // If same priority, sort by end date proximity (closer dates first)
        if (a.end_date && b.end_date) {
          const aEndDate = new Date(a.end_date)
          const bEndDate = new Date(b.end_date)
          return aEndDate.getTime() - bEndDate.getTime()
        }
        
        // If one has end date and other doesn't, prioritize the one with end date
        if (a.end_date && !b.end_date) return -1
        if (!a.end_date && b.end_date) return 1
        
        // Finally, fall back to original order
        return (a.order || 0) - (b.order || 0)
      })
  }, [virtualTasks, tasks])

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsDetailsOpen(true)
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
      setOriginalTasks(tasks)
      setVirtualTasks(tasks)
      setLastOverTarget(null)
      setHoveredEmptyColumn(null)
    }
  }, [tasks])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    
    const activeId = active.id as string
    const overId = over.id as string
    const activeTask = (virtualTasks ?? tasks).find(t => t.id === activeId)
    if (!activeTask) return

    // Determine the target column
    let targetColumn: string
    if (overId.startsWith('column-')) {
      targetColumn = overId.replace('column-', '')
    } else {
      const overTask = (virtualTasks ?? tasks).find(t => t.id === overId)
      if (!overTask) return
      targetColumn = overTask.status
    }

    // Only update if target column changed and we're moving to a different column
    if (targetColumn === lastOverTarget || targetColumn === activeTask.status) return
    
    setLastOverTarget(targetColumn)

    // Check if the target column is empty for drop zone display
    const targetColumnTasks = (virtualTasks ?? tasks).filter(t => t.status === targetColumn && !t.archived)
    if (targetColumnTasks.length === 0) {
      setHoveredEmptyColumn(targetColumn)
    } else {
      setHoveredEmptyColumn(null)
    }

    // Only create virtual state if we don't have it yet
    if (!virtualTasks) {
      setVirtualTasks(tasks)
      return
    }

    // Update virtual state for cross-column movement
    const updatedTasks = virtualTasks.filter(t => t.id !== activeId)
    
    if (overId.startsWith('column-')) {
      // Dropping on column header - move to end
      const newColumnTasks = updatedTasks.filter(t => t.status === targetColumn && !t.archived)
      const reordered = [
        ...updatedTasks,
        { ...activeTask, status: targetColumn, order: newColumnTasks.length }
      ]
      setVirtualTasks(reordered)
    } else {
      // Dropping on a task - insert at position
      const overTask = updatedTasks.find(t => t.id === overId)
      if (!overTask) return
      
      const newColumnTasks = updatedTasks.filter(t => t.status === targetColumn && !t.archived)
      const overIndex = newColumnTasks.findIndex(t => t.id === overId)
      
      const reorderedColumn = [
        ...newColumnTasks.slice(0, overIndex),
        { ...activeTask, status: targetColumn },
        ...newColumnTasks.slice(overIndex)
      ]
      
      const filtered = updatedTasks.filter(t => t.status !== targetColumn)
      const reordered = [...filtered, ...reorderedColumn]
      setVirtualTasks(reordered)
    }
  }, [virtualTasks, tasks, lastOverTarget])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setLastOverTarget(null)
    setHoveredEmptyColumn(null)
    
    if (!over) {
      setVirtualTasks(null)
      setOriginalTasks(null)
      return
    }
    
    const activeId = active.id as string
    const overId = over.id as string
    const finalTasks = virtualTasks ?? tasks
    
    // Commit the virtualTasks to real state and storage
    setTasks(finalTasks)
    setVirtualTasks(null)
    setOriginalTasks(null)
    
    // Only update tasks that actually changed (status only, not order)
    if (originalTasks) {
      finalTasks.forEach((finalTask) => {
        const originalTask = originalTasks.find(t => t.id === finalTask.id)
        if (originalTask && originalTask.status !== finalTask.status) {
          // Only update if status changed, not order
          taskStore.update(finalTask.id, { status: finalTask.status })
        }
      })
    }
  }, [virtualTasks, tasks, originalTasks])

  const handleDragCancel = useCallback(() => {
    // Revert to original state
    if (originalTasks) setTasks(originalTasks)
    setVirtualTasks(null)
    setOriginalTasks(null)
    setActiveTask(null)
    setLastOverTarget(null)
    setHoveredEmptyColumn(null)
  }, [originalTasks])

  const handleAddTask = useCallback((statusId: string) => {
    setNewTaskStatus(statusId)
    setIsNewTaskOpen(true)
  }, [])

  const handleTaskCreated = useCallback((newTask: Task) => {
    setTasks(prev => [...prev, newTask])
    setIsNewTaskOpen(false)
  }, [])

  const handleTaskUpdated = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-auto">
          {statuses.map((status) => {
            const columnTasks = getTasksByStatus(status.id)
            const isEmpty = columnTasks.length === 0
            const isOver = hoveredEmptyColumn === status.id && isEmpty
            
            return (
              <SortableColumn
                key={status.id}
                status={status}
                tasks={columnTasks}
                onTaskClick={handleTaskClick}
                onAddTask={() => handleAddTask(status.id)}
                isOver={isOver}
                isActive={!!activeTask}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90 transform rotate-2 shadow-2xl">
              <TaskCard task={activeTask} showDetails isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <NewTaskDialog 
        open={isNewTaskOpen} 
        onOpenChange={setIsNewTaskOpen}
        initialStatus={newTaskStatus}
        onTaskCreated={handleTaskCreated}
      />

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  )
}
