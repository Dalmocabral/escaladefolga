import React, { useState, useEffect } from 'react';
import type { Employee, LeaveType, EmployeeLeave } from '../types';
import { X, Calendar, FileText, Trash2, CheckCircle2 } from 'lucide-react';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  teamName: string;
  initialType: LeaveType;
  existingLeave: EmployeeLeave | null;
  currentYear: number;
  currentMonth: number; // 0-indexed
  onSaveLeave: (leaveData: Omit<EmployeeLeave, 'id'>) => void;
  onRemoveLeave: (leaveId: string) => void;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  employee,
  teamName,
  initialType,
  existingLeave,
  currentYear,
  currentMonth,
  onSaveLeave,
  onRemoveLeave,
}) => {
  const [type, setType] = useState<LeaveType>(initialType);

  // Formatar YYYY-MM-DD
  const formatDefaultDate = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const [startDate, setStartDate] = useState(formatDefaultDate(1));
  const [endDate, setEndDate] = useState(formatDefaultDate(15));
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (isOpen && employee) {
      if (existingLeave) {
        setType(existingLeave.type);
        setStartDate(existingLeave.startDate);
        setEndDate(existingLeave.endDate);
        setObservation(existingLeave.observation || '');
      } else {
        setType(initialType);
        if (initialType === 'FERIAS') {
          // Padrão 15 dias de férias
          setStartDate(formatDefaultDate(1));
          setEndDate(formatDefaultDate(15));
          setObservation('Férias regulamentares');
        } else if (initialType === 'ATESTADO') {
          // Padrão 3 dias de atestado
          setStartDate(formatDefaultDate(5));
          setEndDate(formatDefaultDate(7));
          setObservation('Atestado médico');
        } else if (initialType === 'INSS') {
          // Padrão 30 dias de INSS
          setStartDate(formatDefaultDate(1));
          setEndDate(formatDefaultDate(30));
          setObservation('Afastamento previdenciário INSS');
        } else if (initialType === 'EXAME') {
          // Padrão 1 dia de exame
          setStartDate(formatDefaultDate(5));
          setEndDate(formatDefaultDate(5));
          setObservation('Exame médico periódico');
        }
      }
    }
  }, [isOpen, employee, existingLeave, initialType, currentYear, currentMonth]);

  if (!isOpen || !employee) return null;

  // Calcular número de dias
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = calculateDays();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    onSaveLeave({
      employeeId: employee.id,
      type,
      startDate,
      endDate,
      observation: observation.trim() || undefined,
    });
    onClose();
  };

  const handleRemove = () => {
    if (existingLeave) {
      onRemoveLeave(existingLeave.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {existingLeave ? 'Editar Afastamento' : 'Registrar Afastamento / Férias'}
            </h3>
            <p className="text-xs text-slate-500">
              {employee.name} • Matrícula: {employee.registration} • {teamName}
            </p>
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
          {/* 1. Escolha do Tipo: Férias, Atestado, INSS ou Exame */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Afastamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setType('FERIAS');
                  setObservation('Férias regulamentares');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  type === 'FERIAS'
                    ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏖️</span>
                  <span className="font-bold text-xs text-slate-900">Férias</span>
                </div>
                <span className="text-[10px] text-slate-500">Descanso regulamentar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('ATESTADO');
                  setObservation('Atestado médico');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  type === 'ATESTADO'
                    ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🩺</span>
                  <span className="font-bold text-xs text-slate-900">Atestado</span>
                </div>
                <span className="text-[10px] text-slate-500">Licença médica</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('INSS');
                  setObservation('Afastamento previdenciário INSS');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  type === 'INSS'
                    ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏥</span>
                  <span className="font-bold text-xs text-slate-900">INSS</span>
                </div>
                <span className="text-[10px] text-slate-500">Previdência social</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('EXAME');
                  setObservation('Exame médico periódico');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  type === 'EXAME'
                    ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <span className="font-bold text-xs text-slate-900">Exame</span>
                </div>
                <span className="text-[10px] text-slate-500">Periódico / Clínico</span>
              </button>
            </div>
          </div>

          {/* 2. Período: Data Início e Término */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Período do Afastamento
              </label>
              {daysCount > 0 && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                    type === 'FERIAS'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : type === 'ATESTADO'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : type === 'INSS'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-teal-50 text-teal-700 border-teal-200'
                  }`}
                >
                  Duração: {daysCount} {daysCount === 1 ? 'dia' : 'dias'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Data de Término
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Observação / Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Observação / Motivo (Opcional)
            </label>
            <input
              type="text"
              placeholder={
                type === 'FERIAS'
                  ? 'Ex: Férias regulares 2026'
                  : type === 'ATESTADO'
                  ? 'Ex: Atestado médico / CID'
                  : type === 'INSS'
                  ? 'Ex: Afastamento previdenciário INSS'
                  : 'Ex: Exame médico periódico / retorno ao trabalho'
              }
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {existingLeave ? (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remover Afastamento</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-98 ${
                  type === 'FERIAS'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : type === 'ATESTADO'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : type === 'INSS'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplicar na Escala</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

