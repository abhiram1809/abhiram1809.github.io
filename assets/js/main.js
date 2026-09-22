(() => {
  document.documentElement.classList.add('js');

  const supportedLanguages = ['en', 'de', 'fr', 'es'];
  const localeNames = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
  const languageInfo = {
    en: { name: 'English', code: 'EN', flag: '🇬🇧' },
    de: { name: 'Deutsch', code: 'DE', flag: '🇩🇪' },
    fr: { name: 'Français', code: 'FR', flag: '🇫🇷' },
    es: { name: 'Español', code: 'ES', flag: '🇪🇸' }
  };
  const messages = {
    en: { language: 'Language', light: 'Switch to light theme', dark: 'Switch to dark theme', open: 'Open navigation', close: 'Close navigation', copied: 'Email address copied.', copyError: 'Copy unavailable. Use the email link above.' },
    de: { language: 'Sprache', light: 'Zum hellen Design wechseln', dark: 'Zum dunklen Design wechseln', open: 'Navigation öffnen', close: 'Navigation schließen', copied: 'E-Mail-Adresse kopiert.', copyError: 'Kopieren nicht verfügbar. Verwenden Sie den E-Mail-Link oben.' },
    fr: { language: 'Langue', light: 'Passer au thème clair', dark: 'Passer au thème sombre', open: 'Ouvrir la navigation', close: 'Fermer la navigation', copied: 'Adresse e-mail copiée.', copyError: 'Copie indisponible. Utilisez le lien e-mail ci-dessus.' },
    es: { language: 'Idioma', light: 'Cambiar al tema claro', dark: 'Cambiar al tema oscuro', open: 'Abrir la navegación', close: 'Cerrar la navegación', copied: 'Dirección de correo copiada.', copyError: 'No se puede copiar. Usa el enlace de correo de arriba.' }
  };
  const dictionaries = window.PORTFOLIO_I18N || {};
  let currentLanguage = supportedLanguages.includes(document.documentElement.dataset.language) ? document.documentElement.dataset.language : 'en';

  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  const localizedTextNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    const key = normalize(node.nodeValue);
    if (!key || parent?.closest('script, style, svg, code, pre, .theme-toggle, .menu-toggle, .language-picker, [data-copy-status]')) continue;
    localizedTextNodes.push({ node, key, original: node.nodeValue });
  }

  const localizedAttributes = [];
  document.querySelectorAll('[aria-label], [alt], [title]').forEach((element) => {
    ['aria-label', 'alt', 'title'].forEach((name) => {
      const value = element.getAttribute(name);
      if (value && !element.matches('[data-theme-toggle]') && !element.closest('[data-language-picker]')) localizedAttributes.push({ element, name, original: value });
    });
  });
  const metadata = [...document.querySelectorAll('meta[name="description"], meta[name="twitter:title"], meta[name="twitter:description"], meta[property="og:title"], meta[property="og:description"]')]
    .map((element) => ({ element, original: element.content }));
  const originalTitle = document.title;

  const themeButton = document.querySelector('[data-theme-toggle]');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const languagePicker = document.querySelector('[data-language-picker]');
  const languageToggle = document.querySelector('[data-language-toggle]');
  const languageMenu = document.querySelector('[data-language-menu]');
  const languageOptions = [...document.querySelectorAll('[data-language-option]')];
  const currentFlag = document.querySelector('[data-current-flag]');
  const currentLanguageName = document.querySelector('[data-current-language]');
  const currentLanguageCode = document.querySelector('[data-current-code]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const navLinks = [...document.querySelectorAll('[data-nav] a')];
  const copyButton = document.querySelector('[data-copy-email]');
  const copyStatus = document.querySelector('[data-copy-status]');

  const updateThemeControl = (theme) => {
    const actionLabel = theme === 'dark' ? messages[currentLanguage].light : messages[currentLanguage].dark;
    document.documentElement.dataset.theme = theme;
    if (themeMeta) themeMeta.content = theme === 'light' ? '#f5f2ea' : '#0b1020';
    if (!themeButton) return;
    themeButton.setAttribute('aria-label', actionLabel);
    themeButton.setAttribute('title', actionLabel);
    const hiddenLabel = themeButton.querySelector('.sr-only');
    if (hiddenLabel) hiddenLabel.textContent = actionLabel;
  };

  const updateMenuControl = () => {
    if (!menuButton) return;
    const label = menuButton.getAttribute('aria-expanded') === 'true' ? messages[currentLanguage].close : messages[currentLanguage].open;
    menuButton.setAttribute('aria-label', label);
    const hiddenLabel = menuButton.querySelector('.sr-only');
    if (hiddenLabel) hiddenLabel.textContent = label;
  };

  let languageCloseTimer;
  const openLanguageMenu = (focusSelected = false) => {
    if (!languagePicker || !languageMenu || !languageToggle) return;
    clearTimeout(languageCloseTimer);
    languageMenu.hidden = false;
    languageToggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => languagePicker.classList.add('is-open'));
    if (focusSelected) {
      requestAnimationFrame(() => languageOptions.find((option) => option.getAttribute('aria-selected') === 'true')?.focus({ preventScroll: true }));
    }
  };

  const closeLanguageMenu = (restoreFocus = false) => {
    if (!languagePicker || !languageMenu || !languageToggle) return;
    languagePicker.classList.remove('is-open');
    languageToggle.setAttribute('aria-expanded', 'false');
    clearTimeout(languageCloseTimer);
    languageCloseTimer = setTimeout(() => {
      if (!languagePicker.classList.contains('is-open')) languageMenu.hidden = true;
    }, 170);
    if (restoreFocus) languageToggle.focus({ preventScroll: true });
  };

  const applyLanguage = (language, persist = true) => {
    currentLanguage = supportedLanguages.includes(language) ? language : 'en';
    const dictionary = dictionaries[currentLanguage] || {};
    localizedTextNodes.forEach(({ node, key, original }) => {
      if (currentLanguage === 'en' || !dictionary[key]) {
        node.nodeValue = original;
        return;
      }
      const leading = original.match(/^\s*/)?.[0] || '';
      const trailing = original.match(/\s*$/)?.[0] || '';
      node.nodeValue = `${leading}${dictionary[key]}${trailing}`;
    });
    localizedAttributes.forEach(({ element, name, original }) => element.setAttribute(name, currentLanguage === 'en' ? original : (dictionary[original] || original)));
    metadata.forEach(({ element, original }) => { element.content = currentLanguage === 'en' ? original : (dictionary[original] || original); });
    document.title = currentLanguage === 'en' ? originalTitle : (dictionary[originalTitle] || originalTitle);
    document.documentElement.lang = currentLanguage;
    document.documentElement.dataset.language = currentLanguage;
    const selectedLanguage = languageInfo[currentLanguage];
    if (currentFlag) currentFlag.textContent = selectedLanguage.flag;
    if (currentLanguageName) currentLanguageName.textContent = selectedLanguage.name;
    if (currentLanguageCode) currentLanguageCode.textContent = selectedLanguage.code;
    if (languageToggle) languageToggle.setAttribute('aria-label', `${messages[currentLanguage].language}: ${selectedLanguage.name}`);
    if (languageMenu) languageMenu.setAttribute('aria-label', messages[currentLanguage].language);
    languageOptions.forEach((option) => option.setAttribute('aria-selected', String(option.dataset.languageOption === currentLanguage)));
    document.querySelectorAll('time[datetime]').forEach((time) => {
      const date = new Date(`${time.dateTime}T12:00:00Z`);
      if (!Number.isNaN(date.getTime())) time.textContent = new Intl.DateTimeFormat(localeNames[currentLanguage], { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
    });
    if (copyStatus) copyStatus.textContent = '';
    updateThemeControl(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    updateMenuControl();
    if (persist) {
      try { localStorage.setItem('portfolio-language', currentLanguage); } catch {}
    }
  };

  applyLanguage(currentLanguage, false);
  languageToggle?.addEventListener('click', () => {
    if (languagePicker?.classList.contains('is-open')) closeLanguageMenu();
    else openLanguageMenu();
  });
  languageToggle?.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    openLanguageMenu(true);
  });
  languageOptions.forEach((option) => option.addEventListener('click', () => {
    applyLanguage(option.dataset.languageOption);
    closeLanguageMenu(true);
  }));
  languageMenu?.addEventListener('keydown', (event) => {
    if (['Enter', ' '].includes(event.key) && document.activeElement?.matches('[data-language-option]')) {
      event.preventDefault();
      document.activeElement.click();
      return;
    }
    const currentIndex = languageOptions.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % languageOptions.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + languageOptions.length) % languageOptions.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = languageOptions.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      closeLanguageMenu(true);
      return;
    } else return;
    event.preventDefault();
    languageOptions[nextIndex]?.focus({ preventScroll: true });
  });
  document.addEventListener('click', (event) => {
    if (languagePicker && !languagePicker.contains(event.target)) closeLanguageMenu();
  });
  themeButton?.addEventListener('click', () => {
    closeLanguageMenu();
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    updateThemeControl(theme);
    try { localStorage.setItem('portfolio-theme', theme); } catch {}
  });

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    updateMenuControl();
  };
  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    nav?.classList.toggle('is-open', !isOpen);
    updateMenuControl();
  });
  navLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMenu();
    closeLanguageMenu();
  });

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

  copyButton?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copyButton.dataset.email); copyStatus.textContent = messages[currentLanguage].copied; }
    catch { copyStatus.textContent = messages[currentLanguage].copyError; }
  });
  const year = document.querySelector('[data-current-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
