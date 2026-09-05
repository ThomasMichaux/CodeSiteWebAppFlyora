(function () {
    'use strict';

    let hamburger;
    let navMenu;

    function initLayout() {
        hamburger = document.querySelector('.hamburger');
        navMenu = document.querySelector('.nav-list');

        initMobileMenu();
        initSmoothScroll();
        initStickyHeader();
        initActiveNav();
    }

    function initMobileMenu() {
        if (!hamburger || !navMenu) return;

        const backdrop = document.querySelector('.nav-backdrop');

        function toggleMobileMenu() {
            const expanded = hamburger.getAttribute('aria-expanded') === 'true';
            const opening = !expanded;

            hamburger.setAttribute('aria-expanded', opening);
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('nav-open');

            if (backdrop) {
                backdrop.classList.toggle('active');
            }

            if (opening) {
                const firstFocusable = navMenu.querySelector('.nav-link');
                if (firstFocusable) {
                    setTimeout(function () { firstFocusable.focus(); }, 100);
                }
            }
        }

        hamburger.addEventListener('click', toggleMobileMenu);

        if (backdrop) {
            backdrop.addEventListener('click', closeMobileMenu);
        }

        const allMenuLinks = navMenu.querySelectorAll('.nav-link');
        allMenuLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                if (navMenu.classList.contains('active')) {
                    closeMobileMenu();
                }
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMobileMenu();
                hamburger.focus();
            }

            if (e.key === 'Tab' && navMenu.classList.contains('active')) {
                const focusable = navMenu.querySelectorAll('.nav-link');
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        document.addEventListener('click', function (e) {
            if (navMenu.classList.contains('active') &&
                !navMenu.contains(e.target) &&
                !hamburger.contains(e.target)) {
                closeMobileMenu();
            }
        });

        let touchStartX = 0;
        let touchStartY = 0;

        navMenu.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        navMenu.addEventListener('touchend', function (e) {
            if (!navMenu.classList.contains('active')) return;
            const deltaX = touchStartX - e.changedTouches[0].screenX;
            const deltaY = touchStartY - e.changedTouches[0].screenY;
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
                closeMobileMenu();
            }
        }, { passive: true });
    }

    function closeMobileMenu() {
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('active');
        document.body.classList.remove('nav-open');

        const backdrop = document.querySelector('.nav-backdrop');
        if (backdrop) {
            backdrop.classList.remove('active');
        }
    }

    function initActiveNav() {
        if (typeof IntersectionObserver === 'undefined') return;

        const sections = document.querySelectorAll('section[id]');
        if (!sections.length) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    document.querySelectorAll('.nav-link').forEach(function (l) {
                        l.classList.remove('active');
                    });
                    const match = document.querySelectorAll('.nav-link[data-section="' + id + '"]');
                    match.forEach(function (l) {
                        l.classList.add('active');
                    });
                }
            });
        }, { threshold: 0.3, rootMargin: '0px 0px -50px 0px' });

        sections.forEach(function (section) {
            observer.observe(section);
        });
    }

    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');

                if (href === '#' || href === '#main-content') {
                    e.preventDefault();
                    return;
                }

                e.preventDefault();

                const target = document.querySelector(href);
                if (!target) return;

                if (target.classList.contains('hidden') &&
                    typeof window.showBrowseView === 'function') {
                    window.showBrowseView();
                }

                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            });
        });
    }

    const debouncedScroll = window.debounce(function () {
        const header = document.querySelector('.header');
        if (!header) return;

        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 100);

    function initStickyHeader() {
        if (!document.querySelector('.header')) return;
        window.addEventListener('scroll', debouncedScroll, { passive: true });
    }

    window.initLayout = initLayout;

})();