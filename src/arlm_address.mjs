import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openRuntime } from './runtime.mjs';

const synth = '../vendor/synthai/';
const yniv = synth + 'donors/recovered/you-n-i-verse-corrected/';
const backup = synth + 'donors/Back-up-/vendor/';
const kimi = backup + 'kimi-agent-automata-state-space-merge/pure-synthia-automata/src/state-space/';
const sources = {
  routing: ['./runtime.mjs', synth + 'services/address-service.mjs',
    synth + 'registry/capability-registry.json'],
  mapping: [yniv + 'synthia-bridge.ported.mjs', yniv + 'state-space-engine-v2.ported.mjs',
    yniv + 'coherence_calculator_v4.json', yniv + 'gate_codon_dictionary.json'],
  verification: [backup + 'execution-spine-v0.4.0/src/canonical-address.mjs',
    kimi + 'addressing.js', kimi + 'constants.js'],
};

async function fingerprint(paths) {
  const entries = await Promise.all(paths.map(async path => [
    path, createHash('sha256').update(await readFile(new URL(path, import.meta.url))).digest('hex'),
  ]));
  return Object.fromEntries(entries);
}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const { provider, coordinates } = JSON.parse(Buffer.concat(chunks).toString());
const dir = await mkdtemp(join(tmpdir(), 'arlm-address-'));
try {
  if (provider !== 'recovered:yniv-addressing-engine') {
    throw new Error('Unsupported semantic address provider');
  }
  const runtime = await openRuntime(join(dir, 'state.json'));
  const result = await runtime.resolve(coordinates);
  const fingerprints = {};
  for (const [role, paths] of Object.entries(sources)) {
    fingerprints[role] = await fingerprint(paths);
  }
  console.log(JSON.stringify({
    ...result,
    mapping: { provider: result.routing.selected_provider, fingerprints },
  }));
} finally {
  await rm(dir, { recursive: true, force: true });
}
