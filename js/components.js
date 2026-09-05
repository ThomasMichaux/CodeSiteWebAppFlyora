(function () {
    'use strict';

    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const SEAT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
    const FIRST_ROW = 15;
    const LAST_ROW = 30;

    function initComponents() {
        initModals();
        initTripType();
        initForms();
        initSeatSelection();
        initPassengerForms();
    }

    function getPassengerCount() {
        if (window.FlyoraApp && window.FlyoraApp.bookingData) {
            return window.FlyoraApp.bookingData.passengers || 1;
        }
        return 1;
    }

    function refreshBookingComponents() {
        initPassengerForms();
        initSeatSelection();
    }

    let previouslyFocusedElement = null;

    function initModals() {
        const openButtons = document.querySelectorAll('[data-modal]');
        const closeButtons = document.querySelectorAll('.modal-close');
        const modalOverlays = document.querySelectorAll('.modal-overlay');

        openButtons.forEach(function (button) {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                openModal(this.getAttribute('data-modal'));
            });
        });

        closeButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                const overlay = this.closest('.modal-overlay');
                if (overlay) {
                    closeModal(overlay);
                }
            });
        });

        modalOverlays.forEach(function (overlay) {
            overlay.setAttribute('aria-hidden', 'true');
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    closeModal(overlay);
                }
            });
        });

        document.addEventListener('keydown', function (e) {
            const openOverlay = document.querySelector('.modal-overlay.open');
            if (!openOverlay) return;

            if (e.key === 'Escape') {
                closeModal(openOverlay);
            } else if (e.key === 'Tab') {
                trapFocus(e, openOverlay);
            }
        });
    }

    function trapFocus(e, overlay) {
        const items = Array.prototype.filter.call(
            overlay.querySelectorAll(FOCUSABLE),
            function (el) { return el.offsetParent !== null; }
        );
        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function openModal(modalId) {
        const overlay = document.getElementById(modalId);
        if (!overlay) return;

        previouslyFocusedElement = document.activeElement;

        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        window.lockScroll();

        const firstField = overlay.querySelector('.modal-body input:not([type="hidden"])');
        const target = firstField || overlay.querySelector(FOCUSABLE);
        if (target) {
            setTimeout(function () { target.focus(); }, 100);
        }
    }

    function closeModal(overlay, focusTarget) {
        if (!overlay.classList.contains('open')) return;

        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        window.unlockScroll();

        const target = focusTarget || previouslyFocusedElement;
        previouslyFocusedElement = null;

        if (target && document.contains(target) && target.offsetParent !== null) {
            target.focus();
        }
    }

    function initTripType() {
        const options = document.querySelectorAll('.tab-btn');
        if (!options.length) return;

        options.forEach(function (option) {
            option.addEventListener('click', function () {
                selectTripType(this, options);
            });

            option.addEventListener('keydown', function (e) {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' &&
                    e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
                    return;
                }

                e.preventDefault();
                const list = Array.from(options);
                const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
                const next = (list.indexOf(this) + (forward ? 1 : -1) + list.length) % list.length;

                list[next].focus();
                selectTripType(list[next], options);
            });
        });
    }

    function selectTripType(chosen, options) {
        options.forEach(function (option) {
            const isChosen = option === chosen;
            option.classList.toggle('active', isChosen);
            option.setAttribute('aria-checked', isChosen ? 'true' : 'false');
            option.setAttribute('tabindex', isChosen ? '0' : '-1');
        });

        const isOneWay = chosen.getAttribute('data-tab') === 'one-way';
        const returnField = document.getElementById('return-field');
        const returnInput = document.getElementById('return-date');

        if (returnField) {
            returnField.classList.toggle('hidden', isOneWay);
        }

        if (returnInput) {
            returnInput.disabled = isOneWay;
            if (isOneWay) {
                returnInput.removeAttribute('required');
            } else {
                returnInput.setAttribute('required', 'required');
            }
        }

        document.dispatchEvent(new CustomEvent('flyora:triptypechange', {
            detail: { tripType: isOneWay ? 'one-way' : 'roundtrip' }
        }));
    }

    function initForms() {
        document.querySelectorAll('form[data-validate]').forEach(function (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                validateForm(form);
            });
        });

        document.addEventListener('focusout', function (e) {
            const input = e.target.closest && e.target.closest('.form-input');
            if (!input) return;
            const group = input.closest('.form-group');
            if (group) validateField(input, group);
        });

        document.addEventListener('input', function (e) {
            const input = e.target.closest && e.target.closest('.form-input');
            if (!input) return;

            formatWhileTyping(input);

            const group = input.closest('.form-group');
            if (group && group.classList.contains('error')) {
                validateField(input, group);
            }
        });

        document.addEventListener('invalid', function (e) {
            const input = e.target.closest && e.target.closest('.form-input');
            if (!input) return;
            e.preventDefault();
            const group = input.closest('.form-group');
            if (group) validateField(input, group);
        }, true);
    }

    function formatWhileTyping(input) {
        const kind = input.getAttribute('data-validate-as');
        if (kind !== 'card-number' && kind !== 'card-expiry') return;

        const formatted = kind === 'card-number'
            ? window.formatCardNumber(input.value)
            : window.formatCardExpiry(input.value);

        if (formatted === input.value) return;

        input.value = formatted;
        if (input === document.activeElement) {
            input.setSelectionRange(formatted.length, formatted.length);
        }
    }

    function validateForm(root) {
        let isValid = true;

        root.querySelectorAll('[required]').forEach(function (field) {
            if (field.disabled) return;
            const group = field.closest('.form-group');
            if (!group) return;
            if (!validateField(field, group)) {
                isValid = false;
            }
        });

        return isValid;
    }

    function validateField(input, group) {
        const errorEl = group.querySelector('.form-error');
        const kind = input.getAttribute('data-validate-as');
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        group.classList.remove('error', 'success');
        input.classList.remove('error', 'success');

        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (input.type === 'email' && value && !window.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (input.type === 'tel' && value && !window.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        } else if (kind === 'card-number' && value && !window.isValidCardNumber(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid 16-digit card number';
        } else if (kind === 'card-expiry' && value && !window.isValidCardExpiry(value)) {
            isValid = false;
            errorMessage = 'Please enter a future expiry date as MM/YY';
        } else if (kind === 'card-cvv' && value && !window.isValidCardCvv(value)) {
            isValid = false;
            errorMessage = 'The security code is 3 or 4 digits';
        }

        if (!isValid) {
            group.classList.add('error');
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');
            setFieldError(input, errorEl, errorMessage);
        } else {
            input.setAttribute('aria-invalid', 'false');
            setFieldError(input, errorEl, '');
            if (value) {
                group.classList.add('success');
                input.classList.add('success');
            }
        }

        return isValid;
    }

    function setFieldError(input, errorEl, message) {
        if (!errorEl) return;

        errorEl.textContent = message;

        if (!input.id) return;

        if (message) {
            errorEl.id = input.id + '-error';
            input.setAttribute('aria-describedby', errorEl.id);
        } else {
            input.removeAttribute('aria-describedby');
        }
    }

    let selectedSeats = [];

    function seatKey(seat) {
        return seat.getAttribute('data-row') + seat.getAttribute('data-seat');
    }

    function isSeatOccupied(row, seatIndex) {
        return ((row * 7 + seatIndex * 13) % 11) < 3;
    }

    function buildSeatMap() {
        const grid = document.getElementById('seat-map');
        if (!grid) return;

        const cabin = document.createDocumentFragment();

        for (let row = FIRST_ROW; row <= LAST_ROW; row++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'seat-row';
            rowEl.setAttribute('role', 'group');
            rowEl.setAttribute('aria-label', 'Row ' + row);

            SEAT_LETTERS.forEach(function (letter, index) {
                if (index === 3) {
                    const aisle = document.createElement('div');
                    aisle.className = 'seat-aisle';
                    aisle.setAttribute('aria-hidden', 'true');
                    rowEl.appendChild(aisle);
                }

                const occupied = isSeatOccupied(row, index);
                const label = row + letter;

                const seat = document.createElement('div');
                seat.className = 'seat ' + (occupied ? 'occupied' : 'available');
                seat.setAttribute('data-row', String(row));
                seat.setAttribute('data-seat', letter);
                seat.setAttribute('role', 'button');
                seat.textContent = label;

                if (occupied) {
                    seat.setAttribute('aria-disabled', 'true');
                    seat.setAttribute('aria-label', 'Seat ' + label + ', occupied');
                } else {
                    seat.setAttribute('tabindex', '0');
                    seat.setAttribute('aria-pressed', 'false');
                    seat.setAttribute('aria-label', 'Seat ' + label + ', available');
                }

                rowEl.appendChild(seat);
            });

            cabin.appendChild(rowEl);
        }

        grid.textContent = '';
        grid.appendChild(cabin);
    }

    function initSeatSelection() {
        const container = document.querySelector('.seat-map-container');
        if (!container) return;

        buildSeatMap();
        selectedSeats = [];
        updateSelectedSeatsDisplay();

        const title = document.querySelector('.cabin-title');
        if (title) {
            title.textContent = 'Economy Class - Rows ' + FIRST_ROW + '-' + LAST_ROW;
        }

        if (container.dataset.bound === 'true') return;
        container.dataset.bound = 'true';

        container.addEventListener('click', function (e) {
            const seat = e.target.closest('.seat');
            if (seat && seat.classList.contains('available')) {
                toggleSeat(seat);
            }
        });

        container.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const seat = e.target.closest('.seat');
            if (seat && seat.classList.contains('available')) {
                e.preventDefault();
                toggleSeat(seat);
            }
        });
    }

    function toggleSeat(seat) {
        const key = seatKey(seat);
        const capacity = getPassengerCount();

        if (seat.classList.contains('selected')) {
            setSeatSelected(seat, false);
            selectedSeats = selectedSeats.filter(function (s) {
                return s !== key;
            });
        } else if (selectedSeats.length < capacity) {
            setSeatSelected(seat, true);
            selectedSeats.push(key);
        } else if (typeof window.showNotification === 'function') {
            window.showNotification(
                'You can select ' + capacity + ' seat' + (capacity > 1 ? 's' : '') +
                ' for this booking. Deselect one first.', 'warning');
            return;
        }

        updateSelectedSeatsDisplay();
    }

    function setSeatSelected(seat, isSelected) {
        seat.classList.toggle('selected', isSelected);
        seat.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        seat.setAttribute('aria-label',
            'Seat ' + seatKey(seat) + ', ' + (isSelected ? 'selected' : 'available'));
    }

    function updateSelectedSeatsDisplay() {
        const display = document.getElementById('selected-seats-display');
        if (display) {
            display.textContent = selectedSeats.length
                ? selectedSeats.join(', ')
                : 'No seats selected';
        }

        if (window.FlyoraApp && window.FlyoraApp.bookingData) {
            window.FlyoraApp.bookingData.selectedSeats = selectedSeats.slice();
            if (typeof window.FlyoraApp.refreshSummary === 'function') {
                window.FlyoraApp.refreshSummary();
            }
        }
    }

    function validateSeatSelection() {
        const capacity = getPassengerCount();
        const missing = capacity - selectedSeats.length;

        if (missing <= 0) return true;

        if (typeof window.showNotification === 'function') {
            window.showNotification(
                selectedSeats.length === 0
                    ? 'Please choose ' + capacity + ' seat' + (capacity > 1 ? 's' : '') + ' to continue.'
                    : 'Please choose ' + missing + ' more seat' + (missing > 1 ? 's' : '') + ' to continue.',
                'error');
        }

        const firstAvailable = document.querySelector('.seat.available:not(.selected)');
        if (firstAvailable) firstAvailable.focus();

        return false;
    }

    function initPassengerForms() {
        const container = document.getElementById('passenger-forms');
        if (!container) return;

        const count = getPassengerCount();
        let html = '';

        for (let i = 0; i < count; i++) {
            html += `<fieldset class="passenger-fieldset">
                <legend class="form-label">Adult ${i + 1}</legend>
                <div class="grid grid-2 gap-lg">
                    <div class="form-group">
                        <label for="firstname-${i}" class="form-label">First Name</label>
                        <input type="text" id="firstname-${i}" class="form-input" required
                            aria-required="true" placeholder="As on passport" autocomplete="given-name">
                        <span class="form-error" role="alert"></span>
                    </div>
                    <div class="form-group">
                        <label for="lastname-${i}" class="form-label">Last Name</label>
                        <input type="text" id="lastname-${i}" class="form-input" required
                            aria-required="true" placeholder="As on passport" autocomplete="family-name">
                        <span class="form-error" role="alert"></span>
                    </div>
                </div>
                <div class="grid grid-2 gap-lg">
                    <div class="form-group">
                        <label for="email-${i}" class="form-label">Email</label>
                        <input type="email" id="email-${i}" class="form-input" required
                            aria-required="true" placeholder="email@example.com" autocomplete="email">
                        <span class="form-error" role="alert"></span>
                    </div>
                    <div class="form-group">
                        <label for="phone-${i}" class="form-label">Phone</label>
                        <input type="tel" id="phone-${i}" class="form-input" required
                            aria-required="true" placeholder="+1 234 567 8900" autocomplete="tel">
                        <span class="form-error" role="alert"></span>
                    </div>
                </div>
            </fieldset>`;
        }

        container.innerHTML = html;
    }

    window.initComponents = initComponents;
    window.refreshBookingComponents = refreshBookingComponents;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.validateForm = validateForm;
    window.validateField = validateField;
    window.validateSeatSelection = validateSeatSelection;
    window.setFieldError = setFieldError;

})();