import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, Badge, Input, Checkbox } from '@/components/ui';
import { useNodeStore } from '@/stores';
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Lightbulb,
  CheckSquare,
  StickyNote,
  GripVertical,
  Search,
} from 'lucide-react';
import type { NodeType } from '@/types';
import type { LucideIcon } from 'lucide-react';

// Local interface for node data
interface NodeData {
  id?: string;
  title?: string;
  content?: string;
  type?: string;
  color?: string;
  emoji?: string;
  metadata?: {
    status?: string;
    priority?: string;
  };
}

interface TreeNode {
  id: string;
  data: NodeData;
  children: TreeNode[];
  level: number;
}

const nodeTypeConfig: Record<NodeType, { icon: LucideIcon; color: string }> = {
  idea: { icon: Lightbulb, color: '#3b82f6' },
  task: { icon: CheckSquare, color: '#22c55e' },
  note: { icon: StickyNote, color: '#f59e0b' },
};

interface ListViewProps {
  className?: string;
  onNodeSelect?: (nodeId: string) => void;
}

export function ListView({ className, onNodeSelect }: ListViewProps) {
  const { nodes, edges } = useNodeStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Build tree structure from nodes and edges
  const tree = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>();
    const childToParent = new Map<string, string>();

    // Create all tree nodes
    nodes.forEach((node) => {
      nodeMap.set(node.id, {
        id: node.id,
        data: node.data as NodeData,
        children: [],
        level: 0,
      });
    });

    // Build parent-child relationships from edges
    edges.forEach((edge) => {
      childToParent.set(edge.target, edge.source);
    });

    // Find root nodes (nodes without parents) and build tree
    const rootNodes: TreeNode[] = [];

    nodeMap.forEach((treeNode, nodeId) => {
      const parentId = childToParent.get(nodeId);
      
      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.children.push(treeNode);
      } else {
        rootNodes.push(treeNode);
      }
    });

    // Calculate levels
    const setLevels = (node: TreeNode, level: number) => {
      node.level = level;
      node.children.forEach((child) => setLevels(child, level + 1));
    };

    rootNodes.forEach((root) => setLevels(root, 0));

    return rootNodes;
  }, [nodes, edges]);

  // Filter nodes by search
  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;

    const query = searchQuery.toLowerCase();

    const filterNode = (node: TreeNode): TreeNode | null => {
      const matchesSearch =
        (node.data.title || '').toLowerCase().includes(query) ||
        (node.data.content || '').toLowerCase().includes(query);

      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is TreeNode => n !== null);

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return tree.map(filterNode).filter((n): n is TreeNode => n !== null);
  }, [tree, searchQuery]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(tree);
    setExpandedIds(allIds);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nós..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expandir tudo
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Recolher tudo
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {filteredTree.length > 0 ? (
            filteredTree.map((node) => (
              <ListItem
                key={node.id}
                node={node}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onSelect={onNodeSelect}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum nó no mapa'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ListItemProps {
  node: TreeNode;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect?: (id: string) => void;
}

function ListItem({
  node,
  expandedIds,
  onToggleExpand,
  onSelect,
}: ListItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const nodeType = (node.data.type || 'idea') as NodeType;
  const typeConfig = nodeTypeConfig[nodeType] || nodeTypeConfig.idea;
  const Icon = typeConfig.icon;
  const isTask = node.data.type === 'task';
  const isDone = node.data.metadata?.status === 'done';

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 group cursor-pointer transition-colors"
        style={{ paddingLeft: `${node.level * 24 + 8}px` }}
        onClick={() => onSelect?.(node.id)}
      >
        {/* Drag Handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node.id);
          }}
          className={cn(
            'p-0.5 hover:bg-muted rounded',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Checkbox for tasks */}
        {isTask && (
          <Checkbox
            checked={isDone}
            onClick={(e) => e.stopPropagation()}
            className="mr-1"
          />
        )}

        {/* Icon */}
        <Icon
          className="h-4 w-4 flex-shrink-0"
          style={{ color: typeConfig.color }}
        />

        {/* Emoji */}
        {node.data.emoji && (
          <span className="text-sm">{node.data.emoji}</span>
        )}

        {/* Title */}
        <span
          className={cn(
            'flex-1 text-sm truncate',
            isDone && 'line-through text-muted-foreground'
          )}
        >
          {node.data.title || 'Sem título'}
        </span>

        {/* Children count */}
        {hasChildren && (
          <Badge variant="secondary" className="text-xs">
            {node.children.length}
          </Badge>
        )}

        {/* Type badge */}
        <Badge
          variant="outline"
          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderColor: typeConfig.color, color: typeConfig.color }}
        >
          {node.data.type === 'idea'
            ? 'Ideia'
            : node.data.type === 'task'
            ? 'Tarefa'
            : 'Nota'}
        </Badge>

        {/* More actions */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <ListItem
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
