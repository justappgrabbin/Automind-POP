// mesh.js — shares what swarms learn between every copy that is running: other tabs, other apps on the same page or
// device, other fields (Movement / Design / Being / Evolution), other models. Conditions only: it carries experience,
// it never decides anything.
// - ON/OFF: mesh.setOn(bool). Off = nothing goes out, nothing comes in. Remembered between visits.
// - BACK BUTTON: every change (sent or received) is a journal entry. mesh.undo(id) removes just that one;
//   mesh.back() removes the latest. Other changes stay. Undone ids are remembered, so they never come back from peers.
// - Transports: BroadcastChannel (same device, no server) built in; add more with mesh.addTransport({send, onMessage})
//   (e.g. a Supabase table or WebRTC later) — same messages, nothing else changes.
// What travels: {kind, field, data} — kind "place" (placememory entries), "grown" (grown functions), anything else.
export function createMesh({ name = "synthia-mesh", field = "Evolution", store = globalThis.localStorage, apply = () => {}, remove = () => {} } = {}) {
  const me = Math.random().toString(36).slice(2, 10), K = k => `${name}:${k}`;
  const load = (k, d) => { try { return JSON.parse(store?.getItem(K(k))) ?? d; } catch { return d; } };
  const save = (k, v) => { try { store?.setItem(K(k), JSON.stringify(v)); } catch {} };
  let on = load("on", false); const journal = load("journal", []), undone = new Set(load("undone", [])), transports = [], listeners = [];
  const persist = () => { save("journal", journal.slice(-500)); save("undone", [...undone].slice(-2000)); };
  const notify = () => listeners.forEach(f => f(api.state()));

  function receive(msg) {
    if (!on || !msg || msg.from === me || undone.has(msg.id) || journal.some(j => j.id === msg.id)) return;
    journal.push({ ...msg, dir: "in", at: Date.now() }); persist(); apply(msg); notify();
  }
  function addTransport(t) { transports.push(t); t.onMessage?.(m => m?.type === "undo" ? (undone.add(m.id), drop(m.id, false)) : receive(m)); return api; }
  function drop(id, tell = true) {
    const i = journal.findIndex(j => j.id === id); if (i < 0) return false;
    const [j] = journal.splice(i, 1); undone.add(id); persist(); remove(j);
    if (tell && on && j.dir === "out") transports.forEach(t => t.send({ type: "undo", id }));
    notify(); return true;
  }
  const api = {
    id: me, field,
    setOn(v) { on = !!v; save("on", on); notify(); return on; }, isOn: () => on,
    share(kind, data, f = field) {
      const msg = { id: me + ":" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), from: me, field: f, kind, data };
      journal.push({ ...msg, dir: "out", at: Date.now() }); persist(); notify();
      if (on) transports.forEach(t => t.send(msg)); return msg.id;
    },
    undo: id => drop(id), back: () => journal.length ? drop(journal[journal.length - 1].id) : false,
    journal: () => journal.slice(), addTransport, onChange: f => (listeners.push(f), api),
    state: () => ({ on, count: journal.length, inCount: journal.filter(j => j.dir === "in").length, fields: [...new Set(journal.map(j => j.field))] }),
  };
  if (typeof BroadcastChannel !== "undefined") { const bc = new BroadcastChannel(name); addTransport({ send: m => bc.postMessage(m), onMessage: f => (bc.onmessage = e => f(e.data)) }); }
  return api;
}
