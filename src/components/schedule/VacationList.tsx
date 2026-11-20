import React from 'react';
import type { Employee, EmployeeLeave } from '../../types';
import type { TeamConfig } from '../../utils/teams';
import { Edit3, Trash2 } from 'lucide-react';

export interface VacationItem {
  employee: Employee;
  leave: EmployeeLeave;
  team: TeamConfig;
}

interface VacationListProps {
  vacationEmployees: VacationItem[];
  monthName: string;
  viewYear: number;
  onEditLeave: (employee: Employee, leave: EmployeeLeave) => void;
  onRemoveLeave: (leaveId: string, employeeName: string) => void;
}

export const VacationList: React.FC<VacationListProps> = ({
  vacationEmployees,
  monthName,
  viewYear,
  onEditLeave,
  onRemoveLeave,
}) => {
  if (vacationEmployees.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50/90 via-purple-50/60 to-indigo-50/40 border border-purple-200/90 rounded-2xl p-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2.5 pb-2.5 border-b border-purple-200/60">
        <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
          🏖️
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-xs sm:text-sm text-purple-950">
            Colaboradores em Férias no Mês ({monthName}/{viewYear})
          </h3>
          <span className="bg-purple-200/90 text-purple-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-300">
            {vacationEmployees.length}{' '}
            {vacationEmployees.length === 1 ? 'colaborador' : 'colaboradores'}
          </span>
        </div>
      </div>

      {/* Lista dos Colaboradores em Férias */}
      <div className="flex flex-col divide-y divide-purple-100 bg-white/95 rounded-xl border border-purple-200/80 overflow-hidden shadow-2xs mt-2.5">
        {vacationEmployees.map(({ employee, leave, team }) => {
          const [, sMonth, sDay] = leave.startDate.split('-');
          const [, eMonth, eDay] = leave.endDate.split('-');
          const startStr = `${sDay}/${sMonth}`;
          const endStr = `${eDay}/${eMonth}`;

          const startD = new Date(leave.startDate);
          const endD = new Date(leave.endDate);
          const diffDays = Math.max(
            1,
            Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1
          );

          return (
            <div
              key={leave.id}
              className="p-2.5 sm:px-3 hover:bg-purple-50/50 transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${team.avatarBg}`}
                >
                  {employee.name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </div>

                {/* Nome e Matrícula */}
                <div className="flex items-center gap-1.5 min-w-[180px] shrink-0">
                  <span className="font-bold text-xs text-slate-900">
                    {employee.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({employee.registration})
                  </span>
                </div>

                {/* Equipe */}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 min-w-[110px] shrink-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: team.dotColor }}
                  />
                  {team.name}
                </span>

                {/* Período de Férias */}
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded border border-purple-200 shrink-0">
                  {startStr} até {endStr} ({diffDays} dias)
                </span>

                {/* Observação */}
                {leave.observation && (
                  <span className="text-[10px] text-slate-500 truncate italic hidden md:inline">
                    {leave.observation}
                  </span>
                )}
              </div>

              {/* Ações Rápidas */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditLeave(employee, leave)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-100/60 transition"
                  title="Editar período de férias"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveLeave(leave.id, employee.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remover férias e retornar colaborador para a tabela"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
