import React, { useState, useEffect } from 'react';
import type {
  GenerateFolgaOptions,
  GenerationMode,
  ScaleType,
  CompensatorySundayMode,
  CompensatoryStrategy,
} from '../types';
import {
  X,
  Wand2,
  Sparkles,
  Repeat,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface GenerateFolgaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentViewMonth: number;
  currentViewYear: number;
  scaleType: ScaleType;
  monthlySchedules: Record<string, Record<string, Record<number, boolean>>>;
  onConfirm: (options: GenerateFolgaOptions) => void;
}

const ALL_MONTHS = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

export const GenerateFolgaModal: React.FC<GenerateFolgaModalProps> = ({
  isOpen,
  onClose,
  currentViewMonth,
  currentViewYear,
  scaleType,
  monthlySchedules,
  onConfirm,
}) => {
  const [targetMonth, setTargetMonth] = useState(currentViewMonth);
  const [targetYear, setTargetYear] = useState(currentViewYear);
  const [mode, setMode] = useState<GenerationMode>('continuidade');
  const [compensatorySunday, setCompensatorySunday] = useState<CompensatorySundayMode>('auto');
  const compensatoryStrategy: CompensatoryStrategy = 'swap';

  // Sincroniza sempre que o modal abre com o mês que o usuário está visualizando na tela
  useEffect(() => {
    if (isOpen) {
      setTargetMonth(currentViewMonth);
      setTargetYear(currentViewYear);
    }
  }, [isOpen, currentViewMonth, currentViewYear]);

  // Calcula dinamicamente se o mês imediatamente anterior ao targetMonth possui escala salva
  const prevMonthIndex = targetMonth === 0 ? 11 : targetMonth - 1;
  const prevYearIndex = targetMonth === 0 ? targetYear - 1 : targetYear;
  const prevMonthKey = `${prevYearIndex}-${prevMonthIndex}`;
  const prevMonthData = monthlySchedules[prevMonthKey];
  const hasPreviousMonthData = Boolean(
    prevMonthData && Object.keys(prevMonthData).length > 0
  );
  const previousMonthLabel = `${ALL_MONTHS[prevMonthIndex].label}/${prevYearIndex}`;

  // Se o mês anterior tiver dados, sugere 'continuidade' automaticamente; senão, 'nova'
  useEffect(() => {
    if (hasPreviousMonthData) {
      setMode('continuidade');
    } else {
      setMode('nova');
    }
  }, [hasPreviousMonthData, targetMonth, targetYear]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      targetMonth,
      targetYear,
      mode,
      compensatorySunday,
      compensatoryStrategy,
    });
    onClose();
  };

  const selectedMonthName = ALL_MONTHS.find((m) => m.value === targetMonth)?.label || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Gerar Escala de Folgas
              </h3>
              <p className="text-xs text-slate-500">
                Regime atual: <strong>Escala {scaleType}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Escolher Mês a Gerar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Mês para Gerar a Folga
              </label>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Alvo: {selectedMonthName} / {targetYear}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {ALL_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {/* 2. Escolha do Modo: Nova ou Continuidade */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              Como deseja calcular as folgas?
            </label>

            <div className="space-y-3">
              {/* Opção: Continuidade */}
              <div
                onClick={() => setMode('continuidade')}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                  mode === 'continuidade'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === 'continuidade' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Repeat className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 block">
                      Continuidade do Mês Anterior
                    </span>
                    {hasPreviousMonthData ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Base: {previousMonthLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">
                        (Sem escala salva anterior)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Mantém a rotação da escala sem interrupção. O dia 01 de {selectedMonthName} continua exatamente de onde parou o último dia do mês anterior.
                  </p>
                </div>
              </div>

              {/* Opção: Escala Nova */}
              <div
                onClick={() => setMode('nova')}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                  mode === 'nova'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === 'nova' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    Gerar Escala Nova
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Inicia um ciclo novo a partir do dia 01 de {selectedMonthName}, distribuindo as equipes (Verde, Azul, Amarela...) com a rotação padrão.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Folga Compensatória */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              Folga Compensatória
            </label>
            <div className="flex items-center gap-6 bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 hover:text-blue-600 transition">
                <input
                  type="radio"
                  name="compensatorySunday"
                  value="auto"
                  checked={compensatorySunday === 'auto'}
                  onChange={() => setCompensatorySunday('auto')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span>Automática</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 hover:text-blue-600 transition">
                <input
                  type="radio"
                  name="compensatorySunday"
                  value="manual"
                  checked={compensatorySunday === 'manual'}
                  onChange={() => setCompensatorySunday('manual')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span>Manual</span>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition active:scale-98"
            >
              <Wand2 className="w-4 h-4" />
              <span>Gerar Folgas para {selectedMonthName}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
