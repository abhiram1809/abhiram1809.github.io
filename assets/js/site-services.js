(() => {
  const api = 'https://portfolio-api.sharmaabhiram1809.workers.dev';
  const siteKey = '0x4AAAAAAGL8jQx2ipfGd0RF';
  const domains = new Set(['abhiramsharma.com', 'www.abhiramsharma.com']);
  if (!domains.has(location.hostname)) return;

  const labels = [
    'title', 'name', 'email', 'message', 'submit', 'views',
    'sending', 'sent', 'verify', 'invalid', 'limit', 'failed'
  ];
  const strings = {
    en: ['Send a message', 'Your name', 'Your email', 'Message', 'Send message', 'Page views',
      'Sending…', 'Message sent.', 'Complete the verification and try again.', 'Check your name, email and message.', 'Try again in a little while or email me directly.', 'Could not send. Try again or email me directly.'],
    de: ['Nachricht schreiben', 'Dein Name', 'Deine E-Mail-Adresse', 'Nachricht', 'Nachricht senden', 'Seitenaufrufe',
      'Wird gesendet…', 'Nachricht gesendet.', 'Schließe die Überprüfung ab und versuche es erneut.', 'Prüfe deinen Namen, deine E-Mail-Adresse und deine Nachricht.', 'Versuche es später erneut oder schreib mir direkt eine E-Mail.', 'Das Senden ist fehlgeschlagen. Versuche es erneut oder schreib mir direkt eine E-Mail.'],
    fr: ['Envoyer un message', 'Votre nom', 'Votre adresse e-mail', 'Message', 'Envoyer le message', 'Pages vues',
      'Envoi en cours…', 'Message envoyé.', 'Terminez la vérification, puis réessayez.', 'Vérifiez votre nom, votre adresse e-mail et votre message.', 'Réessayez dans un instant ou écrivez-moi directement.', 'Échec de l’envoi. Réessayez ou écrivez-moi directement.'],
    es: ['Enviar un mensaje', 'Tu nombre', 'Tu correo electrónico', 'Mensaje', 'Enviar mensaje', 'Páginas vistas',
      'Enviando…', 'Mensaje enviado.', 'Completa la verificación y vuelve a intentarlo.', 'Revisa tu nombre, correo y mensaje.', 'Inténtalo más tarde o escríbeme directamente.', 'No se pudo enviar. Inténtalo de nuevo o escríbeme directamente.'],
    nl: ['Stuur een bericht', 'Je naam', 'Je e-mailadres', 'Bericht', 'Bericht versturen', 'Paginaweergaven',
      'Bezig met versturen…', 'Bericht verstuurd.', 'Voltooi de verificatie en probeer het opnieuw.', 'Controleer je naam, e-mailadres en bericht.', 'Probeer het straks opnieuw of mail me rechtstreeks.', 'Versturen mislukt. Probeer het opnieuw of mail me rechtstreeks.']
  };
  const copy = (key) => (strings[document.documentElement.lang] || strings.en)[labels.indexOf(key)];
  const visit = document.querySelector('[data-visit-total]');
  const form = document.querySelector('[data-contact-form]');
  let total;
  let messageKey;

  function render() {
    if (visit && Number.isSafeInteger(total)) {
      visit.querySelector('[data-visit-label]').textContent = copy('views');
      visit.querySelector('[data-visit-count]').textContent = new Intl.NumberFormat(document.documentElement.lang).format(total);
      visit.hidden = false;
    }
    if (form) {
      form.querySelectorAll('[data-contact-label]').forEach((label) => {
        label.textContent = copy(label.dataset.contactLabel);
      });
      form.querySelector('[data-contact-status]').textContent = messageKey ? copy(messageKey) : '';
    }
  }

  const request = (path, options = {}) => fetch(api + path, {
    cache: 'no-store',
    credentials: 'omit',
    signal: AbortSignal.timeout(15000),
    ...options
  });

  function recordVisit() {
    request('/visits', { method: 'POST' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (Number.isSafeInteger(data?.total)) {
          total = Math.max(total ?? 0, data.total);
          render();
        }
      })
      .catch(() => {});
  }

  recordVisit();
  addEventListener('pageshow', (event) => {
    if (event.persisted) recordVisit();
  });
  document.addEventListener('portfolio:languagechange', render);

  if (!form || location.protocol !== 'https:') return;
  const sendButton = form.querySelector('[type="submit"]');
  const challenge = form.querySelector('[data-contact-challenge]');
  let widget;
  let token;

  function showStatus(key) {
    messageKey = key;
    render();
  }

  async function initializeContact() {
    const status = await request('/contact');
    if (!status.ok || !(await status.json()).available) return;
    form.hidden = false;
    render();
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.addEventListener('error', () => showStatus('failed'), { once: true });
    script.addEventListener('load', () => {
      try {
        widget = window.turnstile.render(challenge, {
          sitekey: siteKey,
          action: 'portfolio-contact',
          appearance: 'interaction-only',
          callback: (value) => { token = value; },
          'expired-callback': () => { token = undefined; },
          'error-callback': () => { token = undefined; }
        });
      } catch {
        showStatus('failed');
      }
    }, { once: true });
    document.head.append(script);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sendButton.disabled) return;
    if (!token) {
      showStatus('verify');
      return;
    }
    sendButton.disabled = true;
    showStatus('sending');
    const fields = Object.fromEntries(new FormData(form));
    try {
      const response = await request('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, token })
      });
      const result = await response.json();
      if (response.ok && result.sent === true) {
        form.reset();
        showStatus('sent');
      } else if (response.status === 429) {
        showStatus('limit');
      } else {
        showStatus(({ invalid: 'invalid', verification: 'verify' })[result.error] || 'failed');
      }
    } catch {
      showStatus('failed');
    } finally {
      sendButton.disabled = false;
      token = undefined;
      if (widget !== undefined) window.turnstile.reset(widget);
    }
  });

  initializeContact().catch(() => {});
})();
