/* Original vanilla-JS implementations inspired by Rare UI's Gooey Nav,
 * Scroll Progress, and Code Block. References and credit: /README.md. */
(() => {
  const copy = {
    en: { contents: 'On this page', intro: 'Introduction', copy: 'Copy', copied: 'Copied', error: 'Select and copy the text below.', terminal: 'Terminal', prompt: 'Agent prompt', equation: 'Equation', snippet: 'Code snippet' },
    de: { contents: 'Auf dieser Seite', intro: 'Einleitung', copy: 'Kopieren', copied: 'Kopiert', error: 'Text unten auswählen und kopieren.', terminal: 'Terminal', prompt: 'Agent-Prompt', equation: 'Gleichung', snippet: 'Codebeispiel' },
    fr: { contents: 'Sur cette page', intro: 'Introduction', copy: 'Copier', copied: 'Copié', error: 'Sélectionnez et copiez le texte ci-dessous.', terminal: 'Terminal', prompt: 'Consigne pour l’agent', equation: 'Équation', snippet: 'Extrait de code' },
    es: { contents: 'En esta página', intro: 'Introducción', copy: 'Copiar', copied: 'Copiado', error: 'Selecciona y copia el texto de abajo.', terminal: 'Terminal', prompt: 'Instrucción para el agente', equation: 'Ecuación', snippet: 'Fragmento de código' },
    nl: { contents: 'Op deze pagina', intro: 'Inleiding', copy: 'Kopiëren', copied: 'Gekopieerd', error: 'Selecteer en kopieer de tekst hieronder.', terminal: 'Terminal', prompt: 'Agentprompt', equation: 'Vergelijking', snippet: 'Codefragment' }
  };
  const text = () => copy[document.documentElement.lang] || copy.en;
  const header = document.querySelector('[data-header]');
  const navLinks = [...document.querySelectorAll('[data-nav] a')];
  const pageSections = [...document.querySelectorAll('main > section[id]')];
  const article = document.querySelector('.article-body');
  const headings = article ? [...article.querySelectorAll('h2[id]')] : [];
  const updates = [];
  let reader, readerToggle, readerLabel, readerRing, readerPanel;
  let readerLinks = [];

  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    node.className = className;
    if (content) node.textContent = content;
    return node;
  };

  // A disclosure with ordinary links keeps tab order and browser hash navigation.
  if (headings.length) {
    reader = element('aside', 'reading-nav');
    readerPanel = element('nav', 'reading-panel');
    readerPanel.id = 'reading-sections';
    readerPanel.hidden = true;
    const title = element('p', 'reading-title');
    readerPanel.append(title);
    const list = element('ol', 'reading-list');
    const targets = [document.querySelector('.article-hero'), ...headings];
    const entries = targets.map((target, index) => {
      const item = element('li', '');
      const link = element('a', 'reading-link');
      link.href = `#${target.id}`;
      const number = element('span', 'reading-number', String(index).padStart(2, '0'));
      number.setAttribute('aria-hidden', 'true');
      const label = element('span', '');
      link.append(number, label);
      item.append(link);
      list.append(item);
      return { target, link, label };
    });
    readerLinks = entries;
    readerPanel.append(list);
    readerToggle = element('button', 'reading-toggle');
    readerToggle.type = 'button';
    readerToggle.setAttribute('aria-expanded', 'false');
    readerToggle.setAttribute('aria-controls', readerPanel.id);
    const ring = element('span', 'reading-ring');
    ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<svg viewBox="0 0 32 32" fill="none"><circle class="reading-ring-track" cx="16" cy="16" r="12"/><circle class="reading-ring-fill" cx="16" cy="16" r="12" pathLength="100"/></svg>';
    readerRing = ring.querySelector('.reading-ring-fill');
    const labelGroup = element('span', 'reading-copy');
    const caption = element('span', 'reading-caption');
    readerLabel = element('span', 'reading-current');
    labelGroup.append(caption, readerLabel);
    const chevron = element('span', 'reading-chevron', '⌃');
    chevron.setAttribute('aria-hidden', 'true');
    readerToggle.append(ring, labelGroup, chevron);
    reader.append(readerPanel, readerToggle);
    document.body.append(reader);
    document.body.classList.add('has-reading-nav');

    const setOpen = (open, restoreFocus = false) => {
      readerToggle.setAttribute('aria-expanded', String(open));
      readerPanel.hidden = !open;
      if (restoreFocus) readerToggle.focus({ preventScroll: true });
    };
    readerToggle.addEventListener('click', () => {
      const open = readerPanel.hidden;
      setOpen(open);
      if (open) (entries.find(({ link }) => link.hasAttribute('aria-current')) || entries[0]).link.focus({ preventScroll: true });
    });
    readerPanel.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      setOpen(false);
      const target = entries.find((entry) => entry.link === link).target;
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !readerPanel.hidden) {
        event.preventDefault();
        setOpen(false, true);
      }
    });
    document.addEventListener('click', (event) => {
      if (!reader.contains(event.target)) setOpen(false);
    });
    reader.addEventListener('focusout', (event) => {
      if (!reader.contains(event.relatedTarget)) setOpen(false);
    });
    updates.push(() => {
      reader.setAttribute('aria-label', text().contents);
      readerPanel.setAttribute('aria-label', text().contents);
      readerToggle.setAttribute('aria-label', text().contents);
      title.textContent = caption.textContent = text().contents;
      entries.forEach(({ target, label }, index) => {
        label.textContent = index ? target.textContent : text().intro;
      });
    });
  }

  document.querySelectorAll('.article-code').forEach((pre, index) => {
    const code = pre.querySelector('code');
    if (!code) return;
    const frame = element('div', 'code-frame');
    const toolbar = element('div', 'code-toolbar');
    const title = element('span', 'code-title');
    const marker = element('span', 'code-marker', pre.dataset.kind === 'terminal' ? '>_' : pre.dataset.kind === 'equation' ? 'ƒ' : '↳');
    marker.setAttribute('aria-hidden', 'true');
    const label = element('span', '');
    title.id = `code-title-${index}`;
    title.append(marker, label);
    const button = element('button', 'code-copy');
    button.type = 'button';
    button.setAttribute('aria-describedby', title.id);
    const status = element('span', 'code-status');
    status.setAttribute('role', 'status');
    toolbar.append(title, button, status);
    pre.before(frame);
    frame.append(toolbar, pre);
    pre.tabIndex = 0;
    if (!pre.hasAttribute('aria-label')) pre.setAttribute('aria-labelledby', title.id);
    let state = 'copy';
    let timer;
    let pending = false;
    const update = () => {
      label.textContent = text()[pre.dataset.kind] || text().snippet;
      button.textContent = `${state === 'copied' ? '✓ ' : ''}${text()[state]}`;
      if (status.textContent) status.textContent = state === 'copied' ? text().copied : text().error;
    };
    updates.push(update);
    button.addEventListener('click', async () => {
      if (pending) return;
      pending = true;
      clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(code.textContent);
        state = 'copied';
        button.classList.add('is-copied');
        status.textContent = text().copied;
      } catch {
        state = 'copy';
        button.classList.remove('is-copied');
        status.textContent = text().error;
      } finally {
        pending = false;
      }
      update();
      timer = setTimeout(() => {
        state = 'copy';
        button.classList.remove('is-copied');
        status.textContent = '';
        update();
      }, 2500);
    });
  });

  // Use document order so the active item clears at the hero and in unlisted sections.
  const updatePosition = () => {
    const offset = (header?.getBoundingClientRect().height || 0) + 28;
    if (pageSections.length) {
      const active = pageSections.filter((section) => section.getBoundingClientRect().top <= offset).at(-1);
      const href = active?.id === 'writing' ? 'blogs/' : `#${active?.id}`;
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === href) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    if (!reader) return;
    const active = readerLinks.filter(({ target }) => target.getBoundingClientRect().top <= offset).at(-1) || readerLinks[0];
    readerLinks.forEach(({ link }) => {
      if (link === active.link) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    readerLabel.textContent = active.label.textContent;
    const start = article.getBoundingClientRect().top + window.scrollY - offset;
    const end = article.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
    const progress = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, end - start)));
    readerRing.style.strokeDashoffset = String(100 * (1 - progress));
  };
  let scheduled = false;
  const schedulePosition = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      updatePosition();
    });
  };
  const updateLanguage = () => {
    updates.forEach((update) => update());
    schedulePosition();
  };
  document.addEventListener('portfolio:languagechange', updateLanguage);
  window.addEventListener('scroll', schedulePosition, { passive: true });
  window.addEventListener('resize', schedulePosition);
  window.addEventListener('pageshow', schedulePosition);
  if ('ResizeObserver' in window) new ResizeObserver(schedulePosition).observe(document.body);
  updateLanguage();
})();
