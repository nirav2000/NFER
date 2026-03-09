import { createInteractionRecorder, getStoredReplay, replayInteractions } from './replay.js?v=3.4.8';

const DEFAULT_SCROLL_SAMPLE_MS = 120;
const DEFAULT_POINTER_SAMPLE_MS = 120;

function smoothScrollTo(targetY, durationMs = 120) {
  const startY = window.scrollY;
  const delta = targetY - startY;
  const duration = Math.max(40, Math.min(260, Number(durationMs) || 120));
  const startAt = performance.now();

  return new Promise((resolve) => {
    const tick = (now) => {
      const elapsed = now - startAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - ((1 - progress) ** 2);
      window.scrollTo(0, Math.round(startY + (delta * eased)));
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

export function mountInteractionReplay(options) {
  const {
    refs,
    getSnapshot,
    applySnapshot,
    actionHandlers = {},
    storageKey = 'y4.interactionReplay',
    frameIntervalMs = 1000,
    scrollSampleMs = DEFAULT_SCROLL_SAMPLE_MS,
    pointerSampleMs = DEFAULT_POINTER_SAMPLE_MS,
    onReplayStart = () => {},
    onReplayEnd = () => {},
    getReplayContainer = () => document
  } = options;

  const recorder = createInteractionRecorder({ storageKey });
  const {
    recordingStatusEl,
    recordingToggleBtn,
    replayBtn,
    replaySpeedEl
  } = refs;

  let frameCaptureTimer = null;
  let lastScrollSampleAt = 0;
  let lastPointerSampleAt = 0;

  const setStatus = (text) => {
    if (recordingStatusEl) recordingStatusEl.textContent = text;
  };

  const withViewport = (payload = {}) => ({
    ...payload,
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  });

  const record = (type, payload = {}) => recorder.log(type, withViewport(payload));

  const startFrameCapture = () => {
    if (frameCaptureTimer) clearInterval(frameCaptureTimer);
    frameCaptureTimer = setInterval(() => {
      if (!recorder.isRecording()) return;
      record('ui:render-complete', { marker: 'interval' });
      const snapshot = getSnapshot();
      record('frame', snapshot);
    }, Math.max(250, frameIntervalMs));
  };

  const stopRecording = (message = 'Recording saved.') => {
    if (!recorder.isRecording()) return null;
    const payload = recorder.stop();
    if (frameCaptureTimer) {
      clearInterval(frameCaptureTimer);
      frameCaptureTimer = null;
    }
    setStatus(message);
    if (recordingToggleBtn) recordingToggleBtn.textContent = 'Start Interaction Recording';
    return payload;
  };

  window.addEventListener('scroll', () => {
    if (!recorder.isRecording()) return;
    const now = Date.now();
    if ((now - lastScrollSampleAt) < scrollSampleMs) return;
    lastScrollSampleAt = now;
    record('scroll', { y: window.scrollY });
  }, { passive: true });

  const container = getReplayContainer();
  container.addEventListener('pointermove', (event) => {
    if (!recorder.isRecording()) return;
    const now = Date.now();
    if ((now - lastPointerSampleAt) < pointerSampleMs) return;
    lastPointerSampleAt = now;
    record('pointer', {
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      pointerType: event.pointerType || 'mouse'
    });
  }, { passive: true });

  container.addEventListener('focusin', (event) => {
    if (!recorder.isRecording()) return;
    const el = event.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    record('focus', {
      name: el.name || '',
      id: el.id || '',
      selectionStart: Number.isFinite(el.selectionStart) ? el.selectionStart : null,
      selectionEnd: Number.isFinite(el.selectionEnd) ? el.selectionEnd : null
    });
  });

  document.addEventListener('selectionchange', () => {
    if (!recorder.isRecording()) return;
    const el = document.activeElement;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    record('caret', {
      name: el.name || '',
      id: el.id || '',
      selectionStart: Number.isFinite(el.selectionStart) ? el.selectionStart : null,
      selectionEnd: Number.isFinite(el.selectionEnd) ? el.selectionEnd : null
    });
  });

  if (recordingToggleBtn) {
    recordingToggleBtn.addEventListener('click', () => {
      if (recorder.isRecording()) {
        stopRecording();
      } else {
        recorder.start({
          viewportHeight: window.innerHeight,
          documentHeight: document.documentElement.scrollHeight,
          devicePixelRatio: window.devicePixelRatio || 1
        });
        record('recordingStart', { startedAt: Date.now() });
        startFrameCapture();
        setStatus('Recording in progress...');
        recordingToggleBtn.textContent = 'Stop Interaction Recording';
      }
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', async () => {
      const recording = await getStoredReplay(storageKey);
      if (!recording) {
        setStatus('No recording found to replay.');
        return;
      }

      setStatus('Replay in progress...');
      onReplayStart();

      await replayInteractions(recording, {
        frame: (payload) => {
          applySnapshot(payload);
        },
        scroll: async (payload, meta) => {
          if (typeof payload?.y !== 'number') return;
          await smoothScrollTo(payload.y, meta.waitMs);
        },
        focus: (payload) => {
          const selector = payload?.id ? `#${CSS.escape(payload.id)}` : (payload?.name ? `[name="${CSS.escape(payload.name)}"]` : null);
          if (!selector) return;
          const el = document.querySelector(selector);
          if (el instanceof HTMLElement) el.focus();
        },
        caret: (payload) => {
          const selector = payload?.id ? `#${CSS.escape(payload.id)}` : (payload?.name ? `[name="${CSS.escape(payload.name)}"]` : null);
          if (!selector) return;
          const el = document.querySelector(selector);
          if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
          const start = Number.isFinite(payload?.selectionStart) ? payload.selectionStart : null;
          const end = Number.isFinite(payload?.selectionEnd) ? payload.selectionEnd : start;
          if (start != null && end != null) {
            try { el.setSelectionRange(start, end); } catch (_error) {}
          }
        },
        ...actionHandlers
      }, Number(replaySpeedEl?.value || 1));

      onReplayEnd();
      setStatus('Replay complete.');
    });
  }

  return {
    record,
    isRecording: () => recorder.isRecording(),
    stop: stopRecording
  };
}
