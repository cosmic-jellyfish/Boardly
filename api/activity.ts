import { activityStore } from "@/lib/local-store"
import type { ActivityLog } from "@/types"

export const activityApi = {
  async getAllActivity() {
    return activityStore.getAll()
  },

  async getRecentActivity(limit: number = 10) {
    return activityStore.getRecent(limit)
  },

  async getActivityByTaskId(taskId: string) {
    return activityStore.getByTaskId(taskId)
  },

  async createActivity(activity: Omit<ActivityLog, 'id'>) {
    return activityStore.create(activity)
  }
}
