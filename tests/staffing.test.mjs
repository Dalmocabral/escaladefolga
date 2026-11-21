import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const testDir = dirname(fileURLToPath(import.meta.url));
const tempDir = await mkdtemp(join(tmpdir(), 'escala-staffing-tests-'));
after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

const tscBinary = resolve(testDir, `../node_modules/.bin/${process.platform === 'win32' ? 'tsc.cmd' : 'tsc'}`);
execFileSync(tscBinary, [
  resolve(testDir, '../src/utils/teams.ts'),
  resolve(testDir, '../src/utils/staffing.ts'),
  '--target', 'ES2022',
  '--module', 'CommonJS',
  '--ignoreConfig',
  '--skipLibCheck',
  '--outDir', tempDir,
], { cwd: resolve(testDir, '..'), stdio: 'pipe', shell: process.platform === 'win32' });

const req = createRequire(import.meta.url);
const staffingModule = req(join(tempDir, 'utils', 'staffing.js'));

const { computeDailyStaffing, getDefaultLeavesForRole, normalizeDateStr } = staffingModule;

test('normalizeDateStr normaliza YYYY-MM-DD e DD/MM/YYYY', () => {
  assert.equal(normalizeDateStr('2026-11-17'), '2026-11-17');
  assert.equal(normalizeDateStr('17/11/2026'), '2026-11-17');
  assert.equal(normalizeDateStr('05/11/2026'), '2026-11-05');
});

test('getDefaultLeavesForRole gera atestados conforme relatório operacional', () => {
  const dummyEmployees = [
    { id: '1', name: 'Emp 1', registration: '1', role: 'Operador de RTG', shiftId: 'manha' },
    { id: '2', name: 'Emp 2', registration: '2', role: 'Operador de RTG', shiftId: 'manha' },
    { id: '3', name: 'Emp 3', registration: '3', role: 'Operador de RTG', shiftId: 'manha' },
  ];
  const rtgLeaves = getDefaultLeavesForRole('manha', 'Operador de RTG', dummyEmployees);
  const rtgAtestados = rtgLeaves.filter((l) => l.type === 'ATESTADO');
  assert.equal(rtgAtestados.length, 1);

  const rsLeaves = getDefaultLeavesForRole('manha', 'Operador Reach Stacker', dummyEmployees);
  const rsAtestados = rsLeaves.filter((l) => l.type === 'ATESTADO');
  assert.equal(rsAtestados.length, 2);

  const matLeaves = getDefaultLeavesForRole('manha', 'Material', dummyEmployees);
  const matAtestados = matLeaves.filter((l) => l.type === 'ATESTADO');
  assert.equal(matAtestados.length, 1);

  const blocoLeaves = getDefaultLeavesForRole('manha', 'Operador de Bloco', dummyEmployees);
  const blocoAtestados = blocoLeaves.filter((l) => l.type === 'ATESTADO');
  assert.equal(blocoAtestados.length, 1);
});

test('computeDailyStaffing contabiliza atestados e férias no turno manhã para 17/11/2026', () => {
  const shift = {
    id: 'manha',
    name: 'Turno Manhã (07:00 - 15:00)',
    timeRange: '07:00 - 15:00',
    color: 'amber',
  };

  const employees = [
    // RTG (3 emps)
    { id: 'rtg1', name: 'RTG 1', registration: '101', role: 'Operador de RTG', shiftId: 'manha' },
    { id: 'rtg2', name: 'RTG 2', registration: '102', role: 'Operador de RTG', shiftId: 'manha' },
    { id: 'rtg3', name: 'RTG 3', registration: '103', role: 'Operador de RTG', shiftId: 'manha' },
    // RS (3 emps)
    { id: 'rs1', name: 'RS 1', registration: '201', role: 'Operador Reach Stacker', shiftId: 'manha' },
    { id: 'rs2', name: 'RS 2', registration: '202', role: 'Operador Reach Stacker', shiftId: 'manha' },
    { id: 'rs3', name: 'RS 3', registration: '203', role: 'Operador Reach Stacker', shiftId: 'manha' },
    // Bloco (2 emps)
    { id: 'bl1', name: 'Bloco 1', registration: '301', role: 'Operador de Bloco', shiftId: 'manha' },
    { id: 'bl2', name: 'Bloco 2', registration: '302', role: 'Operador de Bloco', shiftId: 'manha' },
    // Material (2 emps)
    { id: 'mat1', name: 'Mat 1', registration: '401', role: 'Material', shiftId: 'manha' },
    { id: 'mat2', name: 'Mat 2', registration: '402', role: 'Material', shiftId: 'manha' },
  ];

  const targetDate = new Date(2026, 10, 17); // 17 de Novembro de 2026
  const { rows, totals } = computeDailyStaffing(shift, targetDate, employees);

  const rtgRow = rows.find((r) => r.key === 'rtg');
  assert.equal(rtgRow?.atestados, 1, 'RTG deve ter 1 atestado');
  assert.equal(rtgRow?.ferias, 2, 'RTG deve ter 2 férias');

  const rsRow = rows.find((r) => r.key === 'rs');
  assert.equal(rsRow?.atestados, 2, 'RS deve ter 2 atestados');
  assert.equal(rsRow?.ferias, 1, 'RS deve ter 1 férias');

  const blocoRow = rows.find((r) => r.key === 'bloco');
  assert.equal(blocoRow?.atestados, 1, 'Bloco deve ter 1 atestado');

  const matRow = rows.find((r) => r.key === 'material');
  assert.equal(matRow?.atestados, 1, 'Material deve ter 1 atestado');

  assert.equal(totals.atestados, 5, 'Total de atestados no turno deve ser 5');
});

test('computeDailyStaffing reflete atestados personalizados no dia 21/11/2026 e 0 no dia 17/11/2026', () => {
  const shift = {
    id: 'manha',
    name: 'Turno Manhã (07:00 - 15:00)',
    timeRange: '07:00 - 15:00',
    color: 'amber',
  };

  const employees = [
    { id: '1001', name: 'teste001', registration: '001', role: 'Motorista', shiftId: 'manha' },
    { id: '1002', name: 'teste002', registration: '002', role: 'Motorista', shiftId: 'manha' },
    { id: '1030', name: 'Valdir Fernandes Jr', registration: '1030', role: 'Motorista', shiftId: 'manha' },
  ];

  // Mock global localStorage
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] || null,
  };

  // Salva os 3 atestados do usuário que iniciam em 21/11/2026
  const userLeaves = [
    {
      id: 'leave-1',
      employeeId: '1001',
      type: 'ATESTADO',
      startDate: '2026-11-21',
      endDate: '2026-11-24',
      observation: 'Atestado médico',
    },
    {
      id: 'leave-2',
      employeeId: '1002',
      type: 'ATESTADO',
      startDate: '2026-11-21',
      endDate: '2026-11-24',
      observation: 'Atestado médico',
    },
    {
      id: 'leave-3',
      employeeId: '1030',
      type: 'ATESTADO',
      startDate: '2026-11-21',
      endDate: '2026-11-24',
      observation: 'Atestado médico Valdir',
    },
  ];
  globalThis.localStorage.setItem('escala_db_leaves_v5_manha_Motorista', JSON.stringify(userLeaves));

  // No dia 17/11/2026: deve ser 0 atestados para Motorista (pois o atestado começou no dia 21)
  const res17 = computeDailyStaffing(shift, new Date(2026, 10, 17), employees);
  const tractor17 = res17.rows.find((r) => r.key === 'tractor');
  assert.equal(tractor17?.atestados, 0, 'No dia 17/11/2026 deve ter 0 atestados');

  // No dia 21/11/2026: deve ter 3 atestados para Motorista
  const res21 = computeDailyStaffing(shift, new Date(2026, 10, 21), employees);
  const tractor21 = res21.rows.find((r) => r.key === 'tractor');
  assert.equal(tractor21?.atestados, 3, 'No dia 21/11/2026 deve ter exatamente 3 atestados');
});
