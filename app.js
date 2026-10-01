/* ─────────────────────────────────────────────
   Lab Lens — app.js
   AI-powered lab assistant for college students
───────────────────────────────────────────── */

// ── STATE ──────────────────────────────────────
const state = {
  apiKey: '',
  isDemoMode: false,
  activeTab: 'home',
  scanType: 'equipment',
  cameraStream: null,
  capturedImage: null,   // base64
  currentAnalysis: null,
  session: {
    active: false,
    paused: false,
    totalSeconds: 0,
    stepSeconds: [],     // time per step
    activeStep: -1,
    completed: [],       // bool[]
    totalTimer: null,
    stepTimer: null,
  },
  sessions: [],          // saved sessions (localStorage)
};

// ── DOM REFS ────────────────────────────────────
const $ = id => document.getElementById(id);
const $q = sel => document.querySelector(sel);
const $qa = sel => document.querySelectorAll(sel);

const setupScreen   = $('setup-screen');
const app           = $('app');
const apiKeyInput   = $('api-key-input');
const startBtn      = $('start-btn');
const demoBtn       = $('demo-btn');
const toggleKeyVis  = $('toggle-key-vis');
const demoBadge     = $('demo-badge');

const navBtns       = $qa('.nav-btn');
const tabPanels     = $qa('.tab-panel');

// Scan
const typeChips     = $qa('.type-chip');
const cameraVideo   = $('camera-video');
const cameraCanvas  = $('camera-canvas');
const cameraWrap    = $('camera-wrap');
const scannerOverlay = $('scanner-overlay');
const scanLine      = $('scan-line');
const cameraPlaceholder = $('camera-placeholder');
const capturedImg   = $('captured-img');
const startCamBtn   = $('start-cam-btn');
const captureBtn    = $('capture-btn');
const retakeBtn     = $('retake-btn');
const uploadArea    = $('upload-area');
const fileInput     = $('file-input');
const describeInput = $('describe-input');
const analyseBtn    = $('analyse-btn');

// Analysis
const analysisEmpty   = $('analysis-empty');
const analysisContent = $('analysis-content');
const analysisCat     = $('analysis-category');
const analysisTitle   = $('analysis-title');
const analysisTheory  = $('analysis-theory');
const formulasList    = $('formulas-list');
const componentsList  = $('components-list');
const safetyList      = $('safety-list');
const expectedResults = $('expected-results');
const startSessionBtn = $('start-session-btn');

// Session
const sessionEmpty      = $('session-empty');
const sessionContent    = $('session-content');
const sessionTitleEl    = $('session-title');
const sessionProgressEl = $('session-progress');
const totalTimerDisplay = $('total-timer-display');
const sessionPauseBtn   = $('session-pause-btn');
const pauseIcon         = $('pause-icon');
const progressBar       = $('session-progress-bar');
const checklist         = $('checklist');
const sessionComplete   = $('session-complete');
const completeSummary   = $('complete-summary');
const newScanBtn        = $('new-scan-btn');

// Settings
const settingsBtn   = $('settings-btn');
const settingsModal = $('settings-modal');
const closeSettings = $('close-settings');
const settingsKey   = $('settings-api-key');
const saveKeyBtn    = $('save-key-btn');
const clearDataBtn  = $('clear-data-btn');

// Loading & Toast
const loadingOverlay = $('loading-overlay');
const loadingStatus  = $('loading-status');
const toast          = $('toast');

// ── INIT ────────────────────────────────────────
function init() {
  const saved = localStorage.getItem('labLensApiKey');
  if (saved) {
    state.apiKey = saved;
    apiKeyInput.value = saved;
  }
  loadSessions();
  bindEvents();
}

// ── EVENTS ──────────────────────────────────────
function bindEvents() {
  // Setup
  startBtn.addEventListener('click', handleStart);
  demoBtn.addEventListener('click', handleDemo);
  apiKeyInput.addEventListener('input', () => {
    startBtn.disabled = apiKeyInput.value.trim().length < 10;
  });
  apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleStart(); });
  toggleKeyVis.addEventListener('click', () => {
    const t = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = t;
  });

  // Quick launch buttons on home
  $qa('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      state.scanType = type;
      setActiveTypeChip(type);
      switchTab('scan');
    });
  });

  // Nav buttons
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Buttons with data-tab
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]');
    if (btn && !btn.classList.contains('nav-btn') && !btn.classList.contains('quick-btn')) {
      switchTab(btn.dataset.tab);
    }
  });

  // Scan type chips
  typeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      state.scanType = chip.dataset.type;
      setActiveTypeChip(chip.dataset.type);
    });
  });

  // Camera
  startCamBtn.addEventListener('click', startCamera);
  captureBtn.addEventListener('click', capturePhoto);
  retakeBtn.addEventListener('click', retakePhoto);

  // Upload
  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadImageFile(fileInput.files[0]);
  });

  // Describe input
  describeInput.addEventListener('input', checkAnalyseReady);

  // Analyse
  analyseBtn.addEventListener('click', runAnalysis);

  // Start session
  startSessionBtn.addEventListener('click', startSession);

  // Session controls
  sessionPauseBtn.addEventListener('click', togglePause);
  newScanBtn.addEventListener('click', () => { switchTab('scan'); });

  // Settings
  settingsBtn.addEventListener('click', openSettings);
  closeSettings.addEventListener('click', closeSettingsModal);
  settingsModal.addEventListener('click', e => { if (e.target === settingsModal) closeSettingsModal(); });
  saveKeyBtn.addEventListener('click', saveSettings);
  clearDataBtn.addEventListener('click', clearAllData);
}

// ── SETUP ───────────────────────────────────────
function handleStart() {
  const key = apiKeyInput.value.trim();
  if (key.length < 10) { showToast('Please enter a valid API key.'); return; }
  state.apiKey = key;
  state.isDemoMode = false;
  localStorage.setItem('labLensApiKey', key);
  launchApp();
}

function handleDemo() {
  state.isDemoMode = true;
  state.apiKey = '';
  demoBadge.classList.remove('hidden');
  launchApp();
}

function launchApp() {
  setupScreen.style.opacity = '0';
  setupScreen.style.transition = 'opacity 0.3s';
  setTimeout(() => {
    setupScreen.classList.add('hidden');
    app.classList.remove('hidden');
    app.style.opacity = '0';
    app.style.transition = 'opacity 0.3s';
    requestAnimationFrame(() => { app.style.opacity = '1'; });
  }, 300);
}

// ── TAB NAVIGATION ──────────────────────────────
function switchTab(tab) {
  if (state.activeTab === tab) return;
  state.activeTab = tab;

  tabPanels.forEach(p => p.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));

  $(`tab-${tab}`)?.classList.add('active');
  $qa(`.nav-btn[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
}

// ── SCAN TYPE ───────────────────────────────────
function setActiveTypeChip(type) {
  typeChips.forEach(c => {
    c.classList.toggle('active', c.dataset.type === type);
  });
}

// ── CAMERA ──────────────────────────────────────
async function startCamera() {
  try {
    const constraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.cameraStream = stream;
    cameraVideo.srcObject = stream;
    cameraVideo.classList.remove('hidden');
    cameraPlaceholder.classList.add('hidden');
    scannerOverlay.classList.add('active');
    startCamBtn.classList.add('hidden');
    captureBtn.disabled = false;
    showToast('Camera ready — aim and capture!');
  } catch (err) {
    showToast('Camera not available — please upload an image instead.');
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
  cameraVideo.srcObject = null;
}

function capturePhoto() {
  const ctx = cameraCanvas.getContext('2d');
  cameraCanvas.width = cameraVideo.videoWidth;
  cameraCanvas.height = cameraVideo.videoHeight;
  ctx.drawImage(cameraVideo, 0, 0);
  const dataURL = cameraCanvas.toDataURL('image/jpeg', 0.85);
  state.capturedImage = dataURL;

  stopCamera();
  cameraVideo.classList.add('hidden');
  scannerOverlay.classList.remove('active');
  capturedImg.src = dataURL;
  capturedImg.classList.remove('hidden');
  captureBtn.classList.add('hidden');
  retakeBtn.classList.remove('hidden');
  checkAnalyseReady();
  showToast('Image captured!');
}

function retakePhoto() {
  state.capturedImage = null;
  capturedImg.classList.add('hidden');
  capturedImg.src = '';
  retakeBtn.classList.add('hidden');
  startCamBtn.classList.remove('hidden');
  captureBtn.disabled = true;
  captureBtn.classList.remove('hidden');
  cameraPlaceholder.classList.remove('hidden');
  checkAnalyseReady();
}

function loadImageFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    state.capturedImage = e.target.result;
    stopCamera();
    cameraVideo.classList.add('hidden');
    scannerOverlay.classList.remove('active');
    capturedImg.src = state.capturedImage;
    capturedImg.classList.remove('hidden');
    cameraPlaceholder.classList.add('hidden');
    captureBtn.classList.add('hidden');
    retakeBtn.classList.remove('hidden');
    startCamBtn.classList.remove('hidden');
    checkAnalyseReady();
    showToast('Image loaded!');
  };
  reader.readAsDataURL(file);
}

function checkAnalyseReady() {
  const hasImage = !!state.capturedImage;
  const hasText  = describeInput.value.trim().length > 10;
  analyseBtn.disabled = !(hasImage || hasText);
}

// ── AI ANALYSIS ─────────────────────────────────
async function runAnalysis() {
  if (state.isDemoMode) {
    runDemoAnalysis();
    return;
  }
  if (!state.apiKey) { showToast('Please set your API key in Settings.'); return; }

  showLoading('Sending to AI…');

  try {
    const messages = buildAnalysisMessages();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');

    let analysis;
    try {
      const clean = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const jsonStart = clean.indexOf('{');
      const jsonEnd   = clean.lastIndexOf('}');
      analysis = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
    } catch {
      throw new Error('Could not parse AI response. Please try again.');
    }

    state.currentAnalysis = analysis;
    saveSessionMeta(analysis);
    renderAnalysis(analysis);
    hideLoading();
    switchTab('analysis');
    showToast('Analysis complete!');

  } catch (err) {
    hideLoading();
    showToast(`Error: ${err.message}`);
  }
}

function buildAnalysisMessages() {
  const typeLabel = {
    equipment: 'lab equipment or instrument',
    circuit:   'electronic circuit board or schematic',
    manual:    'lab manual page or experimental procedure',
    chemical:  'chemical apparatus, reagent, or reaction setup',
  }[state.scanType] || 'lab item';

  const prompt = `You are Lab Lens AI, an intelligent lab assistant for college engineering and science students.
Analyse this ${typeLabel} and provide a comprehensive guide.
Return ONLY valid JSON (no markdown fences, no extra text) with EXACTLY this structure:
{
  "title": "Name of the experiment, equipment, or topic",
  "category": "electronics | chemistry | physics | biology | mechanical",
  "theory": "Clear 2-3 paragraph explanation of the underlying scientific theory and principles",
  "formulas": [
    { "name": "Formula name", "formula": "Mathematical expression e.g. V = IR", "description": "What each variable means and when to use it" }
  ],
  "components": [
    { "name": "Component or material name", "quantity": "1", "description": "Its role in the experiment" }
  ],
  "setup_steps": [
    { "step": 1, "title": "Brief action title", "description": "Detailed instruction for this step", "estimated_minutes": 3 }
  ],
  "safety_notes": ["Specific safety precaution"],
  "expected_results": "What students should observe, measure, or calculate, and how to verify success"
}
Include at least 2 formulas, 3 components, and 5 setup steps if applicable.`;

  const content = [];
  if (state.capturedImage) {
    const base64 = state.capturedImage.includes(',')
      ? state.capturedImage.split(',')[1]
      : state.capturedImage;
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } });
  }
  const textContent = state.capturedImage
    ? prompt
    : `${prompt}\n\nStudent describes: ${describeInput.value.trim()}`;
  content.push({ type: 'text', text: textContent });

  return [{ role: 'user', content }];
}

// ── DEMO MODE ───────────────────────────────────
function runDemoAnalysis() {
  showLoading('Loading demo analysis…');
  setTimeout(() => {
    const demo = {
      title: "Wheatstone Bridge Experiment",
      category: "electronics",
      theory: "The Wheatstone bridge is a circuit for measuring an unknown electrical resistance by balancing two legs of a bridge circuit. It was invented by Samuel Hunter Christie in 1833 and popularised by Sir Charles Wheatstone in 1843.\n\nThe bridge consists of four resistors arranged in a diamond configuration with a voltage source across one diagonal and a galvanometer across the other. At balance, no current flows through the galvanometer, and the unknown resistance can be calculated.\n\nThis principle is widely used in instrumentation, including strain gauges, temperature sensors, and pressure transducers, making it one of the most important circuits in electrical metrology.",
      formulas: [
        { name: "Balance Condition", formula: "P / Q = R / X", description: "P, Q, R are known resistances; X is the unknown. At bridge balance, this ratio holds and the galvanometer reads zero." },
        { name: "Unknown Resistance", formula: "X = (R × Q) / P", description: "Rearranged to solve for the unknown resistance X once balance is achieved." },
        { name: "Bridge Sensitivity", formula: "S = ΔI / ΔR", description: "Sensitivity S is the change in galvanometer current per unit change in resistance — higher is better for precision." }
      ],
      components: [
        { name: "Resistor Box (P)", quantity: "1", description: "Variable known resistance forming one arm of the bridge." },
        { name: "Resistor Box (Q)", quantity: "1", description: "Variable known resistance forming the ratio arm." },
        { name: "Standard Resistance (R)", quantity: "1", description: "Known precision resistor in the third arm." },
        { name: "Unknown Resistor (X)", quantity: "1", description: "Resistor under test in the fourth arm." },
        { name: "Galvanometer", quantity: "1", description: "Sensitive current detector to detect balance condition." },
        { name: "DC Power Supply", quantity: "1", description: "Provides stable voltage across the bridge." }
      ],
      setup_steps: [
        { step: 1, title: "Prepare the bench", description: "Lay out all components on the lab bench. Inspect resistor boxes for damage. Verify the galvanometer reads zero when its terminals are shorted.", estimated_minutes: 5 },
        { step: 2, title: "Wire the bridge", description: "Connect P, Q, R, and X in the diamond configuration: top node to positive supply, bottom node to negative supply, galvanometer across the left and right nodes.", estimated_minutes: 8 },
        { step: 3, title: "Set initial values", description: "Set P = Q = 100 Ω on the resistor boxes to start with a 1:1 ratio. Leave R at its initial value.", estimated_minutes: 3 },
        { step: 4, title: "Adjust for balance", description: "Power on the supply. Slowly adjust R while observing the galvanometer. When the galvanometer reads zero, the bridge is balanced.", estimated_minutes: 10 },
        { step: 5, title: "Record the value", description: "Note the value of R at balance. Calculate X = (R × Q) / P. Record in your lab notebook.", estimated_minutes: 5 },
        { step: 6, title: "Verify with multimeter", description: "Measure X directly with a digital multimeter. Compare to your calculated value and compute percentage error.", estimated_minutes: 5 },
        { step: 7, title: "Repeat for accuracy", description: "Change the P:Q ratio to 10:100 and 100:10, repeat the balance procedure, and average the results.", estimated_minutes: 10 }
      ],
      safety_notes: [
        "Keep supply voltage below 12 V DC to prevent damage to the galvanometer.",
        "Always disconnect power before rewiring connections.",
        "Do not leave the bridge energised when unattended.",
        "Handle precision resistors carefully — do not drop or overheat them."
      ],
      expected_results: "At balance, the galvanometer should read exactly 0 µA. The calculated value of X should match the multimeter reading within ±2%. Typical lab unknowns range from 10 Ω to 10 kΩ. Plot R vs the P/Q ratio to verify linearity."
    };
    state.currentAnalysis = demo;
    saveSessionMeta(demo);
    renderAnalysis(demo);
    hideLoading();
    switchTab('analysis');
    showToast('Demo analysis loaded!');
  }, 1800);
}

// ── RENDER ANALYSIS ─────────────────────────────
function renderAnalysis(data) {
  analysisEmpty.classList.add('hidden');
  analysisContent.classList.remove('hidden');

  analysisCat.textContent = data.category || 'General';
  analysisTitle.textContent = data.title || 'Experiment';
  analysisTheory.textContent = data.theory || '';

  // Formulas
  formulasList.innerHTML = '';
  (data.formulas || []).forEach(f => {
    const el = document.createElement('div');
    el.className = 'formula-item';
    el.innerHTML = `
      <div class="formula-name">${esc(f.name)}</div>
      <div class="formula-expr">${esc(f.formula)}</div>
      <div class="formula-desc">${esc(f.description)}</div>`;
    formulasList.appendChild(el);
  });

  // Components
  componentsList.innerHTML = '';
  (data.components || []).forEach(c => {
    const el = document.createElement('div');
    el.className = 'component-item';
    el.innerHTML = `
      <span class="comp-qty">${esc(c.quantity)}</span>
      <div class="comp-info">
        <div class="comp-name">${esc(c.name)}</div>
        <div class="comp-desc">${esc(c.description)}</div>
      </div>`;
    componentsList.appendChild(el);
  });

  // Safety
  safetyList.innerHTML = '';
  (data.safety_notes || []).forEach(note => {
    const li = document.createElement('li');
    li.textContent = note;
    safetyList.appendChild(li);
  });

  expectedResults.textContent = data.expected_results || '';
}

// ── SESSION ─────────────────────────────────────
function startSession() {
  if (!state.currentAnalysis) return;
  const steps = state.currentAnalysis.setup_steps || [];
  if (!steps.length) { showToast('No setup steps found.'); return; }

  // Reset session state
  state.session.active = true;
  state.session.paused = false;
  state.session.totalSeconds = 0;
  state.session.stepSeconds = new Array(steps.length).fill(0);
  state.session.completed = new Array(steps.length).fill(false);
  state.session.activeStep = 0;

  sessionEmpty.classList.add('hidden');
  sessionContent.classList.remove('hidden');
  sessionComplete.classList.add('hidden');

  sessionTitleEl.textContent = state.currentAnalysis.title || 'Experiment';
  updateSessionProgress();

  // Build checklist
  checklist.innerHTML = '';
  steps.forEach((step, i) => {
    const item = document.createElement('div');
    item.className = 'checklist-item' + (i === 0 ? ' active-step' : '');
    item.dataset.index = i;
    item.innerHTML = `
      <div class="step-row">
        <div class="step-check" data-index="${i}" title="Mark complete"></div>
        <div class="step-main">
          <div class="step-num-label">Step ${step.step || i + 1}</div>
          <div class="step-check-label">${esc(step.title)}</div>
          <div class="step-check-desc">${esc(step.description)}</div>
        </div>
      </div>
      <div class="step-timer-row">
        <span class="step-time-display" id="step-time-${i}">00:00</span>
        <span class="step-est">Est. ${step.estimated_minutes || '—'} min</span>
      </div>`;
    checklist.appendChild(item);
  });

  // Bind check clicks
  $qa('.step-check').forEach(el => {
    el.addEventListener('click', () => toggleStepComplete(parseInt(el.dataset.index)));
  });

  startTimers();
  switchTab('session');
  showToast('Lab session started!');
}

function startTimers() {
  clearInterval(state.session.totalTimer);
  clearInterval(state.session.stepTimer);

  state.session.totalTimer = setInterval(() => {
    if (!state.session.paused) {
      state.session.totalSeconds++;
      totalTimerDisplay.textContent = formatTime(state.session.totalSeconds);
    }
  }, 1000);

  state.session.stepTimer = setInterval(() => {
    if (!state.session.paused) {
      const idx = state.session.activeStep;
      if (idx >= 0 && idx < state.session.stepSeconds.length) {
        state.session.stepSeconds[idx]++;
        const el = $(`step-time-${idx}`);
        if (el) el.textContent = formatTime(state.session.stepSeconds[idx]);
      }
    }
  }, 1000);
}

function toggleStepComplete(index) {
  const steps   = state.currentAnalysis.setup_steps || [];
  const wasCompleted = state.session.completed[index];

  state.session.completed[index] = !wasCompleted;

  const items = $qa('.checklist-item');
  const item  = items[index];
  const check = item.querySelector('.step-check');

  if (state.session.completed[index]) {
    item.classList.add('done-step');
    item.classList.remove('active-step');
    check.classList.add('checked');

    // Advance to next incomplete step
    const next = state.session.completed.findIndex((done, i) => !done);
    state.session.activeStep = next;

    items.forEach((el, i) => {
      el.classList.remove('active-step');
      if (i === next) el.classList.add('active-step');
    });

    // Scroll next step into view
    if (next >= 0) {
      items[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } else {
    item.classList.remove('done-step');
    check.classList.remove('checked');
  }

  updateSessionProgress();
  checkSessionComplete();
}

function updateSessionProgress() {
  const total     = (state.currentAnalysis?.setup_steps || []).length;
  const done      = state.session.completed.filter(Boolean).length;
  const pct       = total ? (done / total) * 100 : 0;
  sessionProgressEl.textContent = `${done} of ${total} steps done`;
  progressBar.style.width = `${pct}%`;
}

function checkSessionComplete() {
  const allDone = state.session.completed.every(Boolean);
  if (allDone) {
    clearInterval(state.session.totalTimer);
    clearInterval(state.session.stepTimer);
    sessionComplete.classList.remove('hidden');
    const total = state.session.totalSeconds;
    completeSummary.textContent =
      `You completed all ${state.session.completed.length} steps in ${formatTime(total)}. Great work!`;
    showToast('🎉 Experiment complete!');
  }
}

function togglePause() {
  state.session.paused = !state.session.paused;
  sessionPauseBtn.classList.toggle('paused', state.session.paused);
  pauseIcon.innerHTML = state.session.paused
    ? `<polygon points="5 3 19 12 5 21 5 3"/>`   // play
    : `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;  // pause
  showToast(state.session.paused ? 'Session paused' : 'Session resumed');
}

// ── SETTINGS ────────────────────────────────────
function openSettings() {
  settingsKey.value = state.apiKey;
  settingsModal.classList.remove('hidden');
}
function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}
function saveSettings() {
  const key = settingsKey.value.trim();
  if (key.length < 10) { showToast('Key looks too short.'); return; }
  state.apiKey = key;
  state.isDemoMode = false;
  demoBadge.classList.add('hidden');
  localStorage.setItem('labLensApiKey', key);
  closeSettingsModal();
  showToast('API key saved!');
}
function clearAllData() {
  if (!confirm('Clear all saved sessions and API key?')) return;
  localStorage.clear();
  state.apiKey = '';
  state.sessions = [];
  closeSettingsModal();
  showToast('All data cleared.');
}

// ── SESSION STORAGE ─────────────────────────────
function saveSessionMeta(analysis) {
  const sessions = JSON.parse(localStorage.getItem('labLensSessions') || '[]');
  const entry = {
    id: Date.now(),
    title: analysis.title,
    category: analysis.category,
    date: new Date().toLocaleDateString(),
  };
  sessions.unshift(entry);
  if (sessions.length > 8) sessions.splice(8);
  localStorage.setItem('labLensSessions', JSON.stringify(sessions));
  loadSessions();
}

function loadSessions() {
  const sessions = JSON.parse(localStorage.getItem('labLensSessions') || '[]');
  const section  = $('recent-section');
  const list     = $('recent-list');
  if (!sessions.length) { section.classList.add('hidden'); return; }
  section.classList.remove('hidden');
  list.innerHTML = sessions.map(s => `
    <div class="recent-item">
      <div>
        <div class="recent-name">${esc(s.title)}</div>
        <div class="recent-meta">${esc(s.category)} · ${esc(s.date)}</div>
      </div>
      <svg class="recent-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </div>`).join('');
}

// ── LOADING ─────────────────────────────────────
function showLoading(msg = 'Analysing…') {
  loadingStatus.textContent = msg;
  loadingOverlay.classList.remove('hidden');
}
function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

// ── TOAST ────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 220);
  }, 2800);
}

// ── UTILS ────────────────────────────────────────
function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── KICKOFF ──────────────────────────────────────
init();
