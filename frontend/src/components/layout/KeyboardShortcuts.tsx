import { useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui';
import { useUIStore } from '@/stores';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Abrir busca rápida', category: 'Navegação' },
  { keys: ['⌘', 'B'], description: 'Alternar barra lateral', category: 'Navegação' },
  { keys: ['⌘', ','], description: 'Abrir configurações', category: 'Navegação' },
  { keys: ['Esc'], description: 'Fechar modal/painel', category: 'Navegação' },
  
  // Canvas
  { keys: ['Space'], description: 'Arrastar canvas (modo pan)', category: 'Canvas' },
  { keys: ['⌘', '+'], description: 'Aumentar zoom', category: 'Canvas' },
  { keys: ['⌘', '-'], description: 'Diminuir zoom', category: 'Canvas' },
  { keys: ['⌘', '0'], description: 'Resetar zoom', category: 'Canvas' },
  { keys: ['⌘', '1'], description: 'Ajustar ao conteúdo', category: 'Canvas' },
  
  // Nodes
  { keys: ['N'], description: 'Criar novo nó', category: 'Nós' },
  { keys: ['Enter'], description: 'Editar nó selecionado', category: 'Nós' },
  { keys: ['Tab'], description: 'Criar nó filho', category: 'Nós' },
  { keys: ['Delete'], description: 'Excluir nó selecionado', category: 'Nós' },
  { keys: ['⌘', 'D'], description: 'Duplicar nó', category: 'Nós' },
  { keys: ['⌘', 'C'], description: 'Copiar nó', category: 'Nós' },
  { keys: ['⌘', 'V'], description: 'Colar nó', category: 'Nós' },
  { keys: ['⌘', 'A'], description: 'Selecionar todos os nós', category: 'Nós' },
  
  // History
  { keys: ['⌘', 'Z'], description: 'Desfazer', category: 'Histórico' },
  { keys: ['⌘', 'Shift', 'Z'], description: 'Refazer', category: 'Histórico' },
  
  // Files
  { keys: ['⌘', 'S'], description: 'Salvar mapa', category: 'Arquivos' },
  { keys: ['⌘', 'Shift', 'E'], description: 'Exportar mapa', category: 'Arquivos' },
  { keys: ['⌘', 'N'], description: 'Novo mapa', category: 'Arquivos' },
  
  // AI
  { keys: ['⌘', 'J'], description: 'Abrir painel de IA', category: 'IA' },
  { keys: ['⌘', 'Shift', 'A'], description: 'Expandir ideia com IA', category: 'IA' },
];

export function KeyboardShortcutsDialog() {
  const { modals, closeModal } = useUIStore();

  const categories = [...new Set(shortcuts.map((s) => s.category))];

  return (
    <Dialog 
      open={modals.shortcuts} 
      onOpenChange={() => closeModal('shortcuts')}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Atalhos de Teclado</DialogTitle>
          <DialogDescription>
            Use estes atalhos para navegar mais rapidamente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={i}>
                              <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border rounded">
                                {key}
                              </kbd>
                              {i < shortcut.keys.length - 1 && (
                                <span className="mx-0.5 text-muted-foreground">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Global Keyboard Shortcuts Hook
export function useKeyboardShortcuts() {
  const { setTheme, theme, toggleSidebar, openModal } = useUIStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // ⌘+K - Quick search
      if (cmdKey && e.key === 'k') {
        e.preventDefault();
        // TODO: Open quick search
      }

      // ⌘+B - Toggle sidebar
      if (cmdKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // ⌘+, - Open settings
      if (cmdKey && e.key === ',') {
        e.preventDefault();
        openModal('settings');
      }

      // ⌘+/ - Toggle theme
      if (cmdKey && e.key === '/') {
        e.preventDefault();
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
      }

      // ? - Show keyboard shortcuts
      if (e.key === '?' && !cmdKey) {
        e.preventDefault();
        openModal('shortcuts');
      }
    },
    [theme, setTheme, toggleSidebar, openModal]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
