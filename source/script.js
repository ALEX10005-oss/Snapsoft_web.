(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const glow = $('.cursor-glow');
  if (glow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('pointermove', event => { glow.style.left = `${event.clientX}px`; glow.style.top = `${event.clientY}px`; }, { passive: true });
  }

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }), { threshold: .12 }) : null;
  $$('.reveal').forEach(el => revealObserver ? revealObserver.observe(el) : el.classList.add('visible'));

  $$('.stats [data-count]').forEach(el => {
    let done = false;
    const animate = () => { if (done) return; done = true; const target = Number(el.dataset.count); let start = 0; const timer = setInterval(() => { start = Math.min(target, start + Math.max(1, Math.ceil(target / 40))); el.textContent = start; if (start >= target) clearInterval(timer); }, 30); };
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && animate()), { threshold: .6 }).observe(el); else animate();
  });

  const menuBtn = $('.menu-btn'); const navLinks = $('.nav-links');
  if (menuBtn && navLinks) menuBtn.addEventListener('click', () => { const open = navLinks.classList.toggle('menu-open'); menuBtn.setAttribute('aria-expanded', String(open)); });
  $$('.nav-links a').forEach(link => link.addEventListener('click', () => navLinks?.classList.remove('menu-open')));

  const canvas = $('#particles');
  if (canvas && canvas.getContext && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d'); let w = 0, h = 0, dpr = 1, particles = [];
    const resize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = `${w}px`; canvas.style.height = `${h}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); particles = Array.from({ length: Math.min(95, Math.floor(w / 14)) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16, r: Math.random() * 1.7 + .4 })); };
    const animate = () => { ctx.clearRect(0, 0, w, h); particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(160,175,255,.38)'; ctx.fill(); particles.slice(i + 1).forEach(q => { const dist = Math.hypot(p.x - q.x, p.y - q.y); if (dist < 115) { ctx.strokeStyle = `rgba(100,110,255,${(1 - dist / 115) * .075})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }); }); requestAnimationFrame(animate); };
    resize(); animate(); addEventListener('resize', resize);
  }

  const form = $('#request-form');
  if (!form) return;
  const steps = $$('.form-step', form); const indicators = $$('[data-step-indicator]'); const progress = $('.progress-track'); const progressBar = $('#progress-bar'); const status = $('#step-status'); const percent = $('#progress-percent'); const next = $('#next-btn'); const back = $('#back-btn'); const feedback = $('#form-feedback'); const summary = $('#request-summary'); let current = 1;
  const fields = { 1: [$('#full-name'), $('#email'), $('#phone')], 2: [$('#service'), $('#details')], 3: [$('#consent')] };
  const messageFor = input => input.type === 'email' ? 'Escribe un correo válido.' : input.type === 'checkbox' ? 'Necesitas aceptar para continuar.' : input.tagName === 'SELECT' ? 'Selecciona una opción.' : input.minLength && input.value.trim().length < input.minLength ? `Escribe al menos ${input.minLength} caracteres.` : 'Este campo es obligatorio.';
  const valid = input => { const ok = input.checkValidity() && (input.type !== 'text' || input.value.trim().length >= input.minLength); input.classList.toggle('has-error', !ok); const error = $(`#${input.getAttribute('aria-describedby')}`); if (error) error.textContent = ok ? '' : messageFor(input); return ok; };
  const validateStep = step => { const invalid = fields[step].filter(input => !valid(input)); if (invalid[0]) { invalid[0].focus(); feedback.textContent = 'Revisa los campos marcados para continuar.'; return false; } feedback.textContent = ''; return true; };
  const updateSummary = () => { const values = Object.fromEntries(new FormData(form)); summary.innerHTML = `<div><b>Nombre</b><span>${escapeHtml(values.name)}</span></div><div><b>Contacto</b><span>${escapeHtml(values.email)} · ${escapeHtml(values.phone)}</span></div><div><b>Servicio</b><span>${escapeHtml(values.service)}</span></div><div><b>Detalle</b><span>${escapeHtml(values.details)}</span></div>`; };
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const render = () => { steps.forEach((step, i) => { const active = i + 1 === current; step.hidden = !active; step.classList.toggle('is-active', active); }); indicators.forEach((indicator, i) => { indicator.classList.toggle('is-active', i + 1 === current); indicator.classList.toggle('is-complete', i + 1 < current); }); const value = Math.round((current / 3) * 100); progressBar.style.width = `${value}%`; progress?.setAttribute('aria-valuenow', String(current)); status.textContent = `Paso ${current} de 3`; percent.textContent = `${value}%`; back.hidden = current === 1; next.textContent = current === 3 ? 'Enviar solicitud' : 'Continuar'; if (current === 3) updateSummary(); };
  $$( 'input, select, textarea', form).forEach(input => { input.addEventListener('input', () => valid(input)); input.addEventListener('blur', () => { if (input.value || input.required) valid(input); }); });
  next.addEventListener('click', () => { if (!validateStep(current)) return; if (current < 3) { current += 1; render(); $('.form-step.is-active', form)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } else { next.disabled = true; next.textContent = 'Enviando…'; feedback.textContent = 'Preparando tu solicitud…'; setTimeout(() => { feedback.textContent = 'Solicitud lista. Te contactaremos por WhatsApp o correo en breve.'; next.textContent = 'Solicitud enviada'; next.classList.add('is-success'); }, 700); } });
  back.addEventListener('click', () => { if (current > 1) { current -= 1; feedback.textContent = ''; render(); } });
  form.addEventListener('submit', event => event.preventDefault()); render();
})();
