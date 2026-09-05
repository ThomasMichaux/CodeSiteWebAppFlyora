(function () {
    'use strict';

    const bookingData = {
        tripType: 'roundtrip',
        origin: '',
        destination: '',
        departureDate: '',
        returnDate: '',
        passengers: 1,
        cabinClass: 'economy',
        selectedFlight: null,
        selectedSeats: [],
        bookingReference: ''
    };

    let currentStep = 1;
    const totalSteps = 5;

    function domReady(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    domReady(initApp);

    function initApp() {
        window.addEventListener('error', function (e) {
            console.error('Application error:', e.error);
        });

        window.addEventListener('unhandledrejection', function (e) {
            console.error('Unhandled promise rejection:', e.reason);
        });

        [
            ['utilities', window.initUtilities],
            ['layout', window.initLayout],
            ['components', window.initComponents],
            ['auth', window.initAuth],
            ['booking flow', initBookingFlow],
            ['trip type', initTripTypeSync],
            ['dates', autoFillDates],
            ['search form', initSearchForm],
            ['back to search', initBackToSearch],
            ['payment', initPaymentConfirmation],
            ['demo buttons', initDemoFeatureButtons],
            ['footer', initFooterYear]
        ].forEach(function (entry) {
            if (typeof entry[1] !== 'function') return;
            try {
                entry[1]();
            } catch (err) {
                console.error('Failed to initialise ' + entry[0] + ':', err);
            }
        });
    }

    function initBookingFlow() {
        document.querySelectorAll('[data-next]').forEach(function (btn) {
            btn.addEventListener('click', handleNextStep);
        });

        document.querySelectorAll('[data-prev]').forEach(function (btn) {
            btn.addEventListener('click', handlePrevStep);
        });

        updateStepVisibility();
    }

    function handleNextStep(e) {
        const targetStep = parseInt(e.currentTarget.getAttribute('data-next'), 10);

        if (validateCurrentStep()) {
            saveBookingData();
            goToStep(targetStep);
        }
    }

    function handlePrevStep(e) {
        goToStep(parseInt(e.currentTarget.getAttribute('data-prev'), 10));
    }

    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;
        currentStep = step;
        updateStepVisibility();
        scrollToSection('booking-flow');
        focusActiveStep();
    }

    function updateStepVisibility() {
        document.querySelectorAll('.step-content').forEach(function (step, index) {
            step.classList.toggle('active', index + 1 === currentStep);
        });

        const inner = document.querySelector('.booking-wrapper-inner');
        const sidebar = inner ? inner.querySelector('.sidebar') : null;
        const isFinalStep = currentStep === totalSteps;

        if (sidebar) sidebar.classList.toggle('hidden', isFinalStep);
        if (inner) inner.classList.toggle('no-sidebar', isFinalStep);

        updateProgressIndicator();
    }

    function focusActiveStep() {
        const active = document.querySelector('.step-content.active');
        if (!active) return;

        const heading = active.querySelector('h3');
        if (!heading) return;

        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
    }

    function updateProgressIndicator() {
        document.querySelectorAll('.progress-step').forEach(function (step, index) {
            const stepNum = index + 1;

            step.classList.remove('active', 'completed');

            if (stepNum < currentStep) {
                step.classList.add('completed');
            } else if (stepNum === currentStep) {
                step.classList.add('active');
            }

            if (stepNum === currentStep) {
                step.setAttribute('aria-current', 'step');
            } else {
                step.removeAttribute('aria-current');
            }
        });

        document.querySelectorAll('.progress-connector').forEach(function (connector, index) {
            connector.classList.toggle('completed', index + 1 < currentStep);
        });
    }

    function validateCurrentStep() {
        const currentStepEl = document.querySelector('.step-content.active');
        if (!currentStepEl) return true;

        if (!window.validateForm(currentStepEl)) {
            notify('Please correct the highlighted fields', 'error');
            const firstError = currentStepEl.querySelector('.form-input.error');
            if (firstError) firstError.focus();
            return false;
        }

        if (currentStepEl.id === 'step-3') {
            return window.validateSeatSelection();
        }

        return true;
    }

    function saveBookingData() {
        const origin = document.getElementById('origin');
        const destination = document.getElementById('destination');
        const departureDate = document.getElementById('departure-date');
        const returnDate = document.getElementById('return-date');
        const passengers = document.getElementById('passengers');
        const cabin = document.getElementById('cabin');

        if (origin) bookingData.origin = origin.value;
        if (destination) bookingData.destination = destination.value;
        if (departureDate) bookingData.departureDate = departureDate.value;
        if (passengers) bookingData.passengers = parseInt(passengers.value, 10) || 1;
        if (cabin) bookingData.cabinClass = cabin.value;

        bookingData.returnDate = (bookingData.tripType === 'roundtrip' && returnDate)
            ? returnDate.value
            : '';

        updateBookingSummary();
    }

    function initTripTypeSync() {
        document.addEventListener('flyora:triptypechange', function (e) {
            bookingData.tripType = e.detail.tripType;
            if (bookingData.tripType !== 'roundtrip') {
                bookingData.returnDate = '';
            }
            updateBookingSummary();
        });
    }

    function updateBookingSummary() {
        setText('summary-origin', window.getAirportName(bookingData.origin) || '-');
        setText('summary-destination', window.getAirportName(bookingData.destination) || '-');
        setText('summary-departure', formatDateDisplay(bookingData.departureDate));
        setText('summary-return', bookingData.tripType === 'roundtrip'
            ? formatDateDisplay(bookingData.returnDate)
            : 'One Way');
        setText('summary-passengers', bookingData.passengers +
            ' Passenger' + (bookingData.passengers > 1 ? 's' : ''));
        setText('summary-class', capitalizeFirst(bookingData.cabinClass));
        setText('summary-seats', formatSeats());
        setText('summary-total', formatTotal());
    }

    function formatSeats() {
        return bookingData.selectedSeats.length
            ? bookingData.selectedSeats.join(', ')
            : '-';
    }

    function getTotalPrice() {
        if (!bookingData.selectedFlight) return null;
        return bookingData.selectedFlight.price * bookingData.passengers;
    }

    function formatTotal() {
        const total = getTotalPrice();
        if (total === null) return '-';
        return typeof window.formatCurrency === 'function'
            ? window.formatCurrency(total)
            : '$' + total;
    }

    function updateStep1Review(flight) {
        setText('flight-badge', capitalizeFirst(bookingData.cabinClass));
        setText('flight-airline', flight ? flight.airline : 'Flyora Air');
        setText('review-departure-time', flight ? flight.departure : '-');
        setText('review-origin', bookingData.origin || '-');
        setText('review-duration', flight ? flight.duration : '-');
        setText('review-stops', flight ? flight.stopsText : '-');
        setText('review-arrival-time', flight ? flight.arrival : '-');
        setText('review-destination', bookingData.destination || '-');
        setText('review-departure-date', formatDateDisplay(bookingData.departureDate));
        setText('review-return-date', bookingData.tripType === 'roundtrip'
            ? formatDateDisplay(bookingData.returnDate)
            : 'One Way');
        setText('review-flight-number', flight ? flight.id : '-');
    }

    function autoFillDates() {
        const departureInput = document.getElementById('departure-date');
        const returnInput = document.getElementById('return-date');
        if (!departureInput) return;

        const today = formatDateISO(new Date());

        if (!departureInput.value) {
            const departure = new Date();
            departure.setDate(departure.getDate() + 14);
            departureInput.value = formatDateISO(departure);

            if (returnInput) {
                const returns = new Date(departure);
                returns.setDate(returns.getDate() + 7);
                returnInput.value = formatDateISO(returns);
            }
        }

        departureInput.min = today;
        if (returnInput) {
            returnInput.min = departureInput.value || today;

            departureInput.addEventListener('change', function () {
                returnInput.min = departureInput.value || today;
                if (returnInput.value && returnInput.value < departureInput.value) {
                    returnInput.value = departureInput.value;
                }
            });
        }
    }

    function initSearchForm() {
        const searchForm = document.getElementById('flight-search');
        if (!searchForm) return;

        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            let isValid = window.validateForm(searchForm);

            const origin = document.getElementById('origin');
            const destination = document.getElementById('destination');
            const departure = document.getElementById('departure-date');
            const returns = document.getElementById('return-date');

            if (origin && destination && origin.value && origin.value === destination.value) {
                isValid = false;
                markInvalid(destination, 'Origin and destination cannot be the same');
                notify('Origin and destination cannot be the same', 'error');
            }

            const isRoundTrip = bookingData.tripType === 'roundtrip';
            if (isValid && isRoundTrip && departure && returns &&
                departure.value && returns.value && returns.value < departure.value) {
                isValid = false;
                markInvalid(returns, 'Return date cannot be before the departure date');
                notify('Return date cannot be before the departure date', 'error');
            }

            if (!isValid) {
                const firstError = searchForm.querySelector('.form-input.error');
                if (firstError) firstError.focus();
                return;
            }

            saveBookingData();

            if (typeof window.refreshBookingComponents === 'function') {
                window.refreshBookingComponents();
            }

            showLoadingState();

            setTimeout(function () {
                hideLoadingState();
                showFlightsResults();
            }, 1500);
        });
    }

    function markInvalid(field, message) {
        const group = field.closest('.form-group');
        if (!group) return;
        group.classList.remove('success');
        field.classList.remove('success');
        group.classList.add('error');
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
        window.setFieldError(field, group.querySelector('.form-error'), message);
    }

    function initBackToSearch() {
        ['back-to-search-btn', 'modify-search-btn'].forEach(function (id) {
            const btn = document.getElementById(id);
            if (!btn) return;

            btn.addEventListener('click', function () {
                showBrowseView();
                scrollToSection('book');

                const origin = document.getElementById('origin');
                if (origin) origin.focus({ preventScroll: true });
            });
        });
    }

    function showBrowseView() {
        hide('loading-state');
        hide('flight-results');
        hide('booking-flow');
        show('book');
    }

    function showLoadingState() {
        hide('book');
        show('loading-state');
        scrollToSection('loading-state');
        window.announce('Searching for the best flights');
    }

    function hideLoadingState() {
        hide('loading-state');
    }

    function showFlightsResults() {
        hide('book');
        show('flight-results');

        const count = generateFlightCards();
        scrollToSection('flight-results');

        window.announce(count
            ? count + ' flight' + (count > 1 ? 's' : '') + ' found. Choose one to continue.'
            : 'No flights found for this route.');

        const heading = document.getElementById('results-title');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
        }
    }

    function generateFlightCards() {
        const flightsList = document.getElementById('flights-list');
        const emptyState = document.getElementById('empty-state');
        if (!flightsList) return 0;

        const flights = generateMockFlights(6);

        flightsList.innerHTML = flights.map(createFlightCard).join('');

        if (emptyState) {
            emptyState.classList.toggle('hidden', flights.length > 0);
        }
        flightsList.classList.toggle('hidden', flights.length === 0);

        flightsList.querySelectorAll('.flight-card').forEach(function (card, index) {
            card.classList.add('stagger-item');
            card.style.animationDelay = (index * 100) + 'ms';

            const selectBtn = card.querySelector('.btn-select-flight');
            if (selectBtn) {
                selectBtn.addEventListener('click', function () {
                    selectFlight(flights[index], card);
                });
            }
        });

        return flights.length;
    }

    function generateMockFlights(count) {
        if (!window.hasDirectService(bookingData.origin, bookingData.destination)) {
            return [];
        }

        const airlines = ['Flyora Air', 'Flyora Express', 'Flyora Premium'];
        const basePrice = 200;
        const flights = [];

        const dateStr = bookingData.departureDate || formatDateISO(new Date());
        const firstDeparture = new Date(dateStr + 'T06:00:00');

        for (let i = 0; i < count; i++) {
            const durationMinutes = (2 + Math.floor(Math.random() * 10)) * 60 +
                Math.floor(Math.random() * 60);
            const stops = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : 2) : 0;
            const price = Math.max(
                50,
                basePrice + Math.round(durationMinutes / 60 * 50) - (stops * 20) +
                Math.floor(Math.random() * 100)
            );

            const departsAt = window.addMinutes(firstDeparture, i * 145);
            const arrivesAt = window.addMinutes(departsAt, durationMinutes);

            flights.push({
                id: 'FL' + (1000 + i),
                airline: airlines[Math.floor(Math.random() * airlines.length)],
                departure: formatTime(departsAt),
                arrival: formatTime(arrivesAt),
                arrivesNextDay: arrivesAt.getDate() !== departsAt.getDate(),
                duration: formatDuration(durationMinutes),
                stops: stops,
                stopsText: stops === 0 ? 'Nonstop' : (stops === 1 ? '1 Stop' : stops + ' Stops'),
                price: price,
                origin: bookingData.origin,
                destination: bookingData.destination
            });
        }

        return flights.sort(function (a, b) { return a.price - b.price; });
    }

    function createFlightCard(flight) {
        const cabin = capitalizeFirst(bookingData.cabinClass);
        const selectLabel = 'Select ' + flight.airline + ' flight ' + flight.id +
            ' departing ' + flight.departure + ' for $' + flight.price;
        const nextDay = flight.arrivesNextDay
            ? '<span class="flight-next-day" title="Arrives the following day">+1</span>'
            : '';

        return `<article class="flight-card" data-flight-id="${flight.id}">
            <div class="flight-card-main">
                <div class="flight-time-block">
                    <div class="flight-time">${flight.departure}</div>
                    <div class="flight-code">${flight.origin}</div>
                </div>
                <div class="flight-duration-block">
                    <div class="flight-duration">${flight.duration}</div>
                    <div class="flight-stops">${flight.stopsText}</div>
                    <div class="flight-route-line">
                        <div class="route-line"></div>
                    </div>
                    <div class="flight-airline text-sm text-muted mt-sm">${flight.airline}</div>
                </div>
                <div class="flight-time-block">
                    <div class="flight-time">${flight.arrival}${nextDay}</div>
                    <div class="flight-code">${flight.destination}</div>
                </div>
            </div>
            <div class="flight-details">
                <div class="flight-info">
                    <span>Aircraft: Boeing 787</span>
                    <span>Class: ${cabin}</span>
                </div>
                <div class="flex items-center gap-xl">
                    <div class="flight-price">$${flight.price}</div>
                    <button class="btn btn-primary btn-select-flight" type="button"
                        aria-label="${selectLabel}">Select</button>
                </div>
            </div>
        </article>`;
    }

    function selectFlight(flight, card) {
        document.querySelectorAll('.flight-card').forEach(function (c) {
            c.classList.remove('selected');
        });
        card.classList.add('selected');

        bookingData.selectedFlight = flight;
        updateStep1Review(flight);
        updateBookingSummary();

        setTimeout(function () {
            hide('flight-results');
            show('booking-flow');
            goToStep(1);
        }, 500);
    }

    function initPaymentConfirmation() {
        const confirmBtn = document.getElementById('confirm-payment-btn');
        const printBtn = document.getElementById('print-ticket-btn');
        const bookAnotherBtn = document.getElementById('book-another-btn');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', doPaymentConfirmation);
        }
        if (printBtn) {
            printBtn.addEventListener('click', function () { window.print(); });
        }
        if (bookAnotherBtn) {
            bookAnotherBtn.addEventListener('click', function () { location.reload(); });
        }
    }

    function doPaymentConfirmation() {
        if (!validateCurrentStep()) return;

        showLoadingOverlay();

        setTimeout(function () {
            hideLoadingOverlay();

            bookingData.bookingReference = window.generateBookingReference();

            setText('booking-ref', bookingData.bookingReference);
            setText('ticket-origin', bookingData.origin);
            setText('ticket-destination', bookingData.destination);
            setText('ticket-date', formatDateDisplay(bookingData.departureDate));
            setText('ticket-passengers', bookingData.passengers);
            setText('ticket-seats', formatSeats());
            setText('summary-total', formatTotal());

            goToStep(5);

            notify('Booking confirmed! Reference: ' + bookingData.bookingReference, 'success');
        }, 2000);
    }

    function showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');

        const spinner = document.createElement('div');
        spinner.className = 'spinner spinner-large';
        const label = document.createElement('p');
        label.textContent = 'Processing your payment...';

        overlay.appendChild(spinner);
        overlay.appendChild(label);
        document.body.appendChild(overlay);
        window.lockScroll();
    }

    function hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
            window.unlockScroll();
        }
    }

    function initDemoFeatureButtons() {
        document.querySelectorAll('[data-demo-feature]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                notify(this.getAttribute('data-demo-feature') +
                    ' is not part of this demo.', 'info');
            });
        });
    }

    function initFooterYear() {
        setText('footer-year', new Date().getFullYear());
    }

    function notify(message, type) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        }
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function show(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }

    function hide(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }

    function scrollToSection(id) {
        const target = document.getElementById(id);
        if (!target) return;

        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    const formatDateISO = window.formatDateInput;

    function formatDateDisplay(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        });
    }

    function formatDuration(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return hours + 'h ' + String(minutes).padStart(2, '0') + 'm';
    }

    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    window.showBrowseView = showBrowseView;

    window.FlyoraApp = {
        bookingData: bookingData,
        totalSteps: totalSteps,
        get currentStep() {
            return currentStep;
        },
        goToStep: goToStep,
        refreshSummary: updateBookingSummary,
        getBookingData: function () {
            return bookingData;
        }
    };

})();