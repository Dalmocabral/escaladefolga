import React, { useState, useMemo, useEffect } from 'react';
import type { ShiftConfig, Employee } from '../types';
import {
  computeDailyStaffing,
  saveStaffingOverrides,
  type StaffingRowData,
} from '../utils/staffing';
import { exportDailyStaffingToExcel } from '../utils/exportDailyStaffingExcel';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  X,
  ExternalLink,
} from 'lucide-react';

interface DailyStaffingPageProps {
  shift: ShiftConfig;
  allShifts?: ShiftConfig[];
  onSelectShift?: (newShift: ShiftConfig) => void;
  onBack: () => void;
  employees: Employee[];
  onGoToRoleSchedule?: (roleName: string) => void;
}

export const DailyStaffingPage: React.FC<DailyStaffingPageProps> = ({
  shift,
  allShifts,
  onSelectShift,
  onBack,
  employees,
  onGoToRoleSchedule,
}) => {
  // Data selecionada (Padrão: 17 de Novembro de 2026, ou hoje se preferir)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Inicializa em 17/11/2026 (mesma data do modelo do usuário na imagem)
    return new Date(2026, 10, 17);
  });

  // Turno atual (caso o usuário queira alternar turnos no topo da página)
  const [currentShift, setCurrentShift] = useState<ShiftConfig>(shift);

  useEffect(() => {
    setCurrentShift(shift);
  }, [shift]);

  // Edição inline de SOLICITADO e ANTEC.
  // key: `${categoryKey}_solicitado` ou `${categoryKey}_antec`
  const [editOverrides, setEditOverrides] = useState<Record<string, number>>({});

  // Colaborador / Categoria selecionada para visualização detalhada no Modal
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<StaffingRowData | null>(null);

  // Formatação de string da data (YYYY-MM-DD)
  const dateStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Formatação amigável para exibição
  const formattedDisplayDate = useMemo(() => {
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const y = selectedDate.getFullYear();
    const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const weekDay = weekDays[selectedDate.getDay()];
    return {
      full: `${d}/${m}/${y}`,
      withWeekDay: `${weekDay}, ${d}/${m}/${y}`,
      d,
      m,
      y,
    };
  }, [selectedDate]);

  // Navegação de dias
  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));
  };

  // Computa as linhas e totais para o dia e turno selecionados
  const { rows, totals } = useMemo(() => {
    const res = computeDailyStaffing(currentShift, selectedDate, employees);

    // Aplica eventuais edições da sessão corrente sobre os valores
    const updatedRows = res.rows.map((r) => {
      const customSol = editOverrides[`${r.key}_sol`];
      const customAnt = editOverrides[`${r.key}_ant`];

      const sol = customSol !== undefined ? customSol : r.solicitado;
      const ant = customAnt !== undefined ? customAnt : r.antec;
      const aDisp = r.disponivel - sol + ant;

      return {
        ...r,
        solicitado: sol,
        antec: ant,
        aDisposicao: aDisp,
      };
    });

    // Recalcula totais
    const updatedTotals = updatedRows.reduce(
      (acc, r) => ({
        headcount: acc.headcount + r.headcount,
        atestados: acc.atestados + r.atestados,
        folga: acc.folga + r.folga,
        ferias: acc.ferias + r.ferias,
        treinamento: acc.treinamento + r.treinamento,
        exame: acc.exame + r.exame,
        disponivel: acc.disponivel + r.disponivel,
        solicitado: acc.solicitado + r.solicitado,
        antec: acc.antec + r.antec,
        aDisposicao: acc.aDisposicao + r.aDisposicao,
      }),
      {
        headcount: 0,
        atestados: 0,
        folga: 0,
        ferias: 0,
        treinamento: 0,
        exame: 0,
        disponivel: 0,
        solicitado: 0,
        antec: 0,
        aDisposicao: 0,
      }
    );

    return { rows: updatedRows, totals: updatedTotals };
  }, [currentShift, selectedDate, employees, editOverrides]);

  // Manipulador de edição de Solicitado e Antec
  const handleUpdateOverride = (categoryKey: string, field: 'sol' | 'ant', value: number) => {
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    setEditOverrides((prev) => ({
      ...prev,
      [`${categoryKey}_${field}`]: safeVal,
    }));

    // Persiste no localStorage
    const currentSol = field === 'sol' ? safeVal : (editOverrides[`${categoryKey}_sol`] ?? rows.find((r) => r.key === categoryKey)?.solicitado ?? 0);
    const currentAnt = field === 'ant' ? safeVal : (editOverrides[`${categoryKey}_ant`] ?? rows.find((r) => r.key === categoryKey)?.antec ?? 0);
    saveStaffingOverrides(currentShift.id, dateStr, categoryKey, currentSol, currentAnt);
  };

  // Exportar para Excel
  const handleExportExcel = async () => {
    await exportDailyStaffingToExcel({
      shift: currentShift,
      targetDate: selectedDate,
      rows,
      totals,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 sm:p-8 flex flex-col font-sans">
      <div className="max-w-7xl w-full mx-auto space-y-5">
        {/* Top: Voltar e Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition cursor-pointer self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Turno</span>
          </button>

          {/* Seletor de Turnos (se houver mais de um) */}
          {allShifts && allShifts.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              {allShifts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentShift(s);
                    if (onSelectShift) onSelectShift(s);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentShift.id === s.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{s.emoji}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Botão Exportar Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>

        {/* Barra de Título e Seletor de Data */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 text-2xl">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Painel Efetivo Diário
                </h1>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Controle de Pessoas
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                <span>{currentShift.emoji} {currentShift.title}</span>
                <span>•</span>
                <span>Jornada: {currentShift.timeRange}</span>
              </p>
            </div>
          </div>

          {/* Toolbar de Navegação por Data */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToday}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition"
            >
              Hoje
            </button>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={handlePrevDay}
                title="Dia Anterior"
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative flex items-center px-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <input
                  type="date"
                  value={dateStr}
                  onChange={handleDateChange}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleNextDay}
                title="Próximo Dia"
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              {formattedDisplayDate.withWeekDay}
            </div>
          </div>
        </div>

        {/* Cards de Métricas do Dia (KPIs Rápidos) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Previsto (HC)</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totals.headcount}</div>
            <span className="text-[10px] text-slate-400 font-medium">Cadastrados no turno</span>
          </div>

          <div className="bg-cyan-50/70 p-3.5 rounded-xl border border-cyan-200 shadow-2xs">
            <div className="flex items-center justify-between text-cyan-700 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Disponíveis</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-cyan-900">{totals.disponivel}</div>
            <span className="text-[10px] text-cyan-700 font-medium">Trabalhando hoje</span>
          </div>

          <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Folgas</span>
              <span>⚪</span>
            </div>
            <div className="text-2xl font-black text-rose-900">{totals.folga}</div>
            <span className="text-[10px] text-rose-700 font-medium">De folga pela escala</span>
          </div>

          <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 shadow-2xs">
            <div className="flex items-center justify-between text-purple-700 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Férias</span>
              <span>🏖️</span>
            </div>
            <div className="text-2xl font-black text-purple-900">{totals.ferias}</div>
            <span className="text-[10px] text-purple-700 font-medium">Férias ativas</span>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Atestados/INSS</span>
              <span>🏥</span>
            </div>
            <div className="text-2xl font-black text-amber-900">{totals.atestados}</div>
            <span className="text-[10px] text-amber-700 font-medium">Afastamentos médicos</span>
          </div>

          <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200 shadow-2xs">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Treinamento</span>
              <span>📚</span>
            </div>
            <div className="text-2xl font-black text-indigo-900">{totals.treinamento}</div>
            <span className="text-[10px] text-indigo-700 font-medium">Capacitações</span>
          </div>
        </div>

        {/* TABELA PRINCIPAL ESTILO EXCEL (Fiel à imagem fornecida) */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
          {/* Header Superior "PESSOAS" */}
          <div className="bg-slate-800 text-white text-center py-2.5 font-black text-sm tracking-widest border-b border-slate-700">
            PESSOAS
          </div>

          {/* Subheader: Turno | CONTROLE DE PESSOAS | Data */}
          <div className="grid grid-cols-12 border-b border-slate-300 bg-slate-100 text-xs font-bold">
            <div className="col-span-3 sm:col-span-3 py-2 px-3 text-center border-r border-slate-300 font-black text-rose-700 uppercase tracking-wider flex items-center justify-center">
              {currentShift.title}
            </div>
            <div className="col-span-6 sm:col-span-6 py-2 px-3 text-center border-r border-slate-300 text-slate-800 font-black tracking-wider flex items-center justify-center">
              CONTROLE DE PESSOAS
            </div>
            <div className="col-span-3 sm:col-span-3 py-2 px-3 text-center text-slate-800 font-black flex items-center justify-center">
              {formattedDisplayDate.full}
            </div>
          </div>

          {/* Grade Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-200/90 text-slate-800 font-extrabold border-b border-slate-300 select-none">
                  <th className="py-2.5 px-3 text-left border-r border-slate-300 min-w-[200px]">
                    CATEGORIA
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[90px]" title="Headcount Total Cadastrado">
                    PREVISTO / HC
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[80px]" title="Atestados Médicos">
                    ATESTADOS
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[80px] bg-rose-100 text-rose-950" title="Folgas da Escala">
                    FOLGA
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[80px] bg-rose-100 text-rose-950" title="Férias Programadas">
                    FÉRIAS
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[90px]" title="Colaboradores em Treinamento">
                    TREINAMENTO
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[80px] bg-cyan-100 text-cyan-950 font-black" title="Efetivo Disponível para Trabalhar">
                    DISP.
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[95px] bg-slate-50" title="Efetivo Solicitado pela Operação (Editável)">
                    SOLICITADO
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[80px] bg-slate-50" title="Horas Antecipadas / Reforço (Editável)">
                    ANTEC.
                  </th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300 min-w-[85px] bg-cyan-100 text-cyan-950 font-black" title="À Disposição Final (DISP - Solicitado + Antec)">
                    À DISP.
                  </th>
                  <th className="py-2.5 px-2 text-center min-w-[70px]">
                    AÇÃO
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="hover:bg-blue-50/40 transition group"
                  >
                    {/* Categoria */}
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0">{row.emoji}</span>
                        <span className="truncate">{row.label}</span>
                      </div>
                    </td>

                    {/* Previsto HC */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-semibold text-slate-700">
                      {row.headcount}
                    </td>

                    {/* Atestados */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-semibold text-slate-700">
                      {row.atestados > 0 ? (
                        <span className="font-bold text-amber-700">{row.atestados}</span>
                      ) : (
                        0
                      )}
                    </td>

                    {/* Folga (Fundo rosa/salmão fiel ao Excel) */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 bg-rose-50/70 font-bold text-rose-900">
                      {row.folga}
                    </td>

                    {/* Férias (Fundo rosa/salmão fiel ao Excel) */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 bg-rose-50/70 font-bold text-rose-900">
                      {row.ferias}
                    </td>

                    {/* Treinamento */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-semibold text-slate-700">
                      {row.treinamento > 0 ? (
                        <span className="font-bold text-indigo-700">{row.treinamento}</span>
                      ) : (
                        0
                      )}
                    </td>

                    {/* DISP. (Fundo ciano brilhante fiel ao Excel) */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 bg-cyan-100/90 font-black text-cyan-950 text-sm">
                      {row.disponivel}
                    </td>

                    {/* Solicitado (Editável) */}
                    <td className="py-1 px-1.5 text-center border-r border-slate-200 bg-slate-50/60">
                      <input
                        type="number"
                        min="0"
                        value={row.solicitado}
                        onChange={(e) => handleUpdateOverride(row.key, 'sol', Number(e.target.value))}
                        className="w-16 py-1 text-center font-bold text-xs bg-white border border-slate-300 rounded-md shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </td>

                    {/* Antec (Editável) */}
                    <td className="py-1 px-1.5 text-center border-r border-slate-200 bg-slate-50/60">
                      <input
                        type="number"
                        min="0"
                        value={row.antec}
                        onChange={(e) => handleUpdateOverride(row.key, 'ant', Number(e.target.value))}
                        className="w-16 py-1 text-center font-bold text-xs bg-white border border-slate-300 rounded-md shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </td>

                    {/* À DISP. (Fundo ciano brilhante fiel ao Excel) */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 bg-cyan-100/90 font-black text-cyan-950 text-sm">
                      {row.aDisposicao}
                    </td>

                    {/* Botão de Detalhes / Ver Nomes */}
                    <td className="py-1 px-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryDetails(row)}
                        title="Ver colaboradores e situação no dia"
                        className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Rodapé: TOTAL GERAL */}
              <tfoot>
                <tr className="bg-slate-200 font-black text-slate-900 border-t-2 border-slate-400 text-xs">
                  <td className="py-2.5 px-3 border-r border-slate-300 font-extrabold tracking-wider">
                    TOTAL GERAL
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 font-extrabold">
                    {totals.headcount}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 font-extrabold text-amber-800">
                    {totals.atestados}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 bg-rose-200/80 text-rose-950 font-black">
                    {totals.folga}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 bg-rose-200/80 text-rose-950 font-black">
                    {totals.ferias}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 font-extrabold text-indigo-900">
                    {totals.treinamento}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 bg-cyan-200 text-cyan-950 font-black text-sm">
                    {totals.disponivel}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 font-extrabold">
                    {totals.solicitado}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 font-extrabold">
                    {totals.antec}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 bg-cyan-200 text-cyan-950 font-black text-sm">
                    {totals.aDisposicao}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    -
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Nota explicativa de cálculo */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">💡 Como é calculado:</span>
            <span>DISP. = PREVISTO − (ATESTADOS + FOLGA + FÉRIAS + TREINAMENTO)</span>
            <span>•</span>
            <span>À DISP. = DISP. − SOLICITADO + ANTEC.</span>
          </div>
          <span className="text-[10px] text-slate-500">
            * Valores de Solicitado e Antecipação são salvos automaticamente no banco local.
          </span>
        </div>
      </div>

      {/* MODAL / DRAWER DE DETALHAMENTO DE COLABORADORES DA CATEGORIA */}
      {selectedCategoryDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedCategoryDetails.emoji}</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedCategoryDetails.label}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Situação em {formattedDisplayDate.withWeekDay} ({selectedCategoryDetails.headcount} cadastrados)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onGoToRoleSchedule && (
                  <button
                    type="button"
                    onClick={() => {
                      onGoToRoleSchedule(selectedCategoryDetails.roleName);
                      setSelectedCategoryDetails(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition"
                  >
                    <span>Ver Escala Mensal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCategoryDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo com Lista de Colaboradores Agrupados */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-cyan-50 border border-cyan-200 p-2 rounded-xl">
                  <div className="font-black text-cyan-900 text-lg">{selectedCategoryDetails.disponivel}</div>
                  <div className="text-[10px] font-bold text-cyan-700 uppercase">Trabalhando</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                  <div className="font-black text-rose-900 text-lg">{selectedCategoryDetails.folga}</div>
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Folga</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-2 rounded-xl">
                  <div className="font-black text-purple-900 text-lg">{selectedCategoryDetails.ferias}</div>
                  <div className="text-[10px] font-bold text-purple-700 uppercase">Férias</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
                  <div className="font-black text-amber-900 text-lg">
                    {selectedCategoryDetails.atestados + selectedCategoryDetails.treinamento}
                  </div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Atest./Trein.</div>
                </div>
              </div>

              {/* Lista dos Colaboradores */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lista de Colaboradores:
                </h4>
                {selectedCategoryDetails.employees.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Nenhum colaborador cadastrado nesta categoria neste turno.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedCategoryDetails.employees.map(({ employee, status, statusLabel, teamName }) => {
                      let badgeClass = 'bg-cyan-50 text-cyan-800 border-cyan-200';
                      if (status === 'FOLGA' || status === 'FOLGA_FERIADO' || status === 'DISPENSA') {
                        badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
                      } else if (status === 'FERIAS') {
                        badgeClass = 'bg-purple-50 text-purple-800 border-purple-200';
                      } else if (status === 'ATESTADO' || status === 'INSS') {
                        badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                      } else if (status === 'TREINAMENTO') {
                        badgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                      }

                      return (
                        <div
                          key={employee.id}
                          className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-[10px] text-slate-400 font-bold">
                              #{employee.registration || 'S/M'}
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {employee.name}
                            </span>
                            <span className="text-[10px] text-slate-400">({teamName})</span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedCategoryDetails(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
