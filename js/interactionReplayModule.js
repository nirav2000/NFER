import { createInteractionRecorder, getStoredReplay, replayInteractions } from './replay.js?v=3.4.7';

const DEFAULT_SCROLL_SAMPLE_MS = 120;

export function mountInteractionReplay(options) {
  const {
    refs,
    getSnapshot,
    applySnapshot,
    actionHandlers = {},
    storageKey = 'y4.interactionReplay',
    frameIntervalMs = 1000,
    onReplayStart = () => {},
    onReplayEnd = () => {}
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

  const setStatus = (text) => {
    if (recordingStatusEl) recordingStatusEl.textContent = text;
  };

  const withViewport = (payload = {}) => ({
    ...payload,
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight
  });

  const record = (type, payload = {}) => recorder.log(type, withViewport(payload));

  const startFrameCapture = () => {
    if (frameCaptureTimer) clearInterval(frameCaptureTimer);
    frameCaptureTimer = setInterval(() => {
      if (!recorder.isRecording()) return;
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
    if ((now - lastScrollSampleAt) < DEFAULT_SCROLL_SAMPLE_MS) return;
    lastScrollSampleAt = now;
    record('scroll', { y: window.scrollY });
  }, { passive: true });

  if (recordingToggleBtn) {
    recordingToggleBtn.addEventListener('click', () => {
      if (recorder.isRecording()) {
        stopRecording();
      } else {
        recorder.start({
          viewportHeight: window.innerHeight,
          documentHeight: document.documentElement.scrollHeight
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
      const recording = getStoredReplay(storageKey);
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
        scroll: (payload) => {
          if (typeof payload?.y === 'number') window.scrollTo(0, payload.y);
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
