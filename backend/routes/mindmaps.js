const express = require('express');
const router = express.Router();
const { supabaseAdmin, logActivity } = require('../services/supabaseService');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/mindmaps
 * Get all mindmaps
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('mindmaps')
      .select('*, owner:users!owner_id(id, name, avatar_url), _count:nodes(count)')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Mindmaps] Get all error:', error);
    next(error);
  }
});

/**
 * GET /api/mindmaps/:id
 * Get a specific mindmap with all its nodes
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get mindmap info
    const { data: mindmap, error: mapError } = await supabaseAdmin
      .from('mindmaps')
      .select('*, owner:users!owner_id(id, name, avatar_url)')
      .eq('id', id)
      .single();

    if (mapError) throw mapError;

    // Get all nodes for this mindmap
    const { data: nodes, error: nodesError } = await supabaseAdmin
      .from('nodes')
      .select('*, assignee:users!assigned_to(id, name, avatar_url), creator:users!created_by(id, name)')
      .eq('mindmap_id', id)
      .order('order_index');

    if (nodesError) throw nodesError;

    // Get all cross-links for this mindmap's nodes
    const nodeIds = nodes.map(n => n.id);
    const { data: links, error: linksError } = await supabaseAdmin
      .from('node_links')
      .select('*')
      .or(`source_node_id.in.(${nodeIds.join(',')}),target_node_id.in.(${nodeIds.join(',')})`);

    res.json({
      success: true,
      data: {
        ...mindmap,
        nodes,
        links: links || []
      }
    });

  } catch (error) {
    console.error('[Mindmaps] Get by id error:', error);
    next(error);
  }
});

/**
 * POST /api/mindmaps
 * Create a new mindmap
 */
router.post('/', async (req, res, next) => {
  try {
    const { title, description, ownerId, createRootNode = true } = req.body;

    if (!title) {
      return res.status(400).json({
        error: { message: 'Title is required', code: 'MISSING_TITLE' }
      });
    }

    const mindmapId = uuidv4();

    // Create mindmap
    const { data: mindmap, error: mapError } = await supabaseAdmin
      .from('mindmaps')
      .insert({
        id: mindmapId,
        title,
        description: description || null,
        owner_id: ownerId || null,
        visibility: 'shared',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (mapError) throw mapError;

    // Create root node if requested
    let rootNode = null;
    if (createRootNode) {
      const { data: node, error: nodeError } = await supabaseAdmin
        .from('nodes')
        .insert({
          id: uuidv4(),
          mindmap_id: mindmapId,
          parent_id: null,
          content: title,
          type: 'idea',
          order_index: 0,
          created_by: ownerId || null,
          position_x: 0,
          position_y: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (nodeError) throw nodeError;
      rootNode = node;
    }

    // Log activity
    if (ownerId) {
      await logActivity({
        mindmap_id: mindmapId,
        user_id: ownerId,
        action: 'create_mindmap',
        details: { title }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...mindmap,
        rootNode
      }
    });

  } catch (error) {
    console.error('[Mindmaps] Create error:', error);
    next(error);
  }
});

/**
 * PUT /api/mindmaps/:id
 * Update a mindmap
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, visibility, userId } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (visibility !== undefined) updates.visibility = visibility;

    const { data, error } = await supabaseAdmin
      .from('mindmaps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: id,
        user_id: userId,
        action: 'update_mindmap',
        details: { updates: Object.keys(updates).filter(k => k !== 'updated_at') }
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Mindmaps] Update error:', error);
    next(error);
  }
});

/**
 * DELETE /api/mindmaps/:id
 * Delete a mindmap and all its nodes
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete all nodes first (or rely on cascade)
    await supabaseAdmin
      .from('nodes')
      .delete()
      .eq('mindmap_id', id);

    // Delete mindmap
    const { error } = await supabaseAdmin
      .from('mindmaps')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Mindmap deleted successfully'
    });

  } catch (error) {
    console.error('[Mindmaps] Delete error:', error);
    next(error);
  }
});

/**
 * GET /api/mindmaps/:id/activities
 * Get activity log for a mindmap
 */
router.get('/:id/activities', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*, user:users!user_id(id, name, avatar_url)')
      .eq('mindmap_id', id)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Mindmaps] Get activities error:', error);
    next(error);
  }
});

/**
 * GET /api/mindmaps/:id/stats
 * Get statistics for a mindmap
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get node counts by status
    const { data: nodes, error } = await supabaseAdmin
      .from('nodes')
      .select('status, assigned_to, type')
      .eq('mindmap_id', id);

    if (error) throw error;

    const stats = {
      totalNodes: nodes.length,
      byStatus: {
        todo: nodes.filter(n => n.status === 'todo').length,
        doing: nodes.filter(n => n.status === 'doing').length,
        done: nodes.filter(n => n.status === 'done').length,
        none: nodes.filter(n => !n.status).length
      },
      byType: {
        idea: nodes.filter(n => n.type === 'idea').length,
        task: nodes.filter(n => n.type === 'task').length,
        note: nodes.filter(n => n.type === 'note').length
      },
      assigned: nodes.filter(n => n.assigned_to).length,
      unassigned: nodes.filter(n => !n.assigned_to).length
    };

    // Calculate completion percentage
    const tasks = nodes.filter(n => n.status);
    stats.completionRate = tasks.length > 0 
      ? Math.round((stats.byStatus.done / tasks.length) * 100) 
      : 0;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[Mindmaps] Get stats error:', error);
    next(error);
  }
});

/**
 * POST /api/mindmaps/:id/duplicate
 * Duplicate a mindmap
 */
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newTitle, userId } = req.body;

    // Get original mindmap
    const { data: original, error: getError } = await supabaseAdmin
      .from('mindmaps')
      .select('*')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    // Create new mindmap
    const newMindmapId = uuidv4();
    const { data: newMindmap, error: createError } = await supabaseAdmin
      .from('mindmaps')
      .insert({
        id: newMindmapId,
        title: newTitle || `${original.title} (cópia)`,
        description: original.description,
        owner_id: userId || original.owner_id,
        visibility: original.visibility,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) throw createError;

    // Get all nodes from original
    const { data: originalNodes, error: nodesError } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('mindmap_id', id);

    if (nodesError) throw nodesError;

    // Create ID mapping for parent references
    const idMap = new Map();
    const newNodes = originalNodes.map(node => {
      const newId = uuidv4();
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        mindmap_id: newMindmapId,
        created_by: userId || node.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // Update parent_id references
    newNodes.forEach(node => {
      if (node.parent_id && idMap.has(node.parent_id)) {
        node.parent_id = idMap.get(node.parent_id);
      }
    });

    // Insert new nodes
    if (newNodes.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('nodes')
        .insert(newNodes);

      if (insertError) throw insertError;
    }

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: newMindmapId,
        user_id: userId,
        action: 'duplicate_mindmap',
        details: { originalId: id, nodesCount: newNodes.length }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...newMindmap,
        nodesCount: newNodes.length
      }
    });

  } catch (error) {
    console.error('[Mindmaps] Duplicate error:', error);
    next(error);
  }
});

module.exports = router;
