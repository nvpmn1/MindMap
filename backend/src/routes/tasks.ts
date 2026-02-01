import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, asyncHandler } from '../middleware';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../services/supabase';
import { Insertable, Updatable } from '../types/database';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
  node_id: z.string().uuid('Invalid node ID'),
  title: z.string().min(1, 'Title required').max(500, 'Title too long'),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    done: z.boolean(),
  })).default([]),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().datetime().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    done: z.boolean(),
  })).optional(),
  order_index: z.number().optional(),
});

const listTasksQuerySchema = z.object({
  map_id: z.string().uuid().optional(),
  workspace_id: z.string().uuid().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().optional(),
  assigned_to_me: z.string().transform(v => v === 'true').optional(),
  due_before: z.string().datetime().optional(),
  due_after: z.string().datetime().optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('50'),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional().default('0'),
});

const reorderTasksSchema = z.object({
  tasks: z.array(z.object({
    id: z.string().uuid(),
    order_index: z.number(),
    status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).optional(),
  })).min(1).max(100),
});

/**
 * GET /api/tasks
 * List tasks with filters
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = listTasksQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const {
      map_id,
      workspace_id,
      status,
      priority,
      assigned_to,
      assigned_to_me,
      due_before,
      due_after,
      tags,
      search,
      limit,
      offset,
    } = parsed.data;

    // Build query
    let query = req.supabase!
      .from('tasks')
      .select(`
        *,
        node:nodes!inner (
          id,
          label,
          map_id,
          map:maps!inner (
            id,
            title,
            workspace_id,
            workspace:workspaces!inner (
              id,
              name
            )
          )
        ),
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          display_name,
          avatar_url,
          color
        ),
        creator:profiles!tasks_created_by_fkey (
          id,
          display_name,
          avatar_url,
          color
        )
      `, { count: 'exact' })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (workspace_id) {
      query = query.eq('node.map.workspace_id', workspace_id);
    }

    if (map_id) {
      query = query.eq('node.map_id', map_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (assigned_to_me) {
      query = query.eq('assigned_to', req.user!.id);
    }

    if (due_before) {
      query = query.lte('due_date', due_before);
    }

    if (due_after) {
      query = query.gte('due_date', due_after);
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      query = query.contains('tags', tagList);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: tasks, error, count } = await query;

    if (error) {
      logger.error({ error: error.message }, 'Failed to fetch tasks');
      throw new Error('Failed to fetch tasks');
    }

    res.json({
      success: true,
      data: tasks || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  })
);

/**
 * GET /api/tasks/kanban/:mapId
 * Get tasks grouped by status for Kanban view
 */
router.get(
  '/kanban/:mapId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { mapId } = req.params;

    const { data: tasks, error } = await req.supabase!
      .from('tasks')
      .select(`
        *,
        node:nodes!inner (
          id,
          label,
          map_id
        ),
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          display_name,
          avatar_url,
          color
        )
      `)
      .eq('node.map_id', mapId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch tasks');
    }

    // Group by status
    const columns: Record<string, typeof tasks> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    for (const task of tasks || []) {
      columns[task.status].push(task);
    }

    res.json({
      success: true,
      data: {
        columns,
        totalTasks: tasks?.length || 0,
      },
    });
  })
);

/**
 * GET /api/tasks/:taskId
 * Get single task with details
 */
router.get(
  '/:taskId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;

    const { data: task, error } = await req.supabase!
      .from('tasks')
      .select(`
        *,
        node:nodes (
          id,
          label,
          map_id,
          content,
          map:maps (
            id,
            title,
            workspace_id,
            workspace:workspaces (
              id,
              name
            )
          )
        ),
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          display_name,
          avatar_url,
          color,
          email
        ),
        creator:profiles!tasks_created_by_fkey (
          id,
          display_name,
          avatar_url,
          color
        )
      `)
      .eq('id', taskId)
      .single();

    if (error || !task) {
      throw new NotFoundError('Task not found');
    }

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * POST /api/tasks
 * Create new task
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    // Get max order_index for the status
    const { data: maxOrder } = await req.supabase!
      .from('tasks')
      .select('order_index')
      .eq('node_id', parsed.data.node_id)
      .eq('status', parsed.data.status)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const taskData: Insertable<'tasks'> = {
      ...parsed.data,
      order_index: (maxOrder?.order_index ?? -1) + 1,
      created_by: req.user!.id,
    };

    const { data: task, error } = await req.supabase!
      .from('tasks')
      .insert(taskData)
      .select(`
        *,
        node:nodes (
          id,
          label,
          map_id
        ),
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          display_name,
          avatar_url,
          color
        )
      `)
      .single();

    if (error) {
      logger.error({ error: error.message }, 'Failed to create task');
      throw new Error('Failed to create task');
    }

    // If assigned to someone else, create notification
    if (task.assigned_to && task.assigned_to !== req.user!.id) {
      await createAssignmentNotification(
        task.assigned_to,
        req.user!.id,
        task.id,
        task.title
      );
    }

    logger.info({ taskId: task.id, nodeId: task.node_id, userId: req.user!.id }, 'Task created');

    res.status(201).json({
      success: true,
      data: task,
    });
  })
);

/**
 * PATCH /api/tasks/:taskId
 * Update task
 */
router.patch(
  '/:taskId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    // Get current task to check for assignment changes
    const { data: currentTask } = await req.supabase!
      .from('tasks')
      .select('assigned_to, title')
      .eq('id', taskId)
      .single();

    const updateData: Updatable<'tasks'> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const { data: task, error } = await req.supabase!
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        *,
        node:nodes (
          id,
          label,
          map_id
        ),
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          display_name,
          avatar_url,
          color
        )
      `)
      .single();

    if (error || !task) {
      throw new NotFoundError('Task not found or access denied');
    }

    // If assignment changed, create notification
    if (
      parsed.data.assigned_to &&
      parsed.data.assigned_to !== currentTask?.assigned_to &&
      parsed.data.assigned_to !== req.user!.id
    ) {
      await createAssignmentNotification(
        parsed.data.assigned_to,
        req.user!.id,
        task.id,
        task.title
      );
    }

    logger.debug({ taskId, userId: req.user!.id }, 'Task updated');

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * PATCH /api/tasks/reorder
 * Reorder tasks (for Kanban drag-drop)
 */
router.patch(
  '/reorder',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = reorderTasksSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { tasks } = parsed.data;
    const errors: any[] = [];

    await Promise.all(
      tasks.map(async ({ id, order_index, status }) => {
        const updateData: any = { order_index, updated_at: new Date().toISOString() };
        if (status) updateData.status = status;

        const { error } = await req.supabase!
          .from('tasks')
          .update(updateData)
          .eq('id', id);

        if (error) {
          errors.push({ id, error: error.message });
        }
      })
    );

    res.json({
      success: errors.length === 0,
      data: {
        updated: tasks.length - errors.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  })
);

/**
 * DELETE /api/tasks/:taskId
 * Delete task
 */
router.delete(
  '/:taskId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;

    const { error } = await req.supabase!
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      logger.error({ error: error.message, taskId }, 'Failed to delete task');
      throw new Error('Failed to delete task');
    }

    logger.info({ taskId, userId: req.user!.id }, 'Task deleted');

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  })
);

/**
 * GET /api/tasks/stats/:workspaceId
 * Get task statistics for workspace
 */
router.get(
  '/stats/:workspaceId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId } = req.params;

    // Get all tasks in workspace
    const { data: tasks } = await req.supabase!
      .from('tasks')
      .select(`
        id,
        status,
        priority,
        assigned_to,
        due_date,
        node:nodes!inner (
          map:maps!inner (
            workspace_id
          )
        )
      `)
      .eq('node.map.workspace_id', workspaceId);

    if (!tasks) {
      return res.json({
        success: true,
        data: {
          total: 0,
          byStatus: {},
          byPriority: {},
          byAssignee: {},
          overdue: 0,
          dueThisWeek: 0,
        },
      });
    }

    // Calculate stats
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: tasks.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byAssignee: {} as Record<string, number>,
      overdue: 0,
      dueThisWeek: 0,
      completionRate: 0,
    };

    for (const task of tasks) {
      // By status
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;

      // By priority
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;

      // By assignee
      if (task.assigned_to) {
        stats.byAssignee[task.assigned_to] = (stats.byAssignee[task.assigned_to] || 0) + 1;
      }

      // Overdue
      if (task.due_date && new Date(task.due_date) < now && task.status !== 'done') {
        stats.overdue++;
      }

      // Due this week
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        if (dueDate >= now && dueDate <= weekFromNow) {
          stats.dueThisWeek++;
        }
      }
    }

    // Completion rate
    const completedCount = stats.byStatus['done'] || 0;
    stats.completionRate = tasks.length > 0 
      ? Math.round((completedCount / tasks.length) * 100) 
      : 0;

    res.json({
      success: true,
      data: stats,
    });
  })
);

// ============ HELPERS ============

/**
 * Create assignment notification
 */
async function createAssignmentNotification(
  assigneeId: string,
  assignerId: string,
  taskId: string,
  taskTitle: string
): Promise<void> {
  try {
    // Get assigner profile
    const { data: assigner } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('id', assignerId)
      .single();

    await supabaseAdmin.from('notifications').insert({
      user_id: assigneeId,
      type: 'task_assigned',
      title: 'New task assigned',
      message: `${assigner?.display_name || 'Someone'} assigned you a task: "${taskTitle}"`,
      data: {
        task_id: taskId,
        assigner_id: assignerId,
      },
    });

    logger.debug({ assigneeId, taskId }, 'Assignment notification created');
  } catch (error) {
    logger.warn({ error, taskId }, 'Failed to create assignment notification');
  }
}

export default router;
