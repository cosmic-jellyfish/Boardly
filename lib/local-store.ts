import type { Task, ActivityLog } from "@/types"

// Local storage keys
const TASKS_KEY = "kanban-tasks"
const ACTIVITY_KEY = "kanban-activity"
const USERS_KEY = "kanban-users"

// Initialise default data if not exists
const initializeDefaultData = () => {
  if (typeof window === "undefined") return

  // Only create default tasks if user hasn't completed onboarding
  const hasCompletedOnboarding = localStorage.getItem("kanban-user") !== null
  
  // Initialise tasks if not exists and user hasn't completed onboarding
  if (!localStorage.getItem(TASKS_KEY) && !hasCompletedOnboarding) {
    const defaultTasks: Task[] = [
      {
        id: "1",
        title: "Welcome to Boardly",
        name: "Welcome to Boardly",
        description: "This is your first task. Click to edit or create new tasks!",
        status: "todo",
        priority: "Medium",
        assignees: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived: false,
        order: 0,
        parent_id: null,
        tags: ["welcome"]
      },
      {
        id: "2",
        title: "Create your first project",
        name: "Create your first project",
        description: "Start by creating a new project to organize your work",
        status: "in-progress",
        priority: "High",
        assignees: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived: false,
        order: 1,
        parent_id: null,
        tags: ["project"]
      }
    ]
    localStorage.setItem(TASKS_KEY, JSON.stringify(defaultTasks))
  }

  // Initialize activity if not exists
  if (!localStorage.getItem(ACTIVITY_KEY)) {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify([]))
  }

  // Initialize users if not exists
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers = ["Local User"]
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
  } else {
    // Migrate existing user data to new format
    try {
      const existingUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        // Check if it's the old format (objects with id/name properties)
        const firstUser = existingUsers[0]
        if (typeof firstUser === 'object' && firstUser !== null && 'name' in firstUser) {
          // Convert old format to new format
          const newUsers = existingUsers
            .map(user => user.name || user.username || 'Unknown User')
            .filter(name => name && name !== 'Unknown User')
          
          if (newUsers.length === 0) {
            newUsers.push("Local User")
          }
          
          localStorage.setItem(USERS_KEY, JSON.stringify(newUsers))
        }
      }
    } catch (error) {
      // If there's any error, reset to default
      const defaultUsers = ["Local User"]
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
    }
  }
}

// Helper functions
const getData = <T>(key: string): T[] => {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const setData = <T>(key: string, data: T[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

// Task operations
export const taskStore = {
  getAll: (): Task[] => {
    initializeDefaultData()
    return getData<Task>(TASKS_KEY)
  },

  getById: (id: string): Task | null => {
    const tasks = taskStore.getAll()
    return tasks.find(task => task.id === id) || null
  },

  getByStatus: (status: string): Task[] => {
    const tasks = taskStore.getAll()
    return tasks.filter(task => task.status === status && !task.archived)
  },

  getTopLevel: (): Task[] => {
    const tasks = taskStore.getAll()
    return tasks.filter(task => !task.parent_id && !task.archived)
  },

  getChildren: (parentId: string): Task[] => {
    const tasks = taskStore.getAll()
    return tasks.filter(task => task.parent_id === parentId)
  },

  create: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task => {
    const tasks = taskStore.getAll()
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    tasks.push(newTask)
    setData(TASKS_KEY, tasks)
    
    // Add activity log with descriptive information
    activityStore.create({
      event_type: "Task Created",
      task_id: newTask.id,
      task_name: newTask.name || newTask.title,
      changes: JSON.stringify({ 
        name: newTask.name || newTask.title,
        status: newTask.status,
        priority: newTask.priority,
        description: newTask.description
      }),
      created_at: new Date().toISOString(),
      user_id: "local-user"
    })
    
    return newTask
  },

  update: (id: string, updates: Partial<Task>): Task => {
    const tasks = taskStore.getAll()
    const index = tasks.findIndex(task => task.id === id)
    if (index === -1) throw new Error("Task not found")
    
    const oldTask = tasks[index]
    const updatedTask: Task = {
      ...oldTask,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    tasks[index] = updatedTask
    setData(TASKS_KEY, tasks)
    
    // Create descriptive activity log based on what actually changed
    const changes = Object.keys(updates).map(key => {
      const oldValue = oldTask[key as keyof Task]
      const newValue = updates[key as keyof Task]
      
      // Only create activity log if the value actually changed
      let hasChanged = false
      
      // Handle arrays (like assignees)
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue)
      }
      // Handle other types
      else {
        hasChanged = oldValue !== newValue
      }
      
      if (!hasChanged) {
        return null
      }
      
      if (key === 'status') {
        return {
          type: 'Status Changed',
          old_status: oldValue,
          new_status: newValue
        }
      } else if (key === 'priority') {
        return {
          type: 'Priority Changed',
          old_priority: oldValue,
          new_priority: newValue
        }
      } else if (key === 'end_date') {
        return {
          type: 'Due Date Changed',
          old_due_date: oldValue,
          new_due_date: newValue
        }
      } else if (key === 'start_date') {
        return {
          type: 'Start Date Changed',
          old_start_date: oldValue,
          new_start_date: newValue
        }
      } else if (key === 'assignees') {
        const oldAssignees = Array.isArray(oldValue) ? oldValue : []
        const newAssignees = Array.isArray(newValue) ? newValue : []
        
        if (oldAssignees.length === 0 && newAssignees.length > 0) {
          return {
            type: 'Assignee Added',
            assignees_added: newAssignees
          }
        } else if (oldAssignees.length > 0 && newAssignees.length === 0) {
          return {
            type: 'Assignee Removed',
            assignees_removed: oldAssignees
          }
        } else {
          return {
            type: 'Assignee Changed',
            old_assignee: oldValue,
            new_assignee: newValue
          }
        }
      } else if (key === 'archived') {
        return {
          type: 'Task Archived',
          archived: newValue
        }
      } else if (key === 'name' || key === 'title') {
        return {
          type: 'Task Name Changed',
          old_name: oldValue,
          new_name: newValue
        }
      } else if (key === 'description') {
        return {
          type: 'Description Updated',
          description_changed: true
        }
      } else {
        return {
          type: 'Task Updated',
          field: key,
          old_value: oldValue,
          new_value: newValue
        }
      }
    }).filter(change => change !== null) // Remove null entries for unchanged fields
    
    // Create activity log for each actual change
    changes.forEach(change => {
      if (change) {
        activityStore.create({
          event_type: change.type,
          task_id: id,
          task_name: updatedTask.name || updatedTask.title,
          changes: JSON.stringify(change),
          created_at: new Date().toISOString(),
          user_id: "local-user"
        })
      }
    })
    
    return updatedTask
  },

  delete: (id: string): void => {
    const tasks = taskStore.getAll()
    const task = tasks.find(t => t.id === id)
    if (!task) throw new Error("Task not found")
    
    const filteredTasks = tasks.filter(task => task.id !== id)
    setData(TASKS_KEY, filteredTasks)
    
    // Add activity log
    activityStore.create({
      event_type: "Task Deleted",
      task_id: id,
      task_name: task.name || task.title,
      changes: JSON.stringify({ deleted: true }),
      created_at: new Date().toISOString(),
      user_id: "local-user"
    })
  },

  archive: (id: string): Task => {
    return taskStore.update(id, { archived: true })
  },

  reorder: (taskIds: string[]): void => {
    const tasks = taskStore.getAll()
    const updatedTasks = tasks.map(task => {
      const newOrder = taskIds.indexOf(task.id)
      return newOrder !== -1 ? { ...task, order: newOrder } : task
    })
    setData(TASKS_KEY, updatedTasks)
  },

  removeDefaultTasks: (): void => {
    const tasks = taskStore.getAll()
    const filteredTasks = tasks.filter(task => 
      !task.tags.includes("welcome") && !task.tags.includes("project")
    )
    setData(TASKS_KEY, filteredTasks)
    
    // Add activity log
    activityStore.create({
      event_type: "Default Tasks Removed",
      task_id: "system",
      task_name: "System",
      changes: JSON.stringify({ action: "removed_default_tasks" }),
      created_at: new Date().toISOString(),
      user_id: "local-user"
    })
  }
}

// Activity operations
export const activityStore = {
  getAll: (): ActivityLog[] => {
    initializeDefaultData()
    return getData<ActivityLog>(ACTIVITY_KEY)
  },

  getRecent: (limit: number = 10): ActivityLog[] => {
    const activities = activityStore.getAll()
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  },

  getByTaskId: (taskId: string): ActivityLog[] => {
    const activities = activityStore.getAll()
    return activities
      .filter(activity => activity.task_id === taskId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  create: (activity: Omit<ActivityLog, 'id'>): ActivityLog => {
    const activities = activityStore.getAll()
    const newActivity: ActivityLog = {
      ...activity,
      id: crypto.randomUUID()
    }
    activities.push(newActivity)
    setData(ACTIVITY_KEY, activities)
    return newActivity
  }
}

// User store for managing the kanban user profile
export const userStore = {
  getCurrentUser: (): { name: string; avatar: string; avatarType: 'emoji' | 'upload' | 'url' } | null => {
    if (typeof window === "undefined") return null
    try {
      const userData = localStorage.getItem("kanban-user")
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  },

  setCurrentUser: (user: { name: string; avatar: string; avatarType: 'emoji' | 'upload' | 'url' }): void => {
    if (typeof window === "undefined") return
    localStorage.setItem("kanban-user", JSON.stringify(user))
  },

  hasCompletedOnboarding: (): boolean => {
    return userStore.getCurrentUser() !== null
  },

  clearUser: (): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem("kanban-user")
  },

  // Get all available users (for assignee selection)
  getAll: (): string[] => {
    initializeDefaultData()
    return getData<string>(USERS_KEY)
  },

  // Add a new user to the available users list
  add: (userName: string): void => {
    if (typeof window === "undefined") return
    const users = userStore.getAll()
    if (!users.includes(userName)) {
      users.push(userName)
      setData(USERS_KEY, users)
    }
  },

  // Remove a user from the available users list
  remove: (userName: string): void => {
    if (typeof window === "undefined") return
    const users = userStore.getAll()
    const filteredUsers = users.filter(user => user !== userName)
    setData(USERS_KEY, filteredUsers)
  }
}

// Export a mock user for components that expect user data
export const mockUser = {
  id: "local-user",
  name: "Local User",
  email: "user@local.com",
  avatar_url: null
} 