const ENABLE_KEY = 'nfer.openai.enabled';
const API_KEY_STORAGE_KEY = 'nfer.openai.apiKey';

function readBool(key, fallback = false) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === '1' || raw === 'true';
}

function setBool(key, value) {
  localStorage.setItem(key, value ? '1' : '0');
}

function readApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

function writeApiKey(value) {
  localStorage.setItem(API_KEY_STORAGE_KEY, value || '');
}

function extractOutputText(payload) {
  if (payload?.output_text) return String(payload.output_text);
  const items = Array.isArray(payload?.output) ? payload.output : [];
  const chunks = [];
  items.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((part) => {
      if (part?.type === 'output_text' && typeof part?.text === 'string') chunks.push(part.text);
    });
  });
  return chunks.join('\n\n').trim();
}

async function requestOpenAIFeedback(promptText, apiKey) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: 'You are a Year 4 reading tutor. Respond in concise UK English markdown with specific actionable coaching.'
        },
        {
          role: 'user',
          content: promptText
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${body.slice(0, 240)}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  if (!text) throw new Error('OpenAI response did not include usable text output.');
  return text;
}

export function createOpenAIFeedbackModule({ enabledByDefault = false } = {}) {
  return {
    bind(promptText, statusEl) {
      const toggle = document.getElementById('openAIFeedbackToggle');
      const apiKeyInput = document.getElementById('openAIApiKeyInput');
      const saveKeyBtn = document.getElementById('saveOpenAIApiKeyBtn');
      const generateBtn = document.getElementById('generateInAppFeedbackBtn');
      const outputEl = document.getElementById('inAppFeedbackOutput');
      const outputWrap = document.getElementById('inAppFeedbackOutputWrap');
      const inAppControls = document.getElementById('inAppFeedbackControls');

      if (!toggle || !apiKeyInput || !saveKeyBtn || !generateBtn || !outputEl || !inAppControls) return;

      const refreshUi = () => {
        const enabled = readBool(ENABLE_KEY, enabledByDefault);
        toggle.checked = enabled;
        inAppControls.hidden = !enabled;
      };

      apiKeyInput.value = readApiKey();
      refreshUi();

      toggle.addEventListener('change', () => {
        setBool(ENABLE_KEY, toggle.checked);
        refreshUi();
        if (statusEl) {
          statusEl.textContent = toggle.checked
            ? 'In-app OpenAI feedback enabled for this browser.'
            : 'In-app OpenAI feedback disabled. Prompt tools remain available.';
        }
      });

      saveKeyBtn.addEventListener('click', () => {
        writeApiKey(apiKeyInput.value.trim());
        if (statusEl) statusEl.textContent = 'API key saved in local browser storage for this device.';
      });

      generateBtn.addEventListener('click', async () => {
        const enabled = readBool(ENABLE_KEY, enabledByDefault);
        if (!enabled) {
          if (statusEl) statusEl.textContent = 'Enable in-app feedback first.';
          return;
        }

        const apiKey = (apiKeyInput.value || readApiKey()).trim();
        if (!apiKey) {
          if (statusEl) statusEl.textContent = 'Add an OpenAI API key first.';
          return;
        }

        writeApiKey(apiKey);
        generateBtn.disabled = true;
        if (statusEl) statusEl.textContent = 'Generating in-app feedback…';

        try {
          const text = await requestOpenAIFeedback(promptText, apiKey);
          outputEl.textContent = text;
          if (outputWrap) outputWrap.hidden = false;
          if (statusEl) statusEl.textContent = 'In-app feedback generated successfully.';
        } catch (error) {
          if (statusEl) statusEl.textContent = `In-app feedback failed: ${error?.message || error}`;
        } finally {
          generateBtn.disabled = false;
        }
      });
    }
  };
}
