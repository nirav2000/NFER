const DEFAULT_REPLAY_KEY = 'y4.interactionReplay';
const IDB_NAME = 'nfer-replay-db';
const IDB_STORE = 'replays';

function openReplayDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveReplayToIndexedDb(storageKey, payload) {
  return openReplayDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ key: storageKey, payload, savedAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  })).catch(() => false);
}

function loadReplayFromIndexedDb(storageKey) {
  return openReplayDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(storageKey);
    req.onsuccess = () => resolve(req.result?.payload || null);
    req.onerror = () => reject(req.error);
  })).catch(() => null);
}

function clearReplayFromIndexedDb(storageKey) {
  return openReplayDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(storageKey);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  })).catch(() => false);
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
  const compressed = [];
  let previousAnswers = {};

  events.forEach((event) => {
    const next = { ...event, payload: { ...(event.payload || {}) } };

    if ((event.type === 'frame' || event.type === 'input') && event.payload?.answers && typeof event.payload.answers === 'object') {
      const delta = buildAnswerDelta(previousAnswers, event.payload.answers);
      next.payload.answerDelta = delta;
      delete next.payload.answers;
      previousAnswers = { ...previousAnswers, ...delta };
    }

    compressed.push(next);
  });

  return compressed;
}

function decompressEvents(events = []) {
  const expanded = [];
  let previousAnswers = {};

  events.forEach((event) => {
    const next = { ...event, payload: { ...(event.payload || {}) } };

    if ((event.type === 'frame' || event.type === 'input') && next.payload?.answerDelta && typeof next.payload.answerDelta === 'object') {
      previousAnswers = { ...previousAnswers, ...next.payload.answerDelta };
      next.payload.answers = { ...previousAnswers };
      delete next.payload.answerDelta;
    }

    expanded.push(next);
  });

  return expanded;
}

export function createInteractionRecorder({ storageKey = DEFAULT_REPLAY_KEY } = {}) {
  const state = {
    recording: false,
    startedAt: 0,
    events: [],
    meta: {}
  };

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

      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (_error) {
        // Fall back to IndexedDB for larger recordings.
      }
      void saveReplayToIndexedDb(storageKey, payload);
      return payload;
    },
    log(type, payload = {}) {
      if (!state.recording) return;
      state.events.push({
        t: Date.now() - state.startedAt,
        type,
        payload
      });
    },
    isRecording() {
      return state.recording;
    }
  };
}

export async function getStoredReplay(storageKey = DEFAULT_REPLAY_KEY) {
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    const payload = JSON.parse(raw);
    return {
      ...payload,
      events: payload?.meta?.compressed ? decompressEvents(payload.events) : (payload.events || [])
    };
  }

  const fromDb = await loadReplayFromIndexedDb(storageKey);
  if (!fromDb) return null;

  return {
    ...fromDb,
    events: fromDb?.meta?.compressed ? decompressEvents(fromDb.events) : (fromDb.events || [])
  };
}

export async function clearStoredReplay(storageKey = DEFAULT_REPLAY_KEY) {
  localStorage.removeItem(storageKey);
  await clearReplayFromIndexedDb(storageKey);
}

export async function replayInteractions(recording, handlers, speed = 1) {
  if (!recording || !Array.isArray(recording.events) || !recording.events.length) return;

  const safeSpeed = Math.max(0.25, Number(speed) || 1);
  let lastT = 0;

  for (let index = 0; index < recording.events.length; index += 1) {
    const event = recording.events[index];
    const wait = Math.max(0, (event.t - lastT) / safeSpeed);
    lastT = event.t;
    if (wait) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    const handler = handlers[event.type];
    if (handler) {
      handler(event.payload, { waitMs: wait, index, total: recording.events.length, event });
    }
  }
}
