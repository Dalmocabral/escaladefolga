export type ShiftId = 'manha' | 'tarde' | 'noite';

export type ScaleType = '5x1' | '5x2' | '6x1' | '12x36';

export type GenerationMode = 'nova' | 'continuidade';

export type CompensatorySundayMode = 'auto' | 'manual';
export type CompensatoryStrategy = 'swap' | 'additional';

export type LeaveType = 'FERIAS' | 'ATESTADO';

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

export interface CategoryScheduleSettings {
  scaleType: ScaleType;
  numTeams: number;
}

export interface GenerateFolgaOptions {
  targetMonth: number;
  targetYear: number;
  mode: GenerationMode;
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
