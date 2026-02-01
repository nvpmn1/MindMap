import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Sidebar, 
  TopBar, 
  HomePage,
  MindmapCanvas, 
  KanbanBoard, 
  TaskListView,
  AIChatBot,
  NodeDetailsPanel,
  DatabaseSetup
} from './components';
import { useViewStore, useMindmapStore, useUserStore, useNotificationStore } from './store';
import { usersAPI, mindmapsAPI, nodesAPI } from './lib/api';
import { subscribeToNodes, subscribeToPresence } from './lib/supabase';

function App() {
  const [databaseReady, setDatabaseReady] = useState(false);
  const { currentView, detailsPanelNodeId } = useViewStore();
  const { 
    currentMindmap, 
    setNodes, 
    setMindmaps, 
    setCurrentMindmap,
    addNode, 
    updateNode, 
    removeNode,
    setOnlineUsers
  } = useMindmapStore();
  const { currentUser, setUsers } = useUserStore();
  const { addNotification } = useNotificationStore();

  // Check database on mount
  useEffect(() => {
    // Check if user skipped setup or database is ready
    const skipped = localStorage.getItem('skipDatabaseSetup');
    const ready = localStorage.getItem('databaseReady');
    
    if (skipped || ready) {
      setDatabaseReady(true);
      return;
    }

    const checkDB = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/setup/status', {
          signal: AbortSignal.timeout(5000)
        });
        const data = await res.json();
        if (data.summary?.ready) {
          setDatabaseReady(true);
          localStorage.setItem('databaseReady', 'true');
        }
      } catch {
        // Database might not be ready - user can skip
      }
    };
    
    checkDB();

    // Listen for storage changes (when DatabaseSetup completes)
    const handleStorageChange = () => {
      const ready = localStorage.getItem('databaseReady');
      const skipped = localStorage.getItem('skipDatabaseSetup');
      if (ready || skipped) {
        setDatabaseReady(true);
      }
    };

    // Listen for both cross-tab and same-tab storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also check immediately after setup
    const interval = setInterval(() => {
      const ready = localStorage.getItem('databaseReady');
      const skipped = localStorage.getItem('skipDatabaseSetup');
      if (ready || skipped) {
        setDatabaseReady(true);
        clearInterval(interval);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Initialize app data
  useEffect(() => {
    if (!databaseReady) return;
    const initializeApp = async () => {
      try {
        // Load users
        const usersResult = await usersAPI.getAll();
        if (usersResult.data) {
          setUsers(usersResult.data);
        }

        // Load mindmaps
        const mindmapsResult = await mindmapsAPI.getAll();
        if (mindmapsResult.data?.length > 0) {
          setMindmaps(mindmapsResult.data);
          // Set first mindmap as current if none selected
          if (!currentMindmap) {
            setCurrentMindmap(mindmapsResult.data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        addNotification({
          type: 'warning',
          message: 'Não foi possível conectar ao servidor. Verifique sua conexão.'
        });
      }
    };

    initializeApp();
  }, [databaseReady]);

  // Load nodes when mindmap changes
  useEffect(() => {
    if (!currentMindmap?.id) return;

    const loadNodes = async () => {
      try {
        const result = await nodesAPI.getByMindmap(currentMindmap.id);
        if (result.data) {
          setNodes(result.data);
        }
      } catch (error) {
        console.error('Failed to load nodes:', error);
      }
    };

    loadNodes();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToNodes(currentMindmap.id, {
      onInsert: (newNode) => {
        addNode(newNode);
        if (newNode.created_by !== currentUser?.id) {
          addNotification({
            type: 'info',
            message: `Nova ideia adicionada: "${newNode.content}"`
          });
        }
      },
      onUpdate: (updatedNode) => {
        updateNode(updatedNode.id, updatedNode);
      },
      onDelete: (deletedNode) => {
        removeNode(deletedNode.id);
      }
    });

    return () => unsubscribe?.();
  }, [currentMindmap?.id]);

  // Subscribe to presence when user is logged in
  useEffect(() => {
    if (!currentUser?.id || !currentMindmap?.id) return;

    const unsubscribe = subscribeToPresence(
      currentMindmap.id,
      currentUser.id,
      (presenceState) => {
        const userIds = Object.keys(presenceState);
        setOnlineUsers(userIds);
      }
    );

    return () => unsubscribe?.();
  }, [currentUser?.id, currentMindmap?.id]);

  // Render current view
  const renderView = () => {
    // If no user selected, show home
    if (!currentUser) {
      return <HomePage />;
    }

    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'mindmap':
        return <MindmapCanvas />;
      case 'kanban':
        return <KanbanBoard />;
      case 'list':
        return <TaskListView />;
      default:
        return <MindmapCanvas />;
    }
  };

  // If no user, show full-page home
  if (!currentUser) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {!databaseReady && <DatabaseSetup />}
        <HomePage />
        <AIChatBot />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </main>
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {detailsPanelNodeId && <NodeDetailsPanel />}
      </AnimatePresence>

      {/* AI Chat Bot */}
      <AIChatBot />
    </div>
  );
}

export default App;
