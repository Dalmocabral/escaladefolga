import React, { useState } from 'react';
import type { ShiftConfig, Employee } from '../types';
import { ArrowLeft, UserPlus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface EmployeeRegistrationPageProps {
  shift: ShiftConfig;
  onBack: () => void;
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: string) => void;
  availableRoles?: string[];
}

export const ROLES_LIST = [
  'Motorista',
  'Operador de RTG',
  'Operador de Portêiner',
  'Operador Reach Stacker',
  'Auxiliar de Pátio',
  'Assistente de Pátio',
  'Conferente de Navio',
  'Operador de Bloco',
  'Estivador',
];

export const EmployeeRegistrationPage: React.FC<EmployeeRegistrationPageProps> = ({
  shift,
  onBack,
  employees,
  onAddEmployee,
  onDeleteEmployee,
  availableRoles,
}) => {
  const roles = availableRoles && availableRoles.length > 0 ? availableRoles : ROLES_LIST;
  const [name, setName] = useState('');
  const [registration, setRegistration] = useState('');
  const [role, setRole] = useState(roles[0]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter employees for this shift
  const shiftEmployees = employees.filter((emp) => emp.shiftId === shift.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedReg = registration.trim().toUpperCase();

    if (!trimmedName || !trimmedReg) return;

    // Previne cadastro duplicado de colaborador no mesmo turno
    const isDuplicate = shiftEmployees.some(
      (emp) =>
        emp.role.toLowerCase() === role.toLowerCase() &&
        (emp.registration.trim().toUpperCase() === trimmedReg ||
          emp.name.trim().toLowerCase() === trimmedName.toLowerCase())
    );

    if (isDuplicate) {
      setErrorMessage(`O colaborador "${trimmedName}" (Matrícula: ${trimmedReg}) já está cadastrado como ${role} no ${shift.title}!`);
      setTimeout(() => setErrorMessage(null), 4500);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    onAddEmployee({
      name: trimmedName,
      registration: trimmedReg,
      role,
      shiftId: shift.id,
    });

    setSuccessMessage(`Colaborador ${trimmedName} cadastrado com sucesso!`);
    setName('');
    setRegistration('');

    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top: Voltar */}
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao {shift.title}</span>
          </button>
        </div>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cadastro de Colaborador
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
              <span>{shift.emoji} {shift.title}</span>
              <span>•</span>
              <span>Jornada: {shift.timeRange}</span>
            </p>
          </div>
          <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl shadow-xs">
            {shiftEmployees.length} cadastrados neste turno
          </span>
        </div>

        {/* Formulário de Cadastro */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Novo Colaborador</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Campo: Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome do Colaborador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Campo: Matrícula */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Matrícula
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MAT-10492"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase transition"
                />
              </div>

              {/* Campo: Função (Select) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Função Operacional
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-800"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition active:scale-98 cursor-pointer disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Colaborador'}</span>
              </button>
            </div>
          </form>

          {/* Feedback de Sucesso */}
          {successMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Feedback de Erro / Duplicidade */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Tabela Limpa de Colaboradores Cadastrados */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Colaboradores Cadastrados no {shift.title}
            </h3>
            <span className="text-xs text-slate-400">
              Total: {shiftEmployees.length}
            </span>
          </div>

          {shiftEmployees.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum colaborador cadastrado ainda neste turno. Utilize o formulário acima para cadastrar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5 font-semibold">Nome</th>
                    <th className="py-3 px-4 font-semibold">Matrícula</th>
                    <th className="py-3 px-4 font-semibold">Função</th>
                    <th className="py-3 px-5 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shiftEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-5 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{emp.registration}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold text-[11px] border border-slate-200/60">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Remover colaborador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

