// Mindmap Nodes - Export all
export * from './IdeaNode';
export * from './TaskNode';
export * from './NoteNode';

import { NodeTypes } from '@xyflow/react';
import { IdeaNode } from './IdeaNode';
import { TaskNode } from './TaskNode';
import { NoteNode } from './NoteNode';

// Node types map for React Flow
export const nodeTypes: NodeTypes = {
  idea: IdeaNode,
  task: TaskNode,
  note: NoteNode,
};

// Default node creation helpers
export const createIdeaNode = (
  id: string,
  position: { x: number; y: number },
  label: string = 'Nova ideia',
  data?: Partial<import('./IdeaNode').IdeaNodeData>
) => ({
  id,
  type: 'idea' as const,
  position,
  data: {
    type: 'idea' as const,
    label,
    ...data,
  },
});

export const createTaskNode = (
  id: string,
  position: { x: number; y: number },
  label: string = 'Nova tarefa',
  data?: Partial<import('./TaskNode').TaskNodeData>
) => ({
  id,
  type: 'task' as const,
  position,
  data: {
    type: 'task' as const,
    label,
    status: 'todo' as const,
    priority: 'medium' as const,
    ...data,
  },
});

export const createNoteNode = (
  id: string,
  position: { x: number; y: number },
  label: string = 'Nova nota',
  content: string = '',
  data?: Partial<import('./NoteNode').NoteNodeData>
) => ({
  id,
  type: 'note' as const,
  position,
  data: {
    type: 'note' as const,
    label,
    content,
    ...data,
  },
});
