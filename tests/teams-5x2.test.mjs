import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, rename, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(testDir, '../src/utils/teams.ts');
const tempDir = await mkdtemp(join(tmpdir(), 'escala-5x2-tests-'));
after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});
execFileSync(resolve(testDir, '../node_modules/.bin/tsc'), [
  sourcePath,
  '--target', 'ES2022',
  '--module', 'ES2022',
  '--moduleResolution', 'Bundler',
  '--ignoreConfig',
  '--skipLibCheck',
  '--outDir', tempDir,
], { cwd: resolve(testDir, '..'), stdio: 'pipe' });
const modulePath = join(tempDir, 'teams.mjs');
await rename(join(tempDir, 'utils', 'teams.js'), modulePath);
const { buildInitialSchedule, distributeEmployeesToTeams, enforce5x2TeamContinuity, isTeamOff5x2 } = await import(
  pathToFileURL(modulePath).href
);

const DAY_MS = 24 * 60 * 60 * 1000;

function* dateRange(start, end) {
  for (let date = new Date(start); date < end; date.setUTCDate(date.getUTCDate() + 1)) {
    yield new Date(date);
  }
}

function isOff(date, teamId, rotationMode, offDayStyle) {
  return isTeamOff5x2(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    teamId,
    rotationMode,
    offDayStyle
  );
}

test('sete equipes têm exatamente duas equipes de folga por dia e respeitam o máximo de dias seguidos', () => {
  const start = new Date(Date.UTC(2024, 0, 1));
  const end = new Date(Date.UTC(2031, 0, 1));
  const expectedRuns = {
    'fixed/consecutive': 5,
    'weekly_rotation/consecutive': 6,
    'fixed/interleaved': 3,
    'weekly_rotation/interleaved': 4,
  };

  for (const offDayStyle of ['consecutive', 'interleaved']) {
    for (const rotationMode of ['fixed', 'weekly_rotation']) {
      let maxWorkRun = 0;
      for (let teamId = 0; teamId < 7; teamId++) {
        let workRun = 0;
        for (const date of dateRange(start, end)) {
          if (isOff(date, teamId, rotationMode, offDayStyle)) {
            workRun = 0;
          } else {
            workRun++;
            maxWorkRun = Math.max(maxWorkRun, workRun);
          }
        }
      }
      assert.equal(maxWorkRun, expectedRuns[`${rotationMode}/${offDayStyle}`]);

      for (const date of dateRange(start, end)) {
        const teamsOff = Array.from({ length: 7 }, (_, teamId) => teamId).filter((teamId) =>
          isOff(date, teamId, rotationMode, offDayStyle)
        ).length;
        assert.equal(teamsOff, 2, `${date.toISOString()} ${rotationMode}/${offDayStyle}`);
      }
    }
  }
});

test('rotação semanal muda o par em equipes de 2 a 6 e percorre os sete pares', () => {
  const anchorSunday = new Date(Date.UTC(2026, 10, 1));
  for (let teamCount = 2; teamCount <= 6; teamCount++) {
    for (let teamId = 0; teamId < teamCount; teamId++) {
      const weeklyPairs = [];
      for (let week = 0; week < 7; week++) {
        const sunday = new Date(anchorSunday.getTime() + week * 7 * DAY_MS);
        const pair = [];
        for (let weekday = 0; weekday < 7; weekday++) {
          const date = new Date(sunday.getTime() + weekday * DAY_MS);
          if (isOff(date, teamId, 'weekly_rotation', 'consecutive')) {
            pair.push(date.getUTCDay());
          }
        }
        assert.equal(pair.length, 2);
        weeklyPairs.push(pair.join(','));
      }
      assert.equal(new Set(weeklyPairs).size, 7, `equipe ${teamId} em ${teamCount} equipes`);
    }
  }
});

test('padrão fixo mantém os mesmos dias da semana na virada de mês e ano', () => {
  for (let teamId = 0; teamId < 7; teamId++) {
    const weekdaysFor = (month, year = 2026) => {
      const start = new Date(Date.UTC(year, month, 1));
      const end = new Date(Date.UTC(year, month + 1, 1));
      return new Set(
        [...dateRange(start, end)]
          .filter((date) => isOff(date, teamId, 'fixed', 'consecutive'))
          .map((date) => date.getUTCDay())
      );
    };
    assert.deepEqual([...weekdaysFor(10)].sort(), [...weekdaysFor(11)].sort());
    assert.deepEqual([...weekdaysFor(11)].sort(), [...weekdaysFor(0, 2027)].sort());
  }
});

test('gerador inicial aplica os dois estilos e os modos fixo/rotativo para sete equipes', () => {
  const employees = Array.from({ length: 7 }, (_, index) => ({
    id: `driver-${index}`,
    shiftId: 'shift-a',
    role: 'Motorista',
  }));
  const assignments = Object.fromEntries(employees.map((employee, index) => [index, [employee.id]]));

  for (const rotationMode of ['fixed', 'weekly_rotation']) {
    for (const offDayStyle of ['consecutive', 'interleaved']) {
      const schedules = buildInitialSchedule(
        2026,
        10,
        employees,
        'shift-a',
        'Motorista',
        7,
        '5x2',
        assignments,
        undefined,
        rotationMode,
        offDayStyle
      );
      for (let day = 1; day <= 30; day++) {
        const offCount = employees.filter((employee) => schedules[employee.id][day]).length;
        assert.equal(offCount, 2, `${rotationMode}/${offDayStyle}, dia ${day}`);
      }
    }
  }
});

test('continuidade cria descanso no novo mês após edições que removem folgas anteriores', () => {
  const previousMonth = {};
  for (let day = 1; day <= 30; day++) {
    previousMonth[day] = isOff(new Date(Date.UTC(2026, 10, day)), 0, 'weekly_rotation', 'consecutive');
  }
  previousMonth[26] = false;
  previousMonth[27] = false;

  const targetMonth = {};
  for (let day = 1; day <= 31; day++) {
    targetMonth[day] = isOff(new Date(Date.UTC(2026, 11, day)), 0, 'weekly_rotation', 'consecutive');
  }

  const adjusted = enforce5x2TeamContinuity(
    targetMonth,
    ['driver-0'],
    { 'driver-0': previousMonth },
    30
  );
  assert.equal(adjusted[1], true);

  let workRun = 0;
  let maxTargetMonthWorkRun = 0;
  for (let day = 1; day <= 31; day++) {
    if (adjusted[day]) workRun = 0;
    else {
      workRun++;
      maxTargetMonthWorkRun = Math.max(maxTargetMonthWorkRun, workRun);
    }
  }
  assert.ok(maxTargetMonthWorkRun <= 6);
});

test('40 colaboradores em sete equipes e três férias mantêm entre 25 e 30 disponíveis', () => {
  const employees = Array.from({ length: 40 }, (_, index) => ({ id: `driver-${index}` }));
  const teams = distributeEmployeesToTeams(employees, 7);
  assert.deepEqual(teams.map(({ members }) => members.length), [5, 5, 6, 6, 6, 6, 6]);

  const vacationIds = ['driver-0', 'driver-16', 'driver-34'];
  const vacationTeamIds = vacationIds.map((id) =>
    teams.find(({ members }) => members.some((employee) => employee.id === id)).team.id
  );
  assert.equal(new Set(vacationTeamIds).size, 3);
  const expectedRanges = {
    consecutive: { scheduled: [28, 30], available: [25, 30] },
    interleaved: { scheduled: [28, 29], available: [25, 29] },
  };

  for (const offDayStyle of ['consecutive', 'interleaved']) {
    let minScheduled = Infinity;
    let maxScheduled = 0;
    let minAvailable = Infinity;
    let maxAvailable = 0;

    for (let day = 1; day <= 30; day++) {
      const date = new Date(Date.UTC(2026, 10, day));
      const scheduled = teams.reduce(
        (total, team) =>
          total + (isOff(date, team.team.id, 'weekly_rotation', offDayStyle) ? 0 : team.members.length),
        0
      );
      const employeesOnLeave = day >= 10 && day <= 24
        ? vacationIds.filter((id) => {
            const team = teams.find(({ members }) => members.some((employee) => employee.id === id));
            return team && !isOff(date, team.team.id, 'weekly_rotation', offDayStyle);
          }).length
        : 0;
      const available = scheduled - employeesOnLeave;
      minScheduled = Math.min(minScheduled, scheduled);
      maxScheduled = Math.max(maxScheduled, scheduled);
      minAvailable = Math.min(minAvailable, available);
      maxAvailable = Math.max(maxAvailable, available);
    }

    assert.deepEqual(
      [minScheduled, maxScheduled],
      expectedRanges[offDayStyle].scheduled,
      `${offDayStyle}: escalados antes das férias`
    );
    assert.deepEqual(
      [minAvailable, maxAvailable],
      expectedRanges[offDayStyle].available,
      `${offDayStyle}: disponíveis depois das férias`
    );
  }
});
