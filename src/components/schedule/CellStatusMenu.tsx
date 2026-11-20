import React from 'react';
import type { Employee } from '../../types';
import { Check, X } from 'lucide-react';

export type CellOptionKey =
  | 'FOLGA'
  | 'FOLGA_FERIADO'
  | 'TREINAMENTO'
  | 'DISPENSA'
  | 'INSS'
  | 'EXAME'
  | 'PERIODICO'
  | 'TRABALHO';

export interface CellMenuAnchor {
  employee: Employee;
  dayNumber: number;
  dateKey: string;
  currentStatus: CellOptionKey;
  top: number;
  left: number;
}

interface CellStatusMenuProps {
  anchor: CellMenuAnchor | null;
  onClose: () => void;
  onSelectOption: (empId: string, dayNumber: number, option: CellOptionKey) => void;
}

export const CELL_STATUS_CONFIG: Record<
  CellOptionKey,
  {
    label: string;
    shortLabel: string;
    emoji: string;
    badgeClass: string;
    description: string;
  }
> = {
  FOLGA: {
    label: 'Folga',
    shortLabel: 'Folga',
    emoji: '⚪',
    badgeClass: 'bg-white border-slate-300 text-slate-800',
    description: 'Folga regulamentar da escala',
  },
  FOLGA_FERIADO: {
    label: 'Folga Feriado',
    shortLabel: 'F. Feriado',
    emoji: '🏖️',
    badgeClass: 'bg-amber-100 border-amber-300 text-amber-900',
    description: 'Folga de feriado compensatório',
  },
  TREINAMENTO: {
    label: 'Treinamento',
    shortLabel: 'Treinam.',
    emoji: '📚',
    badgeClass: 'bg-indigo-100 border-indigo-300 text-indigo-900',
    description: 'Em capacitação / treinamento',
  },
  DISPENSA: {
    label: 'Dispensa',
    shortLabel: 'Dispensa',
    emoji: '📄',
    badgeClass: 'bg-orange-100 border-orange-300 text-orange-950',
    description: 'Dispensa autorizada da jornada',
  },
  INSS: {
    label: 'INSS',
    shortLabel: 'INSS',
    emoji: '🏥',
    badgeClass: 'bg-amber-100 border-amber-300 text-amber-900',
    description: 'Afastamento previdenciário INSS',
  },
  EXAME: {
    label: 'Exame',
    shortLabel: 'Exame',
    emoji: '📋',
    badgeClass: 'bg-teal-100 border-teal-300 text-teal-900',
    description: 'Exame médico clínico',
  },
  PERIODICO: {
    label: 'Periódico',
    shortLabel: 'Periódico',
    emoji: '🩺',
    badgeClass: 'bg-cyan-100 border-cyan-300 text-cyan-900',
    description: 'Exame médico periódico',
  },
  TRABALHO: {
    label: 'Trabalho (Normal)',
    shortLabel: 'Trabalho',
    emoji: '🟩',
    badgeClass: 'bg-slate-100 border-slate-200 text-slate-700',
    description: 'Limpar e retornar ao trabalho',
  },
};

const ORDERED_OPTIONS: CellOptionKey[] = [
  'FOLGA',
  'FOLGA_FERIADO',
  'TREINAMENTO',
  'DISPENSA',
  'INSS',
  'EXAME',
  'PERIODICO',
];

export const CellStatusMenu: React.FC<CellStatusMenuProps> = ({
  anchor,
  onClose,
  onSelectOption,
}) => {
  if (!anchor) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/10" onClick={onClose} />

      {/* Popover */}
      <div
        style={{
          position: 'fixed',
          top: `${anchor.top}px`,
          left: `${anchor.left}px`,
        }}
        className="z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 w-64 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
      >
        {/* Header com dia e colaborador */}
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between mb-1 bg-slate-50 rounded-xl">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Dia {anchor.dateKey}
            </span>
            <span className="text-xs font-bold text-slate-900 truncate block">
              {anchor.employee.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lista ordenada de opções */}
        <div className="space-y-0.5">
          {ORDERED_OPTIONS.map((optKey) => {
            const cfg = CELL_STATUS_CONFIG[optKey];
            const isSelected = anchor.currentStatus === optKey;

            return (
              <button
                key={optKey}
                type="button"
                onClick={() => {
                  onSelectOption(anchor.employee.id, anchor.dayNumber, optKey);
                  onClose();
                }}
                className={`w-full px-2.5 py-1.5 text-left rounded-xl flex items-center justify-between transition group ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{cfg.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate">{cfg.label}</div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
              </button>
            );
          })}

          {/* Opção para Voltar ao Trabalho / Limpar marcação */}
          <div className="border-t border-slate-100 pt-1 mt-1">
            <button
              type="button"
              onClick={() => {
                onSelectOption(anchor.employee.id, anchor.dayNumber, 'TRABALHO');
                onClose();
              }}
              className="w-full px-2.5 py-1.5 text-left rounded-xl hover:bg-emerald-50 text-emerald-800 flex items-center justify-between transition text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🟩</span>
                <span>Trabalho (Limpar)</span>
              </div>
              {anchor.currentStatus === 'TRABALHO' && (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
