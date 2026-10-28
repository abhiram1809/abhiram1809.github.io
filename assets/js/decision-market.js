/* Interactive lessons for the D-Trade article. Original experiment records stay fixed. */
(() => {
  const article = document.querySelector('.dm-article');
  if (!article || article.dataset.interactiveReady) return;
  article.dataset.interactiveReady = 'true';
  const copy = {
    encode: 'The frozen encoder reads the state and question once. Its 1,024 FP32 features are cached for reuse. Training the readout does not update the encoder.',
    score: 'Five readout rows score the cached features. Softmax turns the scores into five probabilities. Log loss compares them with the observed return bin.',
    update: 'Vulkan computes gradients and Adam updates for the 5,120 readout weights. The encoder and cached features stay unchanged. Repeating this process produced the selected checkpoint.',
    highest: 'Highest-probability allocation: base takes 281 trades; fine-tuned takes 316. Every active session pays both entry and exit costs.',
    gate: 'Original 55% gate: both models stay in cash for all 454 sessions. With no trades, the cost slider has no effect.',
    bins: ['Large down', 'Down', 'Flat', 'Up', 'Large up']
  };
  const t = (text) => (window.PORTFOLIO_I18N?.[document.documentElement.dataset.language] || {})[text] || text;
  const locale = () => ({de:'de-DE',fr:'fr-FR',es:'es-ES',nl:'nl-NL'}[document.documentElement.dataset.language] || 'en-US');
  const number = (value, digits = 2) => new Intl.NumberFormat(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const percent = (value, digits = 2) => (value > 0 ? '+' : value < 0 ? '−' : '') + number(Math.abs(value), digits) + '%';
  const refresh = [];

  const timeline = article.querySelector('[data-dm-timeline]');
  const overnight = timeline.querySelector('#dm-overnight');
  const intraday = timeline.querySelector('#dm-intraday');
  const renderTimeline = () => {
    const gap = Number(overnight.value) / 100;
    const session = Number(intraday.value) / 100;
    const open = 100 * (1 + gap);
    const close = open * (1 + session);
    const target = Math.log1p(session);
    const sigma = target / 0.02;
    const bin = sigma < -1 ? 0 : sigma < -0.25 ? 1 : sigma < 0.25 ? 2 : sigma < 1 ? 3 : 4;
    timeline.querySelector('[data-dm-value="overnight"]').textContent = percent(gap * 100);
    timeline.querySelector('[data-dm-value="intraday"]').textContent = percent(session * 100);
    overnight.setAttribute('aria-valuetext', percent(gap * 100));
    intraday.setAttribute('aria-valuetext', percent(session * 100));
    timeline.querySelector('[data-dm-prices]').textContent = [100, open, close].map(v => number(v)).join(' → ');
    timeline.querySelector('[data-dm-target]').textContent = percent(target * 100, 3);
    timeline.querySelector('[data-dm-total]').textContent = percent(close - 100);
    timeline.querySelector('[data-dm-bin]').textContent = t(copy.bins[bin]);
  };
  timeline.addEventListener('input', renderTimeline);
  timeline.querySelector('[data-dm-reset]').addEventListener('click', () => {
    overnight.value = '3'; intraday.value = '1'; renderTimeline();
  });
  timeline.hidden = false;
  refresh.push(renderTimeline);

  const training = article.querySelector('[data-dm-training]');
  const trainingFigure = training.closest('figure');
  const stages = [...trainingFigure.querySelectorAll('.dm-stage')];
  const update = trainingFigure.querySelector('.dm-update');
  const explanation = trainingFigure.querySelector('[data-dm-explanation]');
  let step = 'encode';
  const renderTraining = () => {
    training.querySelectorAll('[data-dm-step]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.dmStep === step)));
    stages.forEach((stage, i) => stage.classList.toggle('is-current', step === 'encode' ? i < 2 : step === 'score' ? i > 0 : i === 2));
    update.classList.toggle('is-current', step === 'update');
    explanation.textContent = t(copy[step]);
  };
  training.querySelectorAll('[data-dm-step]').forEach(button => button.addEventListener('click', () => {step = button.dataset.dmStep; renderTraining();}));
  training.hidden = false; explanation.hidden = false;
  refresh.push(renderTraining);

  const replayControls = article.querySelector('[data-dm-replay]');
  const replayFigure = replayControls.closest('figure');
  const replayResults = replayFigure.querySelector('[data-dm-replay-results]');
  const cost = replayControls.querySelector('#dm-cost');
  let rule = 'highest';
  let replayData;
  const renderReplay = () => {
    if (!replayData) return;
    const bps = Number(cost.value);
    const perSide = bps / 10000;
    replayControls.querySelector('[data-dm-cost-value]').textContent = number(bps, Number.isInteger(bps) ? 0 : 1);
    cost.setAttribute('aria-valuetext', number(bps, Number.isInteger(bps) ? 0 : 1));
    replayControls.querySelectorAll('[data-dm-rule]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.dmRule === rule)));
    const rows = [...replayFigure.querySelectorAll('.dm-position-row')];
    ['base', 'fine_tuned'].forEach((name, rowIndex) => {
      const model = replayData.models[name];
      let wealth = 1;
      const counts = [0, 0, 0];
      model.returns.forEach((dailyReturn, i) => {
        const position = rule === 'gate' ? 0 : model.positions[i];
        wealth *= 1 + position * dailyReturn - 2 * perSide * Math.abs(position);
        counts[position > 0 ? 0 : position < 0 ? 1 : 2] += 1;
      });
      rows[rowIndex].querySelectorAll('.dm-position-bar span').forEach((bar, i) => bar.style.flex = String(counts[i]));
      rows[rowIndex].querySelectorAll('.dm-position-counts b').forEach((count, i) => count.textContent = String(counts[i]));
      const output = replayResults.querySelector(`[data-dm-net="${name}"]`);
      output.textContent = percent((wealth - 1) * 100);
      output.dataset.return = String(wealth - 1);
    });
    replayResults.querySelector('[data-dm-rule-note]').textContent = t(copy[rule]);
  };
  replayControls.querySelectorAll('[data-dm-rule]').forEach(button => button.addEventListener('click', () => {rule = button.dataset.dmRule; renderReplay();}));
  cost.addEventListener('input', renderReplay);
  replayResults.querySelector('[data-dm-reset]').addEventListener('click', () => {rule = 'highest'; cost.value = '5'; renderReplay();});
  refresh.push(renderReplay);
  // If data cannot be loaded, retain the original static diagram and article table.
  fetch('../../assets/data/decision-model-market/replay-sessions.json')
    .then(response => {if (!response.ok) throw new Error('Replay data unavailable'); return response.json();})
    .then(data => {
      for (const name of ['base', 'fine_tuned']) {
        const model = data.models?.[name];
        if (!model || model.positions.length !== 454 || model.returns.length !== 454 || !model.positions.every(p => [-1, 0, 1].includes(p)) || !model.returns.every(Number.isFinite)) throw new Error('Invalid replay data');
      }
      replayData = data;
      renderReplay(); replayControls.hidden = false; replayResults.hidden = false;
    })
    .catch(() => { /* The saved results remain readable without the enhancement. */ });
  const render = () => refresh.forEach(update => update());
  document.addEventListener('portfolio:languagechange', render);
  render();
})();
