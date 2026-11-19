import React, { useState, useMemo, useEffect, useRef } from 'react';
import type {
  ShiftConfig,
  Employee,
  CategoryScheduleSettings,
  GenerateFolgaOptions,
  EmployeeLeave,
  LeaveType,
  ScaleType,
  GenerationMode,
  CompensatorySundayMode,
} from '../types';
import {
  distributeEmployeesToTeams,
  getInitialTeamOffDay,
  computeTeamContinuityOffDays,
  buildTeamMonthOffDays,
  TEAMS,
  type TeamConfig,
} from '../utils/teams';
import { exportScheduleToExcel } from '../utils/exportToExcel';
import { RoleScheduleConfigModal } from './RoleScheduleConfigModal';
import { GenerateFolgaModal } from './GenerateFolgaModal';
import { LeaveModal } from './LeaveModal';
import {
  ArrowLeft,
  Wand2,
  Settings,
  UserPlus,
  RotateCcw,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MoreVertical,
  Trash2,
  FileSpreadsheet,
  GripVertical,
  ArrowUpDown,
  Edit3,
} from 'lucide-react';

interface RoleSchedulePageProps {
  shift: ShiftConfig;
  roleName: string;
  roleEmoji: string;
  onBack: () => void;
  onGoToRegistration: () => void;
  employees: Employee[];
  onReorderEmployees?: (newEmployees: Employee[]) => void;
}

interface DayColumn {
  dayNumber: number;
  dateKey: string;
  fullDate: string; // YYYY-MM-DD
  dayShort: string;
  dd: string;
  isSunday: boolean;
  isSaturday: boolean;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const generateMonthDays = (year: number, month: number): DayColumn[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const columns: DayColumn[] = [];

  const mm = String(month + 1).padStart(2, '0');

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeekIdx = date.getDay();
    const dayShort = dayNames[dayOfWeekIdx];
    const dd = String(d).padStart(2, '0');

    columns.push({
      dayNumber: d,
      dateKey: `${dd}/${mm}`,
      fullDate: `${year}-${mm}-${dd}`,
      dayShort,
      dd,
      isSunday: dayOfWeekIdx === 0,
      isSaturday: dayOfWeekIdx === 6,
    });
  }

  return columns;
};

// Valida se a distribuição de equipes está proporcional e balanceada (sem equipes infladas ou vazias)
const isTeamDistributionBalanced = (
  assignments: Record<number, string[]> | undefined,
  numTeams: number,
  totalEmployees: number
): boolean => {
  if (!assignments) return false;
  const keys = Object.keys(assignments).map(Number);
  if (keys.length < numTeams) return false;

  const maxAllowed = Math.ceil(totalEmployees / numTeams) + 2;
  const minAllowed = totalEmployees >= numTeams ? 1 : 0;

  let totalAssigned = 0;
  for (let i = 0; i < numTeams; i++) {
    const list = assignments[i];
    if (!list || list.length < minAllowed || (totalEmployees >= numTeams && list.length > maxAllowed)) {
      return false;
    }
    totalAssigned += list.length;
  }
  return totalAssigned === totalEmployees;
};

// Re-exporta a regra que define o primeiro dia de folga por equipe
export { getInitialTeamOffDay };

// Gera folgas iniciais para Novembro/2026 para a categoria atual
const buildInitialNovemberSchedule = (
  employees: Employee[],
  shiftId: string,
  roleName: string,
  numTeams: number,
  scaleType: ScaleType,
  savedAssignments?: Record<number, string[]>,
  customTeamOffDays?: Record<number, number>
): Record<string, Record<number, boolean>> => {
  const schedule: Record<string, Record<number, boolean>> = {};
  const catEmployees = employees.filter(
    (e) => e.shiftId === shiftId && e.role.toLowerCase() === roleName.toLowerCase()
  );
  const cycleLen = scaleType === '5x1' ? 6 : scaleType === '5x2' ? 7 : scaleType === '6x1' ? 7 : 2;

  // Domingos em Novembro de 2026: 01, 08, 15, 22, 29 (5 domingos)
  const novSundays = [1, 8, 15, 22, 29];
  const numNovSundays = novSundays.length;

  let teamGroups: { teamId: number; memberIds: string[] }[] = [];
  if (savedAssignments && Object.keys(savedAssignments).length > 0) {
    teamGroups = Object.entries(savedAssignments).map(([tId, ids]) => ({
      teamId: Number(tId),
      memberIds: ids,
    }));
  } else {
    const teams = distributeEmployeesToTeams(catEmployees, numTeams);
    teamGroups = teams.map(({ team, members }) => ({
      teamId: team.id,
      memberIds: members.map((m) => m.id),
    }));
  }

  teamGroups.forEach(({ teamId, memberIds }) => {
    const firstOffDay = getInitialTeamOffDay(teamId, numTeams, scaleType, customTeamOffDays);

    memberIds.forEach((empId) => {
      const daysOff: Record<number, boolean> = {};
      for (let d = 1; d <= 30; d++) {
        if (scaleType === '5x2') {
          // Em 5x2: 2 folgas consecutivas (uma atrás da outra)
          daysOff[d] =
            ((d - firstOffDay) % 7 + 7) % 7 === 0 ||
            ((d - (firstOffDay + 1)) % 7 + 7) % 7 === 0;
        } else {
          daysOff[d] = ((d - firstOffDay) % cycleLen + cycleLen) % cycleLen === 0;
        }
      }
      schedule[empId] = daysOff;
    });

    // Distribuição de folga compensatória dominical em 5x1/6x1 para quem ficou com 0 domingos
    if (scaleType !== '5x2') {
      const zeroSundayEmpIds = memberIds.filter((empId) => {
        const offs = schedule[empId] || {};
        return novSundays.filter((s) => offs[s] === true).length === 0;
      });

      if (zeroSundayEmpIds.length > 0) {
        zeroSundayEmpIds.forEach((empId, idx) => {
          const targetSunday = novSundays[idx % numNovSundays];
          schedule[empId][targetSunday] = true;
        });
      }
    }
  });

  return schedule;
};

export const RoleSchedulePage: React.FC<RoleSchedulePageProps> = ({
  shift,
  roleName,
  roleEmoji,
  onBack,
  onGoToRegistration,
  employees,
  onReorderEmployees,
}) => {
  // Chaves do banco de dados local (localStorage) por turno e setor
  const storageKeySchedules = `escala_db_schedules_v4_${shift.id}_${roleName.replace(/\s+/g, '_')}`;
  const storageKeySettings = `escala_db_settings_v4_${shift.id}_${roleName.replace(/\s+/g, '_')}`;
  const storageKeyLeaves = `escala_db_leaves_v5_${shift.id}_${roleName.replace(/\s+/g, '_')}`;
  const storageKeyTeamAssignments = `escala_db_team_assignments_v4_${shift.id}_${roleName.replace(/\s+/g, '_')}`;
  const storageKeyMonthlyScales = `escala_db_monthly_scales_v4_${shift.id}_${roleName.replace(/\s+/g, '_')}`;
  const storageKeyMonthlyTeams = `escala_db_monthly_teams_v4_${shift.id}_${roleName.replace(/\s+/g, '_')}`;

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Colaboradores desta categoria/função no turno atual
  const categoryEmployees = useMemo(() => {
    return employees.filter(
      (emp) => emp.shiftId === shift.id && emp.role.toLowerCase() === roleName.toLowerCase()
    );
  }, [employees, shift.id, roleName]);

  const isMotorista = roleName.toLowerCase() === 'motorista';
  const defaultScaleType: ScaleType = isMotorista ? '5x2' : '5x1';
  const defaultNumTeams = isMotorista ? 6 : categoryEmployees.length >= 20 ? 6 : 3;

  // Mês e ano visualizados atualmente (Padrão: Novembro de 2026)
  const [viewMonth, setViewMonth] = useState<number>(10); // 10 = Novembro
  const [viewYear, setViewYear] = useState<number>(2026);
  const currentMonthKey = `${viewYear}-${viewMonth}`;

  // Escalas por mês (5x1, 5x2, etc.)
  const [monthlyScaleTypes, setMonthlyScaleTypes] = useState<Record<string, ScaleType>>(() => {
    try {
      const saved = localStorage.getItem(storageKeyMonthlyScales);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler escalas mensais:', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyMonthlyScales, JSON.stringify(monthlyScaleTypes));
    } catch (e) {
      console.error('Erro ao salvar escalas mensais:', e);
    }
  }, [monthlyScaleTypes, storageKeyMonthlyScales]);

  // Equipes por mês (sanitizado contra dados antigos corrompidos no localStorage)
  const [monthlyTeamAssignments, setMonthlyTeamAssignments] = useState<Record<string, Record<number, string[]>>>(() => {
    try {
      const saved = localStorage.getItem(storageKeyMonthlyTeams);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const safe: Record<string, Record<number, string[]>> = {};
          const numT = isMotorista ? 6 : categoryEmployees.length >= 20 ? 6 : 3;
          Object.entries(parsed).forEach(([mKey, ass]) => {
            if (isTeamDistributionBalanced(ass as any, numT, categoryEmployees.length)) {
              safe[mKey] = ass as Record<number, string[]>;
            }
          });
          return safe;
        }
      }
    } catch (e) {
      console.error('Erro ao ler divisões de equipes mensais:', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyMonthlyTeams, JSON.stringify(monthlyTeamAssignments));
    } catch (e) {
      console.error('Erro ao salvar divisões de equipes mensais:', e);
    }
  }, [monthlyTeamAssignments, storageKeyMonthlyTeams]);

  // 1. Settings state (carrega do banco local ou inicia padrão)
  const [settings, setSettings] = useState<CategoryScheduleSettings>(() => {
    try {
      const saved = localStorage.getItem(storageKeySettings);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.scaleType && parsed.numTeams) {
          // Se for motorista ou 20+ colaboradores e estiver com menos de 6 equipes, atualiza para 6
          if ((isMotorista || categoryEmployees.length >= 20) && parsed.numTeams < 6) {
            return {
              ...parsed,
              numTeams: 6,
            };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler configurações do banco local:', e);
    }
    return {
      scaleType: defaultScaleType,
      numTeams: defaultNumTeams,
    };
  });

  // Salva configurações no banco local
  useEffect(() => {
    try {
      localStorage.setItem(storageKeySettings, JSON.stringify(settings));
    } catch (e) {
      console.error('Erro ao salvar configurações no banco local:', e);
    }
  }, [settings, storageKeySettings]);

  // 2. Divisão e Alocação Flexível de Equipes (Permite qualquer tamanho por equipe, ex: 4 e 2)
  const [teamAssignments, setTeamAssignments] = useState<Record<number, string[]>>(() => {
    const initialNumTeams = isMotorista ? 6 : categoryEmployees.length >= 20 ? 6 : 3;
    try {
      const saved = localStorage.getItem(storageKeyTeamAssignments);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (isTeamDistributionBalanced(parsed, initialNumTeams, categoryEmployees.length)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error('Erro ao ler divisões de equipe do banco local:', e);
    }
    // Distribuição inicial padrão perfeitamente equilibrada
    const initialDist = distributeEmployeesToTeams(categoryEmployees, initialNumTeams);
    const initialMap: Record<number, string[]> = {};
    for (let i = 0; i < initialNumTeams; i++) {
      initialMap[i] = [];
    }
    initialDist.forEach(({ team, members }) => {
      initialMap[team.id] = members.map((m) => m.id);
    });
    return initialMap;
  });

  // Salva divisões de equipes no banco local sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyTeamAssignments, JSON.stringify(teamAssignments));
    } catch (e) {
      console.error('Erro ao salvar divisões de equipe no banco local:', e);
    }
  }, [teamAssignments, storageKeyTeamAssignments]);

  // Garante que qualquer colaborador novo cadastrado no setor apareça automaticamente na escala
  // e limpa rigorosamente quaisquer duplicidades em teamAssignments (seja mesma equipe ou equipes diferentes)
  // Além disso, se o número de equipes configuradas aumentou e há equipes vazias, redistribui proporcionalmente.
  useEffect(() => {
    const safeNum = Math.max(1, Math.min(settings.numTeams, TEAMS.length));
    const allAssigned = new Set<string>();
    let needsUpdate = false;

    const sanitized: Record<number, string[]> = {};
    for (let i = 0; i < safeNum; i++) {
      sanitized[i] = [];
      const list = teamAssignments[i] || [];
      list.forEach((id) => {
        const empExists = categoryEmployees.some((e) => e.id === id);
        if (empExists && !allAssigned.has(id)) {
          allAssigned.add(id);
          sanitized[i].push(id);
        } else {
          // ID duplicado ou colaborador removido do setor
          needsUpdate = true;
        }
      });
    }

    // Se houver equipes vazias ou qualquer equipe inflada de forma anômala
    const emptyActiveTeamsCount = Array.from({ length: safeNum }, (_, i) => sanitized[i].length).filter(
      (c) => c === 0
    ).length;
    const maxCountInTeams = Math.max(...Array.from({ length: safeNum }, (_, i) => sanitized[i].length), 0);
    const maxCapAllowed = Math.ceil(categoryEmployees.length / safeNum) + 2;

    if (
      (emptyActiveTeamsCount > 0 || (categoryEmployees.length >= 20 && maxCountInTeams > maxCapAllowed)) &&
      categoryEmployees.length >= safeNum
    ) {
      // Redistribuição limpa e proporcional para preencher todas as equipes ativas
      const freshDist = distributeEmployeesToTeams(categoryEmployees, safeNum);
      const rebalanced: Record<number, string[]> = {};
      for (let i = 0; i < safeNum; i++) rebalanced[i] = [];
      freshDist.forEach(({ team, members }) => {
        rebalanced[team.id] = members.map((m) => m.id);
      });
      setTeamAssignments(rebalanced);
      return;
    }

    // Identifica colaboradores da categoria que ainda não foram alocados
    const unassigned = categoryEmployees.filter((e) => !allAssigned.has(e.id));
    if (unassigned.length > 0) {
      needsUpdate = true;
      const newAssignmentsPerTeam: Record<number, string[]> = {};

      unassigned.forEach((emp) => {
        if (!allAssigned.has(emp.id)) {
          allAssigned.add(emp.id);
          let smallestTeamId = 0;
          let smallestCount = Infinity;
          for (let i = 0; i < safeNum; i++) {
            const count = sanitized[i].length;
            if (count < smallestCount) {
              smallestCount = count;
              smallestTeamId = i;
            }
          }
          sanitized[smallestTeamId].push(emp.id);
          if (!newAssignmentsPerTeam[smallestTeamId]) {
            newAssignmentsPerTeam[smallestTeamId] = [];
          }
          newAssignmentsPerTeam[smallestTeamId].push(emp.id);
        }
      });

      if (needsUpdate) {
        setTeamAssignments(sanitized);
      }

      // Adiciona folgas para os novos colaboradores nos meses já gerados,
      // herdando EXATAMENTE a mesma folga da equipe onde foram inseridos sem alterar ninguém existente!
      setMonthlySchedules((prev) => {
        const next = { ...prev };
        let hasChanges = false;

        Object.keys(next).forEach((mKey) => {
          const monthSchedule = { ...next[mKey] };
          if (Object.keys(monthSchedule).length === 0) return;

          const [yStr, mStr] = mKey.split('-');
          const y = Number(yStr);
          const m = Number(mStr);
          const daysInM = new Date(y, m + 1, 0).getDate();
          const mScale = monthlyScaleTypes[mKey] || settings.scaleType;
          const cycleLen =
            mScale === '5x1' ? 6 : mScale === '5x2' ? 7 : mScale === '6x1' ? 7 : 2;

          for (const [tIdStr, newEmpIds] of Object.entries(newAssignmentsPerTeam)) {
            const teamId = Number(tIdStr);
            // Procura um membro da equipe já existente no mês para herdar a folga sincronizada
            const existingMemberId = sanitized[teamId]?.find(
              (id) => !newEmpIds.includes(id) && monthSchedule[id]
            );

            let teamFirstOff = getInitialTeamOffDay(teamId, settings.numTeams, mScale);

            if (existingMemberId && monthSchedule[existingMemberId]) {
              const existingOffs = monthSchedule[existingMemberId];
              for (let d = 1; d <= 7; d++) {
                if (existingOffs[d] === true) {
                  teamFirstOff = d;
                  break;
                }
              }
            }

            newEmpIds.forEach((empId) => {
              if (!monthSchedule[empId]) {
                const empDays: Record<number, boolean> = {};
                for (let d = 1; d <= daysInM; d++) {
                  if (mScale === '5x2') {
                    empDays[d] =
                      ((d - teamFirstOff) % 7 + 7) % 7 === 0 ||
                      ((d - (teamFirstOff + 1)) % 7 + 7) % 7 === 0;
                  } else {
                    empDays[d] = ((d - teamFirstOff) % cycleLen + cycleLen) % cycleLen === 0;
                  }
                }

                // Verifica se tem domingo
                const sundays: number[] = [];
                for (let d = 1; d <= daysInM; d++) {
                  if (new Date(y, m, d).getDay() === 0) sundays.push(d);
                }
                const hasSunday = sundays.some((s) => empDays[s] === true);
                if (!hasSunday && sundays.length > 0) {
                  empDays[sundays[0]] = true;
                }

                monthSchedule[empId] = empDays;
                hasChanges = true;
              }
            });
          }

          next[mKey] = monthSchedule;
        });

        return hasChanges ? next : prev;
      });

      return;
    }

    if (needsUpdate) {
      setTeamAssignments(sanitized);
    }
  }, [categoryEmployees, settings.numTeams, teamAssignments, settings.scaleType]);

  // 5. Stored schedules by month: key "YYYY-M" -> empId -> dayNumber -> boolean (true = Folga)
  // Carrega todas as escalas gravadas no banco de dados local
  const [monthlySchedules, setMonthlySchedules] = useState<
    Record<string, Record<string, Record<number, boolean>>>
  >(() => {
    try {
      const saved = localStorage.getItem(storageKeySchedules);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar escalas do banco local:', e);
    }

    let savedAssignments: Record<number, string[]> | undefined;
    try {
      const savedAss = localStorage.getItem(storageKeyTeamAssignments);
      if (savedAss) savedAssignments = JSON.parse(savedAss);
    } catch {}

    const initialNumTeams = isMotorista ? 6 : categoryEmployees.length >= 20 ? 6 : 3;
    const initialScale: ScaleType = isMotorista ? '5x2' : '5x1';
    return {
      '2026-10': buildInitialNovemberSchedule(
        employees,
        shift.id,
        roleName,
        initialNumTeams,
        initialScale,
        savedAssignments
      ),
    };
  });

  // Salva no banco de dados local (localStorage) sempre que qualquer folga ou escala mudar
  useEffect(() => {
    try {
      localStorage.setItem(storageKeySchedules, JSON.stringify(monthlySchedules));
    } catch (e) {
      console.error('Erro ao persistir escalas no banco local:', e);
    }
  }, [monthlySchedules, storageKeySchedules]);

  // Escala e regime efetivo do mês visualizado
  const currentMonthSchedule = monthlySchedules[currentMonthKey] || {};
  const isCurrentMonthGenerated = Object.keys(currentMonthSchedule).length > 0;
  const currentViewScaleType: ScaleType = monthlyScaleTypes[currentMonthKey] || settings.scaleType;

  // Divisão de equipes respeitando a personalização flexível do usuário e ISOLAMENTO MENSAL RIGOROSO
  // e garantindo com 100% de segurança que NENHUM colaborador apareça duplicado na tabela e as equipes permaneçam balanceadas
  const distributedTeams: { team: TeamConfig; members: Employee[] }[] = useMemo(() => {
    const safeNumTeams = Math.max(1, Math.min(settings.numTeams, TEAMS.length));
    const activeTeams = TEAMS.slice(0, safeNumTeams);

    // Mapeia colaboradores únicos por ID e também previne colaboradores duplicados (mesmo nome ou matrícula)
    const empById = new Map<string, Employee>();
    const seenRegistrations = new Set<string>();
    const seenNames = new Set<string>();
    const uniqueCategoryEmployees: Employee[] = [];

    categoryEmployees.forEach((emp) => {
      const regKey = emp.registration?.trim().toUpperCase();
      const nameKey = emp.name?.trim().toLowerCase();
      if (regKey && seenRegistrations.has(regKey)) {
        return;
      }
      if (nameKey && seenNames.has(nameKey)) {
        return;
      }
      if (regKey) seenRegistrations.add(regKey);
      if (nameKey) seenNames.add(nameKey);
      empById.set(emp.id, emp);
      uniqueCategoryEmployees.push(emp);
    });

    const globallyAssignedEmpIds = new Set<string>();

    // 1. Obtém o mapeamento específico do mês visualizado
    let activeAssignments = monthlyTeamAssignments[currentMonthKey];

    // Se não existir ou for desbalanceado/corrompido, usa o teamAssignments mestre
    if (!activeAssignments || !isTeamDistributionBalanced(activeAssignments, safeNumTeams, uniqueCategoryEmployees.length)) {
      activeAssignments = teamAssignments;
    }

    // Se teamAssignments mestre também não estiver perfeitamente balanceado, redistribui de forma limpa
    if (!isTeamDistributionBalanced(activeAssignments, safeNumTeams, uniqueCategoryEmployees.length)) {
      const freshDist = distributeEmployeesToTeams(uniqueCategoryEmployees, safeNumTeams);
      const balancedMap: Record<number, string[]> = {};
      for (let i = 0; i < safeNumTeams; i++) balancedMap[i] = [];
      freshDist.forEach(({ team, members }) => {
        balancedMap[team.id] = members.map((m) => m.id);
      });
      activeAssignments = balancedMap;
    }

    const result: { team: TeamConfig; members: Employee[] }[] = activeTeams.map((team) => {
      const memberIds = activeAssignments[team.id] || [];
      const members: Employee[] = [];
      memberIds.forEach((id: string) => {
        // Bloqueia se já tiver sido adicionado a qualquer equipe
        if (!globallyAssignedEmpIds.has(id)) {
          const emp = empById.get(id);
          if (emp) {
            globallyAssignedEmpIds.add(id);
            members.push(emp);
          }
        }
      });
      return { team, members };
    });

    // Se houver algum colaborador recém-cadastrado ainda não alocado no state, distribui sem duplicar
    const unassigned = uniqueCategoryEmployees.filter((emp) => !globallyAssignedEmpIds.has(emp.id));
    if (unassigned.length > 0) {
      unassigned.forEach((emp) => {
        if (!globallyAssignedEmpIds.has(emp.id)) {
          globallyAssignedEmpIds.add(emp.id);
          let smallestTeamIdx = 0;
          let smallestCount = Infinity;
          result.forEach((t, idx) => {
            if (t.members.length < smallestCount) {
              smallestCount = t.members.length;
              smallestTeamIdx = idx;
            }
          });
          result[smallestTeamIdx].members.push(emp);
        }
      });
    }

    return result;
  }, [categoryEmployees, settings.numTeams, teamAssignments, monthlyTeamAssignments, currentMonthKey]);

  // Mapeamento rápido de colaborador -> equipe
  const employeeTeamMap = useMemo(() => {
    const map = new Map<string, TeamConfig>();
    distributedTeams.forEach(({ team, members }) => {
      members.forEach((emp) => map.set(emp.id, team));
    });
    return map;
  }, [distributedTeams]);

  // 4. Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 6. Afastamentos (Férias e Atestados) - Carrega do banco local
  const [leaves, setLeaves] = useState<EmployeeLeave[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyLeaves);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler afastamentos do banco local:', e);
    }

    if (roleName.toLowerCase() === 'motorista') {
      const motEmployees = employees.filter(
        (e) => e.shiftId === shift.id && e.role.toLowerCase() === 'motorista'
      );
      if (motEmployees.length >= 3) {
        return [
          {
            id: 'leave-mot-1',
            employeeId: motEmployees[0].id,
            type: 'FERIAS',
            startDate: '2026-11-10',
            endDate: '2026-11-24',
            observation: 'Férias programadas (15 dias)',
          },
          {
            id: 'leave-mot-2',
            employeeId: motEmployees[Math.min(7, motEmployees.length - 1)].id,
            type: 'FERIAS',
            startDate: '2026-11-10',
            endDate: '2026-11-24',
            observation: 'Férias programadas (15 dias)',
          },
          {
            id: 'leave-mot-3',
            employeeId: motEmployees[Math.min(14, motEmployees.length - 1)].id,
            type: 'FERIAS',
            startDate: '2026-11-10',
            endDate: '2026-11-24',
            observation: 'Férias programadas (15 dias)',
          },
        ];
      }
    }

    if (shift.id === 'manha' && roleName.toLowerCase() === 'operador de bloco') {
      return [
        {
          id: 'leave-1',
          employeeId: '3', // Dalmo Cabral
          type: 'FERIAS',
          startDate: '2026-11-05',
          endDate: '2026-11-19',
          observation: 'Férias regulamentares 15 dias',
        },
      ];
    }
    return [];
  });

  // Salva afastamentos no banco local
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyLeaves, JSON.stringify(leaves));
    } catch (e) {
      console.error('Erro ao salvar afastamentos no banco local:', e);
    }
  }, [leaves, storageKeyLeaves]);

  // Sempre que mudar o mês visualizado, reseta a rolagem horizontal para o Dia 01
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = 0;
    }
  }, [viewMonth, viewYear]);

  // Drag and drop state para movimentação entre equipes e reordenação
  const [draggedEmpId, setDraggedEmpId] = useState<string | null>(null);
  const [dragOverEmpId, setDragOverEmpId] = useState<string | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<number | null>(null);

  // Floating menu anchor state (Posição em relação à tela usando getBoundingClientRect)
  const [menuAnchor, setMenuAnchor] = useState<{
    employee: Employee;
    top: number;
    left: number;
  } | null>(null);

  // Leave Modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedEmpForLeave, setSelectedEmpForLeave] = useState<Employee | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>('FERIAS');
  const [selectedExistingLeave, setSelectedExistingLeave] = useState<EmployeeLeave | null>(null);

  // Fecha o menu flutuante ao rolar a página ou tabela
  useEffect(() => {
    const handleScroll = () => {
      if (menuAnchor) setMenuAnchor(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [menuAnchor]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Days columns for currently viewed month
  const dateColumns = useMemo(() => {
    return generateMonthDays(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  // Navigate viewed month
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Toggle cell directly in currently viewed month (Configuração Manual Célula a Célula)
  const handleToggleCell = (empId: string, dayNumber: number) => {
    // 1. Verifica se o colaborador tem afastamento ativo (Férias/Atestado/INSS/Exame) nesta data
    const activeLeave = leaves.find((l) => l.employeeId === empId);
    const dateCol = dateColumns.find((c) => c.dayNumber === dayNumber);
    if (
      activeLeave &&
      dateCol &&
      dateCol.fullDate >= activeLeave.startDate &&
      dateCol.fullDate <= activeLeave.endDate
    ) {
      const emp = categoryEmployees.find((e) => e.id === empId);
      let leaveTypeStr = 'Férias';
      if (activeLeave.type === 'ATESTADO') leaveTypeStr = 'Atestado Médico';
      else if (activeLeave.type === 'INSS') leaveTypeStr = 'Afastamento INSS';
      else if (activeLeave.type === 'EXAME') leaveTypeStr = 'Exame Periódico';

      showToast(
        `📌 ${emp?.name || 'Colaborador'} está em período de ${leaveTypeStr} neste dia. Clique no nome dele para editar ou remover o afastamento.`
      );
      return;
    }

    setMonthlySchedules((prev) => {
      const monthData = prev[currentMonthKey] || {};
      const empOff = monthData[empId] || {};
      const isCurrentlyOff = empOff[dayNumber] ?? false;
      const willBeOff = !isCurrentlyOff;

      const emp = categoryEmployees.find((e) => e.id === empId);
      showToast(
        willBeOff
          ? `⚪ Folga manual aplicada: ${emp?.name || 'Colaborador'} no dia ${String(dayNumber).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}.`
          : `🟩 Trabalho manual definido: ${emp?.name || 'Colaborador'} no dia ${String(dayNumber).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}.`
      );

      return {
        ...prev,
        [currentMonthKey]: {
          ...monthData,
          [empId]: {
            ...empOff,
            [dayNumber]: willBeOff,
          },
        },
      };
    });
  };

  // Open menu on click at employee name
  const handleOpenMenu = (e: React.MouseEvent, emp: Employee) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 280;
    const openUpwards = rect.bottom + menuHeight > window.innerHeight;
    const top = openUpwards ? Math.max(10, rect.top - menuHeight) : rect.bottom + 6;
    const left = Math.min(rect.left, window.innerWidth - 260);

    setMenuAnchor({
      employee: emp,
      top,
      left,
    });
  };

  // Open Leave Modal for specific employee and type
  const handleOpenLeaveModal = (emp: Employee, leaveType: LeaveType) => {
    setMenuAnchor(null);
    setSelectedEmpForLeave(emp);
    setSelectedLeaveType(leaveType);

    // Check if employee already has an active leave
    const existing = leaves.find((l) => l.employeeId === emp.id) || null;
    setSelectedExistingLeave(existing);
    setIsLeaveModalOpen(true);
  };

  // Save Leave (Férias, Atestado, INSS, Exame)
  const handleSaveLeave = (leaveData: Omit<EmployeeLeave, 'id'>) => {
    const newLeave: EmployeeLeave = {
      ...leaveData,
      id: `leave-${Date.now()}`,
    };

    setLeaves((prev) => [
      // Remove any previous leave for this employee to update with the new one
      ...prev.filter((l) => l.employeeId !== leaveData.employeeId),
      newLeave,
    ]);

    let label = 'Férias aplicadas';
    if (leaveData.type === 'ATESTADO') label = 'Atestado aplicado';
    else if (leaveData.type === 'INSS') label = 'Afastamento INSS aplicado';
    else if (leaveData.type === 'EXAME') label = 'Exame registrado';
    showToast(`✅ ${label} com sucesso para ${selectedEmpForLeave?.name || 'colaborador'}!`);
  };

  // Remove Leave
  const handleRemoveLeave = (leaveId: string) => {
    setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    showToast('Afastamento removido da escala.');
  };

  // MOVIMENTAÇÃO DE COLABORADOR (TRANSFERÊNCIA DE EQUIPE OU REORDENAÇÃO)
  // Permite qualquer quantidade de colaboradores por equipe (ex: 4 em uma e 2 na outra)
  // e reajusta as folgas automaticamente se mudar de equipe
  const handleMoveCollaborator = (
    sourceEmpId: string,
    targetTeamId: number,
    targetEmpId?: string
  ) => {
    const movedEmp = categoryEmployees.find((e) => e.id === sourceEmpId);
    if (!movedEmp) return;

    // Identifica a equipe de origem do colaborador
    let sourceTeamId: number | null = null;
    for (const [tIdStr, members] of Object.entries(teamAssignments)) {
      if (members.includes(sourceEmpId)) {
        sourceTeamId = Number(tIdStr);
        break;
      }
    }
    if (sourceTeamId === null) {
      sourceTeamId = employeeTeamMap.get(sourceEmpId)?.id ?? 0;
    }

    // Se estiver soltando no mesmo colaborador na mesma equipe, nada a fazer
    if (sourceTeamId === targetTeamId && targetEmpId === sourceEmpId) {
      return;
    }

    // Monta o novo mapeamento de equipes garantindo isolamento total entre equipes
    const currentAssignments = monthlyTeamAssignments[currentMonthKey] || teamAssignments;
    const nextAssignments: Record<number, string[]> = {};
    for (let i = 0; i < settings.numTeams; i++) {
      nextAssignments[i] = [...(currentAssignments[i] || [])];
    }

    // 1. Remove de QUALQUER equipe onde possa estar (garantindo que fique em apenas 1 equipe e sem duplicatas)
    for (const tId in nextAssignments) {
      nextAssignments[tId] = nextAssignments[tId].filter((id: string) => id !== sourceEmpId);
    }

    // 2. Insere na equipe de destino (equipe de destino fica com 1 a mais, ex: 3 -> 4)
    if (!nextAssignments[targetTeamId]) {
      nextAssignments[targetTeamId] = [];
    }

    if (targetEmpId && targetEmpId !== sourceEmpId) {
      const targetIdx = nextAssignments[targetTeamId].indexOf(targetEmpId);
      if (targetIdx !== -1) {
        nextAssignments[targetTeamId].splice(targetIdx, 0, sourceEmpId);
      } else {
        nextAssignments[targetTeamId].push(sourceEmpId);
      }
    } else {
      nextAssignments[targetTeamId].push(sourceEmpId);
    }

    setMonthlyTeamAssignments((prev) => ({
      ...prev,
      [currentMonthKey]: nextAssignments,
    }));

    // 3. Se mudou de equipe, reajusta as folgas automaticamente APENAS no mês visualizado
    if (sourceTeamId !== targetTeamId) {
      const destTeam = TEAMS.find((t: TeamConfig) => t.id === targetTeamId) || TEAMS[targetTeamId];

      setMonthlySchedules((prev) => {
        const next = { ...prev };
        const monthSchedule = { ...(next[currentMonthKey] || {}) };
        const mScale = monthlyScaleTypes[currentMonthKey] || settings.scaleType;

        // Padrão de dias de folga da equipe de destino (sincronizado e puro)
        const firstOff = getInitialTeamOffDay(
          targetTeamId,
          settings.numTeams,
          mScale
        );
        const cycleLen =
          mScale === '5x1' ? 6 : mScale === '5x2' ? 7 : mScale === '6x1' ? 7 : 2;
        const destPattern: Record<number, boolean> = {};
        for (let d = 1; d <= 31; d++) {
          if (mScale === '5x2') {
            destPattern[d] =
              ((d - firstOff) % 7 + 7) % 7 === 0 ||
              ((d - (firstOff + 1)) % 7 + 7) % 7 === 0;
          } else {
            destPattern[d] = ((d - firstOff) % cycleLen + cycleLen) % cycleLen === 0;
          }
        }

        monthSchedule[sourceEmpId] = destPattern;
        next[currentMonthKey] = monthSchedule;

        return next;
      });

      showToast(
        `🔄 ${movedEmp.name} transferido para a ${destTeam?.name || `Equipe ${targetTeamId + 1}`} (${nextAssignments[targetTeamId].length} colaboradores). Folgas reajustadas automaticamente!`
      );
    } else {
      showToast(`↕️ Posição de ${movedEmp.name} reordenada na equipe.`);
    }

    // Persiste no master de colaboradores ordenado por equipes
    if (onReorderEmployees) {
      const flattened: Employee[] = [];
      const empMap = new Map<string, Employee>();
      categoryEmployees.forEach((e) => empMap.set(e.id, e));

      for (let i = 0; i < settings.numTeams; i++) {
        (nextAssignments[i] || []).forEach((id) => {
          const emp = empMap.get(id);
          if (emp) flattened.push(emp);
        });
      }
      onReorderEmployees(flattened);
    }
  };

  // Mover diretamente para uma equipe pelo menu de opções
  const handleMoveToTeam = (emp: Employee, targetTeamId: number) => {
    setMenuAnchor(null);
    handleMoveCollaborator(emp.id, targetTeamId);
  };

  // Handlers de Drag and Drop
  const handleDragStart = (e: React.DragEvent, empId: string) => {
    e.dataTransfer.setData('text/plain', empId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEmpId(empId);
  };

  const handleDragOverRow = (e: React.DragEvent, empId: string, teamId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverEmpId !== empId) {
      setDragOverEmpId(empId);
    }
    if (dragOverTeamId !== teamId) {
      setDragOverTeamId(teamId);
    }
  };

  const handleDropOnRow = (e: React.DragEvent, targetEmpId: string, targetTeamId: number) => {
    e.preventDefault();
    const sourceEmpId = e.dataTransfer.getData('text/plain') || draggedEmpId;
    setDraggedEmpId(null);
    setDragOverEmpId(null);
    setDragOverTeamId(null);
    if (sourceEmpId) {
      handleMoveCollaborator(sourceEmpId, targetTeamId, targetEmpId);
    }
  };

  const handleDropOnTeam = (e: React.DragEvent, targetTeamId: number) => {
    e.preventDefault();
    const sourceEmpId = e.dataTransfer.getData('text/plain') || draggedEmpId;
    setDraggedEmpId(null);
    setDragOverEmpId(null);
    setDragOverTeamId(null);
    if (sourceEmpId) {
      handleMoveCollaborator(sourceEmpId, targetTeamId);
    }
  };

  const handleDragEnd = () => {
    setDraggedEmpId(null);
    setDragOverEmpId(null);
    setDragOverTeamId(null);
  };

  // Helper to check if a specific day is covered by Férias or Atestado
  const getDayLeave = (empId: string, fullDate: string): EmployeeLeave | null => {
    return (
      leaves.find(
        (l) => l.employeeId === empId && fullDate >= l.startDate && fullDate <= l.endDate
      ) || null
    );
  };

  // Gerador de Escala Mensal (com suporte a Continuidade, Transição 5x1 <-> 5x2, Reorganização de Equipes e Regra de Máximo 6 Dias Trabalhados)
  const generateScheduleForMonth = (
    targetMonth: number,
    targetYear: number,
    cfg: CategoryScheduleSettings,
    mode: GenerationMode,
    compensatorySunday: CompensatorySundayMode = 'auto',
    explicitTeams?: { team: TeamConfig; members: Employee[] }[],
    targetScaleType?: ScaleType
  ) => {
    const targetKey = `${targetYear}-${targetMonth}`;
    const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
    const effectiveScaleType = targetScaleType || cfg.scaleType;

    // Se o modo for manual, limpa as folgas e deixa todos em trabalho para o usuário definir manualmente
    if (mode === 'manual') {
      const blankMonthData: Record<string, Record<number, boolean>> = {};
      const teams = explicitTeams ?? distributedTeams;
      teams.forEach(({ members }) => {
        members.forEach((emp) => {
          const empDays: Record<number, boolean> = {};
          for (let d = 1; d <= daysInTarget; d++) {
            empDays[d] = false;
          }
          blankMonthData[emp.id] = empDays;
        });
      });
      setMonthlyScaleTypes((prev) => ({
        ...prev,
        [targetKey]: effectiveScaleType,
      }));
      setMonthlySchedules((prev) => ({
        ...prev,
        [targetKey]: blankMonthData,
      }));
      setViewMonth(targetMonth);
      setViewYear(targetYear);
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollLeft = 0;
      }
      showToast('✏️ Escala em branco pronta! Clique diretamente nas células para definir as folgas manualmente.');
      return;
    }

    // Dados do mês anterior para cálculo de continuidade
    const pMonth = targetMonth === 0 ? 11 : targetMonth - 1;
    const pYear = targetMonth === 0 ? targetYear - 1 : targetYear;
    const pKey = `${pYear}-${pMonth}`;
    const prevMonthData = monthlySchedules[pKey];
    const prevMonthTotalDays = new Date(pYear, pMonth + 1, 0).getDate();

    // Mapeia colaboradores únicos para garantir ausência de duplicatas
    const uniqueCategoryEmployees: Employee[] = [];
    const empById = new Map<string, Employee>();
    const seenRegistrations = new Set<string>();
    const seenNames = new Set<string>();
    categoryEmployees.forEach((emp) => {
      const regKey = emp.registration?.trim().toUpperCase();
      const nameKey = emp.name?.trim().toLowerCase();
      if (regKey && seenRegistrations.has(regKey)) return;
      if (nameKey && seenNames.has(nameKey)) return;
      if (regKey) seenRegistrations.add(regKey);
      if (nameKey) seenNames.add(nameKey);
      empById.set(emp.id, emp);
      uniqueCategoryEmployees.push(emp);
    });

    let activeTeamsForGeneration: { team: TeamConfig; members: Employee[] }[] = [];

    // Se for continuidade e houver histórico do mês anterior:
    // As equipes MANTÊM sua formação intacta (ninguém é tirado de sua equipe)
    // e o ciclo de folgas de cada equipe CONTINUA exatamente de onde parou no mês anterior!
    if (mode === 'continuidade' && prevMonthData) {
      const safeNumTeams = Math.max(1, Math.min(cfg.numTeams, TEAMS.length));
      let sourceTeamsMap = monthlyTeamAssignments[pKey];

      if (!sourceTeamsMap || !isTeamDistributionBalanced(sourceTeamsMap, safeNumTeams, uniqueCategoryEmployees.length)) {
        sourceTeamsMap = teamAssignments;
      }
      if (!isTeamDistributionBalanced(sourceTeamsMap, safeNumTeams, uniqueCategoryEmployees.length)) {
        const fresh = distributeEmployeesToTeams(uniqueCategoryEmployees, safeNumTeams);
        const map: Record<number, string[]> = {};
        for (let i = 0; i < safeNumTeams; i++) map[i] = [];
        fresh.forEach(({ team, members }) => {
          map[team.id] = members.map((m) => m.id);
        });
        sourceTeamsMap = map;
      }

      const targetTeamsMap: Record<number, string[]> = {};
      for (let i = 0; i < safeNumTeams; i++) targetTeamsMap[i] = [];

      const assignedEmpIds = new Set<string>();
      for (let i = 0; i < safeNumTeams; i++) {
        const ids = sourceTeamsMap[i] || [];
        ids.forEach((id) => {
          if (!assignedEmpIds.has(id)) {
            const emp = empById.get(id);
            if (emp) {
              targetTeamsMap[i].push(id);
              assignedEmpIds.add(id);
            }
          }
        });
      }

      // Distribui novos colaboradores não alocados para as equipes menores
      uniqueCategoryEmployees.forEach((emp) => {
        if (!assignedEmpIds.has(emp.id)) {
          let minT = 0;
          let minCount = Infinity;
          for (let i = 0; i < safeNumTeams; i++) {
            if (targetTeamsMap[i].length < minCount) {
              minCount = targetTeamsMap[i].length;
              minT = i;
            }
          }
          targetTeamsMap[minT].push(emp.id);
          assignedEmpIds.add(emp.id);
        }
      });

      // Salva alocação de equipes no mês de destino
      setMonthlyTeamAssignments((prev) => ({
        ...prev,
        [targetKey]: targetTeamsMap,
      }));

      activeTeamsForGeneration = TEAMS.slice(0, safeNumTeams).map((team) => ({
        team,
        members: targetTeamsMap[team.id].map((id) => empById.get(id)!).filter(Boolean),
      }));
    } else {
      activeTeamsForGeneration = explicitTeams ?? distributedTeams;
      const targetMap: Record<number, string[]> = {};
      for (let i = 0; i < cfg.numTeams; i++) targetMap[i] = [];
      activeTeamsForGeneration.forEach(({ team, members }) => {
        targetMap[team.id] = members.map((m) => m.id);
      });
      setMonthlyTeamAssignments((prev) => ({
        ...prev,
        [targetKey]: targetMap,
      }));
    }

    // Registra a escala utilizada para este mês
    setMonthlyScaleTypes((prev) => ({
      ...prev,
      [targetKey]: effectiveScaleType,
    }));

    const newMonthData: Record<string, Record<number, boolean>> = {};

    activeTeamsForGeneration.forEach(({ team, members }) => {
      if (members.length === 0) return;

      const memberIds = members.map((m) => m.id);
      const defaultFirstOff = getInitialTeamOffDay(
        team.id,
        cfg.numTeams,
        effectiveScaleType,
        cfg.customTeamOffDays
      );

      // CÁLCULO DE CONTINUIDADE REAL DA EQUIPE:
      // Se for continuidade e houver histórico, calcula quando a equipe realmente deve folgar
      // baseado no último dia de folga no mês anterior!
      let continuity = {
        firstOff: defaultFirstOff,
        isSecondDayOfOff: false,
      };

      if (mode === 'continuidade' && prevMonthData) {
        continuity = computeTeamContinuityOffDays(
          prevMonthData,
          memberIds,
          prevMonthTotalDays,
          effectiveScaleType,
          defaultFirstOff
        );
      }

      const teamDays = buildTeamMonthOffDays(daysInTarget, effectiveScaleType, continuity);

      members.forEach((emp) => {
        newMonthData[emp.id] = { ...teamDays };
      });
    });

    // Folga compensatória de domingo (se 5x1 ou 6x1)
    if (compensatorySunday === 'auto' && effectiveScaleType !== '5x2') {
      const sundays: number[] = [];
      for (let d = 1; d <= daysInTarget; d++) {
        const date = new Date(targetYear, targetMonth, d);
        if (date.getDay() === 0) {
          sundays.push(d);
        }
      }

      const numSundays = sundays.length;

      if (numSundays > 0) {
        activeTeamsForGeneration.forEach(({ members }) => {
          const zeroSundayEmployees = members.filter((emp) => {
            const empDays = newMonthData[emp.id] || {};
            const sunOffCount = sundays.filter((sDay) => empDays[sDay] === true).length;
            return sunOffCount === 0;
          });

          const totalZero = zeroSundayEmployees.length;
          if (totalZero === 0) return;

          zeroSundayEmployees.forEach((emp, index) => {
            const assignedSundayIdx = index % numSundays;
            const targetSunday = sundays[assignedSundayIdx];
            newMonthData[emp.id][targetSunday] = true;
          });
        });
      }
    }

    // REGRA DE OURO (Garantia Absoluta): Nenhum colaborador pode ultrapassar 6 dias consecutivos trabalhados
    uniqueCategoryEmployees.forEach((emp) => {
      const empDays = newMonthData[emp.id];
      if (!empDays) return;

      let workedAtEnd = 0;
      if (prevMonthData && prevMonthData[emp.id]) {
        const empPrev = prevMonthData[emp.id];
        for (let d = prevMonthTotalDays; d >= 1; d--) {
          if (empPrev[d] === true) break;
          workedAtEnd++;
        }
      }

      let consecutive = workedAtEnd;
      for (let d = 1; d <= daysInTarget; d++) {
        if (empDays[d] === true) {
          consecutive = 0;
        } else {
          consecutive++;
          if (consecutive > 6) {
            empDays[d] = true;
            consecutive = 0;
          }
        }
      }
    });

    setMonthlySchedules((prev) => ({
      ...prev,
      [targetKey]: newMonthData,
    }));

    setViewMonth(targetMonth);
    setViewYear(targetYear);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = 0;
    }
  };

  // Auto-reparo de segurança: se Dezembro foi previamente gerado com a anomalia (Equipe Verde com folga no Dia 1 em vez do Dia 6),
  // regenera automaticamente com continuidade perfeita
  useEffect(() => {
    const novSchedule = monthlySchedules['2026-10'];
    const decSchedule = monthlySchedules['2026-11'];
    if (novSchedule && decSchedule && teamAssignments[0]?.length > 0) {
      const verdeSampleId = teamAssignments[0][0];
      const novOffs = novSchedule[verdeSampleId] || {};
      const decOffs = decSchedule[verdeSampleId] || {};

      // Se em Novembro a Equipe Verde folgou no dia 30, mas em Dezembro está com folga no dia 1
      if (novOffs[30] === true && decOffs[1] === true) {
        generateScheduleForMonth(11, 2026, settings, 'continuidade', 'auto', undefined, '5x2');
      }
    }
  }, [monthlySchedules, teamAssignments, settings]);

  // CONFIRMAÇÃO DE GERAÇÃO (Modal Gerar Folga)
  const handleConfirmGenerate = (options: GenerateFolgaOptions) => {
    generateScheduleForMonth(
      options.targetMonth,
      options.targetYear,
      settings,
      options.mode,
      options.compensatorySunday ?? 'auto',
      undefined,
      options.targetScaleType
    );

    if (options.mode === 'manual') {
      showToast(
        `✏️ Escala de ${MONTH_NAMES[options.targetMonth]}/${options.targetYear} pronta para Configuração Manual! Clique nas células para definir as folgas.`
      );
      return;
    }

    const scaleName = options.targetScaleType || settings.scaleType;
    const modeLabel =
      options.mode === 'continuidade'
        ? `com continuidade perfeita (ciclo ininterrupto e máx. 6 dias)`
        : 'como nova escala';
    showToast(
      `✨ Escala ${scaleName} gerada ${modeLabel} para ${MONTH_NAMES[options.targetMonth]}/${options.targetYear}!`
    );
  };

  // Exportar Escala para Excel com Formatação Completa de Cores (Apenas Colaboradores Ativos na Escala)
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const teamsForExport = distributedTeams.map(({ team, members }) => ({
        team,
        members: members.filter((emp) => !isEmployeeOnVacation(emp.id)),
      }));

      await exportScheduleToExcel({
        roleName,
        shift,
        month: viewMonth,
        year: viewYear,
        dateColumns,
        distributedTeams: teamsForExport,
        schedule: currentMonthSchedule,
        leaves,
        scaleType: currentViewScaleType,
      });
      showToast('📊 Planilha Excel (.xlsx) baixada com sucesso com todas as cores!');
    } catch (err) {
      console.error('Erro na exportação Excel:', err);
      showToast('❌ Erro ao exportar planilha Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset current month
  const handleResetCurrentMonth = () => {
    setMonthlySchedules((prev) => {
      const next = { ...prev };
      delete next[currentMonthKey];
      return next;
    });
    showToast(`Escala de ${MONTH_NAMES[viewMonth]}/${viewYear} resetada.`);
  };

  // Obtém as folgas de um colaborador (respeitando escalas salvas ou fallback)
  const getEmployeeOffsMap = (empId: string, teamId: number): Record<number, boolean> => {
    const empOffs = currentMonthSchedule[empId];
    if (empOffs) return empOffs;
    if (isCurrentMonthGenerated) return {};

    const teamFirstOff = getInitialTeamOffDay(
      teamId,
      settings.numTeams,
      currentViewScaleType,
      settings.customTeamOffDays
    );
    const cycleL =
      currentViewScaleType === '5x1' ? 6 : currentViewScaleType === '5x2' ? 7 : currentViewScaleType === '6x1' ? 7 : 2;
    const fallbackDays: Record<number, boolean> = {};
    for (let d = 1; d <= dateColumns.length; d++) {
      if (currentViewScaleType === '5x2') {
        fallbackDays[d] =
          ((d - teamFirstOff) % 7 + 7) % 7 === 0 ||
          ((d - (teamFirstOff + 1)) % 7 + 7) % 7 === 0;
      } else {
        fallbackDays[d] =
          ((d - teamFirstOff) % cycleL + cycleL) % cycleL === 0;
      }
    }
    return fallbackDays;
  };

  // Colaboradores da categoria com férias ativas no mês visualizado
  const vacationEmployeesInMonth = useMemo(() => {
    return categoryEmployees
      .map((emp) => {
        const leave = leaves.find(
          (l) =>
            l.employeeId === emp.id &&
            l.type === 'FERIAS' &&
            dateColumns.some((col) => col.fullDate >= l.startDate && col.fullDate <= l.endDate)
        );
        if (!leave) return null;
        const team = employeeTeamMap.get(emp.id) || TEAMS[0];
        return {
          employee: emp,
          leave,
          team,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [categoryEmployees, leaves, dateColumns, employeeTeamMap]);

  // Verifica se o colaborador tem férias no mês (removendo-o da tabela de escala)
  const isEmployeeOnVacation = (empId: string): boolean => {
    return vacationEmployeesInMonth.some((v) => v.employee.id === empId);
  };

  // Data Atual Real
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth(); // 0-indexed (10 para Novembro)
  const todayDay = today.getDate(); // 19

  // Dia selecionado para exibir os dados (padrão: data atual / hoje)
  const [selectedDayForMetrics, setSelectedDayForMetrics] = useState<number>(() => {
    const now = new Date();
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) {
      return now.getDate();
    }
    return 1;
  });

  // Atualiza selectedDayForMetrics se o mês/ano visualizado mudar
  useEffect(() => {
    const now = new Date();
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) {
      setSelectedDayForMetrics(now.getDate());
    } else {
      setSelectedDayForMetrics(1);
    }
  }, [viewMonth, viewYear]);

  // Data formatada para a métrica selecionada (YYYY-MM-DD)
  const selectedDateStr = useMemo(() => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(selectedDayForMetrics).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  }, [viewYear, viewMonth, selectedDayForMetrics]);

  const isSelectedDayToday =
    viewYear === todayYear &&
    viewMonth === todayMonth &&
    selectedDayForMetrics === todayDay;

  // 1. Total Férias no Dia Atual
  const feriasTodayList = useMemo(() => {
    return categoryEmployees.filter((emp) =>
      leaves.some(
        (l) =>
          l.employeeId === emp.id &&
          l.type === 'FERIAS' &&
          selectedDateStr >= l.startDate &&
          selectedDateStr <= l.endDate
      )
    );
  }, [categoryEmployees, leaves, selectedDateStr]);
  const totalFeriasHoje = feriasTodayList.length;

  // 2. Total Atestado no Dia Atual
  const atestadoTodayList = useMemo(() => {
    return categoryEmployees.filter((emp) =>
      leaves.some(
        (l) =>
          l.employeeId === emp.id &&
          l.type === 'ATESTADO' &&
          selectedDateStr >= l.startDate &&
          selectedDateStr <= l.endDate
      )
    );
  }, [categoryEmployees, leaves, selectedDateStr]);
  const totalAtestadoHoje = atestadoTodayList.length;

  // 3. Total INSS no Dia Atual
  const inssTodayList = useMemo(() => {
    return categoryEmployees.filter((emp) =>
      leaves.some(
        (l) =>
          l.employeeId === emp.id &&
          l.type === 'INSS' &&
          selectedDateStr >= l.startDate &&
          selectedDateStr <= l.endDate
      )
    );
  }, [categoryEmployees, leaves, selectedDateStr]);
  const totalINSSHoje = inssTodayList.length;

  // 4. Total Exame no Dia Atual
  const exameTodayList = useMemo(() => {
    return categoryEmployees.filter((emp) =>
      leaves.some(
        (l) =>
          l.employeeId === emp.id &&
          l.type === 'EXAME' &&
          selectedDateStr >= l.startDate &&
          selectedDateStr <= l.endDate
      )
    );
  }, [categoryEmployees, leaves, selectedDateStr]);
  const totalExameHoje = exameTodayList.length;

  // 5. Total de Folga no Dia Atual (colaboradores de folga programada pela escala hoje, sem afastamento)
  const folgaTodayList = useMemo(() => {
    return categoryEmployees.filter((emp) => {
      const hasLeave = getDayLeave(emp.id, selectedDateStr);
      if (hasLeave) return false;
      const team = employeeTeamMap.get(emp.id) || TEAMS[0];
      const offs = getEmployeeOffsMap(emp.id, team.id);
      return offs[selectedDayForMetrics] === true;
    });
  }, [categoryEmployees, leaves, selectedDateStr, selectedDayForMetrics, employeeTeamMap, currentMonthSchedule, isCurrentMonthGenerated, settings]);
  const totalFolgaHoje = folgaTodayList.length;

  // 6. Total Ativos no Dia Atual (colaboradores escalados e trabalhando hoje)
  const ativosTodayList = useMemo(() => {
    return categoryEmployees.filter((emp) => {
      const hasLeave = getDayLeave(emp.id, selectedDateStr);
      if (hasLeave) return false;
      const team = employeeTeamMap.get(emp.id) || TEAMS[0];
      const offs = getEmployeeOffsMap(emp.id, team.id);
      return offs[selectedDayForMetrics] !== true;
    });
  }, [categoryEmployees, leaves, selectedDateStr, selectedDayForMetrics, employeeTeamMap, currentMonthSchedule, isCurrentMonthGenerated, settings]);
  const totalAtivosHoje = ativosTodayList.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 sm:p-8 flex flex-col font-sans">
      <div className="max-w-[1650px] w-full mx-auto space-y-4">
        {/* Top: Voltar e Resumo de Equipes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos Setores do {shift.title}</span>
          </button>

          {/* Resumo elegante das Equipes com Drop Target para transferência rápida */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs overflow-x-auto">
            <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1.5 shrink-0">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Equipes:
            </span>
            {distributedTeams.map(({ team, members }) => {
              const activeCount = members.filter((m) => !isEmployeeOnVacation(m.id)).length;
              const vacationCount = members.length - activeCount;

              return (
                <div
                  key={team.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverTeamId !== team.id) setDragOverTeamId(team.id);
                  }}
                  onDragLeave={() => setDragOverTeamId(null)}
                  onDrop={(e) => handleDropOnTeam(e, team.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 transition-all cursor-pointer ${
                    team.badgeClass
                  } ${
                    dragOverTeamId === team.id
                      ? 'ring-2 ring-blue-500 scale-105 shadow-md bg-blue-100 font-extrabold text-blue-900'
                      : 'hover:shadow-2xs'
                  }`}
                  title={`Arraste um colaborador aqui para transferir para a ${team.name}`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: team.dotColor }}
                  ></span>
                  <span>{team.name}:</span>
                  <span className="font-extrabold">{activeCount}</span>
                  {vacationCount > 0 && (
                    <span
                      className="text-[10px] text-purple-700 bg-purple-100/90 px-1 rounded font-bold"
                      title={`${vacationCount} colaborador(es) em férias (removido(s) da tabela)`}
                    >
                      +{vacationCount} 🏖️
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Toolbar Header com Navegação de Mês e Botões */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-3xl border border-slate-200/80 shrink-0">
              <span>{roleEmoji}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {roleName}
                </h1>
                <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                  Escala {currentViewScaleType}
                </span>
                {isCurrentMonthGenerated ? (
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Gerada
                  </span>
                ) : (
                  <span className="text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                    Aguardando Geração
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {shift.emoji} {shift.title} • {categoryEmployees.length} colaboradores • Arraste para mudar de equipe ou clique no nome para <strong>Férias/Atestado/Mudar Equipe</strong>
              </p>
            </div>
          </div>

          {/* Centro: Seletor de Mês de Visualização */}
          <div className="flex items-center justify-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-center">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition shadow-2xs"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-4 flex items-center gap-2 text-xs font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>
                {MONTH_NAMES[viewMonth]} de {viewYear}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition shadow-2xs"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botões: Configuração e Gerar Folga */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto flex-wrap">
            {/* Botão Configuração */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Configuração</span>
            </button>

            {/* Botão Gerar Folga */}
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              disabled={categoryEmployees.length === 0}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-98"
            >
              <Wand2 className="w-4 h-4" />
              <span>Gerar Folga</span>
            </button>

            {/* Botão Exportar Excel */}
            <button
              onClick={handleExportExcel}
              disabled={categoryEmployees.length === 0 || isExporting}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-98"
              title="Baixar planilha Excel (.xlsx) formatada com as cores oficiais das equipes, folgas, férias e atestados"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExporting ? 'Exportando...' : 'Exportar Excel'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleResetCurrentMonth}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 rounded-xl border border-slate-200 transition"
              title="Resetar mês atual"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Painel de Indicadores / Totais Operacionais do DIA ATUAL */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-2xs flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-900 tracking-tight">
                  Situação do Dia: {String(selectedDayForMetrics).padStart(2, '0')}/{String(viewMonth + 1).padStart(2, '0')}/{viewYear}
                </span>
                <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isSelectedDayToday
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isSelectedDayToday ? 'HOJE (DATA ATUAL)' : 'DIA SELECIONADO NA GRADE'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {!isSelectedDayToday && (
                <button
                  type="button"
                  onClick={() => {
                    setViewMonth(todayMonth);
                    setViewYear(todayYear);
                    setSelectedDayForMetrics(todayDay);
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-200 transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Voltar para Data Atual ({String(todayDay).padStart(2, '0')}/{String(todayMonth + 1).padStart(2, '0')})</span>
                </button>
              )}
              <span className="text-[11px] text-slate-500 font-semibold">
                Setor: <strong>{categoryEmployees.length} colaboradores</strong>
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
                  {totalAtivosHoje}
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
                  {totalFolgaHoje}
                </div>
                <div className="text-[10px] font-semibold text-blue-600 mt-0.5">
                  de folga pela escala hoje
                </div>
              </div>
            </div>

            {/* 3. Total de Férias Hoje */}
            <div className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
              totalFeriasHoje > 0
                ? 'bg-purple-50/80 border-purple-200 ring-1 ring-purple-300/40 text-purple-950'
                : 'bg-white border-slate-200/90'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${totalFeriasHoje > 0 ? 'text-purple-900' : 'text-slate-500'}`}>
                  Total Férias
                </span>
                <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                  🏖️
                </span>
              </div>
              <div>
                <div className={`text-2xl font-black tracking-tight ${totalFeriasHoje > 0 ? 'text-purple-950' : 'text-slate-900'}`}>
                  {totalFeriasHoje}
                </div>
                <div className={`text-[10px] font-bold mt-0.5 ${totalFeriasHoje > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                  {totalFeriasHoje > 0 ? `${totalFeriasHoje} em férias hoje` : 'nenhum hoje'}
                </div>
              </div>
            </div>

            {/* 4. Total de Atestado Hoje */}
            <div className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
              totalAtestadoHoje > 0
                ? 'bg-rose-50/80 border-rose-200 ring-1 ring-rose-300/40 text-rose-950'
                : 'bg-white border-slate-200/90'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${totalAtestadoHoje > 0 ? 'text-rose-900' : 'text-slate-500'}`}>
                  Total Atestado
                </span>
                <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">
                  🩺
                </span>
              </div>
              <div>
                <div className={`text-2xl font-black tracking-tight ${totalAtestadoHoje > 0 ? 'text-rose-950' : 'text-slate-900'}`}>
                  {totalAtestadoHoje}
                </div>
                <div className={`text-[10px] font-bold mt-0.5 ${totalAtestadoHoje > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {totalAtestadoHoje > 0 ? `${totalAtestadoHoje} de atestado hoje` : 'nenhum hoje'}
                </div>
              </div>
            </div>

            {/* 5. Total INSS Hoje */}
            <div className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
              totalINSSHoje > 0
                ? 'bg-amber-50/80 border-amber-200 ring-1 ring-amber-300/40 text-amber-950'
                : 'bg-white border-slate-200/90'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${totalINSSHoje > 0 ? 'text-amber-900' : 'text-slate-500'}`}>
                  Total INSS
                </span>
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  🏥
                </span>
              </div>
              <div>
                <div className={`text-2xl font-black tracking-tight ${totalINSSHoje > 0 ? 'text-amber-950' : 'text-slate-900'}`}>
                  {totalINSSHoje}
                </div>
                <div className={`text-[10px] font-bold mt-0.5 ${totalINSSHoje > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                  {totalINSSHoje > 0 ? `${totalINSSHoje} pelo INSS hoje` : 'nenhum hoje'}
                </div>
              </div>
            </div>

            {/* 6. Total Exame Hoje */}
            <div className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
              totalExameHoje > 0
                ? 'bg-teal-50/80 border-teal-200 ring-1 ring-teal-300/40 text-teal-950'
                : 'bg-white border-slate-200/90'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${totalExameHoje > 0 ? 'text-teal-900' : 'text-slate-500'}`}>
                  Total Exame
                </span>
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                  📋
                </span>
              </div>
              <div>
                <div className={`text-2xl font-black tracking-tight ${totalExameHoje > 0 ? 'text-teal-950' : 'text-slate-900'}`}>
                  {totalExameHoje}
                </div>
                <div className={`text-[10px] font-bold mt-0.5 ${totalExameHoje > 0 ? 'text-teal-700' : 'text-slate-400'}`}>
                  {totalExameHoje > 0 ? `${totalExameHoje} em exame hoje` : 'nenhum hoje'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista Destacada Acima da Tabela para Colaboradores em Férias */}
        {vacationEmployeesInMonth.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50/90 via-purple-50/60 to-indigo-50/40 border border-purple-200/90 rounded-2xl p-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-purple-200/60">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                🏖️
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-xs sm:text-sm text-purple-950">
                  Colaboradores em Férias no Mês ({MONTH_NAMES[viewMonth]}/{viewYear})
                </h3>
                <span className="bg-purple-200/90 text-purple-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-300">
                  {vacationEmployeesInMonth.length} {vacationEmployeesInMonth.length === 1 ? 'colaborador' : 'colaboradores'}
                </span>
              </div>
            </div>

            {/* Lista dos Colaboradores em Férias */}
            <div className="flex flex-col divide-y divide-purple-100 bg-white/95 rounded-xl border border-purple-200/80 overflow-hidden shadow-2xs mt-2.5">
              {vacationEmployeesInMonth.map(({ employee, leave, team }) => {
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
                        onClick={() => handleOpenLeaveModal(employee, 'FERIAS')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-100/60 transition"
                        title="Editar período de férias"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleRemoveLeave(leave.id);
                          showToast(`🏖️ Férias de ${employee.name} removidas. Colaborador retornou para a tabela!`);
                        }}
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
        )}

        {/* Se NÃO houver colaboradores na categoria */}
        {categoryEmployees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 text-2xl">
              <span>{roleEmoji}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Nenhum colaborador com a função "{roleName}" cadastrado no {shift.title}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              O sistema só exibe colaboradores cadastrados nesta categoria.
            </p>
            <div className="mt-6">
              <button
                onClick={onGoToRegistration}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ir para Cadastro de Colaborador</span>
              </button>
            </div>
          </div>
        ) : (
          /* TABELA ESTILO EXCEL COM SUPORTE A FÉRIAS E ATESTADO */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div ref={tableContainerRef} className="overflow-x-auto scroll-smooth">
              <table className="border-collapse text-xs w-full select-none">
                {/* Cabeçalho da Tabela */}
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    {/* Coluna 1: Matrícula */}
                    <th className="sticky left-0 z-20 bg-slate-50 border-r border-slate-200 py-3 px-3 text-center font-bold text-[11px] text-slate-600 uppercase tracking-wider min-w-[85px] shadow-xs">
                      Matrícula
                    </th>

                    {/* Coluna 2: Dom. Mês */}
                    <th className="sticky left-[85px] z-20 bg-slate-50 border-r border-slate-200 py-3 px-2 text-center font-bold text-[10px] text-slate-600 uppercase tracking-wider min-w-[75px] shadow-xs leading-tight">
                      Dom. Mês
                    </th>

                    {/* Coluna 3: Colaborador */}
                    <th className="sticky left-[160px] z-20 bg-slate-50 border-r border-slate-200 py-3 px-4 text-left font-bold text-[11px] text-slate-600 uppercase tracking-wider min-w-[240px] shadow-xs">
                      Colaborador (Clique p/ Opções / Férias)
                    </th>

                    {/* Colunas de Datas do Mês Visualizado */}
                    {dateColumns.map((col) => {
                      const isToday =
                        col.dayNumber === todayDay &&
                        viewMonth === todayMonth &&
                        viewYear === todayYear;
                      const isSelected = col.dayNumber === selectedDayForMetrics;

                      return (
                        <th
                          key={col.dateKey}
                          onClick={() => setSelectedDayForMetrics(col.dayNumber)}
                          className={`border-r border-slate-200 px-1 py-1.5 min-w-[50px] text-center transition-all cursor-pointer select-none hover:bg-blue-100/60 ${
                            isToday
                              ? 'bg-blue-100/80 text-blue-900 ring-2 ring-blue-500/50 ring-inset shadow-xs'
                              : isSelected
                              ? 'bg-blue-50 text-blue-900 border-b-2 border-b-blue-600'
                              : col.isSunday
                              ? 'bg-rose-50/70 text-rose-800'
                              : col.isSaturday
                              ? 'bg-amber-50/50 text-amber-900'
                              : 'bg-slate-50 text-slate-700'
                          }`}
                          title={`Clique para selecionar este dia (${col.dd}/${String(viewMonth + 1).padStart(2, '0')})${isToday ? ' - HOJE' : ''}`}
                        >
                          {isToday && (
                            <span className="block text-[8px] font-black uppercase text-white bg-blue-600 rounded px-1 mb-0.5 leading-tight shadow-2xs">
                              HOJE
                            </span>
                          )}
                          <div className={`text-[9px] font-bold tracking-wider ${isToday ? 'text-blue-700 font-black' : 'text-slate-400'}`}>
                            {col.dayShort}
                          </div>
                          <div
                            className={`text-xs font-bold mt-0.5 ${
                              isToday
                                ? 'text-blue-950 font-black text-sm'
                                : col.isSunday
                                ? 'text-rose-700 font-extrabold'
                                : 'text-slate-800'
                            }`}
                          >
                            {col.dd}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Linhas dos Colaboradores */}
                <tbody className="divide-y divide-slate-100">
                  {distributedTeams.map(({ team, members }) => {
                    // Remove da tabela os colaboradores que estão em férias (eles são exibidos no card de férias acima)
                    const activeMembersInTable = members.filter(
                      (emp) => !isEmployeeOnVacation(emp.id)
                    );

                    if (activeMembersInTable.length === 0) {
                      return (
                        <tr
                          key={`empty-team-${team.id}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverTeamId !== team.id) setDragOverTeamId(team.id);
                          }}
                          onDragLeave={() => setDragOverTeamId(null)}
                          onDrop={(e) => handleDropOnTeam(e, team.id)}
                          className={`border-b-2 border-dashed transition-colors h-12 ${
                            dragOverTeamId === team.id
                              ? 'bg-blue-100/70 border-blue-500'
                              : 'bg-slate-50/60 border-slate-300'
                          }`}
                        >
                          <td
                            colSpan={3 + dateColumns.length}
                            className="text-center py-2 text-xs font-semibold text-slate-500"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: team.dotColor }}
                              />
                              <span>
                                {members.length > 0
                                  ? `${team.name}: Todos os colaboradores estão em férias (removidos da tabela).`
                                  : `${team.name} está sem colaboradores.`}
                              </span>
                              {members.length === 0 && (
                                <span className="text-blue-600 font-bold underline">
                                  Solte um colaborador aqui para transferir para esta equipe
                                </span>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    return activeMembersInTable.map((emp) => {
                      let empOffs = currentMonthSchedule[emp.id];
                      if (!empOffs && isCurrentMonthGenerated) {
                        // Se o colaborador acabou de ser cadastrado no setor enquanto a escala já estava gerada,
                        // herda visualmente na hora a folga sincronizada da equipe dele
                        const teamFirstOff = getInitialTeamOffDay(
                          team.id,
                          settings.numTeams,
                          currentViewScaleType
                        );
                        const cycleLen =
                          currentViewScaleType === '5x1' ? 6 : currentViewScaleType === '5x2' ? 7 : currentViewScaleType === '6x1' ? 7 : 2;
                        const fallbackDays: Record<number, boolean> = {};
                        for (let d = 1; d <= dateColumns.length; d++) {
                          if (currentViewScaleType === '5x2') {
                            fallbackDays[d] =
                              ((d - teamFirstOff) % 7 + 7) % 7 === 0 ||
                              ((d - (teamFirstOff + 1)) % 7 + 7) % 7 === 0;
                          } else {
                            fallbackDays[d] =
                              ((d - teamFirstOff) % cycleLen + cycleLen) % cycleLen === 0;
                          }
                        }
                        empOffs = fallbackDays;
                      } else if (!empOffs) {
                        empOffs = {};
                      }

                      // Verifica se o colaborador tem algum afastamento ativo
                      const activeLeave = leaves.find((l) => l.employeeId === emp.id);

                      // Contagem de Domingos de Folga no mês visualizado (excluindo férias)
                      const sundayOffsCount = dateColumns.filter((c) => {
                        const dayLeave = getDayLeave(emp.id, c.fullDate);
                        if (dayLeave) return false;
                        return c.isSunday && empOffs[c.dayNumber] === true;
                      }).length;

                      const isBeingDragged = draggedEmpId === emp.id;
                      const isDragOver = dragOverEmpId === emp.id;

                      return (
                        <tr
                          key={emp.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, emp.id)}
                          onDragOver={(e) => handleDragOverRow(e, emp.id, team.id)}
                          onDrop={(e) => handleDropOnRow(e, emp.id, team.id)}
                          onDragEnd={handleDragEnd}
                          className={`transition-colors h-11 ${
                            isBeingDragged
                              ? 'opacity-30 bg-blue-100/60'
                              : isDragOver
                              ? 'bg-blue-50 border-t-2 border-blue-600 shadow-inner'
                              : 'hover:bg-slate-50/40'
                          }`}
                        >
                          {/* 1. Matrícula Sticky */}
                          <td className="sticky left-0 z-10 bg-white border-r border-slate-200 px-3 text-center font-mono text-xs font-semibold text-slate-500 shadow-xs">
                            {emp.registration || '—'}
                          </td>

                          {/* 2. Dom. Mês Sticky */}
                          <td className="sticky left-[85px] z-10 bg-white border-r border-slate-200 px-2 text-center shadow-xs">
                            <span
                              className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${
                                sundayOffsCount > 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {sundayOffsCount}
                            </span>
                          </td>

                          {/* 3. Colaborador Sticky (Arrastável e Clicável para Férias/Atestado/Mudar Equipe) */}
                          <td
                            className={`sticky left-[160px] z-10 bg-white border-r border-slate-200 px-3 py-1 shadow-xs border-l-4 ${team.borderLeftColor}`}
                          >
                            <div
                              onClick={(e) => handleOpenMenu(e, emp)}
                              className="flex items-center justify-between gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition group"
                              title="Arraste para mudar de posição/equipe ou clique para Férias/Atestado/Mudar Equipe"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Alça de Arraste (Grip) */}
                                <div
                                  className="text-slate-300 group-hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5 shrink-0 transition-colors"
                                  title="Clique e arraste para transferir de equipe ou reposicionar"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>

                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${team.avatarBg}`}
                                >
                                  {emp.name
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join('')}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 block text-xs truncate group-hover:text-blue-600">
                                      {emp.name}
                                    </span>
                                    {activeLeave && (
                                      <span
                                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 border ${
                                          activeLeave.type === 'FERIAS'
                                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                                            : activeLeave.type === 'ATESTADO'
                                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                                            : activeLeave.type === 'INSS'
                                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                                            : 'bg-teal-100 text-teal-800 border-teal-300'
                                        }`}
                                      >
                                        {activeLeave.type === 'FERIAS'
                                          ? '🏖️ Férias'
                                          : activeLeave.type === 'ATESTADO'
                                          ? '🩺 Atestado'
                                          : activeLeave.type === 'INSS'
                                          ? '🏥 INSS'
                                          : '📋 Exame'}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {team.name}
                                  </span>
                                </div>
                              </div>

                              <div className="text-slate-400 group-hover:text-blue-600 p-1 rounded-md group-hover:bg-blue-50 transition">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </td>

                          {/* Células de Datas (com suporte a Férias, Atestado, INSS e Exame) */}
                          {dateColumns.map((col) => {
                            const dayLeave = getDayLeave(emp.id, col.fullDate);
                            const isOff = empOffs[col.dayNumber] === true;
                            const isTodayCol =
                              col.dayNumber === todayDay &&
                              viewMonth === todayMonth &&
                              viewYear === todayYear;
                            const isSelectedCol = col.dayNumber === selectedDayForMetrics;

                            return (
                              <td
                                key={col.dayNumber}
                                onClick={() => handleToggleCell(emp.id, col.dayNumber)}
                                className={`border-r border-slate-200/80 p-1 text-center cursor-pointer select-none transition-all active:scale-95 ${
                                  isTodayCol
                                    ? 'bg-blue-50/50'
                                    : isSelectedCol
                                    ? 'bg-blue-50/20'
                                    : ''
                                }`}
                                title={`${emp.name} - ${col.dd}/${String(viewMonth + 1).padStart(2, '0')}: ${
                                  dayLeave
                                    ? dayLeave.type === 'FERIAS'
                                      ? 'Férias'
                                      : dayLeave.type === 'ATESTADO'
                                      ? 'Atestado Médico'
                                      : dayLeave.type === 'INSS'
                                      ? 'Afastamento INSS'
                                      : 'Exame Periódico'
                                    : isOff
                                    ? 'Folga'
                                    : 'Trabalho'
                                }`}
                              >
                                {dayLeave ? (
                                  /* Afastamento: Férias, Atestado, INSS ou Exame */
                                  <div
                                    className={`w-full h-7 rounded-md font-extrabold text-[10px] flex items-center justify-center shadow-2xs border ${
                                      dayLeave.type === 'FERIAS'
                                        ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200'
                                        : dayLeave.type === 'ATESTADO'
                                        ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                                        : dayLeave.type === 'INSS'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                        : 'bg-teal-100 text-teal-900 border-teal-300 hover:bg-teal-200'
                                    }`}
                                  >
                                    {dayLeave.type === 'FERIAS'
                                      ? 'Férias'
                                      : dayLeave.type === 'ATESTADO'
                                      ? 'Atestado'
                                      : dayLeave.type === 'INSS'
                                      ? 'INSS'
                                      : 'Exame'}
                                  </div>
                                ) : isOff ? (
                                  /* Folga: Card branco nítido com borda suave */
                                  <div className="w-full h-7 rounded-md bg-white border border-slate-300 text-slate-800 text-[10px] font-bold flex items-center justify-center shadow-2xs hover:bg-slate-100">
                                    Folga
                                  </div>
                                ) : (
                                  /* Trabalho: Bloco sólido e arredondado na cor da equipe */
                                  <div
                                    className={`w-full h-7 rounded-md flex items-center justify-center transition-all hover:brightness-105 shadow-2xs ${team.cellBg}`}
                                  >
                                    <span className="sr-only">Trabalho</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Configuração (5x1, 6x1, 12x36 e Equipes) */}
        <RoleScheduleConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          roleName={roleName}
          totalEmployees={categoryEmployees.length}
          currentSettings={settings}
          onSave={(newSettings) => {
            const numTeamsChanged = newSettings.numTeams !== settings.numTeams;
            setSettings(newSettings);

            let targetTeams = distributedTeams;
            if (numTeamsChanged || distributedTeams.length !== newSettings.numTeams) {
              // Redistribui imediatamente para todas as novas equipes
              const newDist = distributeEmployeesToTeams(categoryEmployees, newSettings.numTeams);
              const newAssignments: Record<number, string[]> = {};
              for (let i = 0; i < newSettings.numTeams; i++) {
                newAssignments[i] = [];
              }
              newDist.forEach(({ team, members }) => {
                newAssignments[team.id] = members.map((m) => m.id);
              });
              setTeamAssignments(newAssignments);
              targetTeams = newDist;
            }

            setMonthlyScaleTypes((prev) => ({
              ...prev,
              [currentMonthKey]: newSettings.scaleType,
            }));
            generateScheduleForMonth(
              viewMonth,
              viewYear,
              newSettings,
              'nova',
              'auto',
              targetTeams,
              newSettings.scaleType
            );
            const modeDesc = newSettings.offDayMode === 'manual' ? ' (Folgas manuais aplicadas por equipe)' : '';
            showToast(
              `Configurações salvas: Escala ${newSettings.scaleType} com ${newSettings.numTeams} equipes${modeDesc}!`
            );
          }}
        />

        {/* Modal Gerar Folga (Escolher mês e se é Nova ou Continuidade) */}
        <GenerateFolgaModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          currentViewMonth={viewMonth}
          currentViewYear={viewYear}
          scaleType={currentViewScaleType}
          monthlySchedules={monthlySchedules}
          onConfirm={handleConfirmGenerate}
        />

        {/* Modal de Afastamento (Férias e Atestado com Seletor de Período) */}
        <LeaveModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          employee={selectedEmpForLeave}
          teamName={
            selectedEmpForLeave
              ? employeeTeamMap.get(selectedEmpForLeave.id)?.name || ''
              : ''
          }
          initialType={selectedLeaveType}
          existingLeave={selectedExistingLeave}
          currentYear={viewYear}
          currentMonth={viewMonth}
          onSaveLeave={handleSaveLeave}
          onRemoveLeave={handleRemoveLeave}
        />

        {/* Menu Flutuante ao Clicar no Colaborador (Renderizado em Camada Fixa com z-50 para NUNCA ficar atrás dos nomes) */}
        {menuAnchor && (
          <>
            {/* Backdrop para fechar ao clicar fora */}
            <div
              className="fixed inset-0 z-50 bg-black/10"
              onClick={() => setMenuAnchor(null)}
            />

            {/* Menu Popover Flutuante */}
            <div
              style={{
                position: 'fixed',
                top: `${menuAnchor.top}px`,
                left: `${menuAnchor.left}px`,
              }}
              className="z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 w-64 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
            >
              {/* Cabeçalho do Menu com Identificação do Colaborador */}
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between mb-1">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Afastamento
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {menuAnchor.employee.name}
                  </span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono shrink-0">
                  {menuAnchor.employee.registration || 'S/M'}
                </span>
              </div>

              {/* Opções de Afastamento */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleOpenLeaveModal(menuAnchor.employee, 'FERIAS')}
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
                  onClick={() => handleOpenLeaveModal(menuAnchor.employee, 'ATESTADO')}
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
                  onClick={() => handleOpenLeaveModal(menuAnchor.employee, 'INSS')}
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
                  onClick={() => handleOpenLeaveModal(menuAnchor.employee, 'EXAME')}
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

                {(() => {
                  const activeEmpLeave = leaves.find(
                    (l) => l.employeeId === menuAnchor.employee.id
                  );
                  if (!activeEmpLeave) return null;

                  return (
                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleRemoveLeave(activeEmpLeave.id);
                          setMenuAnchor(null);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 transition text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Afastamento Atual</span>
                      </button>
                    </div>
                  );
                })()}

                {/* Opção Rápida: Mover para outra Equipe */}
                <div className="border-t border-slate-100 pt-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1.5 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    Mover para Equipe:
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {distributedTeams.map(({ team }) => {
                      const isCurrentTeam =
                        employeeTeamMap.get(menuAnchor.employee.id)?.id === team.id;
                      if (isCurrentTeam) return null;

                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => handleMoveToTeam(menuAnchor.employee, team.id)}
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
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
