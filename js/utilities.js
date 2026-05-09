// Utilities - Helper functions
(function () {
    'use strict';

    function initUtilities() {
        initNotifications();
        initToast();
    }

    function initNotifications() {
        window.showNotification = function (message, type, duration) {
            type = type || 'info';
            duration = duration || 5000;

            var notification = document.createElement('div');
            notification.className = 'notification alert alert-' + type;
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'polite');

            var icon = '';
            switch (type) {
                case 'success':
                    icon = '<span aria-hidden="true">&#10003;</span> ';
                    break;
                case 'error':
                    icon = '<span aria-hidden="true">&#10007;</span> ';
                    break;
                case 'warning':
                    icon = '<span aria-hidden="true">&#9888;</span> ';
                    break;
                case 'info':
                    icon = '<span aria-hidden="true">&#8505;</span> ';
                    break;
            }

            notification.innerHTML = icon + '<span>' + message + '</span>';

            var container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.className = 'notification-container';
                container.style.cssText = 'position:fixed;top:calc(var(--header-height) + 16px);right:16px;z-index:var(--z-toast);display:flex;flex-direction:column;gap:8px;max-width:400px;';
                document.body.appendChild(container);
            }

            container.appendChild(notification);

            setTimeout(function () {
                notification.classList.add('animate-fadeIn');
            }, 10);

            if (duration > 0) {
                setTimeout(function () {
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

    function initToast() {
        window.showToast = function (message, options) {
            options = options || {};
            var type = options.type || 'default';
            var duration = options.duration !== undefined ? options.duration : 3000;

            var toast = document.createElement('div');
            toast.className = 'toast toast-' + type;
            toast.textContent = message;
            toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;background-color:var(--color-bg-primary);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);z-index:var(--z-toast);animation:slideInUp 250ms ease-out forwards;';

            document.body.appendChild(toast);

            if (duration > 0) {
                setTimeout(function () {
                    toast.style.animation = 'fadeOut 250ms ease-out forwards';
                    setTimeout(function () {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 250);
                }, duration);
            }

            return toast;
        };
    }

    function debounce(func, wait) {
        var timeout;
        return function () {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    function throttle(func, limit) {
        var inThrottle;
        return function () {
            var context = this;
            var args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function () {
                    inThrottle = false;
                }, limit);
            }
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

    function formatDateString(date, options) {
        options = options || {};
        var d = new Date(date);
        return d.toLocaleDateString('en-US', {
            weekday: options.weekday || 'short',
            year: options.year || 'numeric',
            month: options.month || 'short',
            day: options.day || 'numeric'
        });
    }

    function formatDateInput(date) {
        var d = new Date(date);
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function getAirportName(code) {
        var airports = {
            'JFK': 'New York (JFK)',
            'LAX': 'Los Angeles (LAX)',
            'SFO': 'San Francisco (SFO)',
            'ORD': 'Chicago O\'Hare (ORD)',
            'LHR': 'London Heathrow (LHR)',
            'CDG': 'Paris Charles de Gaulle (CDG)',
            'FRA': 'Frankfurt (FRA)',
            'AMS': 'Amsterdam Schiphol (AMS)',
            'NRT': 'Tokyo Narita (NRT)',
            'HND': 'Tokyo Haneda (HND)',
            'SIN': 'Singapore Changi (SIN)',
            'DXB': 'Dubai (DXB)',
            'HKG': 'Hong Kong (HKG)',
            'BKK': 'Bangkok Suvarnabhumi (BKK)',
            'ICN': 'Seoul Incheon (ICN)',
            'SYD': 'Sydney Kingsford Smith (SYD)',
            'MIA': 'Miami International (MIA)',
            'BOS': 'Boston Logan (BOS)',
            'SEA': 'Seattle Tacoma (SEA)',
            'ATL': 'Atlanta Hartsfield (ATL)',
            'DFW': 'Dallas Fort Worth (DFW)',
            'DEN': 'Denver (DEN)',
            'LAS': 'Las Vegas (LAS)',
            'PHX': 'Phoenix (PHX)',
            'MCO': 'Orlando (MCO)'
        };
        return airports[code] || code;
    }

    function getAirportCity(code) {
        var cities = {
            'JFK': 'New York',
            'LAX': 'Los Angeles',
            'SFO': 'San Francisco',
            'ORD': 'Chicago',
            'LHR': 'London',
            'CDG': 'Paris',
            'FRA': 'Frankfurt',
            'AMS': 'Amsterdam',
            'NRT': 'Tokyo',
            'HND': 'Tokyo',
            'SIN': 'Singapore',
            'DXB': 'Dubai',
            'HKG': 'Hong Kong',
            'BKK': 'Bangkok',
            'ICN': 'Seoul',
            'SYD': 'Sydney',
            'MIA': 'Miami',
            'BOS': 'Boston',
            'SEA': 'Seattle',
            'ATL': 'Atlanta',
            'DFW': 'Dallas',
            'DEN': 'Denver',
            'LAS': 'Las Vegas',
            'PHX': 'Phoenix',
            'MCO': 'Orlando'
        };
        return cities[code] || code;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^[\d\s\-\+\(\)]{10,}$/.test(phone);
    }

    function isValidPassport(passport) {
        return /^[A-Z0-9]{6,9}$/i.test(passport);
    }

    function generateBookingReference() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = 'FLY';
        for (var i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function calculateFlightDuration(departure, arrival) {
        var dep = new Date(departure);
        var arr = new Date(arrival);
        var diff = arr - dep;
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return hours + 'h ' + minutes + 'm';
    }

    function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function addHours(date, hours) {
        var result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }

    window.initUtilities = initUtilities;
    window.debounce = debounce;
    window.throttle = throttle;
    window.formatCurrency = formatCurrency;
    window.formatDateString = formatDateString;
    window.formatDateInput = formatDateInput;
    window.getAirportName = getAirportName;
    window.getAirportCity = getAirportCity;
    window.isValidEmail = isValidEmail;
    window.isValidPhone = isValidPhone;
    window.isValidPassport = isValidPassport;
    window.generateBookingReference = generateBookingReference;
    window.calculateFlightDuration = calculateFlightDuration;
    window.addDays = addDays;
    window.addHours = addHours;

})();