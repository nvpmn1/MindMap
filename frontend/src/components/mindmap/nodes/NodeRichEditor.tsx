import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NodeRichEditorProps {
  label: string;
  description?: string;
  tags?: string[];
  status?: string;
  priority?: string;
  progress?: number;
  impact?: number;
  effort?: number;
  confidence?: number;
  onCancel: () => void;
  onSave: (payload: {
    label: string;
    description?: string;
    tags: string[];
    status?: string;
    priority?: string;
    progress?: number;
    impact?: number;
    effort?: number;
    confidence?: number;
  }) => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativo' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'archived', label: 'Arquivado' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export function NodeRichEditor({
  label,
  description,
  tags,
  status,
  priority,
  progress,
  impact,
  effort,
  confidence,
  onCancel,
  onSave,
}: NodeRichEditorProps) {
  const [draftLabel, setDraftLabel] = useState(label);
  const [draftDescription, setDraftDescription] = useState(description || '');
  const [draftTags, setDraftTags] = useState((tags || []).join(', '));
  const [draftStatus, setDraftStatus] = useState(status || 'active');
  const [draftPriority, setDraftPriority] = useState(priority || 'medium');
  const [draftProgress, setDraftProgress] = useState(progress ?? 0);
  const [draftImpact, setDraftImpact] = useState(impact ?? 60);
  const [draftEffort, setDraftEffort] = useState(effort ?? 40);
  const [draftConfidence, setDraftConfidence] = useState(confidence ?? 70);

  const parsedTags = useMemo(
    () =>
      draftTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [draftTags]
  );

  return (
    <div className="space-y-3" onClick={(event) => event.stopPropagation()}>
      <div className="space-y-2">
        <input
          value={draftLabel}
          onChange={(event) => setDraftLabel(event.target.value)}
          className="w-full bg-slate-900/60 border border-slate-700 rounded-md px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          placeholder="Título do nó"
        />
        <textarea
          value={draftDescription}
          onChange={(event) => setDraftDescription(event.target.value)}
          className="w-full min-h-[70px] bg-slate-900/60 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          placeholder="Descrição detalhada"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500">Status</label>
          <select
            value={draftStatus}
            onChange={(event) => setDraftStatus(event.target.value)}
            className="w-full mt-1 bg-slate-900/60 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500">Prioridade</label>
          <select
            value={draftPriority}
            onChange={(event) => setDraftPriority(event.target.value)}
            className="w-full mt-1 bg-slate-900/60 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-500">Tags</label>
        <input
          value={draftTags}
          onChange={(event) => setDraftTags(event.target.value)}
          className="w-full mt-1 bg-slate-900/60 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
          placeholder="ex: IA, research, priority"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Progresso</span>
          <span className="text-emerald-400 font-medium">{draftProgress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={draftProgress}
          onChange={(event) => setDraftProgress(Number(event.target.value))}
          className="w-full accent-emerald-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Impacto', value: draftImpact, setter: setDraftImpact },
          { label: 'Esforço', value: draftEffort, setter: setDraftEffort },
          { label: 'Confiança', value: draftConfidence, setter: setDraftConfidence },
        ].map((metric) => (
          <div key={metric.label} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{metric.label}</span>
              <span className="text-cyan-400 font-medium">{metric.value}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={metric.value}
              onChange={(event) => metric.setter(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {parsedTags.map((tag) => (
          <span
            key={tag}
            className={cn('px-2 py-0.5 rounded-full text-[9px] bg-slate-800 text-slate-300')}
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 text-xs text-slate-400 hover:text-white"
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={() =>
            onSave({
              label: draftLabel.trim() || label,
              description: draftDescription.trim() || undefined,
              tags: parsedTags,
              status: draftStatus,
              priority: draftPriority,
              progress: draftProgress,
              impact: draftImpact,
              effort: draftEffort,
              confidence: draftConfidence,
            })
          }
          className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
