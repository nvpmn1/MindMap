import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChatPanel } from './RightPanel';
import { FormDialog } from '@/components/ui';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed,
    aiChatOpen,
    setAIChatOpen,
  } = useUIStore();
  
  const [newMapDialogOpen, setNewMapDialogOpen] = React.useState(false);
  const [newMapName, setNewMapName] = React.useState('');
  const [newMapDescription, setNewMapDescription] = React.useState('');
  const [isCreatingMap, setIsCreatingMap] = React.useState(false);

  const handleNewMap = () => {
    setNewMapDialogOpen(true);
  };

  const handleCreateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;

    setIsCreatingMap(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would call the API and get the new map ID
    const newMapId = 'new-map-' + Date.now();
    
    setIsCreatingMap(false);
    setNewMapDialogOpen(false);
    setNewMapName('');
    setNewMapDescription('');
    
    // Navigate to the new map
    navigate(`/map/${newMapId}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onNewMap={handleNewMap}
      />

      {/* Main Content Area */}
      <div className={cn(
        'flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300',
        aiChatOpen && 'mr-96'
      )}>
        {/* Render children or Outlet */}
        <main className="flex-1">
          {children || <Outlet />}
        </main>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel 
        open={aiChatOpen} 
        onClose={() => setAIChatOpen(false)} 
      />

      {/* New Map Dialog */}
      <FormDialog
        open={newMapDialogOpen}
        onOpenChange={setNewMapDialogOpen}
        title="Criar Novo Mapa"
        description="Dê um nome ao seu novo mapa mental. Você pode adicionar mais detalhes depois."
        onSubmit={handleCreateMap}
        submitText="Criar Mapa"
        loading={isCreatingMap}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="map-name" className="text-sm font-medium">
              Nome do Mapa *
            </label>
            <input
              id="map-name"
              type="text"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              placeholder="Ex: Brainstorm Projeto X"
              className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="map-description" className="text-sm font-medium">
              Descrição (opcional)
            </label>
            <textarea
              id="map-description"
              value={newMapDescription}
              onChange={(e) => setNewMapDescription(e.target.value)}
              placeholder="Descreva o objetivo deste mapa..."
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}

// Auth Layout - for login/signup pages
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <span className="font-bold text-2xl">MindMap Hub</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-xl border shadow-lg p-6">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2024 MindMap Hub Cooperativo. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

// Minimal Layout - for map editor (no sidebar)
interface MinimalLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function MinimalLayout({ children, header }: MinimalLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {header}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
