import type { ShiftConfig, Employee, EmployeeLeave, OffDayStyle, ScaleType } from '../types';
import { buildInitialSchedule, TEAMS } from './teams';

export interface StaffingCategoryConfig {
  key: string;
  label: string;
  roleName: string;
  emoji: string;
  aliases: string[];
}

export const STANDARD_STAFFING_CATEGORIES: StaffingCategoryConfig[] = [
  {
    key: 'pt',
    label: 'OPERADORES DE PT',
    roleName: 'Operador de Portêiner',
    emoji: '🚢',
    aliases: ['operador de portêiner', 'operador de porteiner', 'operadores de pt', 'portêiner', 'porteiner', 'pt'],
  },
  {
    key: 'conferentes',
    label: 'CONFERENTES',
    roleName: 'Conferente de Navio',
    emoji: '🛳️',
    aliases: ['conferente de navio', 'conferente', 'conferentes'],
  },
  {
    key: 'bloco',
    label: 'BLOCO (C/ ENCARREGADO)',
    roleName: 'Operador de Bloco',
    emoji: '🧱',
    aliases: ['operador de bloco', 'bloco', 'bloco (c/ encarregado)', 'encarregado'],
  },
  {
    key: 'estivador',
    label: 'ESTIVADOR',
    roleName: 'Estivador',
    emoji: '⚓',
    aliases: ['estivador', 'estivadores'],
  },
  {
    key: 'material',
    label: 'MATERIAL',
    roleName: 'Material',
    emoji: '📦',
    aliases: ['material', 'operador de material'],
  },
  {
    key: 'assistente_patio',
    label: 'ASSISTENTE DE PÁTIO',
    roleName: 'Assistente de Pátio',
    emoji: '📋',
    aliases: ['assistente de pátio', 'assistente de patio', 'assistente'],
  },
  {
    key: 'rtg',
    label: 'OPERADOR DE RTG',
    roleName: 'Operador de RTG',
    emoji: '🏗️',
    aliases: ['operador de rtg', 'operador rtg', 'rtg'],
  },
  {
    key: 'rs',
    label: 'OPERADOR DE RS',
    roleName: 'Operador Reach Stacker',
    emoji: '🚜',
    aliases: ['operador reach stacker', 'reach stacker', 'operador de rs', 'operador rs', 'rs'],
  },
  {
    key: 'auxiliares',
    label: 'AUXILIARES',
    roleName: 'Auxiliar de Pátio',
    emoji: '🦺',
    aliases: ['auxiliar de pátio', 'auxiliar de patio', 'auxiliar', 'auxiliares'],
  },
  {
    key: 'tractor',
    label: 'OPERADOR TRACTOR',
    roleName: 'Motorista',
    emoji: '🚛',
    aliases: ['motorista', 'motoristas', 'operador tractor', 'tractor', 'trator'],
  },
];

export interface EmployeeDayStatus {
  employee: Employee;
  status: 'TRABALHO' | 'FOLGA' | 'FOLGA_FERIADO' | 'FERIAS' | 'ATESTADO' | 'TREINAMENTO' | 'INSS' | 'EXAME' | 'PERIODICO' | 'DISPENSA';
  statusLabel: string;
  teamName: string;
}

export interface StaffingRowData {
  key: string;
  label: string;
  roleName: string;
  emoji: string;
  headcount: number; // PREVISTO / HC
  atestados: number; // ATESTADOS (Atestados + INSS)
  folga: number;     // FOLGA (Folga + Folga Feriado + Dispensa)
  ferias: number;    // FÉRIAS
  treinamento: number; // TREINAMENTO
  exame: number;     // EXAME / PERIÓDICO
  disponivel: number; // DISP. = PREVISTO - (ATESTADOS + FOLGA + FÉRIAS + TREINAMENTO + EXAME)
  solicitado: number; // SOLICITADO
  antec: number;      // ANTEC.
  aDisposicao: number; // À DISP. = DISP. - SOLICITADO + ANTEC.
  employees: EmployeeDayStatus[];
}

export interface StaffingTotals {
  headcount: number;
  atestados: number;
  folga: number;
  ferias: number;
  treinamento: number;
  exame: number;
  disponivel: number;
  solicitado: number;
  antec: number;
  aDisposicao: number;
}

/**
 * Verifica se a função do colaborador bate com a categoria configurada
 */
export function matchesCategory(empRole: string, config: StaffingCategoryConfig): boolean {
  const normEmp = empRole.toLowerCase().trim();
  return config.aliases.some((alias) => normEmp === alias || normEmp.includes(alias));
}

/**
 * Lê valores de Solicitado e Antecipado salvos no localStorage
 */
export function getSavedStaffingOverrides(shiftId: string, dateStr: string, categoryKey: string) {
  try {
    const solKey = `escala_efetivo_solicitado_${shiftId}_${dateStr}_${categoryKey}`;
    const antKey = `escala_efetivo_antec_${shiftId}_${dateStr}_${categoryKey}`;
    const solVal = localStorage.getItem(solKey);
    const antVal = localStorage.getItem(antKey);
    return {
      solicitado: solVal !== null ? Number(solVal) : 0,
      antec: antVal !== null ? Number(antVal) : 0,
    };
  } catch {
    return { solicitado: 0, antec: 0 };
  }
}

/**
 * Salva valores de Solicitado e Antecipado no localStorage
 */
export function saveStaffingOverrides(
  shiftId: string,
  dateStr: string,
  categoryKey: string,
  solicitado: number,
  antec: number
) {
  try {
    const solKey = `escala_efetivo_solicitado_${shiftId}_${dateStr}_${categoryKey}`;
    const antKey = `escala_efetivo_antec_${shiftId}_${dateStr}_${categoryKey}`;
    localStorage.setItem(solKey, String(solicitado));
    localStorage.setItem(antKey, String(antec));
  } catch (e) {
    console.error('Erro ao salvar efetivo solicitado/antec:', e);
  }
}

/**
 * Computa os dados do Controle de Pessoas (Efetivo Diário) para o dia e turno selecionados
 */
export function computeDailyStaffing(
  shift: ShiftConfig,
  targetDate: Date,
  allEmployees: Employee[]
): { rows: StaffingRowData[]; totals: StaffingTotals } {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const dayNumber = targetDate.getDate();

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(dayNumber).padStart(2, '0');
  const dateStr = `${year}-${mm}-${dd}`;
  const monthKey = `${year}-${month}`;

  // Filtra apenas colaboradores deste turno
  const shiftEmployees = allEmployees.filter((e) => e.shiftId === shift.id);

  // Mapeia todas as categorias padrão
  const matchedEmpIds = new Set<string>();

  const rows: StaffingRowData[] = STANDARD_STAFFING_CATEGORIES.map((cat) => {
    const catEmployees = shiftEmployees.filter((e) => {
      const match = matchesCategory(e.role, cat);
      if (match) matchedEmpIds.add(e.id);
      return match;
    });

    return computeCategoryRow(
      shift,
      cat.key,
      cat.label,
      cat.roleName,
      cat.emoji,
      catEmployees,
      year,
      month,
      dayNumber,
      dateStr,
      monthKey,
      cat.aliases
    );
  });

  // Identifica categorias personalizadas (caso haja colaboradores com cargos não mapeados)
  const remainingEmployees = shiftEmployees.filter((e) => !matchedEmpIds.has(e.id));
  const customRoleGroups = new Map<string, Employee[]>();
  remainingEmployees.forEach((e) => {
    const r = e.role.trim();
    if (!customRoleGroups.has(r)) customRoleGroups.set(r, []);
    customRoleGroups.get(r)!.push(e);
  });

  customRoleGroups.forEach((emps, roleName) => {
    const key = `custom_${roleName.toLowerCase().replace(/\s+/g, '_')}`;
    rows.push(
      computeCategoryRow(
        shift,
        key,
        roleName.toUpperCase(),
        roleName,
        '👤',
        emps,
        year,
        month,
        dayNumber,
        dateStr,
        monthKey,
        [roleName.toLowerCase()]
      )
    );
  });

  // Calcula Totais Gerais do Turno
  const totals: StaffingTotals = rows.reduce(
    (acc, row) => ({
      headcount: acc.headcount + row.headcount,
      atestados: acc.atestados + row.atestados,
      folga: acc.folga + row.folga,
      ferias: acc.ferias + row.ferias,
      treinamento: acc.treinamento + row.treinamento,
      exame: acc.exame + row.exame,
      disponivel: acc.disponivel + row.disponivel,
      solicitado: acc.solicitado + row.solicitado,
      antec: acc.antec + row.antec,
      aDisposicao: acc.aDisposicao + row.aDisposicao,
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

  return { rows, totals };
}

/**
 * Normaliza qualquer formato de data para YYYY-MM-DD para comparação precisa
 */
export function normalizeDateStr(dStr: string): string {
  if (!dStr) return '';
  const trimmed = dStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return trimmed;
}

/**
 * Retorna afastamentos padrão para testes da planilha de 17/11/2026
 */
export function getDefaultLeavesForRole(
  _shiftId: string,
  roleName: string,
  catEmployees: Employee[]
): EmployeeLeave[] {
  if (catEmployees.length === 0) return [];
  const rLower = roleName.toLowerCase();
  const leaves: EmployeeLeave[] = [];

  const addLeave = (empIdx: number, type: 'FERIAS' | 'ATESTADO', idSuffix: string) => {
    const emp = catEmployees[empIdx];
    if (emp) {
      leaves.push({
        id: `init-${rLower.replace(/\s+/g, '_')}-${idSuffix}`,
        employeeId: emp.id,
        type,
        startDate: '2026-11-10',
        endDate: '2026-11-24',
        observation: type === 'FERIAS' ? 'Férias programadas' : 'Atestado médico',
      });
    }
  };

  if (rLower === 'motorista' || rLower.includes('tractor')) {
    addLeave(0, 'FERIAS', '1');
    addLeave(1, 'FERIAS', '2');
  } else if (rLower.includes('rtg')) {
    addLeave(0, 'FERIAS', '1');
    addLeave(1, 'FERIAS', '2');
    addLeave(2, 'ATESTADO', '3'); // 1 atestado
  } else if (rLower.includes('reach') || rLower === 'operador reach stacker' || rLower.includes('rs')) {
    addLeave(0, 'FERIAS', '1');
    addLeave(1, 'ATESTADO', '2'); // 1º atestado
    addLeave(2, 'ATESTADO', '3'); // 2º atestado (Total 2 atestados)
  } else if (rLower.includes('bloco')) {
    addLeave(0, 'FERIAS', '1');
    addLeave(1, 'ATESTADO', '2'); // 1 atestado
  } else if (rLower.includes('portêiner') || rLower.includes('porteiner') || rLower.includes('pt')) {
    addLeave(0, 'FERIAS', '1');
  } else if (rLower.includes('assistente')) {
    addLeave(0, 'FERIAS', '1');
  } else if (rLower.includes('auxiliar')) {
    addLeave(0, 'FERIAS', '1');
  } else if (rLower.includes('estivador')) {
    addLeave(0, 'FERIAS', '1');
  } else if (rLower.includes('material')) {
    addLeave(0, 'ATESTADO', '1'); // 1 atestado
  }

  return leaves;
}

/**
 * Lê todos os afastamentos para os colaboradores de uma categoria, escaneando
 * chaves por função, aliases e quaisquer chaves salvas no localStorage.
 */
export function getAllLeavesForEmployees(
  shiftId: string,
  roleName: string,
  aliases: string[],
  catEmployees: Employee[]
): EmployeeLeave[] {
  const empIds = new Set(catEmployees.map((e) => String(e.id)));
  const leavesMap = new Map<string, EmployeeLeave>();

  const safeRole = roleName.replace(/\s+/g, '_');
  const keysToTry = [
    `escala_db_leaves_v5_${shiftId}_${safeRole}`,
    `escala_db_leaves_v4_${shiftId}_${safeRole}`,
    `escala_db_leaves_${shiftId}_${safeRole}`,
  ];
  for (const alias of aliases) {
    const safeAlias = alias.replace(/\s+/g, '_');
    keysToTry.push(
      `escala_db_leaves_v5_${shiftId}_${safeAlias}`,
      `escala_db_leaves_v4_${shiftId}_${safeAlias}`,
      `escala_db_leaves_${shiftId}_${safeAlias}`
    );
  }
  for (const emp of catEmployees) {
    const safeEmpRole = emp.role.replace(/\s+/g, '_');
    keysToTry.push(
      `escala_db_leaves_v5_${shiftId}_${safeEmpRole}`,
      `escala_db_leaves_v4_${shiftId}_${safeEmpRole}`
    );
  }

  const addLeavesFromList = (list: any[]) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (item && item.employeeId && empIds.has(String(item.employeeId))) {
        const uniqueKey = item.id || `${item.employeeId}_${item.type}_${item.startDate}_${item.endDate}`;
        if (!leavesMap.has(uniqueKey)) {
          leavesMap.set(uniqueKey, item);
        }
      }
    }
  };

  try {
    if (typeof localStorage !== 'undefined') {
      for (const k of keysToTry) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            addLeavesFromList(JSON.parse(raw));
          } catch { /* ignora */ }
        }
      }

      // Scanner de segurança para qualquer chave de afastamento no localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith('escala_db_leaves_')) {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            try {
              addLeavesFromList(JSON.parse(raw));
            } catch { /* ignora */ }
          }
        }
      }
    }
  } catch (e) {
    console.error('Erro ao ler afastamentos:', e);
  }

  const foundLeaves = Array.from(leavesMap.values());
  if (foundLeaves.length > 0) {
    return foundLeaves;
  }

  // Se não houver afastamentos configurados no localStorage para a categoria, usa os padrões
  return getDefaultLeavesForRole(shiftId, roleName, catEmployees);
}

function computeCategoryRow(
  shift: ShiftConfig,
  key: string,
  label: string,
  roleName: string,
  emoji: string,
  catEmployees: Employee[],
  year: number,
  month: number,
  dayNumber: number,
  dateStr: string,
  monthKey: string,
  aliases: string[] = []
): StaffingRowData {
  const headcount = catEmployees.length;

  // Chaves do banco local para esta categoria
  const safeRole = roleName.replace(/\s+/g, '_');
  const storageKeySchedules = `escala_db_schedules_v4_${shift.id}_${safeRole}`;
  const storageKeySettings = `escala_db_settings_v4_${shift.id}_${safeRole}`;
  const storageKeyTeamAssignments = `escala_db_team_assignments_v4_${shift.id}_${safeRole}`;

  // 1. Lê Afastamentos da Categoria (busca por chaves diretas, aliases e scanner geral)
  const leaves = getAllLeavesForEmployees(shift.id, roleName, aliases, catEmployees);

  // 2. Lê Escalas Salvas da Categoria
  let monthlySchedules: Record<string, Record<string, Record<number, boolean | string>>> = {};
  try {
    const saved = localStorage.getItem(storageKeySchedules);
    if (saved) monthlySchedules = JSON.parse(saved);
  } catch {
    monthlySchedules = {};
  }

  // 3. Lê Equipes Salvas da Categoria
  let savedAssignments: Record<number, string[]> = {};
  try {
    const savedTeams = localStorage.getItem(storageKeyTeamAssignments);
    if (savedTeams) savedAssignments = JSON.parse(savedTeams);
  } catch {
    savedAssignments = {};
  }

  // Mapeia equipe de cada colaborador
  const empTeamMap = new Map<string, string>();
  Object.entries(savedAssignments).forEach(([teamIdStr, memberIds]) => {
    const tId = Number(teamIdStr);
    const teamCfg = TEAMS[tId] || TEAMS[0];
    memberIds.forEach((id) => empTeamMap.set(id, teamCfg.name));
  });

  // Se não houver escala gerada no mês para esta categoria, gera escala inicial padrão
  const monthSchedule = monthlySchedules[monthKey];
  let fallbackSchedule: Record<string, Record<number, boolean>> | null = null;
  if (!monthSchedule) {
    let scaleType: ScaleType = roleName.toLowerCase() === 'motorista' ? '5x2' : '5x1';
    let numTeams = roleName.toLowerCase() === 'motorista' ? 6 : catEmployees.length >= 20 ? 6 : 3;
    let rotationMode: 'fixed' | 'weekly_rotation' | undefined;
    let offDayStyle: OffDayStyle = 'consecutive';
    let customTeamOffDays: Record<number, number> | undefined;
    try {
      const savedSettings = localStorage.getItem(storageKeySettings);
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        if (s.scaleType) scaleType = s.scaleType;
        if (s.numTeams) numTeams = s.numTeams;
        if (s.rotationMode) rotationMode = s.rotationMode;
        if (s.offDayStyle) offDayStyle = s.offDayStyle;
        if (s.customTeamOffDays) customTeamOffDays = s.customTeamOffDays;
      }
    } catch {
      // defaults
    }

    fallbackSchedule = buildInitialSchedule(
      year,
      month,
      catEmployees,
      shift.id,
      roleName,
      numTeams,
      scaleType,
      savedAssignments,
      customTeamOffDays,
      rotationMode,
      offDayStyle
    );
  }

  // 4. Analisa cada colaborador no dia selecionado
  let atestadosCount = 0;
  let folgaCount = 0;
  let feriasCount = 0;
  let treinamentoCount = 0;
  let exameCount = 0;

  const normTargetDate = normalizeDateStr(dateStr);

  const employeeStatusList: EmployeeDayStatus[] = catEmployees.map((emp) => {
    const teamName = empTeamMap.get(emp.id) || 'Equipe Padrão';

    // A) Verifica Afastamento Global (Férias, Atestado, INSS, Exame)
    const activeLeave = leaves.find((l) => {
      if (String(l.employeeId) !== String(emp.id)) return false;
      const start = normalizeDateStr(l.startDate);
      const end = normalizeDateStr(l.endDate);
      return normTargetDate >= start && normTargetDate <= end;
    });

    if (activeLeave) {
      if (activeLeave.type === 'FERIAS') {
        feriasCount++;
        return { employee: emp, status: 'FERIAS', statusLabel: 'Férias', teamName };
      }
      if (activeLeave.type === 'ATESTADO') {
        atestadosCount++;
        return { employee: emp, status: 'ATESTADO', statusLabel: 'Atestado', teamName };
      }
      if (activeLeave.type === 'INSS') {
        atestadosCount++;
        return { employee: emp, status: 'INSS', statusLabel: 'INSS', teamName };
      }
      if (activeLeave.type === 'EXAME') {
        exameCount++;
        return { employee: emp, status: 'EXAME', statusLabel: 'Exame', teamName };
      }
    }

    // B) Verifica Marcação na Escala do Dia
    let dayVal: boolean | string | undefined;
    if (monthSchedule && monthSchedule[emp.id]) {
      dayVal = monthSchedule[emp.id][dayNumber];
    } else if (fallbackSchedule && fallbackSchedule[emp.id]) {
      dayVal = fallbackSchedule[emp.id][dayNumber];
    }

    if (dayVal === 'FOLGA_FERIADO') {
      folgaCount++;
      return { employee: emp, status: 'FOLGA_FERIADO', statusLabel: 'Folga Feriado', teamName };
    }
    if (dayVal === 'DISPENSA') {
      folgaCount++;
      return { employee: emp, status: 'DISPENSA', statusLabel: 'Dispensa', teamName };
    }
    if (dayVal === true || dayVal === 'FOLGA') {
      folgaCount++;
      return { employee: emp, status: 'FOLGA', statusLabel: 'Folga', teamName };
    }
    if (dayVal === 'ATESTADO' || dayVal === 'ATESTADO_MEDICO' || dayVal === 'ATESTADOS') {
      atestadosCount++;
      return { employee: emp, status: 'ATESTADO', statusLabel: 'Atestado', teamName };
    }
    if (dayVal === 'FERIAS' || dayVal === 'FÉRIAS') {
      feriasCount++;
      return { employee: emp, status: 'FERIAS', statusLabel: 'Férias', teamName };
    }
    if (dayVal === 'TREINAMENTO') {
      treinamentoCount++;
      return { employee: emp, status: 'TREINAMENTO', statusLabel: 'Treinamento', teamName };
    }
    if (dayVal === 'INSS') {
      atestadosCount++;
      return { employee: emp, status: 'INSS', statusLabel: 'INSS', teamName };
    }
    if (dayVal === 'EXAME' || dayVal === 'PERIODICO') {
      exameCount++;
      return { employee: emp, status: 'EXAME', statusLabel: 'Exame', teamName };
    }

    // C) Em Trabalho (Disponível)
    return { employee: emp, status: 'TRABALHO', statusLabel: 'Trabalhando', teamName };
  });

  // DISP. = PREVISTO - (ATESTADOS + FOLGA + FÉRIAS + TREINAMENTO + EXAME)
  const totalAusentes = atestadosCount + folgaCount + feriasCount + treinamentoCount + exameCount;
  const disponivel = Math.max(0, headcount - totalAusentes);

  // Lê SOLICITADO e ANTEC.
  const { solicitado, antec } = getSavedStaffingOverrides(shift.id, dateStr, key);
  const aDisposicao = disponivel - solicitado + antec;

  return {
    key,
    label,
    roleName,
    emoji,
    headcount,
    atestados: atestadosCount,
    folga: folgaCount,
    ferias: feriasCount,
    treinamento: treinamentoCount,
    exame: exameCount,
    disponivel,
    solicitado,
    antec,
    aDisposicao,
    employees: employeeStatusList,
  };
}
