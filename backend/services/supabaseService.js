const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

// Admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anon client for public operations
const supabaseAnon = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);

module.exports = {
  supabaseAdmin,
  supabaseAnon,
  
  // Helper functions for common operations
  async getNodeById(nodeId) {
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('id', nodeId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getNodeChildren(nodeId) {
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('parent_id', nodeId)
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async getNodeSiblings(nodeId, parentId) {
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('parent_id', parentId)
      .neq('id', nodeId)
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async getMindmapNodes(mindmapId) {
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('mindmap_id', mindmapId)
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async createNode(nodeData) {
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .insert(nodeData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateNode(nodeId, updates) {
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', nodeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteNode(nodeId) {
    const { error } = await supabaseAdmin
      .from('nodes')
      .delete()
      .eq('id', nodeId);
    
    if (error) throw error;
    return true;
  },

  async getUserById(userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async logActivity(activityData) {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert({
        ...activityData,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging shouldn't break main flow
    }
    return data;
  }
};
