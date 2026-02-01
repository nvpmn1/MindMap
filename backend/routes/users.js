const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabaseService');

/**
 * GET /api/users
 * Get all users
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Users] Get all error:', error);
    next(error);
  }
});

/**
 * GET /api/users/:id
 * Get a specific user
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Users] Get by id error:', error);
    next(error);
  }
});

/**
 * PUT /api/users/:id
 * Update a user's profile
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, avatar_url, title, expertise } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (title !== undefined) updates.title = title;
    if (expertise !== undefined) updates.expertise = expertise;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: { message: 'No updates provided', code: 'NO_UPDATES' }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Users] Update error:', error);
    next(error);
  }
});

/**
 * GET /api/users/:id/tasks
 * Get all tasks assigned to a user
 */
router.get('/:id/tasks', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('nodes')
      .select('*, mindmap:mindmaps!mindmap_id(id, title)')
      .eq('assigned_to', id)
      .not('status', 'is', null);

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: true })
      .limit(parseInt(limit));

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Users] Get tasks error:', error);
    next(error);
  }
});

/**
 * GET /api/users/:id/activities
 * Get activity log for a user
 */
router.get('/:id/activities', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*, mindmap:mindmaps!mindmap_id(id, title)')
      .eq('user_id', id)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Users] Get activities error:', error);
    next(error);
  }
});

/**
 * GET /api/users/:id/stats
 * Get statistics for a user
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get all tasks assigned to user
    const { data: tasks, error } = await supabaseAdmin
      .from('nodes')
      .select('status, priority')
      .eq('assigned_to', id)
      .not('status', 'is', null);

    if (error) throw error;

    const stats = {
      totalTasks: tasks.length,
      byStatus: {
        todo: tasks.filter(t => t.status === 'todo').length,
        doing: tasks.filter(t => t.status === 'doing').length,
        done: tasks.filter(t => t.status === 'done').length
      },
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
        : 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[Users] Get stats error:', error);
    next(error);
  }
});

module.exports = router;
