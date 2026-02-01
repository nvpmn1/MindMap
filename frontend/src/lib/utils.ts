import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  
  return target.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate random color
 */
export function randomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF9F43',
    '#A29BFE', '#FD79A8', '#00B894', '#6C5CE7',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sleep/delay helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Node type to color mapping
 */
export const nodeTypeColors: Record<string, string> = {
  idea: '#818CF8',
  task: '#F59E0B',
  note: '#10B981',
  reference: '#EC4899',
  image: '#8B5CF6',
  group: '#6366F1',
};

/**
 * Status to color mapping
 */
export const statusColors: Record<string, string> = {
  backlog: '#94A3B8',
  todo: '#3B82F6',
  in_progress: '#F59E0B',
  review: '#8B5CF6',
  done: '#10B981',
};

/**
 * Priority to color mapping
 */
export const priorityColors: Record<string, string> = {
  low: '#94A3B8',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
};

/**
 * Status labels
 */
export const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  review: 'Revisão',
  done: 'Concluído',
};

/**
 * Priority labels
 */
export const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};
