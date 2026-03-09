const DEFAULT_REPLAY_KEY = 'y4.interactionReplay';

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
        meta: { ...state.meta },
        events: [...state.events]
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
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

export function getStoredReplay(storageKey = DEFAULT_REPLAY_KEY) {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : null;
}

export function clearStoredReplay(storageKey = DEFAULT_REPLAY_KEY) {
  localStorage.removeItem(storageKey);
}

export async function replayInteractions(recording, handlers, speed = 1) {
  if (!recording || !Array.isArray(recording.events) || !recording.events.length) return;

  const safeSpeed = Math.max(0.25, Number(speed) || 1);
  let lastT = 0;

  for (const event of recording.events) {
    const wait = Math.max(0, (event.t - lastT) / safeSpeed);
    lastT = event.t;
    if (wait) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    const handler = handlers[event.type];
    if (handler) {
      handler(event.payload);
    }
  }
}
