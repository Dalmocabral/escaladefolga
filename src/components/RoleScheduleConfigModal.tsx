import React, { useState, useEffect } from 'react';
import type { CategoryScheduleSettings, ScaleType } from '../types';
import { TEAMS } from '../utils/teams';
import { X, Settings, Users, Check } from 'lucide-react';

interface RoleScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
  totalEmployees: number;
  currentSettings: CategoryScheduleSettings;
  onSave: (settings: CategoryScheduleSettings) => void;
}

export const RoleScheduleConfigModal: React.FC<RoleScheduleConfigModalProps> = ({
  isOpen,
  onClose,
  roleName,
  totalEmployees,
  currentSettings,
  onSave,
}) => {
  const [scaleType, setScaleType] = useState<ScaleType>(currentSettings.scaleType);
  const [numTeams, setNumTeams] = useState<number>(currentSettings.numTeams);

  useEffect(() => {
    if (isOpen) {
      setScaleType(currentSettings.scaleType);
      setNumTeams(currentSettings.numTeams);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  // Calculate live preview of team distribution
  const baseSize = Math.floor(totalEmployees / numTeams);
  const remainder = totalEmployees % numTeams;

  const preview = Array.from({ length: numTeams }, (_, i) => {
    const extra = i >= (numTeams - remainder) ? 1 : 0;
    return {
      team: TEAMS[i],
      count: totalEmployees === 0 ? 0 : baseSize + extra,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      scaleType,
      numTeams,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Configuração da Escala — {roleName}
              </h3>
              <p className="text-xs text-slate-500">Defina o modelo de trabalho e divisão de equipes</p>
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
          {/* 1. Tipo de Escala */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Regime de Escala da Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: '5x1', label: '5x1', desc: '5 trab. / 1 folga' },
                { id: '5x2', label: '5x2', desc: '5 trab. / 2 folgas' },
                { id: '6x1', label: '6x1', desc: '6 trab. / 1 folga' },
                { id: '12x36', label: '12x36', desc: '12h trab. / 36h folga' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScaleType(item.id as ScaleType)}
                  className={`p-3 rounded-xl border text-left transition ${
                    scaleType === item.id
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">{item.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Quantidade de Equipes / Turmas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Divisão em Equipes (Turmas de Cores)
              </label>
              <span className="text-xs font-semibold text-blue-600">
                {numTeams} equipes
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setNumTeams(count)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                    numTeams === count
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {count} Equipes
                </button>
              ))}
            </div>

            {/* Live Distribution Preview */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Distribuição Automática ({totalEmployees} colaboradores):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {preview.map(({ team, count }) => (
                  <div
                    key={team.id}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-center shadow-2xs"
                  >
                    <span className="text-[10px] font-bold text-slate-500 block">
                      {team.name}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {count} <span className="text-[10px] font-normal text-slate-400">colab.</span>
                    </span>
                  </div>
                ))}
              </div>
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
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
