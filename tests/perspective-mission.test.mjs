import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { openRuntime } from '../src/runtime.mjs';

test('Biverse preserves dimension proportions and explicit clarity in the POP store', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'pop-perspective-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'state.json');
  const runtime = await openRuntime(path);
  const input = {
    expressions: { Who: 'I think', Where: 'I define' },
    weights: { who: 3, where: 1 },
  };

  const result = await runtime.perspective({ ...input, clarify: 'Movement' });
  assert.equal(result.provider, 'biverse:dimensional-perspective-engine');
  assert.deepEqual(result.observed.proportions, {
    Movement: 0.25, Evolution: 0, Being: 0, Design: 0, Space: 0.75,
  });
  assert.equal(result.clarified.state_id, result.observed.state_id);
  assert.equal(result.clarified.proportions.Movement, 1);
  await assert.rejects(runtime.perspective({ ...input, clarify: 'Design' }), /Design is not active/);
  assert.deepEqual((await openRuntime(path)).latestPerspective(), result);
});
