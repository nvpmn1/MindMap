import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { X } from 'lucide-react';

interface EmojiPickerProps {
  value?: string;
  onChange?: (emoji: string) => void;
  className?: string;
}

const EMOJI_CATEGORIES = {
  'Objetos': ['💡', '📝', '📌', '🎯', '⭐', '🔥', '💎', '🎨', '📊', '📈', '🔧', '⚙️', '🔑', '🎁', '📦', '🗂️', '📁', '📂', '🗃️', '💼'],
  'Pessoas': ['👤', '👥', '🧑‍💻', '👨‍💼', '👩‍💼', '🤝', '💪', '🙌', '👏', '🎉'],
  'Natureza': ['🌱', '🌿', '🌳', '🌸', '🌺', '🌻', '🌙', '☀️', '⚡', '🔮'],
  'Símbolos': ['✅', '❌', '⚠️', '❓', '❗', '💬', '🔔', '🏷️', '📍', '🔗'],
  'Formas': ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '💜'],
};

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<keyof typeof EMOJI_CATEGORIES>('Objetos');

  return (
    <div className={cn('w-64', className)}>
      {/* Category Tabs */}
      <div className="flex gap-1 mb-2 pb-2 border-b overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className="text-xs whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_CATEGORIES[selectedCategory].map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={cn(
              'p-1.5 text-lg hover:bg-accent rounded transition-colors',
              value === emoji && 'bg-accent ring-2 ring-primary'
            )}
            onClick={() => onChange?.(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Clear Button */}
      {value && (
        <div className="mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange?.('')}
            className="w-full text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Remover emoji
          </Button>
        </div>
      )}
    </div>
  );
}

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  className?: string;
}

const COLORS = [
  // Row 1 - Grays
  '#1a1a2e', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6',
  // Row 2 - Reds
  '#7f1d1d', '#991b1b', '#dc2626', '#ef4444', '#f87171', '#fecaca',
  // Row 3 - Oranges
  '#7c2d12', '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fed7aa',
  // Row 4 - Yellows
  '#713f12', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fef08a',
  // Row 5 - Greens
  '#14532d', '#166534', '#16a34a', '#22c55e', '#4ade80', '#bbf7d0',
  // Row 6 - Blues
  '#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#bfdbfe',
  // Row 7 - Purples
  '#581c87', '#7c3aed', '#8b5cf6', '#a855f7', '#c084fc', '#e9d5ff',
  // Row 8 - Pinks
  '#831843', '#be185d', '#db2777', '#ec4899', '#f472b6', '#fbcfe8',
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [customColor, setCustomColor] = React.useState(value || '#3b82f6');

  return (
    <div className={cn('w-64', className)}>
      {/* Preset Colors */}
      <div className="grid grid-cols-6 gap-1.5 mb-3">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              'w-8 h-8 rounded-md border-2 transition-all hover:scale-110',
              value === color
                ? 'border-primary ring-2 ring-primary ring-offset-2'
                : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange?.(color)}
          />
        ))}
      </div>

      {/* Custom Color */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <label className="text-sm text-muted-foreground">Personalizado:</label>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              onChange?.(e.target.value);
            }}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                onChange?.(e.target.value);
              }
            }}
            className="flex-1 h-8 px-2 text-sm border rounded-md bg-background"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
}
