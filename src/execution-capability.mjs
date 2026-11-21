import { execFile, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { EventBus, MemoryPersistence, Registry, StateStore } from '../vendor/synthai/core/kernel.mjs';
import { ProcessFabric } from '../vendor/synthai/runtime/execution.mjs';

export const image = 'automind-pop-execution:1';
const capability = 'execute_automind_python';
const provider = 'automind:isolated-interpreter';
const maxOutput = 256 * 1024;
const run = promisify(execFile);

async function runContainer(request, id) {
  const name = `automind-pop-${id}`;
  const docker = spawn('docker', [
    'run', '--rm', '--pull', 'never', '--name', name, '--interactive',
    '--network', 'none', '--read-only', '--ipc', 'private', '--shm-size', '16m',
    '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=32m', '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges', '--memory', '256m', '--pids-limit', '64',
    '--cpus', '1', image,
  ]);
  let failure;
  const terminate = message => {
    failure ??= message;
    docker.kill('SIGKILL');
  };
  const timeout = setTimeout(() => terminate('Isolated worker timed out'), 30_000);
  const stdout = [];
  const stderr = [];
  let bytes = 0;
  for (const [stream, buffer] of [[docker.stdout, stdout], [docker.stderr, stderr]]) {
    stream.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > maxOutput) terminate('Isolated worker exceeded the output limit');
      else buffer.push(chunk);
    });
  }
  docker.stdin.on('error', error => { failure ??= error.message; });
  try {
    const exit = await new Promise((resolve, reject) => {
      docker.once('error', reject);
      docker.once('close', resolve);
      docker.stdin.end(JSON.stringify(request));
    });
    if (failure || exit !== 0) {
      throw new Error(failure || `Isolated worker exited ${exit}: ${Buffer.concat(stderr).toString().trim().slice(-2000)}`);
    }
    const result = JSON.parse(Buffer.concat(stdout));
    const execution = result?.execution;
    if (!Array.isArray(execution?.term_out) || execution.term_out.some(line => typeof line !== 'string') ||
        !Number.isFinite(execution.exec_time) ||
        !(execution.exc_type === null || typeof execution.exc_type === 'string') ||
        !(result.submission === null || typeof result.submission === 'string')) {
      throw new Error('Invalid isolated worker response');
    }
    return result;
  } finally {
    clearTimeout(timeout);
    if (failure) await run('docker', ['rm', '-f', name], { timeout: 5000 }).catch(() => {});
  }
}

export async function executeCandidate(input) {
  if (typeof input?.code !== 'string' || !input.code.trim() ||
      Buffer.byteLength(input.code) > 64 * 1024 ||
      !input.coordinates || typeof input.coordinates !== 'object' || Array.isArray(input.coordinates)) {
    throw new TypeError('Expected a Python candidate up to 64 KiB and a coordinates object');
  }
  const bus = new EventBus();
  const execution = new ProcessFabric({
    bus,
    processes: new Registry({ kind: 'process', bus }),
    state: new StateStore({ bus, persistence: new MemoryPersistence() }),
  });
  const id = randomUUID();
  execution.register({ id: capability, run: ({ input }) => runContainer(input, id) });
  const result = await execution.execute(capability, input);
  return {
    ...result,
    run: {
      id,
      capability,
      provider,
      codeSha256: createHash('sha256').update(input.code).digest('hex'),
    },
  };
}
