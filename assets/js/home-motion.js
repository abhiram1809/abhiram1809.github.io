(() => {
  if (!document.body.hasAttribute('data-home')) return;
  const atmosphere = document.querySelector('.home-atmosphere');
  const timeline = document.querySelector('.timeline');
  const items = [...document.querySelectorAll('.timeline-item')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const canvas = atmosphere?.querySelector('.pointer-field');
  const context = canvas?.getContext('2d');
  let scrollFrame = 0;

  const contactEmail = document.querySelector('#contact .contact-email');
  let contactFrame = 0;
  let contactJump;
  const cancelContactCue = () => {
    cancelAnimationFrame(contactFrame);
    contactFrame = 0;
    contactJump?.cancel();
  };
  document.querySelectorAll('a[href="#contact"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!contactEmail || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      cancelContactCue();
      if (location.hash !== '#contact') history.pushState(null, '', '#contact');
      contactEmail.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
      const started = performance.now();
      let previousTop = null;
      let stableFrames = 0;
      // Wait for arrival, including the contact section's reveal transition.
      // This also works in browsers without the scrollend event.
      const waitForArrival = () => {
        const rect = contactEmail.getBoundingClientRect();
        const visible = rect.top >= 0 && rect.bottom <= innerHeight;
        stableFrames = visible && previousTop !== null && Math.abs(rect.top - previousTop) < .5 ? stableFrames + 1 : 0;
        previousTop = rect.top;
        if (stableFrames >= 5) {
          contactFrame = 0;
          contactEmail.focus({ preventScroll: true });
          if (!reducedMotion.matches) contactJump = contactEmail.animate([
            { transform: 'translateY(0)', offset: 0 },
            { transform: 'translateY(-32px)', offset: .16, easing: 'ease-in' },
            { transform: 'translateY(0)', offset: .36, easing: 'ease-out' },
            { transform: 'translateY(-18px)', offset: .51, easing: 'ease-in' },
            { transform: 'translateY(0)', offset: .68, easing: 'ease-out' },
            { transform: 'translateY(-8px)', offset: .81, easing: 'ease-in' },
            { transform: 'translateY(0)', offset: 1 }
          ], { duration: 1100, easing: 'ease-out' });
        } else if (performance.now() - started < 5000) contactFrame = requestAnimationFrame(waitForArrival);
      };
      contactFrame = requestAnimationFrame(waitForArrival);
    });
  });
  window.addEventListener('wheel', cancelContactCue, { passive: true });
  window.addEventListener('touchmove', cancelContactCue, { passive: true });
  reducedMotion.addEventListener('change', cancelContactCue);

  if (context) {
    const pointer = { x: 0, y: 0, active: false };
    let points = [];
    let ripples = [];
    let columns = 0;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let enabled = false;
    let color = '';
    let baseOpacity = .12;
    const radius = 200;

    // Only render during input, spring settling, or a bounded click ripple.
    const schedule = () => {
      if (enabled && !frame) frame = requestAnimationFrame(draw);
    };
    const draw = (time) => {
      frame = 0;
      if (!enabled) return;
      const elapsed = lastTime ? Math.min(64, time - lastTime) : 16.7;
      const ease = 1 - Math.exp(-elapsed / 55);
      lastTime = time;
      let settling = false;
      ripples = ripples.filter((ripple) => time - ripple.time < ripple.duration);
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      context.strokeStyle = color;
      atmosphere.style.setProperty('--pointer-x', `${pointer.x}px`);
      atmosphere.style.setProperty('--pointer-y', `${pointer.y}px`);

      for (const point of points) {
        let targetX = 0;
        let targetY = 0;
        let influence = 0;
        if (pointer.active) {
          const dx = point.x - pointer.x;
          const dy = point.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < radius) {
            influence = (1 - distance / radius) ** 2;
            const push = influence * 30;
            targetX = dx / Math.max(1, distance) * push;
            targetY = dy / Math.max(1, distance) * push;
          }
        }
        for (const ripple of ripples) {
          const age = (time - ripple.time) / ripple.duration;
          const dx = point.x - ripple.x;
          const dy = point.y - ripple.y;
          const distance = Math.hypot(dx, dy);
          const wave = Math.exp(-(((distance - age * ripple.reach) / 48) ** 2)) * Math.min(1, (1 - age) * 5);
          targetX += dx / Math.max(1, distance) * wave * 16;
          targetY += dy / Math.max(1, distance) * wave * 16;
          influence = Math.max(influence, wave * .8);
        }
        point.dx += (targetX - point.dx) * ease;
        point.dy += (targetY - point.dy) * ease;
        point.light += (influence - point.light) * ease;
        if (Math.abs(targetX - point.dx) + Math.abs(targetY - point.dy) > .08 || Math.abs(influence - point.light) > .002) settling = true;
      }

      // Lattice neighbors keep the draw cost linear; no all-pairs particle search.
      context.lineWidth = .7;
      for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const neighbors = [];
        if (index % columns < columns - 1) neighbors.push(points[index + 1]);
        if (index + columns < points.length) neighbors.push(points[index + columns]);
        for (const neighbor of neighbors) {
          const strength = (point.light + neighbor.light) * .5;
          if (strength < .012) continue;
          context.globalAlpha = strength * .3;
          context.beginPath();
          context.moveTo(point.x + point.dx, point.y + point.dy);
          context.lineTo(neighbor.x + neighbor.dx, neighbor.y + neighbor.dy);
          context.stroke();
        }
      }
      // Batch the resting dots into one path, then highlight the activated nodes.
      context.globalAlpha = baseOpacity;
      context.beginPath();
      for (const point of points) {
        const x = point.x + point.dx;
        const y = point.y + point.dy;
        context.moveTo(x + .8, y);
        context.arc(x, y, .8, 0, Math.PI * 2);
      }
      context.fill();
      for (const point of points) {
        if (point.light < .015) continue;
        context.globalAlpha = point.light * .65;
        context.beginPath();
        context.arc(point.x + point.dx, point.y + point.dy, .8 + point.light * 1.5, 0, Math.PI * 2);
        context.fill();
      }
      if (settling || ripples.length) schedule();
      else lastTime = 0;
    };
    const readPalette = () => {
      color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      baseOpacity = document.documentElement.dataset.theme === 'light' ? .16 : .12;
      schedule();
    };
    const resize = () => {
      if (!enabled) return;
      width = innerWidth;
      height = innerHeight;
      // Bound both backing-store resolution and node count on large displays.
      const scale = Math.min(devicePixelRatio || 1, finePointer.matches ? 1.5 : 1);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const spacing = Math.max(44, Math.sqrt(width * height / (finePointer.matches ? 1100 : 650)));
      columns = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      points = Array.from({ length: columns * rows }, (_, index) => ({
        x: index % columns * spacing,
        y: Math.floor(index / columns) * spacing,
        dx: 0, dy: 0, light: 0
      }));
      lastTime = 0;
      schedule();
    };
    const leave = () => {
      pointer.active = false;
      atmosphere.classList.remove('is-tracking');
      schedule();
    };
    const syncAvailability = () => {
      enabled = !reducedMotion.matches && !document.hidden;
      if (enabled) {
        readPalette();
        resize();
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        pointer.active = false;
        ripples = [];
        atmosphere.classList.remove('is-tracking');
        // Release the backing store while hidden or under reduced motion.
        canvas.width = canvas.height = 1;
      }
    };
    window.addEventListener('pointermove', (event) => {
      if (!enabled || !finePointer.matches || event.pointerType === 'touch') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      atmosphere.classList.add('is-tracking');
      schedule();
    }, { passive: true });
    window.addEventListener('click', (event) => {
      if (!enabled || event.button !== 0 || event.detail === 0) return;
      // Reach every corner from the click, with room for the wave to fade out.
      const reach = Math.hypot(Math.max(event.clientX, width - event.clientX), Math.max(event.clientY, height - event.clientY)) + 120;
      ripples.push({ x: event.clientX, y: event.clientY, time: performance.now(), reach, duration: Math.max(1200, reach / .85) });
      ripples = ripples.slice(-4);
      schedule();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    window.addEventListener('resize', resize, { passive: true });
    reducedMotion.addEventListener('change', syncAvailability);
    finePointer.addEventListener('change', syncAvailability);
    document.addEventListener('visibilitychange', syncAvailability);
    new MutationObserver(readPalette).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    syncAvailability();
  }

  const updateTimeline = () => {
    scrollFrame = 0;
    if (!timeline || !items.length) return;
    const rect = timeline.getBoundingClientRect();
    const focusLine = innerHeight * .64;
    const markerOffset = parseFloat(getComputedStyle(items[0], '::before').top) + 5.5;
    const length = items.at(-1).offsetTop - items[0].offsetTop;
    const progress = Math.max(0, Math.min(1, (focusLine - rect.top - markerOffset) / Math.max(1, length)));
    const active = items.filter((item) => item.getBoundingClientRect().top + markerOffset <= focusLine).at(-1);
    timeline.style.setProperty('--timeline-length', `${length}px`);
    timeline.style.setProperty('--timeline-progress', progress.toFixed(4));
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
