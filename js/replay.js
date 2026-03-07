const REPLAY_KEY = 'y4.interactionReplay';

export function createInteractionRecorder() {
  const state = {
    recording: false,
    startedAt: 0,
    events: []
  };

  return {
    start() {
      state.recording = true;
      state.startedAt = Date.now();
      state.events = [];
    },
    stop() {
      state.recording = false;
      const payload = {
        createdAt: new Date().toISOString(),
        events: [...state.events]
      };
      localStorage.setItem(REPLAY_KEY, JSON.stringify(payload));
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

export function getStoredReplay() {
  const raw = localStorage.getItem(REPLAY_KEY);
  return raw ? JSON.parse(raw) : null;
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
