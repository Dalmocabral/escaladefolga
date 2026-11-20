import React from 'react';
import { Calendar } from 'lucide-react';

interface MetricsPanelProps {
  selectedDay: number;
  viewMonth: number;
  viewYear: number;
  isSelectedDayToday: boolean;
  todayDay: number;
  todayMonth: number;
  totalAtivos: number;
  totalFolga: number;
  totalFerias: number;
  totalAtestado: number;
  totalINSS: number;
  totalExame: number;
  totalCategoryEmployees: number;
  onResetToToday: () => void;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  selectedDay,
  viewMonth,
  viewYear,
  isSelectedDayToday,
  todayDay,
  todayMonth,
  totalAtivos,
  totalFolga,
  totalFerias,
  totalAtestado,
  totalINSS,
  totalExame,
  totalCategoryEmployees,
  onResetToToday,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-2xs flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <span className="text-xs font-black text-slate-900 tracking-tight">
              Situação do Dia: {String(selectedDay).padStart(2, '0')}/{String(viewMonth + 1).padStart(2, '0')}/{viewYear}
            </span>
            <span
              className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                isSelectedDayToday
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {isSelectedDayToday ? 'HOJE (DATA ATUAL)' : 'DIA SELECIONADO NA GRADE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!isSelectedDayToday && (
            <button
              type="button"
              onClick={onResetToToday}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-200 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Voltar para Data Atual ({String(todayDay).padStart(2, '0')}/{String(todayMonth + 1).padStart(2, '0')})
              </span>
            </button>
          )}
          <span className="text-[11px] text-slate-500 font-semibold">
            Setor: <strong>{totalCategoryEmployees} colaboradores</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Ativos Hoje */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Ativos
            </span>
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
              👥
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {totalAtivos}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
              trabalhando no turno hoje
            </div>
          </div>
        </div>

        {/* 2. Total de Folga Hoje */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Folga
            </span>
            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              ☕
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {totalFolga}
            </div>
            <div className="text-[10px] font-semibold text-blue-600 mt-0.5">
              de folga pela escala hoje
            </div>
          </div>
        </div>

        {/* 3. Total de Férias Hoje */}
        <div
          className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
            totalFerias > 0
              ? 'bg-purple-50/80 border-purple-200 ring-1 ring-purple-300/40 text-purple-950'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                totalFerias > 0 ? 'text-purple-900' : 'text-slate-500'
              }`}
            >
              Total Férias
            </span>
            <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
              🏖️
            </span>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                totalFerias > 0 ? 'text-purple-950' : 'text-slate-900'
              }`}
            >
              {totalFerias}
            </div>
            <div
              className={`text-[10px] font-bold mt-0.5 ${
                totalFerias > 0 ? 'text-purple-700' : 'text-slate-400'
              }`}
            >
              {totalFerias > 0 ? `${totalFerias} em férias hoje` : 'nenhum hoje'}
            </div>
          </div>
        </div>

        {/* 4. Total de Atestado Hoje */}
        <div
          className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
            totalAtestado > 0
              ? 'bg-rose-50/80 border-rose-200 ring-1 ring-rose-300/40 text-rose-950'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                totalAtestado > 0 ? 'text-rose-900' : 'text-slate-500'
              }`}
            >
              Total Atestado
            </span>
            <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">
              🩺
            </span>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                totalAtestado > 0 ? 'text-rose-950' : 'text-slate-900'
              }`}
            >
              {totalAtestado}
            </div>
            <div
              className={`text-[10px] font-bold mt-0.5 ${
                totalAtestado > 0 ? 'text-rose-700' : 'text-slate-400'
              }`}
            >
              {totalAtestado > 0 ? `${totalAtestado} de atestado hoje` : 'nenhum hoje'}
            </div>
          </div>
        </div>

        {/* 5. Total INSS Hoje */}
        <div
          className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
            totalINSS > 0
              ? 'bg-amber-50/80 border-amber-200 ring-1 ring-amber-300/40 text-amber-950'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                totalINSS > 0 ? 'text-amber-900' : 'text-slate-500'
              }`}
            >
              Total INSS
            </span>
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
              🏥
            </span>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                totalINSS > 0 ? 'text-amber-950' : 'text-slate-900'
              }`}
            >
              {totalINSS}
            </div>
            <div
              className={`text-[10px] font-bold mt-0.5 ${
                totalINSS > 0 ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              {totalINSS > 0 ? `${totalINSS} pelo INSS hoje` : 'nenhum hoje'}
            </div>
          </div>
        </div>

        {/* 6. Total Exame Hoje */}
        <div
          className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
            totalExame > 0
              ? 'bg-teal-50/80 border-teal-200 ring-1 ring-teal-300/40 text-teal-950'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                totalExame > 0 ? 'text-teal-900' : 'text-slate-500'
              }`}
            >
              Total Exame
            </span>
            <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
              📋
            </span>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                totalExame > 0 ? 'text-teal-950' : 'text-slate-900'
              }`}
            >
              {totalExame}
            </div>
            <div
              className={`text-[10px] font-bold mt-0.5 ${
                totalExame > 0 ? 'text-teal-700' : 'text-slate-400'
              }`}
            >
              {totalExame > 0 ? `${totalExame} em exame hoje` : 'nenhum hoje'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
