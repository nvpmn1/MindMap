import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createAvatarSvgDataUrl, getInitials } from './avatarUtils';
import { AlertCircle } from 'lucide-react';

export interface AvatarPreset {
  id: string;
  label: string;
  dataUrl: string;
}

const presetColors = [
  ['#22D3EE', '#06B6D4'],
  ['#34D399', '#10B981'],
  ['#F472B6', '#EC4899'],
  ['#F59E0B', '#EF4444'],
  ['#60A5FA', '#3B82F6'],
  ['#A78BFA', '#8B5CF6'],
  ['#F97316', '#EF4444'],
  ['#0EA5E9', '#0284C7'],
];

export function getAvatarPresets(displayName?: string | null): AvatarPreset[] {
  try {
    const initials = getInitials(displayName);
    return presetColors.map(([c1, c2], index) => ({
      id: `preset-${index}`,
      label: `Modelo ${index + 1}`,
      dataUrl: createAvatarSvgDataUrl(initials, c1, c2),
    }));
  } catch (error) {
    console.error('Error generating avatar presets:', error);
    // Return fallback presets
    return presetColors.map((_, index) => ({
      id: `preset-${index}`,
      label: `Modelo ${index + 1}`,
      dataUrl: createAvatarSvgDataUrl('U', presetColors[index][0], presetColors[index][1]),
    }));
  }
}

interface AvatarPresetsProps {
  displayName?: string | null;
  selected?: string | null;
  onSelect: (dataUrl: string) => void;
}

export function AvatarPresets({ displayName, selected, onSelect }: AvatarPresetsProps) {
  const [presets, setPresets] = useState<AvatarPreset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const generatedPresets = getAvatarPresets(displayName);
      setPresets(generatedPresets);
      setError(null);
    } catch (err) {
      console.error('Failed to generate presets:', err);
      setError('Erro ao gerar avatares');
      setPresets([]);
    }
  }, [displayName]);

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set([...prev, id]));
  };

  const handleImageError = (id: string) => {
    console.error(`Failed to load preset ${id}`);
    // Try to regenerate this preset
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      try {
        const newDataUrl = createAvatarSvgDataUrl('U', presetColors[presets.indexOf(preset)][0], presetColors[presets.indexOf(preset)][1]);
        setPresets((prev) =>
          prev.map((p) => (p.id === id ? { ...p, dataUrl: newDataUrl } : p))
        );
      } catch (err) {
        console.error('Error regenerating preset:', err);
      }
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {presets.length === 0 ? (
        <div className="col-span-4 flex items-center justify-center py-6 text-xs text-slate-400">
          Carregando avatares...
        </div>
      ) : (
        presets.map((preset) => (
          <motion.button
            key={preset.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(preset.dataUrl)}
            className={
              `rounded-full p-0.5 transition-all border ` +
              (selected === preset.dataUrl
                ? 'border-cyan-400 shadow-[0_0_0_3px_rgba(34,211,238,0.15)]'
                : 'border-slate-700 hover:border-slate-500')
            }
            title={preset.label}
            type="button"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <img
                src={preset.dataUrl}
                alt={preset.label}
                className="w-full h-full object-cover"
                loading="lazy"
                onLoad={() => handleImageLoad(preset.id)}
                onError={() => handleImageError(preset.id)}
              />
            </div>
          </motion.button>
        ))
      )}
    </div>
  );
}
