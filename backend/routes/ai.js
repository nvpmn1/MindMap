const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { getMindmapNodes, getNodeById, getNodeSiblings, createNode, logActivity } = require('../services/supabaseService');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/ai/generate-map
 * Generate a complete mind map from a prompt
 */
router.post('/generate-map', async (req, res, next) => {
  try {
    const { prompt, mindmapId, userId, options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: { message: 'Prompt is required', code: 'MISSING_PROMPT' } 
      });
    }

    console.log(`[AI] Generating map for prompt: "${prompt.substring(0, 50)}..."`);

    // Generate structure from AI
    const structure = await aiService.generateMap(prompt, options);

    // If mindmapId provided, create nodes in database
    let createdNodes = [];
    if (mindmapId) {
      // Convert AI structure to flat nodes
      const flattenNodes = (items, parentId = null, depth = 0) => {
        const nodes = [];
        items.forEach((item, index) => {
          const nodeId = uuidv4();
          nodes.push({
            id: nodeId,
            mindmap_id: mindmapId,
            parent_id: parentId,
            content: item.content,
            description: item.description || null,
            order_index: index,
            created_by: userId || null,
            type: 'idea',
            status: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          if (item.children && item.children.length > 0) {
            nodes.push(...flattenNodes(item.children, nodeId, depth + 1));
          }
        });
        return nodes;
      };

      createdNodes = flattenNodes(structure);
      
      // Log activity
      if (userId) {
        await logActivity({
          mindmap_id: mindmapId,
          user_id: userId,
          action: 'ai_generate_map',
          node_id: null,
          details: { prompt, nodesCreated: createdNodes.length }
        });
      }
    }

    res.json({
      success: true,
      data: {
        structure,
        nodes: createdNodes,
        prompt
      }
    });

  } catch (error) {
    console.error('[AI] Generate map error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/expand-node
 * Generate suggestions to expand a specific node
 */
router.post('/expand-node', async (req, res, next) => {
  try {
    const { nodeId, nodeContent, context = {}, userId, mindmapId } = req.body;

    if (!nodeContent && !nodeId) {
      return res.status(400).json({ 
        error: { message: 'nodeContent or nodeId is required', code: 'MISSING_CONTENT' } 
      });
    }

    let content = nodeContent;
    let enhancedContext = { ...context };

    // If nodeId provided, fetch node and context from database
    if (nodeId) {
      const node = await getNodeById(nodeId);
      content = node.content;
      
      // Get siblings for context
      if (node.parent_id) {
        const siblings = await getNodeSiblings(nodeId, node.parent_id);
        enhancedContext.siblings = siblings.map(s => s.content);
        
        // Get parent content
        const parent = await getNodeById(node.parent_id);
        enhancedContext.parentContent = parent.content;
      }
    }

    console.log(`[AI] Expanding node: "${content}"`);

    // Generate suggestions
    const suggestions = await aiService.expandNode(content, enhancedContext);

    // Log activity
    if (userId && mindmapId) {
      await logActivity({
        mindmap_id: mindmapId,
        user_id: userId,
        action: 'ai_expand_node',
        node_id: nodeId || null,
        details: { suggestionsCount: suggestions.length }
      });
    }

    res.json({
      success: true,
      data: {
        suggestions,
        sourceNode: content
      }
    });

  } catch (error) {
    console.error('[AI] Expand node error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/summarize
 * Summarize nodes, text, or attachments
 */
router.post('/summarize', async (req, res, next) => {
  try {
    const { content, type = 'text', title, mindmapId, userId } = req.body;

    if (!content) {
      return res.status(400).json({ 
        error: { message: 'Content is required', code: 'MISSING_CONTENT' } 
      });
    }

    // If summarizing a mindmap, fetch all nodes
    let contentToSummarize = content;
    if (type === 'mindmap' && mindmapId) {
      const nodes = await getMindmapNodes(mindmapId);
      contentToSummarize = nodes;
    }

    console.log(`[AI] Summarizing ${type} content`);

    const summary = await aiService.summarize(contentToSummarize, { type, title });

    // Log activity
    if (userId && mindmapId) {
      await logActivity({
        mindmap_id: mindmapId,
        user_id: userId,
        action: 'ai_summarize',
        details: { type, title }
      });
    }

    res.json({
      success: true,
      data: {
        summary,
        type
      }
    });

  } catch (error) {
    console.error('[AI] Summarize error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/chat
 * Chat with the AI assistant
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { message, history = [], mapContext, currentUser, mindmapId } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: { message: 'Message is required', code: 'MISSING_MESSAGE' } 
      });
    }

    // Build map context if mindmapId provided
    let enrichedMapContext = mapContext;
    if (mindmapId && !mapContext) {
      const nodes = await getMindmapNodes(mindmapId);
      const topLevelNodes = nodes.filter(n => !n.parent_id);
      enrichedMapContext = `Mapa com ${nodes.length} nós. Tópicos principais: ${topLevelNodes.map(n => n.content).join(', ')}`;
    }

    console.log(`[AI] Chat message from ${currentUser || 'user'}: "${message.substring(0, 50)}..."`);

    const response = await aiService.chat(message, {
      history,
      mapContext: enrichedMapContext,
      currentUser
    });

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[AI] Chat error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/suggest-tasks
 * Suggest tasks based on project context
 */
router.post('/suggest-tasks', async (req, res, next) => {
  try {
    const { mindmapId, projectContext, existingTasks = [], users = [] } = req.body;

    let context = projectContext;
    
    // Build context from mindmap if needed
    if (mindmapId && !projectContext) {
      const nodes = await getMindmapNodes(mindmapId);
      context = nodes.map(n => `- ${n.content}${n.status ? ` [${n.status}]` : ''}`).join('\n');
    }

    if (!context) {
      return res.status(400).json({ 
        error: { message: 'Project context or mindmapId is required', code: 'MISSING_CONTEXT' } 
      });
    }

    console.log(`[AI] Suggesting tasks for project`);

    const tasks = await aiService.suggestTasks(context, { existingTasks, users });

    res.json({
      success: true,
      data: {
        suggestions: tasks
      }
    });

  } catch (error) {
    console.error('[AI] Suggest tasks error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/analyze
 * Analyze project for insights
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { mindmapId, includeRisks = true, includeSuggestions = true } = req.body;

    if (!mindmapId) {
      return res.status(400).json({ 
        error: { message: 'mindmapId is required', code: 'MISSING_MINDMAP' } 
      });
    }

    const nodes = await getMindmapNodes(mindmapId);
    
    console.log(`[AI] Analyzing project with ${nodes.length} nodes`);

    const analysis = await aiService.analyzeProject(nodes, {
      includeRisks,
      includeSuggestions
    });

    res.json({
      success: true,
      data: {
        analysis,
        nodesAnalyzed: nodes.length
      }
    });

  } catch (error) {
    console.error('[AI] Analyze error:', error);
    next(error);
  }
});

module.exports = router;
