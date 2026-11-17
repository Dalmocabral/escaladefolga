import React, { useState } from 'react';
import type { ShiftConfig, Employee } from '../types';
import { EmployeeRegistrationPage } from './EmployeeRegistrationPage';
import { RoleSchedulePage } from './RoleSchedulePage';
import { ArrowLeft, ChevronRight, UserPlus } from 'lucide-react';

interface ShiftPageProps {
  shift: ShiftConfig;
  onBack: () => void;
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: string) => void;
  onReorderEmployees?: (newEmployees: Employee[]) => void;
}

interface OperationalCard {
  id: string;
  title: string;
  role: string;
  emoji: string;
  isAction?: boolean;
}

const OPERATIONAL_CARDS: OperationalCard[] = [
  { id: 'cadastro', title: 'Cadastro de Colaborador', role: '', emoji: '👤', isAction: true },
  { id: 'motorista', title: 'Escala de Motorista', role: 'Motorista', emoji: '🚛' },
  { id: 'rtg', title: 'Escala de Operador de RTG', role: 'Operador de RTG', emoji: '🏗️' },
  { id: 'portainer', title: 'Escala de Operador de Portêiner', role: 'Operador de Portêiner', emoji: '🚢' },
  { id: 'reach_stacker', title: 'Escala de Operador Reach Stacker', role: 'Operador Reach Stacker', emoji: '🚜' },
  { id: 'auxiliar_patio', title: 'Escala Auxiliar de Pátio', role: 'Auxiliar de Pátio', emoji: '🦺' },
  { id: 'assistente_patio', title: 'Escala Assistente de Pátio', role: 'Assistente de Pátio', emoji: '📋' },
  { id: 'conferente_navio', title: 'Escala Conferente de Navio', role: 'Conferente de Navio', emoji: '🛳️' },
  { id: 'bloco', title: 'Escala Bloco', role: 'Operador de Bloco', emoji: '🧱' },
  { id: 'estivador', title: 'Escala Estivador', role: 'Estivador', emoji: '⚓' },
];

export const ShiftPage: React.FC<ShiftPageProps> = ({
  shift,
  onBack,
  employees,
  onAddEmployee,
  onDeleteEmployee,
  onReorderEmployees,
}) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // If "Cadastro de Colaborador" is clicked
  if (activeCardId === 'cadastro') {
    return (
      <EmployeeRegistrationPage
        shift={shift}
        onBack={() => setActiveCardId(null)}
        employees={employees}
        onAddEmployee={onAddEmployee}
        onDeleteEmployee={onDeleteEmployee}
      />
    );
  }

  // If any specific role schedule is clicked (Motorista, Bloco, RTG, etc.)
  if (activeCardId) {
    const card = OPERATIONAL_CARDS.find((c) => c.id === activeCardId);
    if (card) {
      return (
        <RoleSchedulePage
          shift={shift}
          roleName={card.role}
          roleEmoji={card.emoji}
          onBack={() => setActiveCardId(null)}
          onGoToRegistration={() => setActiveCardId('cadastro')}
          employees={employees}
          onReorderEmployees={onReorderEmployees}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Top: Voltar */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos Turnos</span>
          </button>
        </div>

        {/* Cabeçalho do Turno */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">{shift.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {shift.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Horário da Jornada: {shift.timeRange}
            </p>
          </div>
        </div>

        {/* Grid de Cards Operacionais do Turno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {OPERATIONAL_CARDS.map((card) => {
            const isSpecialAction = card.isAction;

            // Count employees in this role for this shift
            const countInRole = isSpecialAction
              ? employees.filter((e) => e.shiftId === shift.id).length
              : employees.filter(
                  (e) => e.shiftId === shift.id && e.role.toLowerCase() === card.role.toLowerCase()
                ).length;

            return (
              <div
                key={card.id}
                onClick={() => setActiveCardId(card.id)}
                className={`group relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 select-none ${
                  isSpecialAction
                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Emoji / Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-2xs shrink-0 ${
                      isSpecialAction
                        ? 'bg-blue-600 text-white shadow-blue-500/20'
                        : 'bg-slate-100 group-hover:bg-white border border-slate-200/60'
                    }`}
                  >
                    {isSpecialAction ? (
                      <UserPlus className="w-6 h-6 text-white" />
                    ) : (
                      <span>{card.emoji}</span>
                    )}
                  </div>

                  {/* Title & Count */}
                  <div>
                    <h3
                      className={`text-sm font-bold tracking-tight transition-colors ${
                        isSpecialAction
                          ? 'text-blue-900 group-hover:text-blue-700'
                          : 'text-slate-800 group-hover:text-blue-600'
                      }`}
                    >
                      {card.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isSpecialAction
                        ? `${countInRole} colaboradores cadastrados`
                        : `${countInRole} ${countInRole === 1 ? 'colaborador' : 'colaboradores'}`}
                    </span>
                  </div>
                </div>

                {/* Seta Chevron */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isSpecialAction
                      ? 'text-blue-600 group-hover:bg-blue-100'
                      : 'text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
