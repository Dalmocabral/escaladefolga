export const MONTH_NAMES = [
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
] as const;

export const DAY_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const;

export const ALL_MONTHS = MONTH_NAMES.map((label, value) => ({
  value,
  label,
}));

/**
 * Retorna uma lista de anos disponíveis (ano atual - 1 até ano atual + 3)
 */
export const getAvailableYears = (baseYear: number = new Date().getFullYear()): number[] => {
  return [baseYear - 1, baseYear, baseYear + 1, baseYear + 2];
};
