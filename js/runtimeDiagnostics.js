export function installRuntimeDiagnostics({ footerSelector = '.site-footer' } = {}) {
  const footer = document.querySelector(footerSelector);
  const noop = () => {};
  if (!footer) return { report: noop };

  let panel = document.getElementById('runtimeDiagnosticsPanel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'runtimeDiagnosticsPanel';
    panel.className = 'runtime-diagnostics-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="runtime-diagnostics-head">
        <strong>Diagnostics</strong>
        <button type="button" id="runtimeDiagnosticsCloseBtn" class="icon-btn" aria-label="Close diagnostics">✕</button>
      </div>
      <p class="muted">Recent client-side runtime events.</p>
      <pre id="runtimeDiagnosticsOutput">No runtime events yet.</pre>
    `;
    document.body.appendChild(panel);
  }

  let toggle = document.getElementById('runtimeDiagnosticsToggleBtn');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'runtimeDiagnosticsToggleBtn';
    toggle.className = 'footer-diagnostics-btn';
    toggle.textContent = 'Diagnostics';
    const version = footer.querySelector('#versionInfo');
    if (version && version.nextSibling) footer.insertBefore(toggle, version.nextSibling);
    else footer.appendChild(toggle);
  }

  const output = panel.querySelector('#runtimeDiagnosticsOutput');
  const close = panel.querySelector('#runtimeDiagnosticsCloseBtn');
  const entries = [];
  const limit = 100;

  const render = () => {
    if (!output) return;
    output.textContent = entries.length
      ? entries.map((e) => `[${e.time}] ${e.level.toUpperCase()} ${e.message}${e.detail ? ` :: ${e.detail}` : ''}`).join('\n')
      : 'No runtime events yet.';
  };

  const report = (level, message, detail = '') => {
    entries.push({
      time: new Date().toISOString(),
      level,
      message,
      detail: detail ? String(detail) : ''
    });
    if (entries.length > limit) entries.shift();
    render();
  };

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });

  close?.addEventListener('click', () => {
    panel.hidden = true;
  });

  window.addEventListener('error', (event) => {
    report('error', event.message || 'Unhandled error', event.error?.stack || '');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    report('error', 'Unhandled promise rejection', reason?.message || String(reason || 'Unknown rejection'));
  });

  return { report };
}
