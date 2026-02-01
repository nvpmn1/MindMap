// ============================================================================
// MindMap Hub - Map Editor Page
// ============================================================================
// Editor principal de mapas mentais com canvas React Flow
// Suporta múltiplas visualizações: Mapa, Kanban, Lista
// ============================================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Map as MapIcon,
  List,
  LayoutGrid,
  Cloud,
  CloudOff,
  Users,
  Settings,
  Share2,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  X
} from 'lucide-react'
import { useMapStore } from '@/stores/mapStore'
import { useNodeStore } from '@/stores/nodeStore'
import { useCollaborationStore } from '@/stores/collaborationStore'
import { useAuthStore } from '@/stores/authStore'
import { MinimalLayout } from '@/components/layout'
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas'
import { KanbanView } from '@/components/views/KanbanView'
import { ListView } from '@/components/views/ListView'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getInitials } from '@/lib/utils'
import type { ViewMode } from '@/types'

// ============================================================================
// Types
// ============================================================================

type RightPanelView = 'none' | 'details' | 'ai' | 'settings'

// ============================================================================
// Collaborator Cursor Component
// ============================================================================

interface CollaboratorCursor {
  userId: string
  userName: string
  color: string
  x: number
  y: number
}

function CollaboratorCursors({ cursors }: { cursors: CollaboratorCursor[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              left: cursor.x,
              top: cursor.y,
              position: 'absolute'
            }}
            className="flex items-start gap-1"
          >
            {/* Cursor */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={{ color: cursor.color }}
            >
              <path
                d="M2.5 2.5L17.5 10L10 10L7.5 17.5L2.5 2.5Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            {/* Name Tag */}
            <div
              className="px-2 py-0.5 rounded text-xs text-white font-medium whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.userName}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// Map Editor Header
// ============================================================================

interface EditorHeaderProps {
  mapName: string
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  isSaving: boolean
  isOnline: boolean
  collaborators: Array<{ user_id: string; user?: { name?: string; avatar_url?: string } }>
  onBack: () => void
  onShare: () => void
  onSettings: () => void
  onAI: () => void
  rightPanelView: RightPanelView
}

function EditorHeader({
  mapName,
  viewMode,
  onViewModeChange,
  isSaving,
  isOnline,
  collaborators,
  onBack,
  onShare,
  onSettings,
  onAI,
  rightPanelView
}: EditorHeaderProps) {
  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4 shrink-0">
      {/* Back Button */}
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" />
      </Button>

      {/* Map Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <h1 className="font-semibold truncate">{mapName}</h1>
        
        {/* Save Status */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : isOnline ? (
            <>
              <Cloud className="w-3 h-3 text-success" />
              <span className="text-success">Salvo</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3 h-3 text-warning" />
              <span className="text-warning">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
        <TabsList className="h-9">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="map" className="h-7 px-3">
                  <MapIcon className="w-4 h-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Mapa Mental</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="kanban" className="h-7 px-3">
                  <LayoutGrid className="w-4 h-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Kanban</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="list" className="h-7 px-3">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Lista</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsList>
      </Tabs>

      {/* Collaborators */}
      {collaborators.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {collaborators.slice(0, 4).map((collab) => (
              <TooltipProvider key={collab.user_id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="w-7 h-7 border-2 border-background ring-2 ring-success">
                      <AvatarImage src={collab.user?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(collab.user?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    {collab.user?.name || 'Usuário'} - Online
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {collaborators.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                +{collaborators.length - 4}
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {collaborators.length} online
          </Badge>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={rightPanelView === 'ai' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={onAI}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Assistente IA</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Compartilhar</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={rightPanelView === 'settings' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={onSettings}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configurações</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}

// ============================================================================
// Map Editor Page Component
// ============================================================================

export function MapEditorPage() {
  const { mapId } = useParams<{ mapId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const {
    currentMap,
    isLoading: mapLoading,
    error: mapError,
    fetchMapById
  } = useMapStore()

  const {
    nodes,
    selectedNodeId,
    isLoading: nodesLoading,
    fetchNodes,
    setSelectedNode
  } = useNodeStore()

  const {
    isConnected,
    cursors,
    connect,
    disconnect,
    broadcastCursor
  } = useCollaborationStore()

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('none')
  const [isSaving] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Selected node
  const selectedNode = selectedNodeId 
    ? nodes.find(n => n.id === selectedNodeId) 
    : null

  // Fetch map and nodes
  useEffect(() => {
    if (mapId) {
      fetchMapById(mapId)
      fetchNodes(mapId)
    }
  }, [mapId, fetchMapById, fetchNodes])

  // Connect to real-time collaboration
  useEffect(() => {
    if (mapId && user) {
      connect(mapId, user.id, user.name || 'Anônimo', user.avatar_url)
      return () => disconnect()
    }
  }, [mapId, user, connect, disconnect])

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Track cursor position for collaboration
  useEffect(() => {
    if (!isConnected) return

    const handleMouseMove = (e: MouseEvent) => {
      broadcastCursor(e.clientX, e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isConnected, broadcastCursor])

  // Open node details when selected
  useEffect(() => {
    if (selectedNodeId && rightPanelView === 'none') {
      setRightPanelView('details')
    }
  }, [selectedNodeId])

  // Handlers
  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleShare = () => {
    // TODO: Open share modal
    console.log('Open share modal')
  }

  const handleSettings = () => {
    setRightPanelView(rightPanelView === 'settings' ? 'none' : 'settings')
  }

  const handleAI = () => {
    setRightPanelView(rightPanelView === 'ai' ? 'none' : 'ai')
  }

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNode(nodeId)
    if (nodeId) {
      setRightPanelView('details')
    }
  }

  const handleCloseRightPanel = () => {
    setRightPanelView('none')
    setSelectedNode(null)
  }

  // Format cursors for display
  const formattedCursors: CollaboratorCursor[] = Object.entries(cursors)
    .filter(([id]) => id !== user?.id)
    .map(([userId, cursor]) => ({
      userId,
      userName: cursor.userName,
      color: cursor.color,
      x: cursor.x,
      y: cursor.y
    }))

  // Loading state
  if (mapLoading || nodesLoading) {
    return (
      <MinimalLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      </MinimalLayout>
    )
  }

  // Error state
  if (mapError || !currentMap) {
    return (
      <MinimalLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Mapa não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              {mapError || 'O mapa que você está procurando não existe ou você não tem permissão para acessá-lo.'}
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </MinimalLayout>
    )
  }

  return (
    <MinimalLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <EditorHeader
          mapName={currentMap.name}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isSaving={isSaving}
          isOnline={isOnline}
          collaborators={currentMap.collaborators || []}
          onBack={handleBack}
          onShare={handleShare}
          onSettings={handleSettings}
          onAI={handleAI}
          rightPanelView={rightPanelView}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Canvas Area */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {viewMode === 'map' && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <MindMapCanvas
                    onNodeSelect={handleNodeSelect}
                  />
                </motion.div>
              )}

              {viewMode === 'kanban' && (
                <motion.div
                  key="kanban"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 overflow-auto"
                >
                  <KanbanView
                    onNodeSelect={handleNodeSelect}
                  />
                </motion.div>
              )}

              {viewMode === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 overflow-auto p-4"
                >
                  <ListView
                    onNodeSelect={handleNodeSelect}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel */}
          <AnimatePresence>
            {rightPanelView !== 'none' && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 360, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l bg-background overflow-hidden flex flex-col"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold text-sm">
                    {rightPanelView === 'details' && 'Detalhes do Nó'}
                    {rightPanelView === 'ai' && 'Assistente IA'}
                    {rightPanelView === 'settings' && 'Configurações'}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={handleCloseRightPanel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Panel Content */}
                <div className="flex-1 overflow-auto p-4">
                  {rightPanelView === 'details' && selectedNode && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">ID</label>
                        <p className="text-sm">{selectedNode.id}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                        <p className="text-sm">{selectedNode.type || 'default'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Posição</label>
                        <p className="text-sm">
                          X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}
                        </p>
                      </div>
                      {(() => {
                        const nodeData = selectedNode.data as Record<string, unknown>;
                        const label = nodeData?.label || nodeData?.content;
                        if (label) {
                          return (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Conteúdo</label>
                              <p className="text-sm">{String(label)}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  
                  {rightPanelView === 'details' && !selectedNode && (
                    <p className="text-sm text-muted-foreground">
                      Selecione um nó para ver seus detalhes.
                    </p>
                  )}
                  
                  {rightPanelView === 'ai' && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <h4 className="font-medium mb-1">Assistente IA</h4>
                      <p className="text-sm text-muted-foreground">
                        Chat com IA em desenvolvimento...
                      </p>
                    </div>
                  )}
                  
                  {rightPanelView === 'settings' && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Configurações do Mapa</h4>
                      <p className="text-sm text-muted-foreground">
                        Configurações em desenvolvimento...
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Panel Button */}
          {rightPanelView === 'none' && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10"
              onClick={() => setRightPanelView('details')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Collaborator Cursors */}
        {formattedCursors.length > 0 && (
          <CollaboratorCursors cursors={formattedCursors} />
        )}
      </div>
    </MinimalLayout>
  )
}

export default MapEditorPage