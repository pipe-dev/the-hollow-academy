import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
    gsap.from('.key', { y: -100, opacity: 0, stagger: 0.1, duration: 1.5, ease: 'elastic.out(1, 0.5)' });
    gsap.from('.headline', { y: 50, opacity: 0, duration: 1, delay: 0.5 });
    gsap.from('.cta-btn', { scale: 0, duration: 0.5, delay: 1, ease: 'back.out(1.7)' });

    // Scroll-triggered background color changes
    document.querySelectorAll('.section').forEach(section => {
        if (section.id === 'methodology') return;
        ScrollTrigger.create({
            trigger: section,
            start: 'top 60%',
            end: 'bottom 60%',
            onEnter: () => updateBodyColor(section),
            onEnterBack: () => updateBodyColor(section)
        });
    });

    // Pet animation: show for 2.5s then fade to benefit cards
    const overlay = document.getElementById('benefits-video-overlay');
    const grid = document.getElementById('benefits-grid');

    if (overlay && grid) {
        ScrollTrigger.create({
            trigger: '#benefits',
            start: 'top center',
            once: true,
            onEnter: () => {
                setTimeout(() => {
                    gsap.to(overlay, { opacity: 0, duration: 0.5, onComplete: () => overlay.style.display = 'none' });
                    gsap.to(grid, { opacity: 1, duration: 0.5 });
                    gsap.from('.benefit-card', { y: 50, opacity: 0, stagger: 0.2, duration: 0.8 });
                }, 2500);
            }
        });
    }
}

function updateBodyColor(section) {
    gsap.to('body', { backgroundColor: section.dataset.color, duration: 0.5 });
}
