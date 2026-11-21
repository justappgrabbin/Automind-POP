import { randomUUID } from 'node:crypto';
import { EventBus, MemoryPersistence, Registry, StateStore } from '../vendor/synthai/core/kernel.mjs';
import { ProcessFabric } from '../vendor/synthai/runtime/execution.mjs';
import { JsonFilePersistence } from '../vendor/synthai/runtime/json-file-persistence.mjs';
import { CapabilityRegistryService } from '../vendor/synthai/registry/capability-registry.mjs';
import { AddressService, ADDRESS_FIELDS } from '../vendor/synthai/services/address-service.mjs';
import { locatePerspective, perspectiveProvider } from './perspective.mjs';

const capability = 'resolve_address';
const provider = 'recovered:yniv-addressing-engine';
const coordinateFields = {
  micro: { gate: 63, line: 5, color: 5, tone: 5, base: 4 },
  macro: { planet: 12, dimension: 4, zodiac: 11, house: 11 },
  emergent: { degree: 360, minute: 59, second: 59, arcSecond: 99 },
};
const canonicalFields = ['gate', 'line', 'color', 'tone', 'base', 'degree', 'minute', 'second', 'house'];

function checkInput(input) {
  for (const [part, fields] of Object.entries(coordinateFields)) {
    for (const [field, maximum] of Object.entries(fields)) {
      const value = input?.[part]?.[field];
      if (!Number.isInteger(value) || value < 0 || value > maximum) {
        throw new RangeError(`Expected integer coordinate ${part}.${field} in 0–${maximum}`);
      }
    }
  }
}

// Execute a single address task supplied by the conductor or by the CLI.
export async function openRuntime(statePath) {
  const bus = new EventBus();
  const persistence = new JsonFilePersistence(statePath);
  async function restoreState() {
    const store = new StateStore({ bus, persistence, namespace: 'automind-pop' });
    await store.restore();
    return store;
  }
  let state = await restoreState();

  const capabilityRegistry = await new CapabilityRegistryService({ bus }).load();
  const address = new AddressService({ bus, capabilityRegistry });
  const processes = new Registry({ kind: 'process', bus });
  const transientState = new StateStore({ bus, persistence: new MemoryPersistence() });
  const execution = new ProcessFabric({ bus, processes, state: transientState });
  execution.register({
    id: capability,
    async run({ input }) {
      const output = await address.resolveAddress(input, { strategy: 'micro-resolution' });
      const verification = await address.validateCanonical(input);
      if (!verification.valid) {
        throw new Error(`Address output failed canonical verification: ${verification.error ?? verification.reason}`);
      }
      return { output, verification };
    },
  });

  execution.register({
    id: 'locate_perspective',
    run: ({ input }) => locatePerspective(input),
  });

  let running = false;
  async function runMission(path, operation) {
    if (running) throw new Error('A mission is already running');
    running = true;
    try {
      const mission = await operation();
      const updated = await restoreState();
      await updated.set(path, mission, { source: mission.capability });
      state = updated;
      return mission;
    } finally {
      running = false;
    }
  }

  return {
    latest: () => state.get('address.latest', null),
    latestPerspective: () => state.get('perspective.latest', null),
    async perspective(request) {
      const input = structuredClone(request);
      if (!input?.expressions || typeof input.expressions !== 'object' ||
          Array.isArray(input.expressions)) {
        throw new TypeError('Perspective requires expressions keyed by question');
      }
      return runMission('perspective.latest', async () => {
        const capability = 'locate_perspective';
        const output = await execution.execute(capability, input);
        return {
          id: randomUUID(),
          capability,
          provider: perspectiveProvider,
          input,
          ...output,
        };
      });
    },
    async resolve(request) {
      const input = structuredClone(request);
      checkInput(input);

      return runMission('address.latest', async () => {
        let routing;
        const stop = bus.on('routing:decision', ({ payload }) => { routing = payload; });
        try {
          const { output, verification } = await execution.execute(capability, input);
          if (routing?.selected_provider !== provider || output.provider !== provider ||
              output.status !== 'resolved') {
            throw new Error('Address resolution did not select a qualified provider');
          }
          if (Object.keys(output.address).length !== ADDRESS_FIELDS.length ||
              !ADDRESS_FIELDS.every(field => Object.hasOwn(output.address, field)) ||
              !canonicalFields.every(field => output.address[field] === verification.spine_address[field])) {
            throw new Error('Address output failed canonical verification');
          }

          return {
            id: randomUUID(),
            capability,
            input: structuredClone(input),
            routing,
            address: output.address,
            receipt: {
              consumer: 'canonical-address-verifier',
              provider: verification.provider,
              canonicalKey: verification.canonical_key,
              canonicalAddress: verification.spine_address,
              resolvedFields: output.resolved_fields,
            },
          };
        } finally {
          stop();
        }
      });
    },
  };
}
