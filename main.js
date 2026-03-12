import { initAnimations } from './src/animations.js';
import { PianoAudio } from './src/audio.js';
import { initYouTubePlayer } from './src/youtube.js';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const audio = new PianoAudio();
initAnimations(audio);
initYouTubePlayer();

gsap.to('.cta-btn', { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(1.7)' });

// Mute Button
const muteBtn = document.getElementById('btn-mute');
if (muteBtn) {
    muteBtn.innerText = audio.isMuted ? '🔇' : '🔊';
    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isMutedNow = audio.toggleMute();
        muteBtn.innerText = isMutedNow ? '🔇' : '🔊';
    });
}

// Benefit Card Sounds
document.querySelectorAll('.piano-hover').forEach(el => {
    el.addEventListener('mouseenter', () => {
        const note = el.dataset.sound;
        if (!audio.isMuted) {
            note === 'chord' ? audio.playChord(true) : audio.playNote(note, true);
        }
    });
    el.addEventListener('mousedown', () => { el.style.filter = 'brightness(0.9)'; });
    el.addEventListener('mouseup', () => { el.style.filter = ''; });
    el.addEventListener('mouseleave', () => { el.style.filter = ''; });
});

// WhatsApp Click Sound
document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
        if (!audio.isMuted) audio.playChord();
    });
});

// Hero Piano Keys
document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('mouseenter', () => playKey(key, true));
    key.addEventListener('mousedown', () => playKey(key, false));
    key.addEventListener('touchstart', (e) => { e.preventDefault(); playKey(key, false); });

    const resetKey = () => {
        gsap.to(key, { y: 0, duration: 0.2 });
        key.style.background = '';
    };

    key.addEventListener('mouseleave', resetKey);
    key.addEventListener('mouseup', resetKey);
    key.addEventListener('touchend', resetKey);
});

function playKey(key, isHover = false) {
    const note = key.dataset.note;
    if (!audio.isMuted) audio.playNote(note, isHover);
    gsap.to(key, { y: 20, duration: 0.05, yoyo: true, repeat: 1 });
    key.style.background = '#b8a8c8';
}

// Geo-Detection: Colombia → COP prices
setTimeout(() => {
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
            if (data.country_code === 'CO') {
                const updates = {
                    'price-monthly': '$290.000',
                    'interval-monthly': 'COP/mes',
                    'price-quarterly': '$790.000',
                    'interval-quarterly': 'COP/3 meses',
                    'monthly-equiv-quarterly': 'Solo $263.333 COP / mes',
                    'desc-quarterly-saving': '(Ahorras más de $860.000 COP)',
                    'hero-price-old': '$550.000',
                    'hero-price-new': '$290.000',
                    'old-price-monthly': '$550.000',
                    'old-price-quarterly': '$1.650.000'
                };

                Object.entries(updates).forEach(([id, text]) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = text;
                });

                const promoBanner = document.getElementById('promo-text-container');
                if (promoBanner) {
                    promoBanner.innerHTML = `<span class="promo-text">🔥 Antes <span style="text-decoration: line-through; opacity: 0.6;">$550.000 COP</span> — Solo por estos días a <strong>$290.000 COP</strong> al mes</span>`;
                }
            }

            // WhatsApp links
            const waMonthly = document.getElementById('whatsapp-btn-monthly');
            const waQuarterly = document.getElementById('whatsapp-btn-quarterly');
            if (waMonthly) waMonthly.href = `https://wa.me/573046708255?text=${encodeURIComponent('Hola, quiero inscribirme al Plan Mensual de piano')}`;
            if (waQuarterly) waQuarterly.href = `https://wa.me/573046708255?text=${encodeURIComponent('Hola, quiero inscribirme al Plan Trimestral de piano')}`;
        })
        .catch(() => { });
}, 2000);

// Benefit Modals
const benefitModalData = {
    1: { title: 'Práctica Real', body: 'Nuestro método se enfoca en que toques desde el primer día. No más teoría aburrida sin acción. Cada lección incluye ejercicios prácticos diseñados para desarrollar tu técnica gradualmente. Comenzarás con melodías simples y progresarás hacia piezas más complejas, siempre con acompañamiento paso a paso.' },
    2: { title: 'Historia de la Música', body: 'Sumérgete en un viaje fascinante a través de las épocas musicales. Desde el Barroco de Bach hasta el Romanticismo de Chopin, pasando por el Jazz y la música contemporánea. Conocerás a los grandes compositores que revolucionaron el piano, entenderás el contexto histórico de sus obras maestras y descubrirás cómo cada período influyó en las técnicas y estilos que usamos hoy. Este conocimiento enriquecerá tu interpretación y te convertirá en un músico más completo.' },
    3: { title: 'Lectura Musical', body: 'Aprende a leer partituras de forma fluida y natural. Nuestra metodología progresiva te llevará desde las notas básicas hasta la lectura a primera vista. Podrás interpretar cualquier partitura y acceder a un mundo infinito de música escrita para piano.' },
    4: { title: 'Comunidad Global', body: 'Únete a nuestra comunidad de estudiantes de todo el mundo hispanohablante. Comparte tu progreso, recibe feedback, participa en retos semanales y conecta con otros apasionados del piano. Aprender en comunidad te motiva y acelera tu progreso.' },
    step1: { title: 'Fundamentos', body: 'En esta primera etapa aprenderás todo lo esencial para comenzar tu viaje musical. Dominarás la postura correcta para evitar lesiones y tocar con fluidez. Conocerás cada tecla del teclado y entenderás cómo se organizan las notas. Practicarás ritmos básicos que serán la base de toda tu técnica futura. Al finalizar esta etapa, tendrás los cimientos sólidos para avanzar con confianza.' },
    step2: { title: 'Acordes Mágicos', body: 'Los acordes son la clave para tocar prácticamente cualquier canción popular. Aprenderás los acordes mayores, menores y séptimas más usados en la música pop, rock, baladas y más. Descubrirás progresiones de acordes que se repiten en miles de canciones famosas. Con este conocimiento, podrás acompañar canciones, improvisar y crear tu propia música.' },
    step3: { title: 'Maestría', body: 'La etapa final te llevará al siguiente nivel. Dominarás técnicas avanzadas como arpegios, escalas veloces y ornamentación. Aprenderás a expresar emociones a través de la dinámica, el tempo y el fraseo. Desarrollarás tu propio estilo interpretativo y estarás listo para abordar repertorio clásico, jazz o cualquier género que te apasione.' }
};

const modal = document.getElementById('benefit-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.querySelector('.modal-close');

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.querySelectorAll('.read-more-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const data = benefitModalData[btn.dataset.modal];
        if (data && modal) {
            modalTitle.textContent = data.title;
            modalBody.textContent = data.body;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
// Buttery Smooth Scroll for CTA buttons (GSAP ScrollToPlugin)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            gsap.to(window, {
                duration: 1.5,
                scrollTo: { y: targetElement, offsetY: 0 },
                ease: 'power2.inOut'
            });
        }
    });
});
