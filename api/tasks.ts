import { taskStore } from "@/lib/local-store"
import type { Task } from "@/types"

export const taskApi = {
  async getAllTasks() {
    return taskStore.getAll()
  },

  async getTaskById(id: string) {
    return taskStore.getById(id)
  },

  async getTasksByStatus(status: string) {
    return taskStore.getByStatus(status)
  },

  async getTopLevelTasks() {
    return taskStore.getTopLevel()
  },

  async getChildTasks(parentId: string) {
    return taskStore.getChildren(parentId)
  },

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    return taskStore.create(task)
  },

  async updateTask(id: string, updates: Partial<Task>) {
    return taskStore.update(id, updates)
  },

  async deleteTask(id: string) {
    return taskStore.delete(id)
  },

  async archiveTask(id: string) {
    return taskStore.archive(id)
  },

  async reorderTasks(taskIds: string[]) {
    return taskStore.reorder(taskIds)
  }
}
