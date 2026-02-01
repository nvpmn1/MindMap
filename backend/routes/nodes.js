const express = require('express');
const router = express.Router();
const { supabaseAdmin, createNode, updateNode, deleteNode, getNodeById, logActivity } = require('../services/supabaseService');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/nodes/:nodeId
 * Get a specific node by ID
 */
router.get('/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .select('*, users!assigned_to(id, name, avatar_url), creator:users!created_by(id, name)')
      .eq('id', nodeId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Nodes] Get node error:', error);
    next(error);
  }
});

/**
 * POST /api/nodes
 * Create a new node
 */
router.post('/', async (req, res, next) => {
  try {
    const { 
      mindmapId, 
      parentId, 
      content, 
      description,
      type = 'idea',
      userId,
      position
    } = req.body;

    if (!mindmapId || !content) {
      return res.status(400).json({
        error: { message: 'mindmapId and content are required', code: 'MISSING_PARAMS' }
      });
    }

    // Get max order_index for siblings
    const { data: siblings } = await supabaseAdmin
      .from('nodes')
      .select('order_index')
      .eq('mindmap_id', mindmapId)
      .eq('parent_id', parentId || null)
      .order('order_index', { ascending: false })
      .limit(1);

    const orderIndex = siblings && siblings.length > 0 ? siblings[0].order_index + 1 : 0;

    const nodeData = {
      id: uuidv4(),
      mindmap_id: mindmapId,
      parent_id: parentId || null,
      content,
      description: description || null,
      type,
      order_index: orderIndex,
      created_by: userId || null,
      position_x: position?.x || null,
      position_y: position?.y || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const node = await createNode(nodeData);

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: mindmapId,
        user_id: userId,
        action: 'create_node',
        node_id: node.id,
        details: { content, type }
      });
    }

    res.status(201).json({
      success: true,
      data: node
    });

  } catch (error) {
    console.error('[Nodes] Create node error:', error);
    next(error);
  }
});

/**
 * PUT /api/nodes/:nodeId
 * Update a node
 */
router.put('/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { content, description, type, position, userId, color } = req.body;

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (color !== undefined) updates.color = color;
    if (position) {
      updates.position_x = position.x;
      updates.position_y = position.y;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: { message: 'No updates provided', code: 'NO_UPDATES' }
      });
    }

    const node = await updateNode(nodeId, updates);

    // Log activity
    if (userId) {
      const originalNode = await getNodeById(nodeId);
      await logActivity({
        mindmap_id: originalNode.mindmap_id,
        user_id: userId,
        action: 'update_node',
        node_id: nodeId,
        details: { updates: Object.keys(updates) }
      });
    }

    res.json({
      success: true,
      data: node
    });

  } catch (error) {
    console.error('[Nodes] Update node error:', error);
    next(error);
  }
});

/**
 * DELETE /api/nodes/:nodeId
 * Delete a node and its children
 */
router.delete('/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { userId } = req.query;

    // Get node info before deleting
    const node = await getNodeById(nodeId);

    // Delete node (children will be deleted via cascade or need separate handling)
    // First, recursively delete children
    const deleteRecursive = async (parentId) => {
      const { data: children } = await supabaseAdmin
        .from('nodes')
        .select('id')
        .eq('parent_id', parentId);

      for (const child of children || []) {
        await deleteRecursive(child.id);
        await deleteNode(child.id);
      }
    };

    await deleteRecursive(nodeId);
    await deleteNode(nodeId);

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: node.mindmap_id,
        user_id: userId,
        action: 'delete_node',
        node_id: nodeId,
        details: { content: node.content }
      });
    }

    res.json({
      success: true,
      message: 'Node deleted successfully'
    });

  } catch (error) {
    console.error('[Nodes] Delete node error:', error);
    next(error);
  }
});

/**
 * POST /api/nodes/:nodeId/move
 * Move a node to a new parent
 */
router.post('/:nodeId/move', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { newParentId, orderIndex, userId } = req.body;

    const node = await getNodeById(nodeId);

    const updates = {
      parent_id: newParentId || null
    };

    if (orderIndex !== undefined) {
      updates.order_index = orderIndex;
    }

    const updated = await updateNode(nodeId, updates);

    // Log activity
    if (userId) {
      await logActivity({
        mindmap_id: node.mindmap_id,
        user_id: userId,
        action: 'move_node',
        node_id: nodeId,
        details: { newParentId, orderIndex }
      });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('[Nodes] Move node error:', error);
    next(error);
  }
});

/**
 * POST /api/nodes/:nodeId/link
 * Create a cross-link between two nodes
 */
router.post('/:nodeId/link', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { targetNodeId, userId } = req.body;

    if (!targetNodeId) {
      return res.status(400).json({
        error: { message: 'targetNodeId is required', code: 'MISSING_PARAMS' }
      });
    }

    // Create link in node_links table
    const { data, error } = await supabaseAdmin
      .from('node_links')
      .insert({
        id: uuidv4(),
        source_node_id: nodeId,
        target_node_id: targetNodeId,
        created_by: userId || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (userId) {
      const node = await getNodeById(nodeId);
      await logActivity({
        mindmap_id: node.mindmap_id,
        user_id: userId,
        action: 'create_link',
        node_id: nodeId,
        details: { targetNodeId }
      });
    }

    res.status(201).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Nodes] Create link error:', error);
    next(error);
  }
});

/**
 * GET /api/nodes/:nodeId/children
 * Get all children of a node
 */
router.get('/:nodeId/children', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { recursive } = req.query;

    const { data, error } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('parent_id', nodeId)
      .order('order_index');

    if (error) throw error;

    // If recursive, get all descendants
    if (recursive === 'true') {
      const getAllDescendants = async (nodes) => {
        const result = [...nodes];
        for (const node of nodes) {
          const { data: children } = await supabaseAdmin
            .from('nodes')
            .select('*')
            .eq('parent_id', node.id)
            .order('order_index');
          
          if (children && children.length > 0) {
            result.push(...await getAllDescendants(children));
          }
        }
        return result;
      };

      const allDescendants = await getAllDescendants(data);
      return res.json({
        success: true,
        data: allDescendants
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Nodes] Get children error:', error);
    next(error);
  }
});

/**
 * POST /api/nodes/bulk
 * Create multiple nodes at once (useful for AI-generated structures)
 */
router.post('/bulk', async (req, res, next) => {
  try {
    const { nodes, mindmapId, userId } = req.body;

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({
        error: { message: 'nodes array is required', code: 'MISSING_PARAMS' }
      });
    }

    // Prepare nodes with IDs and timestamps
    const preparedNodes = nodes.map((node, index) => ({
      id: node.id || uuidv4(),
      mindmap_id: node.mindmap_id || mindmapId,
      parent_id: node.parent_id || null,
      content: node.content,
      description: node.description || null,
      type: node.type || 'idea',
      status: node.status || null,
      priority: node.priority || null,
      order_index: node.order_index ?? index,
      created_by: userId || null,
      position_x: node.position_x || null,
      position_y: node.position_y || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabaseAdmin
      .from('nodes')
      .insert(preparedNodes)
      .select();

    if (error) throw error;

    // Log activity
    if (userId && mindmapId) {
      await logActivity({
        mindmap_id: mindmapId,
        user_id: userId,
        action: 'bulk_create_nodes',
        details: { count: data.length }
      });
    }

    res.status(201).json({
      success: true,
      data,
      count: data.length
    });

  } catch (error) {
    console.error('[Nodes] Bulk create error:', error);
    next(error);
  }
});

module.exports = router;
