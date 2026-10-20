const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/dashboardWeek.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context);
const { currentDashboardWeek: week, advanceDashboardWeek: advance } = context.exports;
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));
eq(week(new Date('2026-10-20T03:00:00Z')), { from: '2026-10-19', to: '2026-10-25' });
const old = week(new Date('2026-10-25T16:59:59Z'));
const next = week(new Date('2026-10-25T17:00:00Z'));
eq(old, { from: '2026-10-19', to: '2026-10-25' });
eq(next, { from: '2026-10-26', to: '2026-11-01' });
eq(week(new Date('2027-01-01T12:00:00Z')), { from: '2026-12-28', to: '2027-01-03' });
eq(advance({ ...old, machineId: 'M1', shift: 'A' }, old, next), { ...next, machineId: 'M1', shift: 'A' });
for (const chosen of [{ from: '', to: '' }, { from: '2026-10-01', to: '2026-10-05' }]) {
  assert.equal(advance(chosen, old, next), chosen, 'Keep user-selected dates');
}
console.log('Weekly defaults, Bangkok midnight, year boundary, rollover and manual filters passed');
