// Animations - Scroll animations, lazy loading, reduced motion
(function () {
    'use strict';

    let scrollObserver = null;
    let imageObserver = null;

    function initAnimations() {
        initScrollAnimations();
        initLazyLoading();
        initReducedMotion();
        initStaggerAnimations();
    }

    function initScrollAnimations() {
        if (typeof IntersectionObserver === 'undefined') return;

        const animatedElements = document.querySelectorAll('[data-animate]');

        scrollObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-animate-delay') || 0;
                    setTimeout(function () {
                        entry.target.classList.add('animated');
                    }, delay);
                    scrollObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(function (el) {
            scrollObserver.observe(el);
        });
    }

    function initLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            const images = document.querySelectorAll('img[loading="lazy"]');
            images.forEach(function (img) {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            });
            return;
        }

        const images = document.querySelectorAll('img[loading="lazy"]');

        imageObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });

        images.forEach(function (img) {
            imageObserver.observe(img);
        });
    }

    function initReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (prefersReducedMotion.matches) {
            document.body.classList.add('reduce-motion');
        }

        prefersReducedMotion.addEventListener('change', function (e) {
            if (e.matches) {
                document.body.classList.add('reduce-motion');
            } else {
                document.body.classList.remove('reduce-motion');
            }
        });

        if (typeof CSS !== 'undefined' && CSS.supports) {
            if (!CSS.supports('animation', 'step-end')) {
                document.body.classList.add('reduce-motion');
            }
        }
    }

    function initStaggerAnimations() {
        const staggerContainers = document.querySelectorAll('[data-stagger]');

        staggerContainers.forEach(function (container) {
            const items = container.querySelectorAll('[data-stagger-item]');
            const baseDelay = parseInt(container.getAttribute('data-stagger'), 10) || 100;

            items.forEach(function (item, index) {
                item.style.animationDelay = (index * baseDelay) + 'ms';
                item.classList.add('stagger-item');
            });
        });
    }

    function smoothScrollTo(target, duration) {
        duration = duration || 500;
        const targetPosition = typeof target === 'number' ? target : target.getBoundingClientRect().top;
        const startPosition = window.pageYOffset;
        let startTime = null;

        function animationStep(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, targetPosition, duration);

            window.scrollTo(0, run);

            if (timeElapsed < duration) {
                requestAnimationFrame(animationStep);
            }
        }

        function ease(t, b, c, d) {
            t /= d;
            t--;
            return -c * (t * t * t * t - 1) + b;
        }

        requestAnimationFrame(animationStep);
    }

    function formatDateInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    window.initAnimations = initAnimations;
    window.smoothScrollTo = smoothScrollTo;
    window.formatDateInput = formatDateInput;

})();