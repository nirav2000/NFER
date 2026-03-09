const DEFAULT_REPLAY_KEY = 'y4.interactionReplay';
const IDB_NAME = 'nfer-replay-db';
const IDB_STORE = 'replays';

function openReplayDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveReplayToIndexedDb(key, payload) {
  return openReplayDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ key, payload, savedAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  })).catch(() => false);
}

function loadReplayFromIndexedDb(key) {
  return openReplayDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result?.payload || null);
    req.onerror = () => reject(req.error);
  })).catch(() => null);
}

const indexKey = (storageKey) => `${storageKey}:index`;

function addReplayIndex(storageKey, entry) {
  const raw = localStorage.getItem(indexKey(storageKey));
  const list = raw ? JSON.parse(raw) : [];
  list.unshift(entry);
  localStorage.setItem(indexKey(storageKey), JSON.stringify(list.slice(0, 20)));
}

function buildAnswerDelta(prevAnswers, nextAnswers = {}) {
  const delta = {};
  const keys = new Set([...Object.keys(prevAnswers || {}), ...Object.keys(nextAnswers || {})]);
  keys.forEach((k) => {
    const prev = prevAnswers?.[k] ?? '';
    const next = nextAnswers?.[k] ?? '';
    if (prev !== next) delta[k] = next;
  });
  return delta;
}

function compressEvents(events = []) {
  let previousAnswers = {};
  return events.map((event) => {
    const next = { ...event, payload: { ...(event.payload || {}) } };
    if ((event.type === 'frame' || event.type === 'input') && event.payload?.answers && typeof event.payload.answers === 'object') {
      const delta = buildAnswerDelta(previousAnswers, event.payload.answers);
      next.payload.answerDelta = delta;
      delete next.payload.answers;
      previousAnswers = { ...previousAnswers, ...delta };
    }
    return next;
  });
}

function decompressEvents(events = []) {
  let previousAnswers = {};
  return events.map((event) => {
    const next = { ...event, payload: { ...(event.payload || {}) } };
    if ((event.type === 'frame' || event.type === 'input') && next.payload?.answerDelta && typeof next.payload.answerDelta === 'object') {
      previousAnswers = { ...previousAnswers, ...next.payload.answerDelta };
      next.payload.answers = { ...previousAnswers };
      delete next.payload.answerDelta;
    }
    return next;
  });
}

function persistPayload(key, payload) {
  try { localStorage.setItem(key, JSON.stringify(payload)); } catch (_error) {}
  void saveReplayToIndexedDb(key, payload);
}

export function createInteractionRecorder({ storageKey = DEFAULT_REPLAY_KEY } = {}) {
  const state = { recording: false, startedAt: 0, events: [], meta: {} };

  return {
    start(meta = {}) {
      state.recording = true;
      state.startedAt = Date.now();
      state.events = [];
      state.meta = { ...meta };
    },
    stop() {
      state.recording = false;
      const payload = {
        createdAt: new Date().toISOString(),
        meta: { ...state.meta, compressed: true },
        events: compressEvents(state.events)
      };

      const replayId = `${storageKey}:${Date.now()}`;
      persistPayload(storageKey, payload);      // latest
      persistPayload(replayId, payload);        // archive item
      addReplayIndex(storageKey, { id: replayId, createdAt: payload.createdAt, eventCount: payload.events.length });
      return { ...payload, replayId };
    },
    log(type, payload = {}) {
      if (!state.recording) return;
      state.events.push({ t: Date.now() - state.startedAt, type, payload });
    },
    isRecording() {
      return state.recording;
    }
  };
}

export function getReplayIndex(storageKey = DEFAULT_REPLAY_KEY) {
  const raw = localStorage.getItem(indexKey(storageKey));
  return raw ? JSON.parse(raw) : [];
}

export async function getStoredReplay(storageKey = DEFAULT_REPLAY_KEY) {
  const raw = localStorage.getItem(storageKey);
  const payload = raw ? JSON.parse(raw) : await loadReplayFromIndexedDb(storageKey);
  if (!payload) return null;
  return { ...payload, events: payload?.meta?.compressed ? decompressEvents(payload.events) : (payload.events || []) };
}

export async function replayInteractions(recording, handlers, speed = 1, controls = {}) {
  if (!recording || !Array.isArray(recording.events) || !recording.events.length) return;
  const safeSpeed = Math.max(0.25, Number(speed) || 1);
  let lastT = 0;

  for (let index = 0; index < recording.events.length; index += 1) {
    if (controls.isStopped?.()) break;

    while (controls.isPaused?.() && !controls.isStopped?.()) {
      if (controls.consumeStep?.()) break;
      await new Promise((r) => setTimeout(r, 40));
    }

    const event = recording.events[index];
    const wait = Math.max(0, (event.t - lastT) / safeSpeed);
    lastT = event.t;
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));

    const handler = handlers[event.type];
    if (handler) handler(event.payload, { waitMs: wait, index, total: recording.events.length, event });
    controls.onEventApplied?.(event, index);
  }
}
