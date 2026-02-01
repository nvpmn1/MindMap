// ============================================================================
// MindMap Hub - Dashboard Page
// ============================================================================
// Página principal após login: lista mapas, favoritos, recentes, busca
// ============================================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Star,
  Clock,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Archive,
  SortAsc,
  SortDesc,
  Brain,
  FolderOpen,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useMapStore } from '@/stores/mapStore'
import { AppLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/loading'
import { cn, formatRelativeDate, getInitials } from '@/lib/utils'
import type { MindMap } from '@/types'

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'grid' | 'list'
type SortField = 'updated_at' | 'created_at' | 'name'
type SortOrder = 'asc' | 'desc'
type FilterTab = 'all' | 'owned' | 'shared' | 'favorites' | 'archived'

// ============================================================================
// Map Card Component
// ============================================================================

interface MapCardProps {
  map: MindMap
  viewMode: ViewMode
  onOpen: (map: MindMap) => void
  onEdit: (map: MindMap) => void
  onDelete: (map: MindMap) => void
  onDuplicate: (map: MindMap) => void
  onShare: (map: MindMap) => void
  onToggleFavorite: (map: MindMap) => void
  onArchive: (map: MindMap) => void
}

function MapCard({
  map,
  viewMode,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onToggleFavorite,
  onArchive
}: MapCardProps) {
  const { user } = useAuthStore()
  const isOwner = map.owner_id === user?.id
  const isFavorite = map.is_favorite

  // Generate preview gradient based on map id
  const gradientIndex = map.id.charCodeAt(0) % 6
  const gradients = [
    'from-blue-500/20 to-purple-500/20',
    'from-green-500/20 to-teal-500/20',
    'from-orange-500/20 to-red-500/20',
    'from-pink-500/20 to-rose-500/20',
    'from-indigo-500/20 to-blue-500/20',
    'from-yellow-500/20 to-orange-500/20'
  ]

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => onOpen(map)}
      >
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
          gradients[gradientIndex]
        )}>
          <Brain className="w-5 h-5 text-foreground" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{map.name}</h3>
            {isFavorite && <Star className="w-4 h-4 text-warning fill-warning" />}
            {map.is_public && <Badge variant="secondary" className="text-xs">Público</Badge>}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {map.description || 'Sem descrição'}
          </p>
        </div>

        {/* Meta */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{map.node_count || 0} nós</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatRelativeDate(map.updated_at)}</span>
          </div>
        </div>

        {/* Collaborators */}
        {map.collaborators && map.collaborators.length > 0 && (
          <div className="hidden lg:flex -space-x-2">
            {map.collaborators.slice(0, 3).map((collab) => (
              <Avatar key={collab.user_id} className="w-7 h-7 border-2 border-background">
                <AvatarImage src={collab.user?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(collab.user?.name || collab.user?.email || '')}
                </AvatarFallback>
              </Avatar>
            ))}
            {map.collaborators.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                +{map.collaborators.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onOpen(map)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Abrir
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem onClick={() => onEdit(map)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onToggleFavorite(map)}>
              <Star className={cn('w-4 h-4 mr-2', isFavorite && 'fill-current')} />
              {isFavorite ? 'Remover favorito' : 'Favoritar'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDuplicate(map)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem onClick={() => onShare(map)}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchive(map)}>
              <Archive className="w-4 h-4 mr-2" />
              Arquivar
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem 
                onClick={() => onDelete(map)}
                className="text-error focus:text-error"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    )
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onOpen(map)}
    >
      {/* Preview Area */}
      <div className={cn(
        'h-32 bg-gradient-to-br flex items-center justify-center relative',
        gradients[gradientIndex]
      )}>
        <Brain className="w-12 h-12 text-foreground/50" />
        
        {/* Favorite Badge */}
        {isFavorite && (
          <div className="absolute top-2 left-2">
            <Star className="w-5 h-5 text-warning fill-warning" />
          </div>
        )}

        {/* Actions Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              onOpen(map)
            }}
          >
            Abrir
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="secondary">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isOwner && (
                <DropdownMenuItem onClick={() => onEdit(map)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onToggleFavorite(map)}>
                <Star className={cn('w-4 h-4 mr-2', isFavorite && 'fill-current')} />
                {isFavorite ? 'Remover favorito' : 'Favoritar'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(map)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => onShare(map)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(map)}
                    className="text-error focus:text-error"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{map.name}</h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {map.description || 'Sem descrição'}
            </p>
          </div>
          {map.is_public && <Badge variant="secondary" className="text-xs shrink-0">Público</Badge>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeDate(map.updated_at)}</span>
          </div>

          {/* Collaborators */}
          {map.collaborators && map.collaborators.length > 0 ? (
            <div className="flex -space-x-1.5">
              {map.collaborators.slice(0, 3).map((collab) => (
                <Avatar key={collab.user_id} className="w-6 h-6 border-2 border-card">
                  <AvatarImage src={collab.user?.avatar_url} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(collab.user?.name || '')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {map.collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px]">
                  +{map.collaborators.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="w-3.5 h-3.5" />
              <span>{map.node_count || 0}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Create Map Dialog
// ============================================================================

interface CreateMapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description: string }) => Promise<void>
  isLoading: boolean
  editMap?: MindMap | null
}

function CreateMapDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  editMap 
}: CreateMapDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (editMap) {
      setName(editMap.name)
      setDescription(editMap.description || '')
    } else {
      setName('')
      setDescription('')
    }
  }, [editMap, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onSubmit({ name: name.trim(), description: description.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editMap ? 'Editar mapa' : 'Criar novo mapa'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do mapa</Label>
            <Input
              id="name"
              placeholder="Ex: Planejamento Q1 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito deste mapa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editMap ? 'Salvar' : 'Criar mapa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Delete Confirmation Dialog
// ============================================================================

interface DeleteDialogProps {
  map: MindMap | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isLoading: boolean
}

function DeleteDialog({ map, open, onOpenChange, onConfirm, isLoading }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir mapa</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          Tem certeza que deseja excluir <strong>"{map?.name}"</strong>? 
          Esta ação não pode ser desfeita e todos os dados serão perdidos.
        </p>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Dashboard Page Component
// ============================================================================

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { 
    maps, 
    isLoading, 
    error,
    fetchMaps, 
    createMap, 
    updateMap, 
    deleteMap,
    duplicateMap,
    toggleFavorite,
    archiveMap 
  } = useMapStore()

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingMap, setEditingMap] = useState<MindMap | null>(null)
  const [deletingMap, setDeletingMap] = useState<MindMap | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch maps on mount
  useEffect(() => {
    fetchMaps()
  }, [fetchMaps])

  // Filter and sort maps
  const filteredMaps = useMemo(() => {
    let result = [...maps]

    // Apply filter tab
    switch (filterTab) {
      case 'owned':
        result = result.filter(m => m.owner_id === user?.id)
        break
      case 'shared':
        result = result.filter(m => m.owner_id !== user?.id)
        break
      case 'favorites':
        result = result.filter(m => m.is_favorite)
        break
      case 'archived':
        result = result.filter(m => m.is_archived)
        break
      default:
        result = result.filter(m => !m.is_archived)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      )
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'updated_at':
        default:
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [maps, filterTab, searchQuery, sortField, sortOrder, user?.id])

  // Handlers
  const handleCreateMap = async (data: { name: string; description: string }) => {
    setIsSubmitting(true)
    try {
      if (editingMap) {
        await updateMap(editingMap.id, data)
      } else {
        const newMap = await createMap({ name: data.name, description: data.description })
        if (newMap) {
          navigate(`/map/${newMap.id}`)
        }
      }
      setCreateDialogOpen(false)
      setEditingMap(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMap = async () => {
    if (!deletingMap) return
    setIsSubmitting(true)
    try {
      await deleteMap(deletingMap.id)
      setDeleteDialogOpen(false)
      setDeletingMap(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openMap = (map: MindMap) => {
    navigate(`/map/${map.id}`)
  }

  const openEditDialog = (map: MindMap) => {
    setEditingMap(map)
    setCreateDialogOpen(true)
  }

  const openDeleteDialog = (map: MindMap) => {
    setDeletingMap(map)
    setDeleteDialogOpen(true)
  }

  const handleDuplicate = async (map: MindMap) => {
    await duplicateMap(map.id)
  }

  const handleShare = (map: MindMap) => {
    // TODO: Open share dialog
    console.log('Share map:', map.id)
  }

  const handleToggleFavorite = async (map: MindMap) => {
    await toggleFavorite(map.id)
  }

  const handleArchive = async (map: MindMap) => {
    await archiveMap(map.id)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Meus Mapas</h1>
                <p className="text-muted-foreground">
                  {maps.length} {maps.length === 1 ? 'mapa' : 'mapas'} no total
                </p>
              </div>
              <Button onClick={() => {
                setEditingMap(null)
                setCreateDialogOpen(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo mapa
              </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Tabs */}
              <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="owned">Meus</TabsTrigger>
                  <TabsTrigger value="shared">Compartilhados</TabsTrigger>
                  <TabsTrigger value="favorites">
                    <Star className="w-4 h-4 mr-1" />
                    Favoritos
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    <Archive className="w-4 h-4 mr-1" />
                    Arquivados
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex-1" />

              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar mapas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleSort('updated_at')}>
                    <Clock className="w-4 h-4 mr-2" />
                    Última modificação
                    {sortField === 'updated_at' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4 ml-auto" /> : <SortDesc className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort('created_at')}>
                    <Clock className="w-4 h-4 mr-2" />
                    Data de criação
                    {sortField === 'created_at' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4 ml-auto" /> : <SortDesc className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort('name')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Nome
                    {sortField === 'name' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4 ml-auto" /> : <SortDesc className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Loading State */}
          {isLoading && maps.length === 0 && (
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-2'
            )}>
              {[...Array(8)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className={viewMode === 'grid' ? 'h-48 rounded-xl' : 'h-16 rounded-lg'} 
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-12 h-12 text-error mb-4" />
              <h3 className="text-lg font-medium mb-2">Erro ao carregar mapas</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchMaps()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredMaps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {searchQuery ? (
                <>
                  <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Não encontramos mapas para "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Limpar busca
                  </Button>
                </>
              ) : filterTab === 'favorites' ? (
                <>
                  <Star className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sem favoritos</h3>
                  <p className="text-muted-foreground">
                    Marque mapas como favoritos para acesso rápido
                  </p>
                </>
              ) : filterTab === 'archived' ? (
                <>
                  <Archive className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sem mapas arquivados</h3>
                  <p className="text-muted-foreground">
                    Mapas arquivados aparecerão aqui
                  </p>
                </>
              ) : (
                <>
                  <Brain className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Comece a criar!</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro mapa mental e organize suas ideias
                  </p>
                  <Button onClick={() => {
                    setEditingMap(null)
                    setCreateDialogOpen(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar meu primeiro mapa
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Maps Grid/List */}
          {!isLoading && !error && filteredMaps.length > 0 && (
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-2'
                )}
              >
                {filteredMaps.map((map) => (
                  <MapCard
                    key={map.id}
                    map={map}
                    viewMode={viewMode}
                    onOpen={openMap}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                    onDuplicate={handleDuplicate}
                    onShare={handleShare}
                    onToggleFavorite={handleToggleFavorite}
                    onArchive={handleArchive}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <CreateMapDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateMap}
        isLoading={isSubmitting}
        editMap={editingMap}
      />

      <DeleteDialog
        map={deletingMap}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteMap}
        isLoading={isSubmitting}
      />
    </AppLayout>
  )
}

export default DashboardPage
