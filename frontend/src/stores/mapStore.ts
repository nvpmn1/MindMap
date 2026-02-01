import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { MindMap, CreateMapInput, UpdateMapInput } from '@/types';

interface MapFilters {
  search: string;
  filter: 'all' | 'owned' | 'shared' | 'favorites' | 'archived';
  sortBy: 'updated_at' | 'created_at' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface MapState {
  // Data
  maps: MindMap[];
  currentMap: MindMap | null;
  selectedMapIds: string[];
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  filters: MapFilters;
  
  // Actions - Data
  setMaps: (maps: MindMap[]) => void;
  addMap: (map: MindMap) => void;
  updateMapLocal: (id: string, updates: Partial<MindMap>) => void;
  removeMap: (id: string) => void;
  setCurrentMap: (map: MindMap | null) => void;
  
  // Actions - Selection
  selectMap: (id: string) => void;
  deselectMap: (id: string) => void;
  toggleMapSelection: (id: string) => void;
  selectAllMaps: () => void;
  clearSelection: () => void;
  
  // Actions - UI
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setFilters: (filters: Partial<MapFilters>) => void;
  resetFilters: () => void;
  
  // API Actions
  fetchMaps: () => Promise<void>;
  fetchMapById: (id: string) => Promise<MindMap | null>;
  createMap: (data: CreateMapInput) => Promise<MindMap>;
  updateMap: (id: string, data: UpdateMapInput) => Promise<MindMap>;
  deleteMap: (id: string) => Promise<void>;
  duplicateMap: (id: string) => Promise<MindMap>;
  toggleFavorite: (id: string) => Promise<void>;
  archiveMap: (id: string, archived?: boolean) => Promise<void>;
  
  // Computed
  getFilteredMaps: () => MindMap[];
  getMapById: (id: string) => MindMap | undefined;
}

const defaultFilters: MapFilters = {
  search: '',
  filter: 'all',
  sortBy: 'updated_at',
  sortOrder: 'desc',
};

export const useMapStore = create<MapState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      maps: [],
      currentMap: null,
      selectedMapIds: [],
      isLoading: false,
      isSaving: false,
      error: null,
      viewMode: 'grid',
      filters: defaultFilters,

      // Data Actions
      setMaps: (maps) => set({ maps }),
      
      addMap: (map) => set((state) => ({ 
        maps: [map, ...state.maps] 
      })),
      
      updateMapLocal: (id, updates) => set((state) => ({
        maps: state.maps.map((m) => 
          m.id === id ? { ...m, ...updates } : m
        ),
        currentMap: state.currentMap?.id === id 
          ? { ...state.currentMap, ...updates }
          : state.currentMap,
      })),
      
      removeMap: (id) => set((state) => ({
        maps: state.maps.filter((m) => m.id !== id),
        selectedMapIds: state.selectedMapIds.filter((i) => i !== id),
        currentMap: state.currentMap?.id === id ? null : state.currentMap,
      })),
      
      setCurrentMap: (currentMap) => set({ currentMap }),

      // Selection Actions
      selectMap: (id) => set((state) => ({
        selectedMapIds: state.selectedMapIds.includes(id)
          ? state.selectedMapIds
          : [...state.selectedMapIds, id],
      })),
      
      deselectMap: (id) => set((state) => ({
        selectedMapIds: state.selectedMapIds.filter((i) => i !== id),
      })),
      
      toggleMapSelection: (id) => set((state) => ({
        selectedMapIds: state.selectedMapIds.includes(id)
          ? state.selectedMapIds.filter((i) => i !== id)
          : [...state.selectedMapIds, id],
      })),
      
      selectAllMaps: () => set((state) => ({
        selectedMapIds: state.maps.map((m) => m.id),
      })),
      
      clearSelection: () => set({ selectedMapIds: [] }),

      // UI Actions
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      setError: (error) => set({ error }),
      setViewMode: (viewMode) => set({ viewMode }),
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),
      
      resetFilters: () => set({ filters: defaultFilters }),

      // API Actions
      fetchMaps: async () => {
        try {
          set({ isLoading: true, error: null });
          const maps = await api.get<MindMap[]>('/maps');
          set({ maps, isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch maps', isLoading: false });
        }
      },

      fetchMapById: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const map = await api.get<MindMap>(`/maps/${id}`);
          set({ currentMap: map, isLoading: false });
          return map;
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch map', isLoading: false });
          return null;
        }
      },

      createMap: async (data: CreateMapInput) => {
        try {
          set({ isSaving: true, error: null });
          const newMap = await api.post<MindMap>('/maps', data);
          get().addMap(newMap);
          set({ isSaving: false });
          return newMap;
        } catch (error: any) {
          set({ error: error.message || 'Failed to create map', isSaving: false });
          throw error;
        }
      },

      updateMap: async (id: string, data: UpdateMapInput) => {
        try {
          set({ isSaving: true, error: null });
          const updatedMap = await api.patch<MindMap>(`/maps/${id}`, data);
          get().updateMapLocal(id, updatedMap);
          set({ isSaving: false });
          return updatedMap;
        } catch (error: any) {
          set({ error: error.message || 'Failed to update map', isSaving: false });
          throw error;
        }
      },

      deleteMap: async (id: string) => {
        try {
          set({ isSaving: true, error: null });
          await api.delete(`/maps/${id}`);
          get().removeMap(id);
          set({ isSaving: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete map', isSaving: false });
          throw error;
        }
      },

      duplicateMap: async (id: string) => {
        try {
          set({ isSaving: true, error: null });
          const duplicatedMap = await api.post<MindMap>(`/maps/${id}/duplicate`);
          get().addMap(duplicatedMap);
          set({ isSaving: false });
          return duplicatedMap;
        } catch (error: any) {
          set({ error: error.message || 'Failed to duplicate map', isSaving: false });
          throw error;
        }
      },

      toggleFavorite: async (id: string) => {
        try {
          const map = get().maps.find(m => m.id === id);
          if (!map) return;
          
          const newFavorite = !map.is_favorite;
          get().updateMapLocal(id, { is_favorite: newFavorite });
          
          await api.patch(`/maps/${id}`, { is_favorite: newFavorite });
        } catch (error: any) {
          // Revert optimistic update on failure
          const map = get().maps.find(m => m.id === id);
          if (map) {
            get().updateMapLocal(id, { is_favorite: !map.is_favorite });
          }
          set({ error: error.message || 'Failed to toggle favorite' });
        }
      },

      archiveMap: async (id: string, archived = true) => {
        try {
          get().updateMapLocal(id, { is_archived: archived });
          await api.patch(`/maps/${id}`, { is_archived: archived });
        } catch (error: any) {
          // Revert optimistic update on failure
          get().updateMapLocal(id, { is_archived: !archived });
          set({ error: error.message || 'Failed to archive map' });
        }
      },

      // Computed
      getFilteredMaps: () => {
        const { maps, filters } = get();
        let filtered = [...maps];

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.name.toLowerCase().includes(searchLower) ||
              m.description?.toLowerCase().includes(searchLower)
          );
        }

        // Category filter
        switch (filters.filter) {
          case 'owned':
            // Implement based on user context
            break;
          case 'shared':
            filtered = filtered.filter((m) => m.is_public);
            break;
          case 'favorites':
            filtered = filtered.filter((m) => m.is_favorite);
            break;
          case 'archived':
            filtered = filtered.filter((m) => m.is_archived);
            break;
          case 'all':
          default:
            filtered = filtered.filter((m) => !m.is_archived);
            break;
        }

        // Sort
        filtered.sort((a, b) => {
          let comparison = 0;
          
          switch (filters.sortBy) {
            case 'title':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'created_at':
              comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              break;
            case 'updated_at':
            default:
              comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
              break;
          }

          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });

        return filtered;
      },

      getMapById: (id) => get().maps.find((m) => m.id === id),
    })),
    { name: 'MapStore' }
  )
);
