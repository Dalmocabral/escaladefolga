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
  const [rotationMode, setRotationMode] = useState<'fixed' | 'weekly_rotation'>(
    currentSettings.rotationMode || 'weekly_rotation'
  );
  const [offDayMode, setOffDayMode] = useState<'auto' | 'manual'>(
    currentSettings.offDayMode || 'auto'
  );
  const [customTeamOffDays, setCustomTeamOffDays] = useState<Record<number, number>>(
    currentSettings.customTeamOffDays || {
      0: 1,
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
      6: 7,
    }
  );

  useEffect(() => {
    if (isOpen) {
      setScaleType(currentSettings.scaleType);
      setNumTeams(currentSettings.numTeams);
      setRotationMode(currentSettings.rotationMode || (currentSettings.numTeams === 7 ? 'weekly_rotation' : 'weekly_rotation'));
      setOffDayMode(currentSettings.offDayMode || 'auto');
      if (currentSettings.customTeamOffDays) {
        setCustomTeamOffDays(currentSettings.customTeamOffDays);
      }
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

  const handleCustomDayChange = (teamId: number, day: number) => {
    setCustomTeamOffDays((prev) => ({
      ...prev,
      [teamId]: day,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      scaleType,
      numTeams,
      offDayMode,
      customTeamOffDays: offDayMode === 'manual' ? customTeamOffDays : undefined,
      rotationMode: scaleType === '5x2' ? rotationMode : undefined,
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

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[2, 3, 4, 5, 6, 7].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setNumTeams(count);
                    if (scaleType === '5x2' && count === 7) {
                      setRotationMode('weekly_rotation');
                    }
                  }}
                  className={`flex-1 min-w-[55px] py-2 text-xs font-bold rounded-xl border transition ${
                    numTeams === count
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {count} Eq.
                </button>
              ))}
            </div>

            {/* Live Distribution Preview */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Distribuição Automática ({totalEmployees} colaboradores):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                {preview.map(({ team, count }) => (
                  <div
                    key={team.id}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-center shadow-2xs"
                  >
                    <span className="text-[9px] font-bold text-slate-500 block truncate">
                      {team.name}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {count} <span className="text-[9px] font-normal text-slate-400">colab.</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Opção Específica para Escala 5x2: Modelo A (Escala Corrida) vs Fixa */}
          {scaleType === '5x2' && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Comportamento da Escala 5x2
                </label>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {rotationMode === 'weekly_rotation' ? '🔄 Modelo A: Rotação Semanal' : '📌 Escala Fixa'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRotationMode('weekly_rotation')}
                  className={`p-3 rounded-xl border text-left transition ${
                    rotationMode === 'weekly_rotation'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>🔄 Modelo A (Escala Corrida)</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 leading-tight font-medium">
                    Rodízio de 7 semanas onde as equipes revezam folgas semanalmente. Todos passam por finais de semana e ninguém ultrapassa 6 dias trabalhados.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRotationMode('fixed')}
                  className={`p-3 rounded-xl border text-left transition ${
                    rotationMode === 'fixed'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>📌 Escala Fixa</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Folgas sempre nos mesmos 2 dias da semana para cada equipe (ex: sempre Sáb/Dom, sempre Seg/Ter).
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 3. Modo de Definição das Folgas (Automático ou Manual) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Definição das Folgas das Equipes
              </label>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {offDayMode === 'manual' ? '✏️ Modo Manual Ativo' : '🔄 Modo Automático'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setOffDayMode('auto')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  offDayMode === 'auto'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold">🔄 Automático</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Folgas contínuas e balanceadas
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOffDayMode('manual')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  offDayMode === 'manual'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold">✏️ Manual por Equipe</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Você escolhe o dia de cada equipe
                </div>
              </button>
            </div>

            {/* Painel de Configuração Manual por Equipe */}
            {offDayMode === 'manual' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-amber-900 block">
                  Escolha o 1º dia de folga no mês de cada equipe:
                </span>
                <div className="space-y-1.5">
                  {preview.map(({ team }) => {
                    const currentVal = customTeamOffDays[team.id] ?? (team.id + 1);
                    return (
                      <div
                        key={team.id}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: team.dotColor }}
                          />
                          <span className="font-bold text-slate-800">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">1º Dia de Folga:</span>
                          <select
                            value={currentVal}
                            onChange={(e) =>
                              handleCustomDayChange(team.id, Number(e.target.value))
                            }
                            className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-lg px-2 py-1 focus:bg-white focus:ring-2 focus:ring-blue-500"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                              <option key={d} value={d}>
                                Dia {String(d).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-amber-800 leading-tight">
                  {scaleType === '5x2'
                    ? '💡 Em escala 5x2, ao escolher o Dia X, a equipe folga os dias X e X+1 seguidos a cada 7 dias.'
                    : '💡 As folgas da equipe se repetirão a cada ciclo com base no primeiro dia escolhido.'}
                </p>
              </div>
            )}
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
