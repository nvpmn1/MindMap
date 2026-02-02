import { KanbanBoard } from '@/components/views/KanbanBoard';

export function KanbanPage() {
  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Kanban</h1>
      <KanbanBoard />
    </div>
  );
}
