const express = require('express');
const router = express.Router();
const { supabaseAdmin, updateNode, getNodeById, logActivity } = require('../services/supabaseService');

/**
 * POST /api/tasks/assign
 * Assign a task to a user
 */
router.post('/assign', async (req, res, next) => {
  try {
    const { nodeId, userId, assignedBy } = req.body;

    if (!nodeId || !userId) {
      return res.status(400).json({
        error: { message: 'nodeId and userId are required', code: 'MISSING_PARAMS' }
      });
    }

    const node = await getNodeById(nodeId);
    
    const updated = await updateNode(nodeId, {
      assigned_to: userId,
      status: node.status || 'todo',
      type: 'task'
    });

    // Log activity
    if (assignedBy) {
      await logActivity({
        mindmap_id: node.mindmap_id,
        user_id: assignedBy,
        action: 'assign_task',
        node_id: nodeId,
        details: { assignedTo: userId }
      });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('[Tasks] Assign error:', error);
    next(error);
  }
});

/**
 * POST /api/tasks/unassign
 * Remove assignment from a task
 */
router.post('/unassign', async (req, res, next) => {
  try {
    const { nodeId, userId } = req.body;

    if (!nodeId) {
      return res.status(400).json({
        error: { message: 'nodeId is required', code: 'MISSING_PARAMS' }
      });
    }

    const node = await getNodeById(nodeId);
    
    const updated = await updateNode(nodeId, {
      assigned_to: null
    });

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: node.mindmap_id,
        user_id: userId,
        action: 'unassign_task',
        node_id: nodeId
      });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('[Tasks] Unassign error:', error);
    next(error);
  }
});

/**
 * POST /api/tasks/status
 * Update task status
 */
router.post('/status', async (req, res, next) => {
  try {
    const { nodeId, status, userId } = req.body;

    if (!nodeId || !status) {
      return res.status(400).json({
        error: { message: 'nodeId and status are required', code: 'MISSING_PARAMS' }
      });
    }

    const validStatuses = ['todo', 'doing', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, code: 'INVALID_STATUS' }
      });
    }

    const node = await getNodeById(nodeId);
    const previousStatus = node.status;
    
    const updated = await updateNode(nodeId, { status });

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: node.mindmap_id,
        user_id: userId,
        action: 'update_status',
        node_id: nodeId,
        details: { previousStatus, newStatus: status }
      });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('[Tasks] Status update error:', error);
    next(error);
  }
});

/**
 * POST /api/tasks/priority
 * Update task priority
 */
router.post('/priority', async (req, res, next) => {
  try {
    const { nodeId, priority, userId } = req.body;

    if (!nodeId || !priority) {
      return res.status(400).json({
        error: { message: 'nodeId and priority are required', code: 'MISSING_PARAMS' }
      });
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: { message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`, code: 'INVALID_PRIORITY' }
      });
    }

    const node = await getNodeById(nodeId);
    
    const updated = await updateNode(nodeId, { priority });

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: node.mindmap_id,
        user_id: userId,
        action: 'update_priority',
        node_id: nodeId,
        details: { priority }
      });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('[Tasks] Priority update error:', error);
    next(error);
  }
});

/**
 * POST /api/tasks/due-date
 * Set task due date
 */
router.post('/due-date', async (req, res, next) => {
  try {
    const { nodeId, dueDate, userId } = req.body;

    if (!nodeId) {
      return res.status(400).json({
        error: { message: 'nodeId is required', code: 'MISSING_PARAMS' }
      });
    }

    const node = await getNodeById(nodeId);
    
    const updated = await updateNode(nodeId, { 
      due_date: dueDate || null 
    });

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: node.mindmap_id,
        user_id: userId,
        action: 'set_due_date',
        node_id: nodeId,
        details: { dueDate }
      });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('[Tasks] Due date update error:', error);
    next(error);
  }
});

/**
 * GET /api/tasks/user/:userId
 * Get all tasks assigned to a specific user
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, mindmapId } = req.query;

    let query = supabaseAdmin
      .from('nodes')
      .select('*, mindmaps(title)')
      .eq('assigned_to', userId)
      .not('status', 'is', null);

    if (status) {
      query = query.eq('status', status);
    }

    if (mindmapId) {
      query = query.eq('mindmap_id', mindmapId);
    }

    query = query.order('due_date', { ascending: true, nullsFirst: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[Tasks] Get user tasks error:', error);
    next(error);
  }
});

/**
 * GET /api/tasks/pending
 * Get all pending tasks (not done)
 */
router.get('/pending', async (req, res, next) => {
  try {
    const { mindmapId } = req.query;

    let query = supabaseAdmin
      .from('nodes')
      .select('*, users!assigned_to(id, name, avatar_url)')
      .in('status', ['todo', 'doing']);

    if (mindmapId) {
      query = query.eq('mindmap_id', mindmapId);
    }

    query = query.order('priority', { ascending: true })
                 .order('due_date', { ascending: true, nullsFirst: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[Tasks] Get pending tasks error:', error);
    next(error);
  }
});

module.exports = router;
