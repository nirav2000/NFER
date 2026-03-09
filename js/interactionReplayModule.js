import { createInteractionRecorder, getStoredReplay, replayInteractions, getReplayIndex } from './replay.js?v=3.4.12';

const DEFAULT_SCROLL_SAMPLE_MS = 120;
const DEFAULT_POINTER_SAMPLE_MS = 120;

function smoothScrollTo(targetY, durationMs = 120) {
  const startY = window.scrollY;
  const delta = targetY - startY;
  const duration = Math.max(40, Math.min(260, Number(durationMs) || 120));
  const startAt = performance.now();
  return new Promise((resolve) => {
    const tick = (now) => {
      const p = Math.min(1, (now - startAt) / duration);
      const eased = 1 - ((1 - p) ** 2);
      window.scrollTo(0, Math.round(startY + (delta * eased)));
      if (p < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function pulseButton(el) {
  if (!el) return;
  el.classList.remove('replay-pop');
  void el.offsetWidth;
  el.classList.add('replay-pop');
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
    getReplayContainer = () => document,
    hideSettingsOnReplay = true
  } = options;

  const recorder = createInteractionRecorder({ storageKey });
  const { recordingStatusEl, recordingToggleBtn, replayBtn, replaySpeedEl, replaySelectEl, replayRefreshBtn, replayControlBarEl, replayPlayPauseBtn, replayStopBtn, replayStepBackBtn, replayStepForwardBtn, recordModeBadgeEl } = refs;

  let frameCaptureTimer = null;
  let lastScrollSampleAt = 0;
  let lastPointerSampleAt = 0;
  let mode = 'idle';

  let replayPaused = false;
  let replayStopped = false;
  let replayStepBudget = 0;
  let replayFrames = [];
  let replayFramePtr = -1;

  const replayCursor = document.createElement('div');
  replayCursor.id = 'replayCursor';
  replayCursor.hidden = true;
  document.body.appendChild(replayCursor);

  const setStatus = (text) => {
    if (recordingStatusEl) recordingStatusEl.textContent = text;
  };

  const setMode = (nextMode) => {
    mode = nextMode;
    if (!replayControlBarEl) return;
    replayControlBarEl.classList.remove('idle', 'recording', 'replaying');
    replayControlBarEl.classList.add(mode);
    replayControlBarEl.hidden = mode === 'idle';
    if (recordModeBadgeEl) recordModeBadgeEl.hidden = mode !== 'recording';
    replayCursor.hidden = mode !== 'replaying';
  };

  const refreshReplayList = () => {
    if (!replaySelectEl) return;
    const list = getReplayIndex(storageKey);
    replaySelectEl.innerHTML = '';
    const latest = document.createElement('option');
    latest.value = storageKey;
    latest.textContent = 'Latest recording';
    replaySelectEl.appendChild(latest);
    list.forEach((item, idx) => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${idx + 1}. ${new Date(item.createdAt).toLocaleString('en-GB')} (${item.eventCount} events)`;
      replaySelectEl.appendChild(opt);
    });
  };

  const withViewport = (payload = {}) => ({
    ...payload,
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  });

  const record = (type, payload = {}) => {
    recorder.log(type, withViewport(payload));
    if (mode === 'recording' && type !== 'recordingStart') setMode('recording');
  };

  const startFrameCapture = () => {
    if (frameCaptureTimer) clearInterval(frameCaptureTimer);
    frameCaptureTimer = setInterval(() => {
      if (!recorder.isRecording()) return;
      record('ui:render-complete', { marker: 'interval' });
      record('frame', getSnapshot());
    }, Math.max(250, frameIntervalMs));
  };

  const stopRecording = (message = 'Recording saved.') => {
    if (!recorder.isRecording()) return null;
    const payload = recorder.stop();
    if (frameCaptureTimer) clearInterval(frameCaptureTimer);
    frameCaptureTimer = null;
    setStatus(message);
    if (recordingToggleBtn) {
      recordingToggleBtn.textContent = 'Start Interaction Recording';
      recordingToggleBtn.classList.remove('recording-live');
    }
    setMode('idle');
    refreshReplayList();
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
    record('pointer', { x: Math.round(event.clientX), y: Math.round(event.clientY), pointerType: event.pointerType || 'mouse' });
  }, { passive: true });

  container.addEventListener('focusin', (event) => {
    if (!recorder.isRecording()) return;
    const el = event.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    record('focus', { name: el.name || '', id: el.id || '', selectionStart: el.selectionStart ?? null, selectionEnd: el.selectionEnd ?? null });
  });

  container.addEventListener('input', (event) => {
    if (!recorder.isRecording()) return;
    const el = event.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    record('typing', { id: el.id || '', name: el.name || '', value: el.value, selectionStart: el.selectionStart ?? null, selectionEnd: el.selectionEnd ?? null });
  });

  document.addEventListener('selectionchange', () => {
    if (!recorder.isRecording()) return;
    const el = document.activeElement;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    record('caret', { name: el.name || '', id: el.id || '', selectionStart: el.selectionStart ?? null, selectionEnd: el.selectionEnd ?? null });
  });

  if (recordingToggleBtn) {
    recordingToggleBtn.addEventListener('click', () => {
      pulseButton(recordingToggleBtn);
      if (recorder.isRecording()) stopRecording();
      else {
        recorder.start({ viewportHeight: window.innerHeight, documentHeight: document.documentElement.scrollHeight, devicePixelRatio: window.devicePixelRatio || 1 });
        record('recordingStart', { startedAt: Date.now() });
        startFrameCapture();
        setStatus('Recording in progress...');
        recordingToggleBtn.textContent = 'Stop Interaction Recording';
        recordingToggleBtn.classList.add('recording-live');
        setMode('idle');
      }
    });
  }

  if (replayRefreshBtn) replayRefreshBtn.addEventListener('click', refreshReplayList);
  refreshReplayList();

  const mapButtonByEvent = (type) => ({
    prev: document.getElementById('prevBtn'),
    next: document.getElementById('nextBtn'),
    skip: document.getElementById('skipBtn'),
    review: document.getElementById('reviewBtn'),
    timerToggle: document.getElementById('toggleTimerProgressBtn'),
    allQuestionsToggle: document.getElementById('toggleAllQuestionsBtn')
  }[type]);

  const setReplayUiMode = (active) => {
    document.body.classList.toggle('replay-active', active);
    if (hideSettingsOnReplay) {
      const settingsPanel = document.getElementById('settingsPanel');
      if (settingsPanel) settingsPanel.hidden = true;
    }
    setMode(active ? 'replaying' : 'idle');
  };

  if (replayPlayPauseBtn) {
    replayPlayPauseBtn.addEventListener('click', () => {
      replayPaused = !replayPaused;
      replayPlayPauseBtn.textContent = replayPaused ? 'Play' : 'Pause';
    });
  }
  if (replayStopBtn) replayStopBtn.addEventListener('click', () => { replayStopped = true; });
  if (replayStepForwardBtn) replayStepForwardBtn.addEventListener('click', () => {
    replayPaused = true;
    replayStepBudget += 1;
    if (replayPlayPauseBtn) replayPlayPauseBtn.textContent = 'Play';
  });
  if (replayStepBackBtn) replayStepBackBtn.addEventListener('click', () => {
    replayPaused = true;
    if (replayFramePtr > 0) {
      replayFramePtr -= 1;
      applySnapshot(replayFrames[replayFramePtr]);
      setStatus(`Stepped back to frame ${replayFramePtr + 1}/${replayFrames.length}`);
    }
  });

  if (replayBtn) {
    replayBtn.addEventListener('click', async () => {
      pulseButton(replayBtn);
      const selected = replaySelectEl?.value || storageKey;
      const recording = await getStoredReplay(selected);
      if (!recording) return setStatus('No recording found to replay.');

      replayPaused = false;
      replayStopped = false;
      replayStepBudget = 0;
      replayFrames = [];
      replayFramePtr = -1;
      if (replayPlayPauseBtn) replayPlayPauseBtn.textContent = 'Pause';

      setStatus('Replay in progress...');
      setReplayUiMode(true);
      onReplayStart();

      await replayInteractions(recording, {
        frame: (payload) => {
          replayFrames.push(payload);
          replayFramePtr = replayFrames.length - 1;
          applySnapshot(payload);
        },
        scroll: async (payload, meta) => {
          if (typeof payload?.y === 'number') await smoothScrollTo(payload.y, meta.waitMs);
        },
        pointer: (payload) => {
          replayCursor.style.transform = `translate(${payload.x || 0}px, ${payload.y || 0}px)`;
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
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            if (payload.selectionStart != null && payload.selectionEnd != null) {
              try { el.setSelectionRange(payload.selectionStart, payload.selectionEnd); } catch (_error) {}
            }
          }
        },
        ...actionHandlers
      }, Number(replaySpeedEl?.value || 1), {
        isPaused: () => replayPaused,
        isStopped: () => replayStopped,
        consumeStep: () => {
          if (replayStepBudget > 0) { replayStepBudget -= 1; return true; }
          return false;
        },
        onEventApplied: (event) => {
          pulseButton(mapButtonByEvent(event.type));
        }
      });

      onReplayEnd();
      setReplayUiMode(false);
      setStatus(replayStopped ? 'Replay stopped.' : 'Replay complete.');
    });
  }

  setMode('idle');
  return { record, isRecording: () => recorder.isRecording(), stop: stopRecording, refreshReplayList };
}
