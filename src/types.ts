export type ShiftId = 'manha' | 'tarde' | 'noite';

export type ScaleType = '5x1' | '5x2' | '6x1' | '12x36';

export type GenerationMode = 'nova' | 'continuidade' | 'manual';

export type CompensatorySundayMode = 'auto' | 'manual';
export type CompensatoryStrategy = 'swap' | 'additional';

export type LeaveType = 'FERIAS' | 'ATESTADO' | 'INSS' | 'EXAME';

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  observation?: string;
}

export interface ShiftConfig {
  id: ShiftId;
  title: string;
  emoji: string;
  timeRange: string;
  bgImage?: string;
}

export interface Employee {
  id: string;
  name: string;
  registration: string;
  role: string;
  shiftId: ShiftId;
}

export type DayScheduleValue = boolean | string;

export type OffDayStyle = 'consecutive' | 'interleaved';
export type RotationMode = 'fixed' | 'weekly_rotation';

export interface CategoryScheduleSettings {
  scaleType: ScaleType;
  numTeams: number;
  offDayMode?: 'auto' | 'manual';
  customTeamOffDays?: Record<number, number>; // teamId -> primeiro dia de folga (1..7)
  rotationMode?: RotationMode; // Em 5x2: fixo ou escala corrida semanal (Modelo A)
  offDayStyle?: OffDayStyle; // 'consecutive' (2 juntas) ou 'interleaved' (3x1 + 2x1 separadas)
}

export interface GenerateFolgaOptions {
  targetMonth: number;
  targetYear: number;
  mode: GenerationMode;
  targetScaleType?: ScaleType;
  offDayStyle?: OffDayStyle;
  compensatorySunday?: CompensatorySundayMode;
  compensatoryStrategy?: CompensatoryStrategy;
}

export interface OperationalCategory {
  id: string;
  title: string;
  role: string;
  emoji: string;
  isCustom?: boolean;
}
