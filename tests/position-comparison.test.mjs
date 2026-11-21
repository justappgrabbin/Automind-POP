import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { openRuntime } from '../src/runtime.mjs';

test('compares two original mandala mappings and preserves the disagreement', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'pop-position-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'state.json');
  const runtime = await openRuntime(path);

  await assert.rejects(runtime.comparePosition({
    birthDate: '1990-02-31', birthTime: '12:00',
  }), /valid UTC/);
  const result = await runtime.comparePosition({
    birthDate: '1990-01-01', birthTime: '12:00',
  });

  assert.equal(result.kimi.provider, 'back-up-:kimi-human-design');
  assert.equal(result.foundry.provider, 'recovered:foundry-glyphs-ephemeris');
  assert.deepEqual(result.coordinate, { sign: 'Capricorn', degree: 11, minute: 19, second: 15 });
  assert.equal(result.arcDifferenceSeconds, -1);
  assert.equal(result.kimi.address.gate, 64);
  assert.equal(result.foundry.address.gate, 38);
  assert.ok(result.differingLevels.includes('gate'));
  assert.equal(result.foundry.address.house, null);
  assert.deepEqual((await openRuntime(path)).latestPosition(), result);
});
