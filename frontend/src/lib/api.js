const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with error handling
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Try to parse JSON
    let data;
    try {
      data = await response.json();
    } catch {
      data = { error: 'Invalid JSON response' };
    }

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.error || 'API request failed';
      console.error(`API Error [${endpoint}]:`, errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    // Return a standardized error response instead of throwing
    return { 
      error: true, 
      message: error.message,
      data: null 
    };
  }
}

// AI API calls
export const aiAPI = {
  generateMap: async (prompt, options = {}) => {
    return fetchAPI('/ai/generate-map', {
      method: 'POST',
      body: JSON.stringify({ prompt, ...options }),
    });
  },

  expandNode: async (nodeId, nodeContent, context = {}) => {
    return fetchAPI('/ai/expand-node', {
      method: 'POST',
      body: JSON.stringify({ nodeId, nodeContent, context }),
    });
  },

  summarize: async (content, options = {}) => {
    return fetchAPI('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ content, ...options }),
    });
  },

  chat: async (message, context = {}) => {
    return fetchAPI('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, ...context }),
    });
  },

  suggestTasks: async (mindmapId, options = {}) => {
    return fetchAPI('/ai/suggest-tasks', {
      method: 'POST',
      body: JSON.stringify({ mindmapId, ...options }),
    });
  },

  analyze: async (mindmapId, options = {}) => {
    return fetchAPI('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ mindmapId, ...options }),
    });
  },
};

// Tasks API calls
export const tasksAPI = {
  assign: async (nodeId, userId, assignedBy) => {
    return fetchAPI('/tasks/assign', {
      method: 'POST',
      body: JSON.stringify({ nodeId, userId, assignedBy }),
    });
  },

  unassign: async (nodeId, userId) => {
    return fetchAPI('/tasks/unassign', {
      method: 'POST',
      body: JSON.stringify({ nodeId, userId }),
    });
  },

  updateStatus: async (nodeId, status, userId) => {
    return fetchAPI('/tasks/status', {
      method: 'POST',
      body: JSON.stringify({ nodeId, status, userId }),
    });
  },

  updatePriority: async (nodeId, priority, userId) => {
    return fetchAPI('/tasks/priority', {
      method: 'POST',
      body: JSON.stringify({ nodeId, priority, userId }),
    });
  },

  setDueDate: async (nodeId, dueDate, userId) => {
    return fetchAPI('/tasks/due-date', {
      method: 'POST',
      body: JSON.stringify({ nodeId, dueDate, userId }),
    });
  },

  getUserTasks: async (userId, options = {}) => {
    const params = new URLSearchParams(options).toString();
    return fetchAPI(`/tasks/user/${userId}${params ? `?${params}` : ''}`);
  },

  getPending: async (mindmapId) => {
    const params = mindmapId ? `?mindmapId=${mindmapId}` : '';
    return fetchAPI(`/tasks/pending${params}`);
  },
};

// Nodes API calls
export const nodesAPI = {
  get: async (nodeId) => {
    return fetchAPI(`/nodes/${nodeId}`);
  },

  create: async (nodeData) => {
    return fetchAPI('/nodes', {
      method: 'POST',
      body: JSON.stringify(nodeData),
    });
  },

  update: async (nodeId, updates) => {
    return fetchAPI(`/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (nodeId, userId) => {
    const params = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/nodes/${nodeId}${params}`, {
      method: 'DELETE',
    });
  },

  move: async (nodeId, newParentId, orderIndex, userId) => {
    return fetchAPI(`/nodes/${nodeId}/move`, {
      method: 'POST',
      body: JSON.stringify({ newParentId, orderIndex, userId }),
    });
  },

  link: async (nodeId, targetNodeId, userId) => {
    return fetchAPI(`/nodes/${nodeId}/link`, {
      method: 'POST',
      body: JSON.stringify({ targetNodeId, userId }),
    });
  },

  getChildren: async (nodeId, recursive = false) => {
    return fetchAPI(`/nodes/${nodeId}/children?recursive=${recursive}`);
  },

  bulkCreate: async (nodes, mindmapId, userId) => {
    return fetchAPI('/nodes/bulk', {
      method: 'POST',
      body: JSON.stringify({ nodes, mindmapId, userId }),
    });
  },
};

// Mindmaps API calls
export const mindmapsAPI = {
  getAll: async () => {
    return fetchAPI('/mindmaps');
  },

  get: async (id) => {
    return fetchAPI(`/mindmaps/${id}`);
  },

  create: async (title, description, ownerId) => {
    return fetchAPI('/mindmaps', {
      method: 'POST',
      body: JSON.stringify({ title, description, ownerId }),
    });
  },

  update: async (id, updates) => {
    return fetchAPI(`/mindmaps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id) => {
    return fetchAPI(`/mindmaps/${id}`, {
      method: 'DELETE',
    });
  },

  getActivities: async (id, limit = 50) => {
    return fetchAPI(`/mindmaps/${id}/activities?limit=${limit}`);
  },

  getStats: async (id) => {
    return fetchAPI(`/mindmaps/${id}/stats`);
  },

  duplicate: async (id, newTitle, userId) => {
    return fetchAPI(`/mindmaps/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ newTitle, userId }),
    });
  },
};

// Users API calls
export const usersAPI = {
  getAll: async () => {
    return fetchAPI('/users');
  },

  get: async (id) => {
    return fetchAPI(`/users/${id}`);
  },

  update: async (id, updates) => {
    return fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  getTasks: async (id, options = {}) => {
    const params = new URLSearchParams(options).toString();
    return fetchAPI(`/users/${id}/tasks${params ? `?${params}` : ''}`);
  },

  getActivities: async (id, limit = 50) => {
    return fetchAPI(`/users/${id}/activities?limit=${limit}`);
  },

  getStats: async (id) => {
    return fetchAPI(`/users/${id}/stats`);
  },
};

export default {
  ai: aiAPI,
  tasks: tasksAPI,
  nodes: nodesAPI,
  mindmaps: mindmapsAPI,
  users: usersAPI,
};
