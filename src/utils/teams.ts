import type { ScaleType, Employee, OffDayStyle } from '../types';

export interface TeamConfig {
  id: number;
  name: string;
  colorName: string;
  cellBg: string;
  badgeClass: string;
  avatarBg: string;
  dotColor: string;
  borderLeftColor: string;
}

export const TEAMS: TeamConfig[] = [
  {
    id: 0,
    name: 'Equipe Verde',
    colorName: 'Verde',
    cellBg: 'bg-emerald-500 text-white font-medium',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-600 text-white shadow-2xs',
    dotColor: '#10b981',
    borderLeftColor: 'border-l-emerald-500',
  },
  {
    id: 1,
    name: 'Equipe Azul',
    colorName: 'Azul',
    cellBg: 'bg-blue-500 text-white font-medium',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarBg: 'bg-blue-600 text-white shadow-2xs',
    dotColor: '#3b82f6',
    borderLeftColor: 'border-l-blue-500',
  },
  {
    id: 2,
    name: 'Equipe Amarela',
    colorName: 'Amarela',
    cellBg: 'bg-amber-400 text-amber-950 font-bold',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    avatarBg: 'bg-amber-500 text-white shadow-2xs',
    dotColor: '#f59e0b',
    borderLeftColor: 'border-l-amber-400',
  },
  {
    id: 3,
    name: 'Equipe Vermelha',
    colorName: 'Vermelha',
    cellBg: 'bg-rose-500 text-white font-medium',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    avatarBg: 'bg-rose-600 text-white shadow-2xs',
    dotColor: '#f43f5e',
    borderLeftColor: 'border-l-rose-500',
  },
  {
    id: 4,
    name: 'Equipe Cinza',
    colorName: 'Cinza',
    cellBg: 'bg-slate-400 text-white font-medium',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    avatarBg: 'bg-slate-500 text-white shadow-2xs',
    dotColor: '#64748b',
    borderLeftColor: 'border-l-slate-400',
  },
  {
    id: 5,
    name: 'Equipe Roxa',
    colorName: 'Roxa',
    cellBg: 'bg-purple-600 text-white font-medium',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    avatarBg: 'bg-purple-600 text-white shadow-2xs',
    dotColor: '#9333ea',
    borderLeftColor: 'border-l-purple-600',
  },
  {
    id: 6,
    name: 'Equipe Ciano',
    colorName: 'Ciano',
    cellBg: 'bg-cyan-500 text-white font-medium',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    avatarBg: 'bg-cyan-600 text-white shadow-2xs',
    dotColor: '#06b6d4',
    borderLeftColor: 'border-l-cyan-500',
  },
  {
    id: 7,
    name: 'Equipe Laranja',
    colorName: 'Laranja',
    cellBg: 'bg-orange-500 text-white font-medium',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    avatarBg: 'bg-orange-600 text-white shadow-2xs',
    dotColor: '#f97316',
    borderLeftColor: 'border-l-orange-500',
  },
];

// Regra que define o primeiro dia de folga para cada equipe (folgas contínuas e sequenciais ou manuais)
export const getInitialTeamOffDay = (
  teamIdx: number,
  _numTeams: number,
  scaleType: ScaleType,
  customTeamOffDays?: Record<number, number>
): number => {
  if (customTeamOffDays && customTeamOffDays[teamIdx] !== undefined) {
    return customTeamOffDays[teamIdx];
  }

  if (scaleType === '5x1') {
    // Escala 5x1: ciclo de 6 dias (5 trabalhados + 1 folga)
    return (teamIdx % 6) + 1;
  }

  if (scaleType === '5x2') {
    // Escala 5x2: ciclo de 7 dias (5 trabalhados + 2 folgas consecutivas - uma atrás da outra)
    return (teamIdx % 7) + 1;
  }

  if (scaleType === '6x1') {
    // Escala 6x1: ciclo de 7 dias (6 trabalhados + 1 folga)
    return (teamIdx % 7) + 1;
  }

  // 12x36: alternância diária (Dia 1 e Dia 2)
  return (teamIdx % 2) + 1;
};

export function distributeEmployeesToTeams<T>(items: T[], numTeams: number) {
  const result: { team: TeamConfig; members: T[] }[] = [];
  const safeNumTeams = Math.max(1, Math.min(numTeams, TEAMS.length));

  const total = items.length;
  if (total === 0) {
    for (let i = 0; i < safeNumTeams; i++) {
      result.push({ team: TEAMS[i], members: [] });
    }
    return result;
  }

  const baseSize = Math.floor(total / safeNumTeams);
  const remainder = total % safeNumTeams;

  let currentIndex = 0;
  for (let i = 0; i < safeNumTeams; i++) {
    const extra = i >= (safeNumTeams - remainder) ? 1 : 0;
    const count = baseSize + extra;
    const members = items.slice(currentIndex, currentIndex + count);
    currentIndex += count;

    result.push({
      team: TEAMS[i],
      members,
    });
  }

  return result;
}

export interface ReorganizeTeamsOptions {
  employees: Employee[];
  prevMonthSchedule: Record<string, Record<number, boolean | string>>;
  prevMonthTotalDays: number;
  targetScaleType: ScaleType;
  numTeams: number;
  customTeamOffDays?: Record<number, number>;
}

/**
 * Reorganiza os colaboradores entre equipes para transição de meses (ex: 5x1 <-> 5x2 ou continuidade)
 * Garantindo RIGOROSAMENTE:
 * 1. Nenhum colaborador trabalha mais de 6 dias consecutivos na virada do mês (TotalTrabalhado <= 6).
 * 2. As equipes permanecem equilibradas no tamanho.
 * 3. As folgas seguem o padrão da escala de destino (5x2: 2 folgas consecutivas; 5x1: 1 folga).
 */
export function reorganizeTeamsForScaleTransition({
  employees,
  prevMonthSchedule,
  prevMonthTotalDays,
  targetScaleType,
  numTeams,
  customTeamOffDays,
}: ReorganizeTeamsOptions): Record<number, string[]> {
  const safeNumTeams = Math.max(1, Math.min(numTeams, TEAMS.length));
  const maxCap = Math.ceil(employees.length / safeNumTeams);

  // 1. Calcula para cada colaborador os dias trabalhados consecutivamente no final do mês anterior
  const empData = employees.map((emp) => {
    let workedAtEnd = 0;
    const empPrev = prevMonthSchedule[emp.id];
    if (empPrev) {
      for (let d = prevMonthTotalDays; d >= 1; d--) {
        if (empPrev[d] === true) break;
        workedAtEnd++;
      }
    }
    return { emp, workedAtEnd };
  });

  // Ordena decrescente pelos dias trabalhados (os mais restritivos primeiro)
  empData.sort((a, b) => b.workedAtEnd - a.workedAtEnd);

  const teamFirstOff: number[] = [];
  for (let t = 0; t < safeNumTeams; t++) {
    teamFirstOff.push(getInitialTeamOffDay(t, safeNumTeams, targetScaleType, customTeamOffDays));
  }

  const teamMembers: string[][] = Array.from({ length: safeNumTeams }, () => []);

  for (const { emp, workedAtEnd } of empData) {
    let bestTeam = -1;
    let bestScore = Infinity;

    for (let t = 0; t < safeNumTeams; t++) {
      const f = teamFirstOff[t];
      const startWorkedInNewMonth = f - 1;
      const totalConsecutive = workedAtEnd + startWorkedInNewMonth;

      // REGRA MESTRA: Não pode ultrapassar 6 dias trabalhados
      if (totalConsecutive > 6) {
        continue;
      }

      const currentCount = teamMembers[t].length;
      let capacityPenalty = 0;
      if (currentCount >= maxCap) {
        capacityPenalty = 1000 + (currentCount - maxCap) * 500;
      } else {
        // Encoraja equilíbrio de membros entre as equipes
        capacityPenalty = currentCount * 30;
      }

      // Distância do ciclo ideal de 5 dias trabalhados
      const distanceTo5 = Math.abs(totalConsecutive - 5);
      const score = distanceTo5 * 15 + capacityPenalty;

      if (score < bestScore) {
        bestScore = score;
        bestTeam = t;
      }
    }

    // Se nenhuma equipe couber com <= 6 dias (caso extremo), seleciona a equipe com menor número de dias até a primeira folga
    if (bestTeam === -1) {
      let bestT = 0;
      let minTotal = Infinity;
      for (let t = 0; t < safeNumTeams; t++) {
        const total = workedAtEnd + (teamFirstOff[t] - 1);
        if (total < minTotal) {
          minTotal = total;
          bestT = t;
        }
      }
      bestTeam = bestT;
    }

    teamMembers[bestTeam].push(emp.id);
  }

  const result: Record<number, string[]> = {};
  for (let t = 0; t < safeNumTeams; t++) {
    result[t] = teamMembers[t];
  }
  return result;
}

/**
 * Infere a distribuição de equipes de um mês a partir dos dias de folga gravados na escala.
 * Garante que ao navegar para qualquer mês passado (como Outubro), os colaboradores apareçam
 * exatamente nas equipes com as quais a escala daquele mês foi originalmente gerada.
 */
export function inferTeamsFromMonthSchedule(
  schedule: Record<string, Record<number, boolean | string>>,
  scaleType: ScaleType,
  numTeams: number,
  employees: Employee[]
): Record<number, string[]> {
  const safeNumTeams = Math.max(1, Math.min(numTeams, TEAMS.length));
  const result: Record<number, string[]> = {};
  for (let i = 0; i < safeNumTeams; i++) {
    result[i] = [];
  }

  const cycleLen = scaleType === '5x1' ? 6 : scaleType === '5x2' ? 7 : scaleType === '6x1' ? 7 : 2;
  const assigned = new Set<string>();

  employees.forEach((emp) => {
    const empDays = schedule[emp.id];
    if (!empDays) return;

    let firstOff = -1;
    for (let d = 1; d <= cycleLen; d++) {
      if (empDays[d] === true) {
        firstOff = d;
        break;
      }
    }

    if (firstOff !== -1) {
      let teamId = 0;
      if (scaleType === '5x1') {
        teamId = (firstOff - 1) % 6;
      } else if (scaleType === '5x2') {
        teamId = (firstOff - 1) % 7;
      } else if (scaleType === '6x1') {
        teamId = (firstOff - 1) % 7;
      } else {
        teamId = (firstOff - 1) % 2;
      }

      if (teamId < safeNumTeams) {
        result[teamId].push(emp.id);
        assigned.add(emp.id);
      }
    }
  });

  // Colaboradores sem folga nos primeiros dias são distribuídos nas equipes menores
  const unassigned = employees.filter((e) => !assigned.has(e.id));
  unassigned.forEach((emp) => {
    let smallestTeamIdx = 0;
    let smallestCount = Infinity;
    for (let i = 0; i < safeNumTeams; i++) {
      if (result[i].length < smallestCount) {
        smallestCount = result[i].length;
        smallestTeamIdx = i;
      }
    }
    result[smallestTeamIdx].push(emp.id);
  });

  return result;
}

export interface TeamContinuityResult {
  firstOff: number;
  isSecondDayOfOff: boolean;
}

/**
 * Calcula o primeiro dia de folga de uma equipe no mês de destino baseado no histórico real do mês anterior.
 * Respeita rigorosamente a continuidade:
 * - Se folgou no penúltimo e último dia (ex: 29 e 30 em 5x2), trabalha 5 dias (1 a 5) e folga no dia 6 e 7!
 * - Se folgou apenas no último dia (dia 30 foi folga #1), o dia 1 do novo mês é folga #2!
 * - Se trabalhou W dias no final do mês anterior, trabalha 5 - W dias e folga no dia 6 - W!
 */
export function computeTeamContinuityOffDays(
  prevMonthSchedule: Record<string, Record<number, boolean | string>>,
  memberIds: string[],
  prevTotalDays: number,
  targetScaleType: ScaleType,
  defaultFirstOff: number
): TeamContinuityResult {
  const membersWithHistory = memberIds.filter((id) => prevMonthSchedule[id]);
  if (membersWithHistory.length === 0) {
    return { firstOff: defaultFirstOff, isSecondDayOfOff: false };
  }

  let lastDayOffCount = 0;
  let secondLastDayOffCount = 0;
  const workedCounts: number[] = [];

  membersWithHistory.forEach((id) => {
    const offs = prevMonthSchedule[id] || {};
    const isLastOff = Boolean(offs[prevTotalDays]) && offs[prevTotalDays] !== 'TRABALHO';
    const isSecondLastOff = Boolean(offs[prevTotalDays - 1]) && offs[prevTotalDays - 1] !== 'TRABALHO';
    if (isLastOff) lastDayOffCount++;
    if (isSecondLastOff) secondLastDayOffCount++;

    let w = 0;
    for (let d = prevTotalDays; d >= 1; d--) {
      const isOff = Boolean(offs[d]) && offs[d] !== 'TRABALHO';
      if (isOff) break;
      w++;
    }
    workedCounts.push(w);
  });

  const half = membersWithHistory.length / 2;
  const lastDayWasOff = lastDayOffCount >= half;
  const secondLastDayWasOff = secondLastDayOffCount >= half;

  const freqMap = new Map<number, number>();
  workedCounts.forEach((w) => freqMap.set(w, (freqMap.get(w) || 0) + 1));
  let bestWorked = workedCounts[0];
  let maxF = 0;
  freqMap.forEach((f, w) => {
    if (f > maxF) {
      maxF = f;
      bestWorked = w;
    }
  });

  if (targetScaleType === '5x2') {
    if (lastDayWasOff) {
      if (secondLastDayWasOff) {
        // Folgou 29 e 30: trabalha 1, 2, 3, 4, 5 e folga dias 6 e 7!
        return { firstOff: 6, isSecondDayOfOff: false };
      } else {
        // Dia 30 foi o 1º dia de folga: Dia 1 é o 2º dia de folga!
        return { firstOff: 1, isSecondDayOfOff: true };
      }
    } else {
      if (bestWorked >= 5) {
        return { firstOff: 1, isSecondDayOfOff: false };
      } else {
        return { firstOff: 6 - bestWorked, isSecondDayOfOff: false };
      }
    }
  }

  if (targetScaleType === '5x1') {
    if (lastDayWasOff) {
      return { firstOff: 6, isSecondDayOfOff: false };
    } else {
      return { firstOff: bestWorked >= 5 ? 1 : 6 - bestWorked, isSecondDayOfOff: false };
    }
  }

  if (targetScaleType === '6x1') {
    if (lastDayWasOff) {
      return { firstOff: 7, isSecondDayOfOff: false };
    } else {
      return { firstOff: bestWorked >= 6 ? 1 : 7 - bestWorked, isSecondDayOfOff: false };
    }
  }

  return { firstOff: lastDayWasOff ? 2 : 1, isSecondDayOfOff: false };
}

/**
 * Gera as folgas de um mês para uma equipe a partir da informação de continuidade calculada.
 */
export function buildTeamMonthOffDays(
  daysInTarget: number,
  scaleType: ScaleType,
  continuity: TeamContinuityResult
): Record<number, boolean> {
  const days: Record<number, boolean> = {};

  if (scaleType === '5x2') {
    if (continuity.isSecondDayOfOff) {
      days[1] = true;
      for (let d = 2; d <= daysInTarget; d++) {
        days[d] =
          ((d - 7) % 7 + 7) % 7 === 0 ||
          ((d - 8) % 7 + 7) % 7 === 0;
      }
    } else {
      const f = continuity.firstOff;
      for (let d = 1; d <= daysInTarget; d++) {
        days[d] =
          ((d - f) % 7 + 7) % 7 === 0 ||
          ((d - (f + 1)) % 7 + 7) % 7 === 0;
      }
    }
  } else if (scaleType === '5x1') {
    const f = continuity.firstOff;
    for (let d = 1; d <= daysInTarget; d++) {
      days[d] = ((d - f) % 6 + 6) % 6 === 0;
    }
  } else if (scaleType === '6x1') {
    const f = continuity.firstOff;
    for (let d = 1; d <= daysInTarget; d++) {
      days[d] = ((d - f) % 7 + 7) % 7 === 0;
    }
  } else {
    // 12x36
    const f = continuity.firstOff;
    for (let d = 1; d <= daysInTarget; d++) {
      days[d] = ((d - f) % 2 + 2) % 2 === 0;
    }
  }

  return days;
}

/**
 * Pares de folgas semanais consecutivas para a Escala 5x2 (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
 */
export const ROTATION_PAIRS_5X2: [number, number][] = [
  [1, 2], // Par 0: Segunda e Terça
  [2, 3], // Par 1: Terça e Quarta
  [3, 4], // Par 2: Quarta e Quinta
  [4, 5], // Par 3: Quinta e Sexta
  [5, 6], // Par 4: Sexta e Sábado
  [6, 0], // Par 5: Sábado e Domingo
  [0, 1], // Par 6: Domingo e Segunda
];

/**
 * Retorna o índice da semana no calendário contínuo (semanas de Domingo a Sábado),
 * ancorado no domingo 01/11/2026.
 * Todos os 7 dias da mesma semana compartilham o mesmo weekIndex.
 */
export function getCalendarWeekIndex(year: number, month: number, day: number): number {
  const d = new Date(year, month, day);
  const dow = d.getDay(); // 0 = Domingo, ..., 6 = Sábado
  const sun = new Date(year, month, day - dow);
  const anchor = new Date(2026, 10, 1);
  const diffDays = Math.round((sun.getTime() - anchor.getTime()) / (24 * 3600 * 1000));
  return Math.floor(diffDays / 7);
}

/**
 * Determina se a equipe está de folga em uma data específica no regime contínuo 5x2 com 7 equipes.
 * Aplica o Modelo A (Escala Corrida com Rotação SEMANAL de Equipes):
 * - A cada semana, cada equipe rotaciona e muda de par de folga (garantindo que todas passem pelos fins de semana).
 * - Em todos os dias do ano, rigorosamente 2 equipes folgam e 5 equipes trabalham.
 * - Todos os membros da mesma equipe recebem 100% a mesma escala.
 */
export function isTeamOff5x2Continuous(
  year: number,
  month: number,
  day: number,
  teamId: number
): boolean {
  const weekIndex = getCalendarWeekIndex(year, month, day);
  const pairIdx = (((teamId + weekIndex) % 7) + 7) % 7;
  const pair = ROTATION_PAIRS_5X2[pairIdx];
  const dow = new Date(year, month, day).getDay();
  return pair[0] === dow || pair[1] === dow;
}

/**
 * Pares de folgas semanais intercaladas para a Escala 5x2 (3x1 + 2x1 corrida rotativa).
 * (0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado).
 * Cada par separa as duas folgas por intervalos de 2 e 3 dias de trabalho (máx. 3 ou 4 dias seguidos de trabalho).
 * Em todos os 7 dias da semana, rigorosamente 2 equipes folgam e 5 equipes trabalham.
 */
export const INTERLEAVED_PAIRS_5X2: [number, number][] = [
  [3, 0], // Par 0: Quarta e Domingo
  [4, 1], // Par 1: Quinta e Segunda
  [5, 2], // Par 2: Sexta e Terça
  [6, 3], // Par 3: Sábado e Quarta
  [0, 4], // Par 4: Domingo e Quinta
  [1, 5], // Par 5: Segunda e Sexta
  [2, 6], // Par 6: Terça e Sábado
];

/**
 * Determina se a equipe está de folga em uma data específica no regime contínuo 5x2 INTERCALADO (3x1 + 2x1).
 * Rotação SEMANAL de equipes: a cada semana a equipe avança de par de folga!
 * As folgas não são consecutivas: ocorrem separadas na semana (ex: Quarta e Domingo, etc.).
 * Ninguém trabalha mais do que 4 dias seguidos na troca de semana (muito abaixo do limite CLT de 6).
 */
export function isTeamOff5x2Interleaved(
  year: number,
  month: number,
  day: number,
  teamId: number
): boolean {
  const weekIndex = getCalendarWeekIndex(year, month, day);
  const pairIdx = (((teamId + weekIndex) % 7) + 7) % 7;
  const pair = INTERLEAVED_PAIRS_5X2[pairIdx];
  const dow = new Date(year, month, day).getDay();
  return pair[0] === dow || pair[1] === dow;
}

/**
 * Constrói a escala inicial do mês para uma categoria quando não há escala salva no localStorage.
 */
export function buildInitialSchedule(
  year: number,
  month: number,
  employees: Employee[],
  shiftId: string,
  roleName: string,
  numTeams: number,
  scaleType: ScaleType,
  savedAssignments?: Record<number, string[]>,
  customTeamOffDays?: Record<number, number>,
  rotationMode?: 'fixed' | 'weekly_rotation',
  offDayStyle?: OffDayStyle
): Record<string, Record<number, boolean>> {
  const schedule: Record<string, Record<number, boolean>> = {};
  const catEmployees = employees.filter(
    (e) => e.shiftId === shiftId && e.role.toLowerCase() === roleName.toLowerCase()
  );
  const cycleLen = scaleType === '5x1' ? 6 : scaleType === '5x2' ? 7 : scaleType === '6x1' ? 7 : 2;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthSundays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month, d).getDay() === 0) {
      monthSundays.push(d);
    }
  }
  const numSundays = monthSundays.length;

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

  // Em 5x2 com 7 equipes e modo revezamento (Modelo A), aplica o deslocamento mensal
  const monthOffset =
    scaleType === '5x2' && numTeams === 7 && rotationMode !== 'fixed'
      ? ((year * 12 + month) % 7 + 7) % 7
      : 0;

  teamGroups.forEach(({ teamId, memberIds }) => {
    let firstOffDay = getInitialTeamOffDay(teamId, numTeams, scaleType, customTeamOffDays);
    if (scaleType === '5x2' && numTeams === 7 && rotationMode !== 'fixed' && !customTeamOffDays?.[teamId]) {
      firstOffDay = ((teamId + monthOffset) % 7) + 1;
    }

    const daysOff: Record<number, boolean> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      if (scaleType === '5x2' && offDayStyle === 'interleaved') {
        daysOff[d] = isTeamOff5x2Interleaved(year, month, d, teamId);
      } else if (scaleType === '5x2' && numTeams === 7 && rotationMode !== 'fixed' && !customTeamOffDays?.[teamId]) {
        daysOff[d] = isTeamOff5x2Continuous(year, month, d, teamId);
      } else if (scaleType === '5x2') {
        // Em 5x2 Fixo: rigorosamente 2 folgas consecutivas a cada 7 dias
        daysOff[d] =
          ((d - firstOffDay) % 7 + 7) % 7 === 0 ||
          ((d - (firstOffDay + 1)) % 7 + 7) % 7 === 0;
      } else {
        daysOff[d] = ((d - firstOffDay) % cycleLen + cycleLen) % cycleLen === 0;
      }
    }

    // Todos os membros da mesma equipe recebem RIGOROSAMENTE a mesma escala
    memberIds.forEach((empId) => {
      schedule[empId] = { ...daysOff };
    });

    // Distribuição de folga compensatória dominical em 5x1/6x1 para quem ficou com 0 domingos
    if (scaleType !== '5x2' && numSundays > 0) {
      const zeroSundayEmpIds = memberIds.filter((empId) => {
        const offs = schedule[empId] || {};
        return monthSundays.filter((s) => offs[s] === true).length === 0;
      });

      if (zeroSundayEmpIds.length > 0) {
        zeroSundayEmpIds.forEach((empId, idx) => {
          const targetSunday = monthSundays[idx % numSundays];
          schedule[empId][targetSunday] = true;
        });
      }
    }
  });

  return schedule;
}
