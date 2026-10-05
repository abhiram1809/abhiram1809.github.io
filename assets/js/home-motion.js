(() => {
  if (!document.body.hasAttribute('data-home')) return;
  const atmosphere = document.querySelector('.home-atmosphere');
  const timeline = document.querySelector('.timeline');
  const items = [...document.querySelectorAll('.timeline-item')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let pointerFrame = 0;
  let scrollFrame = 0;
  let targetX = innerWidth * .72;
  let targetY = innerHeight * .32;
  let x = targetX;
  let y = targetY;

  // Ease toward the pointer only while it moves; no idle rendering loop.
  const drawPointer = () => {
    x += (targetX - x) * .085;
    y += (targetY - y) * .085;
    atmosphere.style.setProperty('--pointer-x', `${x.toFixed(1)}px`);
    atmosphere.style.setProperty('--pointer-y', `${y.toFixed(1)}px`);
    pointerFrame = Math.abs(targetX - x) + Math.abs(targetY - y) > .5
      ? requestAnimationFrame(drawPointer) : 0;
  };
  const movePointer = (event) => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    targetX = event.clientX;
    targetY = event.clientY;
    atmosphere.classList.add('is-tracking');
    if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
  };
  const stopPointer = () => {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    atmosphere.classList.remove('is-tracking');
  };
  window.addEventListener('pointermove', movePointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', stopPointer);
  window.addEventListener('blur', stopPointer);
  reducedMotion.addEventListener('change', stopPointer);
  finePointer.addEventListener('change', stopPointer);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPointer(); });

  const updateTimeline = () => {
    scrollFrame = 0;
    if (!timeline || !items.length) return;
    const rect = timeline.getBoundingClientRect();
    const focusLine = innerHeight * .64;
    const markerOffset = parseFloat(getComputedStyle(items[0], '::before').top) + 5.5;
    const length = items.at(-1).offsetTop - items[0].offsetTop;
    timeline.style.setProperty('--timeline-length', `${length}px`);
    const progress = Math.max(0, Math.min(1, (focusLine - rect.top - markerOffset) / Math.max(1, length)));
    timeline.style.setProperty('--timeline-progress', progress.toFixed(4));
    const active = items.filter((item) => item.getBoundingClientRect().top + markerOffset <= focusLine).at(-1);
    items.forEach((item) => item.classList.toggle('is-active', item === active));
  };
  const scheduleTimeline = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateTimeline);
  };
  window.addEventListener('scroll', scheduleTimeline, { passive: true });
  window.addEventListener('resize', scheduleTimeline);
  window.addEventListener('pageshow', scheduleTimeline);
  document.addEventListener('portfolio:languagechange', scheduleTimeline);
  if (timeline && 'ResizeObserver' in window) new ResizeObserver(scheduleTimeline).observe(timeline);
  updateTimeline();
})();
