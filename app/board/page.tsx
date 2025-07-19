import { KanbanBoard } from "@/components/kanban-board"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export default async function BoardPage() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto px-6 pt-4">
          <KanbanBoard />
        </main>
      </div>
    </div>
  )
}
