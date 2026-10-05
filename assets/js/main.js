(() => {
  document.documentElement.classList.add('js');

  const isBlog = document.documentElement.hasAttribute('data-blog');
  const supportedLanguages = ['en', 'de', 'fr', 'es', 'nl', ...(isBlog ? ['hulk'] : [])];
  const localeNames = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', nl: 'nl-NL', hulk: 'en-US' };
  const languageInfo = {
    en: { name: 'English', code: 'EN', flag: '🇬🇧' },
    de: { name: 'Deutsch', code: 'DE', flag: '🇩🇪' },
    fr: { name: 'Français', code: 'FR', flag: '🇫🇷' },
    es: { name: 'Español', code: 'ES', flag: '🇪🇸' },
    nl: { name: 'Nederlands', code: 'NL', flag: '🇳🇱' },
    hulk: { name: 'Hulk Speak', code: 'HULK', icon: true }
  };
  const messages = {
    en: { language: 'Language', light: 'Switch to light theme', dark: 'Switch to dark theme', open: 'Open navigation', close: 'Close navigation', copied: 'Email address copied.', copyError: 'Copy unavailable. Use the email link above.' },
    de: { language: 'Sprache', light: 'Zum hellen Design wechseln', dark: 'Zum dunklen Design wechseln', open: 'Navigation öffnen', close: 'Navigation schließen', copied: 'E-Mail-Adresse kopiert.', copyError: 'Kopieren nicht verfügbar. Verwenden Sie den E-Mail-Link oben.' },
    fr: { language: 'Langue', light: 'Passer au thème clair', dark: 'Passer au thème sombre', open: 'Ouvrir la navigation', close: 'Fermer la navigation', copied: 'Adresse e-mail copiée.', copyError: 'Copie indisponible. Utilisez le lien e-mail ci-dessus.' },
    es: { language: 'Idioma', light: 'Cambiar al tema claro', dark: 'Cambiar al tema oscuro', open: 'Abrir la navegación', close: 'Cerrar la navegación', copied: 'Dirección de correo copiada.', copyError: 'No se puede copiar. Usa el enlace de correo de arriba.' },
    nl: { language: 'Taal', light: 'Schakel naar licht thema', dark: 'Schakel naar donker thema', open: 'Navigatie openen', close: 'Navigatie sluiten', copied: 'E-mailadres gekopieerd.', copyError: 'Kopiëren is niet beschikbaar. Gebruik de e-maillink hierboven.' },
    hulk: { language: 'Reading mode', light: 'Hulk want light', dark: 'Hulk want dark', open: 'Open menu', close: 'Close menu', copied: 'Hulk copied email.', copyError: 'Copy failed. Use email link.' }
  };
  const dictionaries = window.PORTFOLIO_I18N || {};
  const videoControlUpdates = [];
  let currentLanguage = supportedLanguages.includes(document.documentElement.dataset.language) ? document.documentElement.dataset.language : 'en';

  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  const localizedTextNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    const key = normalize(node.nodeValue);
    if (!key || parent?.closest('script, style, svg, code, pre, .theme-toggle, .menu-toggle, .language-picker, [data-no-i18n], [data-copy-status], [data-video-controls]')) continue;
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
  const hulkIcon = document.querySelector('[data-language-option="hulk"] img');
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
    if (themeMeta) themeMeta.content = theme === 'light' ? '#f5f6f5' : '#0c0c0c';
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

  let languageCloseTimer, languageOpenFrame;
  const openLanguageMenu = (focusSelected = false) => {
    if (!languagePicker || !languageMenu || !languageToggle) return;
    clearTimeout(languageCloseTimer);
    cancelAnimationFrame(languageOpenFrame);
    languageMenu.hidden = false;
    languageToggle.setAttribute('aria-expanded', 'true');
    languageOpenFrame = requestAnimationFrame(() => {
      languagePicker.classList.add('is-open');
      if (focusSelected) languageOptions.find((option) => option.getAttribute('aria-selected') === 'true')?.focus({ preventScroll: true });
    });
  };

  const closeLanguageMenu = (restoreFocus = false) => {
    if (!languagePicker || !languageMenu || !languageToggle) return;
    cancelAnimationFrame(languageOpenFrame);
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
    // Hulk Speak is an English reading style, not an ISO language code.
    document.documentElement.lang = currentLanguage === 'hulk' ? 'en' : currentLanguage;
    document.documentElement.dataset.language = currentLanguage;
    const selectedLanguage = languageInfo[currentLanguage];
    if (currentFlag) {
      if (selectedLanguage.icon && hulkIcon) currentFlag.replaceChildren(hulkIcon.cloneNode(true));
      else currentFlag.textContent = selectedLanguage.flag;
    }
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
    videoControlUpdates.forEach((update) => update());
    document.dispatchEvent(new CustomEvent('portfolio:languagechange'));
    if (persist) {
      try { localStorage.setItem(isBlog ? 'blog-language' : 'portfolio-language', currentLanguage); } catch {}
    }
  };

  applyLanguage(currentLanguage, false);
  languageToggle?.addEventListener('click', () => {
    if (languageToggle.getAttribute('aria-expanded') === 'true') closeLanguageMenu();
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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-article-animation]').forEach((figure) => {
    const img = figure.querySelector('img');
    const source = figure.querySelector('source');
    const toggle = figure.querySelector('[data-animation-toggle]');
    const updateAnimation = (paused) => {
      // The picture source also supplies a still image before JavaScript runs.
      source.media = paused ? 'all' : 'not all';
      img.src = paused ? img.dataset.stillSrc : img.dataset.animationSrc;
      toggle.setAttribute('aria-pressed', String(paused));
    };
    updateAnimation(reducedMotion.matches);
    toggle.hidden = false;
    toggle.addEventListener('click', () => updateAnimation(toggle.getAttribute('aria-pressed') !== 'true'));
    reducedMotion.addEventListener('change', (event) => updateAnimation(event.matches));
  });

  document.querySelectorAll('[data-article-video]').forEach((figure) => {
    const video = figure.querySelector('video');
    const controls = figure.querySelector('[data-video-controls]');
    const toggle = figure.querySelector('[data-video-toggle]');
    const fullscreen = figure.querySelector('[data-video-fullscreen]');
    if (!video || !controls || !toggle || !fullscreen) return;

    let visible = false;
    let manuallyPaused = false;
    let automaticPause = false;
    const text = (key) => dictionaries[currentLanguage]?.[key] || key;
    const updateControls = () => {
      toggle.textContent = text(video.paused ? 'Play animation' : 'Pause animation');
      toggle.setAttribute('aria-pressed', String(!video.paused));
      fullscreen.textContent = text(document.fullscreenElement === figure ? 'Exit full screen' : 'Full screen');
    };
    const pauseAutomatically = () => {
      if (video.paused) return;
      automaticPause = true;
      video.pause();
    };
    const updatePlayback = () => {
      if (visible && !document.hidden && !reducedMotion.matches && !manuallyPaused) {
        video.play().catch(updateControls);
      } else {
        pauseAutomatically();
      }
    };

    // Keep controls outside the picture so they cannot obscure the annotations.
    video.controls = false;
    video.muted = true;
    controls.hidden = false;
    fullscreen.hidden = !figure.requestFullscreen;
    videoControlUpdates.push(updateControls);
    updateControls();
    video.addEventListener('play', () => {
      manuallyPaused = false;
      updateControls();
    });
    video.addEventListener('pause', () => {
      if (!automaticPause) manuallyPaused = true;
      automaticPause = false;
      updateControls();
    });
    toggle.addEventListener('click', () => {
      if (video.paused) {
        manuallyPaused = false;
        video.play().catch(updateControls);
      } else {
        manuallyPaused = true;
        pauseAutomatically();
      }
    });
    fullscreen.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === figure) await document.exitFullscreen();
        else await figure.requestFullscreen();
      } catch {
        // Playback still works if the browser denies a fullscreen request.
      }
      updateControls();
    });
    document.addEventListener('fullscreenchange', updateControls);
    document.addEventListener('visibilitychange', updatePlayback);
    reducedMotion.addEventListener('change', updatePlayback);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= .25;
        updatePlayback();
      }, { threshold: [0, .25] });
      observer.observe(video);
    }
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
    const wasMenuOpen = menuButton?.getAttribute('aria-expanded') === 'true';
    closeMenu();
    if (wasMenuOpen) menuButton.focus({ preventScroll: true });
    closeLanguageMenu();
  });

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
