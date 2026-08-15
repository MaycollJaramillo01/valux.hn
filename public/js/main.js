/* VALUX — main.js
   - Mobile nav toggle
   - Language toggle (ES / EN) via data-es / data-en attributes
   - Scroll-reveal animations
   - Newsletter & contact form stubs
*/

(function () {
    'use strict';

    // Local file previews cannot use Apache rewrites. Keep clean slugs in source,
    // but point clicks to the matching .html files only when opened with file://.
    if (window.location.protocol === 'file:') {
        const localRoutes = {
            'index': 'index.html',
            'que-es': 'que-es.html',
            'como-funciona': 'como-funciona.html',
            'miembros': 'miembros.html',
            'proyectos': 'proyectos.html',
            'podcast': 'podcast.html',
            'aliados': 'aliados.html',
            'blog': 'blog.html',
            'contacto': 'contacto.html',
            'apoya': 'apoya.html'
        };

        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.includes(':')) return;
            if (href === '/') {
                link.setAttribute('href', 'index.html');
                return;
            }
            const match = href.match(/^\/?([^?#/]+)(.*)$/);
            if (!match || !localRoutes[match[1]]) return;
            link.setAttribute('href', localRoutes[match[1]] + (match[2] || ''));
        });
    }

    // ---------- Mobile nav ----------
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    if (navToggle && navList) {
        navToggle.addEventListener('click', () => {
            navList.classList.toggle('open');
        });
        navList.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => navList.classList.remove('open'));
        });
    }

    // ---------- Language toggle ----------
    const LANG_KEY = 'valux_lang';
    const initialLang = localStorage.getItem(LANG_KEY) || 'es';

    function setLang(lang) {
        document.documentElement.setAttribute('lang', lang);
        document.querySelectorAll('[data-es]').forEach(el => {
            const txt = el.getAttribute(lang === 'es' ? 'data-es' : 'data-en');
            if (txt !== null) el.textContent = txt;
        });
        document.querySelectorAll('[data-es-placeholder]').forEach(el => {
            const txt = el.getAttribute(lang === 'es' ? 'data-es-placeholder' : 'data-en-placeholder');
            if (txt !== null) el.setAttribute('placeholder', txt);
        });
        document.querySelectorAll('.lang-toggle button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        localStorage.setItem(LANG_KEY, lang);
    }

    document.querySelectorAll('.lang-toggle button').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
    setLang(initialLang);

    // ---------- Video players ----------
    // Browsers block audible autoplay until the user interacts with the page.
    // We try low-volume autoplay first; if it is blocked, we keep playback muted
    // and expose a low-audio control on each player.
    const LOW_VIDEO_VOLUME = 0.16;
    const videos = Array.from(document.querySelectorAll('video'));
    let audibleVideo = null;

    function getCurrentLang() {
        return document.documentElement.getAttribute('lang') || localStorage.getItem(LANG_KEY) || 'es';
    }

    function setToggleText(button) {
        if (!button) return;
        button.textContent = button.getAttribute(getCurrentLang() === 'en' ? 'data-en' : 'data-es');
    }

    function getVideoShell(video) {
        return video.closest('.video-wrap, .video-slab, .video-portrait, .editorial-hero, .hero') || video.parentElement;
    }

    function markVideoState(video) {
        const shell = getVideoShell(video);
        if (!shell) return;
        const isAudible = !video.muted && video.volume > 0;
        shell.classList.toggle('is-audible', isAudible);
        shell.classList.toggle('is-muted', !isAudible);
        const toggle = shell.querySelector('.video-sound-toggle');
        if (toggle) {
            toggle.setAttribute('data-es', isAudible ? 'Audio bajo' : 'Activar audio');
            toggle.setAttribute('data-en', isAudible ? 'Low audio' : 'Enable audio');
            toggle.setAttribute('aria-label', isAudible ? 'Silenciar video' : 'Activar audio bajo');
            setToggleText(toggle);
        }
    }

    function muteOtherVideos(current) {
        videos.forEach(video => {
            if (video === current) return;
            video.muted = true;
            video.setAttribute('muted', '');
            markVideoState(video);
        });
    }

    function tryPlay(video, audible) {
        video.volume = LOW_VIDEO_VOLUME;
        if (audible) {
            muteOtherVideos(video);
            video.defaultMuted = false;
            video.muted = false;
            video.removeAttribute('muted');
        } else {
            video.defaultMuted = true;
            video.muted = true;
            video.setAttribute('muted', '');
        }

        markVideoState(video);

        const playAttempt = video.play();
        if (!playAttempt || typeof playAttempt.catch !== 'function') return;

        playAttempt.then(() => {
            if (audible && !video.muted) audibleVideo = video;
            markVideoState(video);
        }).catch(() => {
            if (!audible) return;
            video.defaultMuted = true;
            video.muted = true;
            video.setAttribute('muted', '');
            const shell = getVideoShell(video);
            if (shell) shell.classList.add('is-audio-blocked');
            markVideoState(video);
            const mutedAttempt = video.play();
            if (mutedAttempt && typeof mutedAttempt.catch === 'function') mutedAttempt.catch(() => {});
        });
    }

    function activateLowAudio(video) {
        muteOtherVideos(video);
        video.volume = LOW_VIDEO_VOLUME;
        video.defaultMuted = false;
        video.muted = false;
        video.removeAttribute('muted');
        audibleVideo = video;

        const shell = getVideoShell(video);
        if (shell) shell.classList.remove('is-audio-blocked');
        markVideoState(video);

        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === 'function') playAttempt.catch(() => {});
    }

    if (videos.length) {
        videos.forEach((video, index) => {
            const shell = getVideoShell(video);
            if (shell) shell.classList.add('video-player-shell');

            video.autoplay = true;
            video.setAttribute('autoplay', '');
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.preload = 'auto';
            video.volume = LOW_VIDEO_VOLUME;
            video.defaultMuted = false;

            if (!video.classList.contains('hero-video')) {
                video.controls = true;
                video.setAttribute('controls', '');
            }

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'video-sound-toggle';
            toggle.setAttribute('data-es', 'Activar audio');
            toggle.setAttribute('data-en', 'Enable audio');
            toggle.setAttribute('aria-label', 'Activar audio bajo');
            setToggleText(toggle);
            toggle.addEventListener('click', () => {
                if (!video.muted && video.volume > 0) {
                    video.muted = true;
                    video.setAttribute('muted', '');
                    markVideoState(video);
                    return;
                }
                activateLowAudio(video);
            });

            if (shell && !shell.querySelector('.video-sound-toggle')) {
                shell.appendChild(toggle);
            }

            tryPlay(video, index === 0);
        });

        if ('IntersectionObserver' in window) {
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        tryPlay(video, audibleVideo === video);
                    } else if (video !== audibleVideo) {
                        video.pause();
                    }
                });
            }, { threshold: 0.35 });

            videos.forEach(video => videoObserver.observe(video));
        }
    }

    // ---------- Scroll reveal ----------
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('in'));
    }

    // ---------- Newsletter ----------
    document.querySelectorAll('.newsletter').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = form.querySelector('input[type="email"]');
            if (!input || !input.value) return;
            try {
                const res = await fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: input.value }),
                });
                form.innerHTML = res.ok
                    ? '<p style="color:#fff;font-weight:600;margin:0;">Listo. Te avisamos con cada publicación nueva del blog.</p>'
                    : '<p style="color:#fff;font-weight:600;margin:0;">No se pudo guardar el correo. Intentá de nuevo.</p>';
            } catch {
                form.innerHTML = '<p style="color:#fff;font-weight:600;margin:0;">No se pudo guardar el correo. Intentá de nuevo.</p>';
            }
        });
    });

    // ---------- Contact form (stub) ----------
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const status = contactForm.querySelector('.form-status');
            if (status) {
                status.textContent = '¡Gracias! Te responderemos en menos de 48 horas.';
                status.style.color = 'var(--royal)';
            }
            contactForm.reset();
        });
    }

    // ---------- Header shadow on scroll ----------
    const header = document.querySelector('.site-header');
    if (header) {
        const onScroll = () => {
            header.style.boxShadow = window.scrollY > 8 ? '0 4px 14px rgba(10,10,10,.05)' : 'none';
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }
})();
