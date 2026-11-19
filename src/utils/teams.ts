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
