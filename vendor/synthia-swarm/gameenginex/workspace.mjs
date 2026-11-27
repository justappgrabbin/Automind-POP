// Bind the original GameEngineX bridge to the existing Swarm OS World panel.
// No separate swarm or surrogate engine is created.
import { GameEngineXBridge } from './bridge.mjs';
const get = id => document.getElementById(id);
const bridge = new GameEngineXBridge({
  swarm: () => window.__S,
  klein: () => window.__gamexKlein,
  onLearn: () => window.__gamexSaveKlein?.()
});
window.__gamexBridge = bridge;
const show = value => { get('gamex-out').textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); };
const run = action => { try { show(action()); } catch (error) { show('GameEngineX: ' + error.message); } };
get('gamex-sync').onclick = () => run(() => {
  if (!window.__S?.units?.length) throw Error('Living swarm is still initializing');
  return bridge.sync();
});
get('gamex-step').onclick = () => run(() => {
  if (get('gamex-learn').checked && !window.__gamexKlein) throw Error('Klein grammar is still initializing');
  return bridge.step(get('gamex-action').value, { learn: get('gamex-learn').checked });
});
get('gamex-reset').onclick = () => run(() => { bridge.reset(); return 'Sandbox reset'; });
get('gamex-oracle').onclick = () => run(() => {
  const question = get('gamex-question').value.trim();
  if (!question) throw Error('Enter a scenario question');
  return bridge.oracle(question);
});
