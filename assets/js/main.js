(() => {
  document.documentElement.classList.add('js');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const updateThemeControl = (theme) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const actionLabel = `Switch to ${nextTheme} theme`;
    document.documentElement.dataset.theme = theme;
    if (themeMeta) themeMeta.content = theme === 'light' ? '#f5f2ea' : '#0b1020';
    if (!themeButton) return;
    themeButton.setAttribute('aria-label', actionLabel);
    themeButton.setAttribute('title', actionLabel);
    themeButton.querySelector('.sr-only').textContent = actionLabel;
  };
  updateThemeControl(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  themeButton?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    updateThemeControl(theme);
    try { localStorage.setItem('portfolio-theme', theme); } catch {}
  });
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const navLinks = [...document.querySelectorAll('[data-nav] a')];
  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('.sr-only').textContent = 'Open navigation';
    nav.classList.remove('is-open');
  };
  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.querySelector('.sr-only').textContent = isOpen ? 'Open navigation' : 'Close navigation';
    nav?.classList.toggle('is-open', !isOpen);
  });
  navLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  const sectionLinks = navLinks.filter((link) => {
    const href = link.getAttribute('href');
    return href?.startsWith('#') && href.length > 1;
  });
  const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }), { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  sections.forEach((section) => navObserver.observe(section));
  const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));
  const copyButton = document.querySelector('[data-copy-email]');
  const copyStatus = document.querySelector('[data-copy-status]');
  copyButton?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copyButton.dataset.email); copyStatus.textContent = 'Email address copied.'; }
    catch { copyStatus.textContent = 'Copy unavailable. Use the email link above.'; }
  });
  const year = document.querySelector('[data-current-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
