import { loadLibrary, setLibraryPath, getStoredLibraryPath, generateTestRandom, selectNextTest, getWeakDomains } from './generator.js?v=3.4.9';
import { getLastDiagnostic, loadHistory, saveCurrentTest, getHistory } from './storage.js?v=3.4.9';
import { renderDashboardMeta, renderDiagnostic, renderTracker, renderAttemptReview, renderFeedbackAssist } from './renderer.js?v=3.4.9';
import { createFeedbackPrompt, openPromptInChatGPT, copyPrompt } from './feedback.js?v=3.4.9';
import { installRuntimeDiagnostics } from './runtimeDiagnostics.js?v=3.4.9';
import { initGlobalUI, currentPage } from './app.global-ui.js?v=3.4.9';
import { initDashboardPage } from './appDashboard.js?v=3.4.9';
import { bindFeedbackAssist, initDiagnosticPage, initTrackerPage, initAttemptPage } from './appReports.js?v=3.4.9';
import { initTestRuntime } from './app.test-runtime.js?v=3.4.9';
import { createOpenAIFeedbackModule } from './feedbackOpenAI.js?v=3.4.9';

export async function bootstrapApp() {
  const runtimeDiagnostics = installRuntimeDiagnostics();
  const inAppFeedback = createOpenAIFeedbackModule({ enabledByDefault: false });
  try {
    initGlobalUI();
    const page = currentPage();
    runtimeDiagnostics.report('info', `Bootstrap start on ${page} page`);
    if (page === 'dashboard') await initDashboardPage({
      loadLibrary,
      setLibraryPath,
      getStoredLibraryPath,
      generateTestRandom,
      selectNextTest,
      loadHistory,
      saveCurrentTest,
      getWeakDomains,
      renderDashboardMeta
    });
    if (page === 'test') initTestRuntime();
    if (page === 'diagnostic') initDiagnosticPage({
      getLastDiagnostic,
      renderDiagnostic,
      createFeedbackPrompt,
      renderFeedbackAssist,
      bindFeedbackAssistFn: (prompt) => bindFeedbackAssist(prompt, {
        copyPrompt,
        openPromptInChatGPT,
        bindInAppFeedbackFn: (promptText, statusEl) => inAppFeedback.bind(promptText, statusEl)
      })
    });
    if (page === 'tracker') initTrackerPage({ renderTracker, getHistory });
    if (page === 'attempt') initAttemptPage({
      getHistory,
      renderAttemptReview,
      createFeedbackPrompt,
      renderFeedbackAssist,
      bindFeedbackAssistFn: (prompt) => bindFeedbackAssist(prompt, {
        copyPrompt,
        openPromptInChatGPT,
        bindInAppFeedbackFn: (promptText, statusEl) => inAppFeedback.bind(promptText, statusEl)
      })
    });
    runtimeDiagnostics.report('info', 'Bootstrap complete');
  } catch (error) {
    runtimeDiagnostics.report('error', 'App bootstrap failed', error?.message || error);
    const container = document.querySelector('.container');
    if (container) {
      container.insertAdjacentHTML('afterbegin', `<section class="card"><p class="error">App error: ${error?.message || error}</p></section>`);
    }
  }
}
