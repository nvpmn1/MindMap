import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// Color picker popover
interface ColorPickerPopoverProps {
  color: string;
  onColorChange: (color: string) => void;
  colors?: string[];
  children?: React.ReactNode;
}

const defaultColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
];

function ColorPickerPopover({
  color,
  onColorChange,
  colors = defaultColors,
  children,
}: ColorPickerPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <button
            type="button"
            className="h-8 w-8 rounded-md border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ backgroundColor: color }}
          />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="grid grid-cols-6 gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                'h-6 w-6 rounded-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                color === c && 'ring-2 ring-ring ring-offset-2'
              )}
              style={{ backgroundColor: c }}
              onClick={() => onColorChange(c)}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border-0 p-0"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="flex-1 rounded-md border px-2 py-1 text-sm"
            placeholder="#000000"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Emoji picker popover
interface EmojiPickerPopoverProps {
  onEmojiSelect: (emoji: string) => void;
  children: React.ReactNode;
}

const commonEmojis = [
  '💡', '✨', '🎯', '🚀', '⚡', '🔥', '💪', '👍',
  '❤️', '⭐', '🎉', '✅', '❌', '⚠️', '📌', '🔗',
  '📝', '📊', '📁', '🗂️', '💼', '🛠️', '⚙️', '🔧',
  '🎨', '🖼️', '📷', '🎬', '🎵', '🎮', '💻', '📱',
  '🌟', '🌈', '☀️', '🌙', '🌍', '🏠', '🏢', '🏗️',
];

function EmojiPickerPopover({
  onEmojiSelect,
  children,
}: EmojiPickerPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="grid grid-cols-8 gap-1">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="h-8 w-8 rounded hover:bg-muted transition-colors text-lg"
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Date picker popover (simplified)
interface DatePickerPopoverProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  children: React.ReactNode;
  placeholder?: string;
}

function DatePickerPopover({
  date,
  onDateChange,
  children,
  placeholder = 'Selecione uma data',
}: DatePickerPopoverProps) {
  const [inputValue, setInputValue] = React.useState(
    date ? date.toISOString().split('T')[0] : ''
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    if (newDate && !isNaN(newDate.getTime())) {
      onDateChange(newDate);
    } else if (!e.target.value) {
      onDateChange(undefined);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">{placeholder}</label>
          <input
            type="date"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {date && (
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setInputValue('');
                onDateChange(undefined);
              }}
            >
              Limpar data
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Node context menu popover
interface NodeContextMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { x: number; y: number };
  onAction: (action: string) => void;
  children?: React.ReactNode;
}

function NodeContextMenu({
  open,
  onOpenChange,
  position,
  onAction,
  children,
}: NodeContextMenuProps) {
  const actions = [
    { id: 'edit', label: 'Editar', icon: '✏️', shortcut: 'E' },
    { id: 'duplicate', label: 'Duplicar', icon: '📋', shortcut: 'Ctrl+D' },
    { id: 'delete', label: 'Excluir', icon: '🗑️', shortcut: 'Del' },
    { id: 'divider1', type: 'divider' },
    { id: 'toTask', label: 'Converter em Tarefa', icon: '✓' },
    { id: 'addChild', label: 'Adicionar Filho', icon: '➕', shortcut: 'Tab' },
    { id: 'addSibling', label: 'Adicionar Irmão', icon: '↔️', shortcut: 'Enter' },
    { id: 'divider2', type: 'divider' },
    { id: 'expand', label: 'Expandir com IA', icon: '🤖' },
    { id: 'summarize', label: 'Resumir com IA', icon: '📝' },
  ];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {children && <PopoverTrigger asChild>{children}</PopoverTrigger>}
      <PopoverAnchor
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
        }}
      />
      <PopoverContent
        className="w-52 p-1"
        side="right"
        align="start"
        sideOffset={5}
      >
        {actions.map((action) =>
          action.type === 'divider' ? (
            <div key={action.id} className="my-1 h-px bg-border" />
          ) : (
            <button
              key={action.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => {
                onAction(action.id);
                onOpenChange(false);
              }}
            >
              <span>{action.icon}</span>
              <span className="flex-1 text-left">{action.label}</span>
              {action.shortcut && (
                <span className="text-xs text-muted-foreground">
                  {action.shortcut}
                </span>
              )}
            </button>
          )
        )}
      </PopoverContent>
    </Popover>
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  ColorPickerPopover,
  EmojiPickerPopover,
  DatePickerPopover,
  NodeContextMenu,
};
