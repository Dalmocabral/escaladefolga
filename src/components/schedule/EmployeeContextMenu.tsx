import React from 'react';
import type { Employee, EmployeeLeave, LeaveType } from '../../types';
import type { TeamConfig } from '../../utils/teams';
import { Trash2, ArrowUpDown, Edit3 } from 'lucide-react';

interface MenuAnchor {
  employee: Employee;
  top: number;
  left: number;
}

interface EmployeeContextMenuProps {
  menuAnchor: MenuAnchor | null;
  onClose: () => void;
  employeeLeaves: EmployeeLeave[];
  distributedTeams: { team: TeamConfig; members: Employee[] }[];
  currentTeamId?: number;
  onOpenLeaveModal: (emp: Employee, leaveType: LeaveType, existingLeave?: EmployeeLeave | null) => void;
  onRemoveLeave: (leaveId: string) => void;
  onMoveToTeam: (emp: Employee, targetTeamId: number) => void;
}

export const EmployeeContextMenu: React.FC<EmployeeContextMenuProps> = ({
  menuAnchor,
  onClose,
  employeeLeaves,
  distributedTeams,
  currentTeamId,
  onOpenLeaveModal,
  onRemoveLeave,
  onMoveToTeam,
}) => {
  if (!menuAnchor) return null;

  const emp = menuAnchor.employee;

  return (
    <>
      {/* Backdrop para fechar ao clicar fora */}
      <div className="fixed inset-0 z-50 bg-black/10" onClick={onClose} />

      {/* Menu Popover Flutuante */}
      <div
        style={{
          position: 'fixed',
          top: `${menuAnchor.top}px`,
          left: `${menuAnchor.left}px`,
        }}
        className="z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 w-72 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 max-h-[85vh] overflow-y-auto"
      >
        {/* Cabeçalho do Menu com Identificação do Colaborador */}
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between mb-1">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Opções do Colaborador
            </span>
            <span className="text-xs font-bold text-slate-900 truncate block">
              {emp.name}
            </span>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono shrink-0">
            {emp.registration || 'S/M'}
          </span>
        </div>

        {/* Lista de Afastamentos Cadastrados para este colaborador */}
        {employeeLeaves.length > 0 && (
          <div className="mb-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Afastamentos Ativos ({employeeLeaves.length}):
            </span>
            <div className="space-y-1.5">
              {employeeLeaves.map((l) => {
                const [, sm, sd] = l.startDate.split('-');
                const [, em, ed] = l.endDate.split('-');
                const typeLabel =
                  l.type === 'FERIAS'
                    ? '🏖️ Férias'
                    : l.type === 'ATESTADO'
                    ? '🩺 Atestado'
                    : l.type === 'INSS'
                    ? '🏥 INSS'
                    : '📋 Exame';

                return (
                  <div
                    key={l.id}
                    className="p-1.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-1 text-[11px]"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800">{typeLabel}</div>
                      <div className="text-[10px] text-slate-500">
                        {sd}/{sm} até {ed}/{em}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenLeaveModal(emp, l.type, l);
                          onClose();
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Editar afastamento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveLeave(l.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remover afastamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Opções de Novo Afastamento */}
        <div className="space-y-1">
          <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Registrar Novo Afastamento
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenLeaveModal(emp, 'FERIAS', null);
              onClose();
            }}
            className="w-full px-3 py-2 text-left hover:bg-purple-50 text-slate-800 hover:text-purple-700 rounded-xl flex items-center gap-2.5 transition group"
          >
            <span className="text-lg p-1 bg-purple-100 text-purple-700 rounded-lg group-hover:scale-105 transition shrink-0">
              🏖️
            </span>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-purple-700">
                Adicionar Férias
              </div>
              <div className="text-[10px] text-slate-400 font-normal">
                Definir período de descanso
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenLeaveModal(emp, 'ATESTADO', null);
              onClose();
            }}
            className="w-full px-3 py-2 text-left hover:bg-rose-50 text-slate-800 hover:text-rose-700 rounded-xl flex items-center gap-2.5 transition group"
          >
            <span className="text-lg p-1 bg-rose-100 text-rose-700 rounded-lg group-hover:scale-105 transition shrink-0">
              🩺
            </span>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-rose-700">
                Adicionar Atestado
              </div>
              <div className="text-[10px] text-slate-400 font-normal">
                Licença médica / saúde
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenLeaveModal(emp, 'INSS', null);
              onClose();
            }}
            className="w-full px-3 py-2 text-left hover:bg-amber-50 text-slate-800 hover:text-amber-700 rounded-xl flex items-center gap-2.5 transition group"
          >
            <span className="text-lg p-1 bg-amber-100 text-amber-700 rounded-lg group-hover:scale-105 transition shrink-0">
              🏥
            </span>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-amber-700">
                Adicionar INSS
              </div>
              <div className="text-[10px] text-slate-400 font-normal">
                Afastamento previdenciário
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenLeaveModal(emp, 'EXAME', null);
              onClose();
            }}
            className="w-full px-3 py-2 text-left hover:bg-teal-50 text-slate-800 hover:text-teal-700 rounded-xl flex items-center gap-2.5 transition group"
          >
            <span className="text-lg p-1 bg-teal-100 text-teal-700 rounded-lg group-hover:scale-105 transition shrink-0">
              📋
            </span>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-teal-700">
                Adicionar Exame
              </div>
              <div className="text-[10px] text-slate-400 font-normal">
                Exame periódico / retorno
              </div>
            </div>
          </button>

          {/* Opção Rápida: Mover para outra Equipe */}
          <div className="border-t border-slate-100 pt-2 mt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              Mover para Equipe:
            </span>
            <div className="grid grid-cols-2 gap-1">
              {distributedTeams.map(({ team }) => {
                const isCurrentTeam = currentTeamId === team.id;
                if (isCurrentTeam) return null;

                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      onMoveToTeam(emp, team.id);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 text-left rounded-xl hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition border border-slate-100 hover:border-slate-300"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: team.dotColor }}
                    />
                    <span className="truncate">{team.colorName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
