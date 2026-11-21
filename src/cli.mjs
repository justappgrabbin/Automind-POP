import { openRuntime } from './runtime.mjs';

const commands = {
  'resolve-address': { method: 'resolve', needsInput: true },
  'latest-address': { method: 'latest', needsInput: false },
  'locate-perspective': { method: 'perspective', needsInput: true },
  'compare-position': { method: 'comparePosition', needsInput: true },
  'latest-position': { method: 'latestPosition', needsInput: false },
  'latest-perspective': { method: 'latestPerspective', needsInput: false },
};

async function main([action, statePath, rawInput, ...extra]) {
  const command = Object.hasOwn(commands, action) && commands[action];
  if (!command || !statePath || extra.length || command.needsInput !== (rawInput !== undefined)) {
    throw new Error('Usage: node src/cli.mjs <resolve-address|locate-perspective|latest-address|latest-perspective|compare-position|latest-position> STATE_PATH [JSON_INPUT]');
  }
  const runtime = await openRuntime(statePath);
  const result = await runtime[command.method](command.needsInput ? JSON.parse(rawInput) : undefined);
  console.log(JSON.stringify(result, null, 2));
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
