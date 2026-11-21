import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

import { openRuntime } from '../src/runtime.mjs';

test('execute, consume, reject a controlled failure, retry, and restore with a fresh runtime', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'pop-address-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'state.json');
  const boot = () => openRuntime(path);
  const runtime = await boot();
  const input = {
    micro: { gate: 41, line: 4, color: 2, tone: 5, base: 3 },
    macro: { planet: 0, dimension: 0, zodiac: 0, house: 0 },
    emergent: { degree: 1, minute: 0, second: 0, arcSecond: 0 },
  };

  assert.equal((await boot()).latest(), null);
  const first = await runtime.resolve(input);
  assert.equal(first.routing.selected_provider, 'recovered:yniv-addressing-engine');
  assert.ok(first.routing.candidate_providers.includes(first.routing.selected_provider));
  assert.deepEqual(first.address, {
    planetary: '0', dimension: '0', gate: 42, line: 5, color: 3, tone: 6, base: 4,
    degree: 1, minute: 0, second: 0, arc: null, zodiac: null, house: 1,
  });
  assert.equal(first.receipt.consumer, 'canonical-address-verifier');
  assert.equal(first.receipt.canonicalAddress.dimension, 'Movement');
  assert.match(first.receipt.canonicalKey, /gate=42/);

  const changed = { ...input, micro: { ...input.micro, gate: 42 } };
  const rejected = { ...changed, emergent: { ...input.emergent, axis: 'invalid' } };
  await assert.rejects(runtime.resolve(rejected), /failed canonical verification.*arcAxis.axis/);
  assert.deepEqual((await boot()).latest(), first);

  const recovered = await runtime.resolve(changed);
  assert.notEqual(recovered.id, first.id);
  assert.equal(recovered.address.gate, 43);
  assert.match(recovered.receipt.canonicalKey, /gate=43/);
  assert.deepEqual((await boot()).latest(), recovered);
});
