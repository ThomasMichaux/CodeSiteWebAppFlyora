// Components - Interactive UI components
(function () {
    'use strict';

    function initComponents() {
        initModals();
        initTabs();
        initForms();
        initDropdowns();
        initSeatSelection();
        initPassengerForms();
    }

    function initModals() {
        const openButtons = document.querySelectorAll('[data-modal]');
        const closeButtons = document.querySelectorAll('.modal-close');
        const modalOverlays = document.querySelectorAll('.modal-overlay');

        openButtons.forEach(function (button) {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                const modalId = this.getAttribute('data-modal');
                openModal(modalId);
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
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    closeModal(overlay);
                }
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const openOverlay = document.querySelector('.modal-overlay.open');
                if (openOverlay) {
                    closeModal(openOverlay);
                }
            }
        });
    }

    let previouslyFocusedElement = null;

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const overlay = modal.closest('.modal-overlay');
        if (overlay) {
            overlay.classList.add('open');
        }

        document.body.style.overflow = 'hidden';

        previouslyFocusedElement = document.activeElement;

        const firstFocusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            setTimeout(function () {
                firstFocusable.focus();
            }, 100);
        }

        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal(overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';

        const modal = overlay.querySelector('.modal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
        }

        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();
        }
    }

    function initTabs() {
        const tripTypeTabs = document.querySelectorAll('.tab-btn');
        tripTypeTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tripTypeTabs.forEach(function (t) {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });

                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');

                const returnField = document.getElementById('return-field');
                const returnInput = document.getElementById('return-date');
                const isOneWay = this.getAttribute('data-tab') === 'one-way';

                if (returnField) {
                    if (isOneWay) {
                        returnField.classList.add('hidden');
                    } else {
                        returnField.classList.remove('hidden');
                    }
                }
                if (returnInput) {
                    if (isOneWay) {
                        returnInput.disabled = true;
                        returnInput.removeAttribute('required');
                    } else {
                        returnInput.disabled = false;
                        returnInput.setAttribute('required', 'required');
                    }
                }
            });

            tab.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    const tabs = Array.from(tripTypeTabs);
                    const currentIndex = tabs.indexOf(this);
                    let nextIndex;

                    if (e.key === 'ArrowRight') {
                        nextIndex = (currentIndex + 1) % tabs.length;
                    } else {
                        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                    }

                    tabs[nextIndex].focus();
                    tabs[nextIndex].click();
                    e.preventDefault();
                }
            });
        });
    }

    function initForms() {
        const forms = document.querySelectorAll('form[data-validate]');

        forms.forEach(function (form) {
            form.addEventListener('submit', function (e) {
                if (!validateForm(form)) {
                    e.preventDefault();
                    return false;
                }
            });
        });

        const inputs = document.querySelectorAll('.form-input');

        inputs.forEach(function (input) {
            input.addEventListener('blur', function () {
                const group = this.closest('.form-group');
                if (group) {
                    validateField(this, group);
                }
            });

            input.addEventListener('input', function () {
                const group = this.closest('.form-group');
                if (group && group.classList.contains('error')) {
                    validateField(this, group);
                }
            });

            input.addEventListener('invalid', function (e) {
                e.preventDefault();
                const group = this.closest('.form-group');
                if (group) {
                    validateField(this, group);
                }
            });
        });
    }

    function validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach(function (field) {
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
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        group.classList.remove('error', 'success');
        input.classList.remove('error', 'success');

        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (input.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        } else if (input.type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        if (!isValid) {
            group.classList.add('error');
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');

            if (errorEl) {
                errorEl.textContent = errorMessage;
                errorEl.classList.add('visible');
                if (input.id) {
                    errorEl.setAttribute('id', input.id + '-error');
                    input.setAttribute('aria-describedby', input.id + '-error');
                }
            }
        } else if (value) {
            group.classList.add('success');
            input.classList.add('success');
            input.setAttribute('aria-invalid', 'false');

            if (errorEl) {
                errorEl.textContent = '';
                errorEl.classList.remove('visible');
            }
        }

        return isValid;
    }

    function initDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');

        dropdowns.forEach(function (dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');

            if (!toggle) return;

            toggle.addEventListener('click', function (e) {
                e.preventDefault();
                const expanded = this.getAttribute('aria-expanded') === 'true';

                dropdowns.forEach(function (d) {
                    const t = d.querySelector('.dropdown-toggle');
                    d.classList.remove('open');
                    if (t) t.setAttribute('aria-expanded', 'false');
                });

                if (!expanded) {
                    dropdown.classList.add('open');
                    this.setAttribute('aria-expanded', 'true');
                }
            });

            const items = dropdown.querySelectorAll('.dropdown-item');
            items.forEach(function (item) {
                item.addEventListener('click', function (e) {
                    e.preventDefault();
                    dropdown.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
        });

        document.addEventListener('click', function (e) {
            dropdowns.forEach(function (dropdown) {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('open');
                    const toggle = dropdown.querySelector('.dropdown-toggle');
                    if (toggle) toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    let seatObserver = null;

    function initSeatSelection() {
        const seatMapContainer = document.querySelector('.seat-map-container');
        if (!seatMapContainer) return;

        const seats = seatMapContainer.querySelectorAll('.seat');
        let selectedSeats = [];
        let passengerCount = 1;

        if (window.FlyoraApp && window.FlyoraApp.bookingData) {
            passengerCount = window.FlyoraApp.bookingData.passengers || 1;
        }

        seats.forEach(function (seat) {
            if (seat.classList.contains('available')) {
                seat.addEventListener('click', function () {
                    const seatId = this.getAttribute('data-seat');
                    const seatRow = this.getAttribute('data-row');

                    if (this.classList.contains('selected')) {
                        this.classList.remove('selected');
                        selectedSeats = selectedSeats.filter(function (s) {
                            return s.id !== seatId;
                        });
                    } else if (selectedSeats.length < passengerCount) {
                        this.classList.add('selected');
                        selectedSeats.push({ id: seatId + '-' + seatRow, row: seatRow, seat: seatId });
                    } else {
                        if (typeof showNotification === 'function') {
                            showNotification('Maximum ' + passengerCount + ' seat(s) can be selected', 'warning');
                        }
                    }

                    updateSelectedSeatsDisplay();
                });

                seat.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.click();
                    }
                });
            }
        });

        const selectedSeatsDisplay = document.getElementById('selected-seats-display');
        function updateSelectedSeatsDisplay() {
            if (selectedSeatsDisplay) {
                if (selectedSeats.length > 0) {
                    selectedSeatsDisplay.textContent = selectedSeats.map(function (s) {
                        return s.seat + s.row;
                    }).join(', ');
                } else {
                    selectedSeatsDisplay.textContent = 'No seats selected';
                }
            }

            if (window.FlyoraApp) {
                window.FlyoraApp.bookingData.selectedSeats = selectedSeats;
            }
        }
    }

    function initPassengerForms() {
        let passengerCount = 1;
        if (window.FlyoraApp && window.FlyoraApp.bookingData) {
            passengerCount = window.FlyoraApp.bookingData.passengers || 1;
        }

        const passengerFormsContainer = document.getElementById('passenger-forms');
        if (!passengerFormsContainer) return;

        let html = '';
        const titles = ['Adult 1', 'Adult 2', 'Adult 3', 'Adult 4', 'Adult 5'];

        for (let i = 0; i < passengerCount; i++) {
            html += '<fieldset class="passenger-fieldset">' +
                '<legend class="form-label">' + (titles[i] || 'Passenger ' + (i + 1)) + '</legend>' +
                '<div class="grid grid-2 gap-lg">' +
                '<div class="form-group">' +
                '<label for="firstname-' + i + '" class="form-label">First Name</label>' +
                '<input type="text" id="firstname-' + i + '" class="form-input" required aria-required="true" placeholder="As on passport">' +
                '<span class="form-error" role="alert"></span>' +
                '</div>' +
                '<div class="form-group">' +
                '<label for="lastname-' + i + '" class="form-label">Last Name</label>' +
                '<input type="text" id="lastname-' + i + '" class="form-input" required aria-required="true" placeholder="As on passport">' +
                '<span class="form-error" role="alert"></span>' +
                '</div>' +
                '</div>' +
                '<div class="grid grid-2 gap-lg">' +
                '<div class="form-group">' +
                '<label for="email-' + i + '" class="form-label">Email</label>' +
                '<input type="email" id="email-' + i + '" class="form-input" required aria-required="true" placeholder="email@example.com" autocomplete="email">' +
                '<span class="form-error" role="alert"></span>' +
                '</div>' +
                '<div class="form-group">' +
                '<label for="phone-' + i + '" class="form-label">Phone</label>' +
                '<input type="tel" id="phone-' + i + '" class="form-input" required aria-required="true" placeholder="+1 234 567 8900" autocomplete="tel">' +
                '<span class="form-error" role="alert"></span>' +
                '</div>' +
                '</div>' +
                '</fieldset>';
        }

        passengerFormsContainer.innerHTML = html;
    }

    window.initComponents = initComponents;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.validateForm = validateForm;
    window.validateField = validateField;

})();