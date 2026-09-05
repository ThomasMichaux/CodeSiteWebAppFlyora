(function () {
    'use strict';

    const AIRPORTS = {
        JFK: { name: 'New York (JFK)', city: 'New York', region: 'Americas' },
        LAX: { name: 'Los Angeles (LAX)', city: 'Los Angeles', region: 'Americas' },
        SFO: { name: 'San Francisco (SFO)', city: 'San Francisco', region: 'Americas' },
        ORD: { name: 'Chicago O\'Hare (ORD)', city: 'Chicago', region: 'Americas' },
        ATL: { name: 'Atlanta (ATL)', city: 'Atlanta', region: 'Americas' },
        DFW: { name: 'Dallas Fort Worth (DFW)', city: 'Dallas', region: 'Americas' },
        MIA: { name: 'Miami (MIA)', city: 'Miami', region: 'Americas' },
        BOS: { name: 'Boston Logan (BOS)', city: 'Boston', region: 'Americas' },
        SEA: { name: 'Seattle Tacoma (SEA)', city: 'Seattle', region: 'Americas' },
        LHR: { name: 'London Heathrow (LHR)', city: 'London', region: 'Europe' },
        CDG: { name: 'Paris Charles de Gaulle (CDG)', city: 'Paris', region: 'Europe' },
        FRA: { name: 'Frankfurt (FRA)', city: 'Frankfurt', region: 'Europe' },
        AMS: { name: 'Amsterdam Schiphol (AMS)', city: 'Amsterdam', region: 'Europe' },
        DXB: { name: 'Dubai (DXB)', city: 'Dubai', region: 'Middle East' },
        NRT: { name: 'Tokyo Narita (NRT)', city: 'Tokyo', region: 'Asia Pacific' },
        HND: { name: 'Tokyo Haneda (HND)', city: 'Tokyo', region: 'Asia Pacific' },
        ICN: { name: 'Seoul Incheon (ICN)', city: 'Seoul', region: 'Asia Pacific' },
        HKG: { name: 'Hong Kong (HKG)', city: 'Hong Kong', region: 'Asia Pacific' },
        BKK: { name: 'Bangkok Suvarnabhumi (BKK)', city: 'Bangkok', region: 'Asia Pacific' },
        KUL: { name: 'Kuala Lumpur (KUL)', city: 'Kuala Lumpur', region: 'Asia Pacific' },
        HAN: { name: 'Hanoi Noi Bai (HAN)', city: 'Hanoi', region: 'Asia Pacific' },
        SIN: { name: 'Singapore Changi (SIN)', city: 'Singapore', region: 'Asia Pacific' },
        SYD: { name: 'Sydney Kingsford Smith (SYD)', city: 'Sydney', region: 'Asia Pacific' }
    };

    const REGION_ORDER = ['Americas', 'Europe', 'Middle East', 'Asia Pacific'];

    const HUBS = ['JFK', 'LAX', 'ORD', 'LHR', 'CDG', 'AMS', 'DXB', 'NRT', 'ICN', 'HKG', 'SIN'];

    let scrollLocks = 0;

    function initUtilities() {
        initNotifications();
        populateAirportSelects();
    }

    function initNotifications() {
        window.showNotification = function (message, type, duration) {
            type = type || 'info';
            duration = duration || 5000;

            const notification = document.createElement('div');
            notification.className = 'notification alert alert-' + type;

            notification.setAttribute('role', type === 'error' ? 'alert' : 'status');

            const icons = {
                success: '✓',
                error: '✗',
                warning: '⚠',
                info: 'ℹ'
            };

            if (icons[type]) {
                const iconEl = document.createElement('span');
                iconEl.setAttribute('aria-hidden', 'true');
                iconEl.textContent = icons[type];
                notification.appendChild(iconEl);
                notification.appendChild(document.createTextNode(' '));
            }

            const textEl = document.createElement('span');
            textEl.textContent = message;
            notification.appendChild(textEl);

            let container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.className = 'notification-container';
                document.body.appendChild(container);
            }

            container.appendChild(notification);

            requestAnimationFrame(function () {
                notification.classList.add('animate-fadeIn');
            });

            if (duration > 0) {
                setTimeout(function () {
                    notification.classList.remove('animate-fadeIn');
                    notification.classList.add('animate-fadeOut');
                    setTimeout(function () {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, duration);
            }
        };
    }

    function announce(message) {
        let region = document.getElementById('live-region');

        if (!region) {
            region = document.createElement('div');
            region.id = 'live-region';
            region.className = 'sr-only';
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            document.body.appendChild(region);
        }

        region.textContent = '';
        setTimeout(function () {
            region.textContent = message;
        }, 100);
    }

    function populateAirportSelects() {
        const selects = [document.getElementById('origin'), document.getElementById('destination')];

        selects.forEach(function (select) {
            if (!select) return;

            const placeholder = select.querySelector('option[value=""]');
            select.textContent = '';
            if (placeholder) select.appendChild(placeholder);

            REGION_ORDER.forEach(function (region) {
                const codes = Object.keys(AIRPORTS).filter(function (code) {
                    return AIRPORTS[code].region === region;
                });
                if (!codes.length) return;

                const group = document.createElement('optgroup');
                group.label = region;

                codes.forEach(function (code) {
                    const option = document.createElement('option');
                    option.value = code;
                    option.textContent = AIRPORTS[code].name;
                    group.appendChild(option);
                });

                select.appendChild(group);
            });
        });
    }

    function lockScroll() {
        scrollLocks += 1;
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        scrollLocks = Math.max(0, scrollLocks - 1);
        if (scrollLocks === 0) {
            document.body.style.overflow = '';
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    function formatCurrency(amount, currency) {
        currency = currency || 'USD';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function formatDateInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function getAirportName(code) {
        const airport = AIRPORTS[code];
        return airport ? airport.name : code;
    }

    function hasDirectService(origin, destination) {
        return HUBS.indexOf(origin) !== -1 || HUBS.indexOf(destination) !== -1;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^[\d\s\-\+\(\)]{10,}$/.test(phone);
    }

    function isValidCardNumber(value) {
        const digits = value.replace(/\s+/g, '');
        if (!/^\d{13,19}$/.test(digits)) return false;

        let sum = 0;
        let double = false;

        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = Number(digits.charAt(i));
            if (double) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            double = !double;
        }

        return sum % 10 === 0;
    }

    function isValidCardExpiry(value) {
        const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
        if (!match) return false;

        const month = Number(match[1]);
        const year = 2000 + Number(match[2]);
        if (month < 1 || month > 12) return false;

        const now = new Date();
        const expiry = new Date(year, month, 1);
        return expiry > now;
    }

    function isValidCardCvv(value) {
        return /^\d{3,4}$/.test(value.trim());
    }

    function formatCardNumber(value) {
        return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    function formatCardExpiry(value) {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        if (digits.length < 3) return digits;
        return digits.slice(0, 2) + '/' + digits.slice(2);
    }

    function generateBookingReference() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const bytes = new Uint8Array(6);
        let result = 'FLY';

        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let j = 0; j < bytes.length; j++) {
                bytes[j] = Math.floor(Math.random() * 256);
            }
        }

        for (let i = 0; i < bytes.length; i++) {
            result += chars.charAt(bytes[i] % chars.length);
        }
        return result;
    }

    function addMinutes(date, minutes) {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }

    window.initUtilities = initUtilities;
    window.announce = announce;
    window.lockScroll = lockScroll;
    window.unlockScroll = unlockScroll;
    window.debounce = debounce;
    window.formatCurrency = formatCurrency;
    window.formatDateInput = formatDateInput;
    window.getAirportName = getAirportName;
    window.hasDirectService = hasDirectService;
    window.isValidEmail = isValidEmail;
    window.isValidPhone = isValidPhone;
    window.isValidCardNumber = isValidCardNumber;
    window.isValidCardExpiry = isValidCardExpiry;
    window.isValidCardCvv = isValidCardCvv;
    window.formatCardNumber = formatCardNumber;
    window.formatCardExpiry = formatCardExpiry;
    window.generateBookingReference = generateBookingReference;
    window.addMinutes = addMinutes;

})();