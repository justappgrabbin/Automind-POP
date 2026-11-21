import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const worker = fileURLToPath(new URL('./perspective-worker.py', import.meta.url));
export const perspectiveProvider = 'biverse:dimensional-perspective-engine';

export async function locatePerspective(input) {
  try {
    const { stdout } = await run('python3', ['-B', worker, JSON.stringify(input)], {
      timeout: 10000,
    });
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(error.stderr?.trim() || 'Biverse perspective worker failed', { cause: error });
  }
}
