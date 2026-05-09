// Main - Application entry point
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
        selectedReturnFlight: null,
        selectedSeats: [],
        passengerDetails: [],
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

    domReady(function () {
        initApp();
    });

    function initApp() {
        if (typeof window.initLayout === 'function') window.initLayout();
        if (typeof window.initComponents === 'function') window.initComponents();
        if (typeof window.initUtilities === 'function') window.initUtilities();
        if (typeof window.initAnimations === 'function') window.initAnimations();
        if (typeof window.initAuth === 'function') window.initAuth();

        initBookingFlow();
        autoFillDates();
        initSearchForm();
        initModifySearch();

        window.addEventListener('error', function (e) {
            console.error('Application error:', e.error);
        });

        window.addEventListener('unhandledrejection', function (e) {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }

    function initBookingFlow() {
        const nextBtns = document.querySelectorAll('[data-next]');
        const prevBtns = document.querySelectorAll('[data-prev]');

        nextBtns.forEach(function (btn) {
            btn.addEventListener('click', handleNextStep);
        });

        prevBtns.forEach(function (btn) {
            btn.addEventListener('click', handlePrevStep);
        });

        updateStepVisibility();
    }

    function handleNextStep(e) {
        const btn = e.currentTarget;
        const targetStep = parseInt(btn.getAttribute('data-next'), 10);

        if (validateCurrentStep()) {
            saveBookingData();
            currentStep = targetStep;
            updateStepVisibility();
            updateProgressIndicator();
            scrollToTop();
        }
    }

    function handlePrevStep(e) {
        const btn = e.currentTarget;
        const targetStep = parseInt(btn.getAttribute('data-prev'), 10);

        currentStep = targetStep;
        updateStepVisibility();
        updateProgressIndicator();
        scrollToTop();
    }

    function updateStepVisibility() {
        const steps = document.querySelectorAll('.step-content');

        steps.forEach(function (step, index) {
            if (index + 1 === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        updateProgressIndicator();
        updateNavigationButtons();
    }

    function updateProgressIndicator() {
        const steps = document.querySelectorAll('.progress-step');

        steps.forEach(function (step, index) {
            const stepNum = index + 1;

            step.classList.remove('active', 'completed');

            if (stepNum < currentStep) {
                step.classList.add('completed');
            } else if (stepNum === currentStep) {
                step.classList.add('active');
            }
        });

        const connectors = document.querySelectorAll('.progress-connector');
        connectors.forEach(function (connector, index) {
            if (index + 1 < currentStep) {
                connector.classList.add('completed');
            } else {
                connector.classList.remove('completed');
            }
        });
    }

    function updateNavigationButtons() {
        const prevBtn = document.querySelector('.btn-prev');
        const nextBtn = document.querySelector('.btn-next');

        if (prevBtn) {
            if (currentStep === 1) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
                prevBtn.setAttribute('data-prev', currentStep - 1);
            }
        }

        if (nextBtn) {
            if (currentStep === totalSteps) {
                nextBtn.classList.add('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                nextBtn.setAttribute('data-next', currentStep + 1);
            }
        }
    }

    function validateCurrentStep() {
        const currentStepEl = document.querySelector('.step-content.active');
        if (!currentStepEl) return true;

        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(function (field) {
            const group = field.closest('.form-group');
            const errorEl = group.querySelector('.form-error');

            if (!field.value.trim()) {
                isValid = false;
                group.classList.add('error');
                field.classList.add('error');

                if (errorEl) {
                    errorEl.textContent = 'This field is required';
                    errorEl.classList.add('visible');
                }
            } else {
                group.classList.remove('error');
                field.classList.remove('error');

                if (errorEl) {
                    errorEl.textContent = '';
                    errorEl.classList.remove('visible');
                }
            }
        });

        if (!isValid && typeof showNotification === 'function') {
            showNotification('Please fill in all required fields', 'error');
        }

        return isValid;
    }

    function saveBookingData() {
        const origin = document.getElementById('origin');
        const destination = document.getElementById('destination');
        const departureDate = document.getElementById('departure-date');
        const returnDate = document.getElementById('return-date');
        const passengers = document.getElementById('passengers');
        const cabin = document.getElementById('cabin');
        const tripTypeInputs = document.querySelectorAll('input[name="trip-type"]');

        tripTypeInputs.forEach(function (input) {
            if (input.checked) {
                bookingData.tripType = input.value;
            }
        });

        if (origin) bookingData.origin = origin.value;
        if (destination) bookingData.destination = destination.value;
        if (departureDate) bookingData.departureDate = departureDate.value;
        if (returnDate) bookingData.returnDate = returnDate.value;
        if (passengers) bookingData.passengers = parseInt(passengers.value, 10);
        if (cabin) bookingData.cabinClass = cabin.value;

        updateBookingSummary();
    }

    function updateBookingSummary() {
        const summaryOrigin = document.getElementById('summary-origin');
        const summaryDestination = document.getElementById('summary-destination');
        const summaryDeparture = document.getElementById('summary-departure');
        const summaryReturn = document.getElementById('summary-return');
        const summaryPassengers = document.getElementById('summary-passengers');
        const summaryClass = document.getElementById('summary-class');

        if (summaryOrigin) summaryOrigin.textContent = getAirportName(bookingData.origin) || '-';
        if (summaryDestination) summaryDestination.textContent = getAirportName(bookingData.destination) || '-';
        if (summaryDeparture) summaryDeparture.textContent = formatDateDisplay(bookingData.departureDate);
        if (summaryReturn) summaryReturn.textContent = bookingData.tripType === 'roundtrip' ? formatDateDisplay(bookingData.returnDate) : 'One Way';
        if (summaryPassengers) summaryPassengers.textContent = bookingData.passengers + ' Passenger' + (bookingData.passengers > 1 ? 's' : '');
        if (summaryClass) summaryClass.textContent = capitalizeFirst(bookingData.cabinClass);
    }

    function updateStep1Review(flight) {
        const badge = document.getElementById('flight-badge');
        const airline = document.getElementById('flight-airline');
        const deptTime = document.getElementById('review-departure-time');
        const deptCode = document.getElementById('review-origin');
        const duration = document.getElementById('review-duration');
        const stops = document.getElementById('review-stops');
        const arrTime = document.getElementById('review-arrival-time');
        const arrCode = document.getElementById('review-destination');
        const deptDate = document.getElementById('review-departure-date');
        const returnDate = document.getElementById('review-return-date');

        if (badge) badge.textContent = capitalizeFirst(bookingData.cabinClass);
        if (airline) airline.textContent = flight ? flight.airline : 'Flyora Air';
        if (deptTime) deptTime.textContent = flight ? flight.departure : '-';
        if (deptCode) deptCode.textContent = bookingData.origin || '-';
        if (duration) duration.textContent = flight ? flight.duration : '-';
        if (stops) stops.textContent = flight ? flight.stopsText : '-';
        if (arrTime) arrTime.textContent = flight ? flight.arrival : '-';
        if (arrCode) arrCode.textContent = bookingData.destination || '-';
        if (deptDate) deptDate.textContent = formatDateDisplay(bookingData.departureDate) || '-';
        if (returnDate) returnDate.textContent = formatDateDisplay(bookingData.returnDate) || '-';
    }

    function autoFillDates() {
        const departureInput = document.getElementById('departure-date');
        const returnInput = document.getElementById('return-date');

        if (departureInput && !departureInput.value) {
            const today = new Date();
            const departure = new Date(today);
            departure.setDate(departure.getDate() + 14);

            departureInput.value = formatDateISO(departure);
            departureInput.min = formatDateISO(today);

            if (returnInput) {
                const returns = new Date(departure);
                returns.setDate(returns.getDate() + 7);

                returnInput.value = formatDateISO(returns);
                returnInput.min = formatDateISO(today);
            }
        }
    }

    function initModifySearch() {
        const modifyBtn = document.getElementById('modify-search-btn');
        if (modifyBtn) {
            modifyBtn.addEventListener('click', function () {
                document.getElementById('flight-results').classList.add('hidden');
                document.getElementById('book').classList.remove('hidden');
            });
        }
    }

    function initSearchForm() {
        const searchForm = document.getElementById('flight-search');
        const tripTypeInputs = document.querySelectorAll('input[name="trip-type"]');
        const returnField = document.getElementById('return-field');

        if (!searchForm) return;

        tripTypeInputs.forEach(function (input) {
            input.addEventListener('change', function () {
                bookingData.tripType = this.value;

                if (returnField) {
                    const returnInput = document.getElementById('return-date');
                    if (this.value === 'one-way') {
                        returnField.classList.add('hidden');
                        if (returnInput) {
                            returnInput.removeAttribute('required');
                        }
                    } else {
                        returnField.classList.remove('hidden');
                        const returnInput = document.getElementById('return-date');
                        if (returnInput) {
                            returnInput.setAttribute('required', 'required');
                        }
                    }
                }
            });
        });

        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            let isValid = true;
            const requiredFields = searchForm.querySelectorAll('[required]');

            requiredFields.forEach(function (field) {
                const group = field.closest('.form-group');

                if (!field.value.trim()) {
                    isValid = false;
                    group.classList.add('error');
                    field.classList.add('error');
                } else {
                    group.classList.remove('error');
                    field.classList.remove('error');
                }
            });

            const origin = document.getElementById('origin');
            const destination = document.getElementById('destination');

            if (origin && destination && origin.value === destination.value) {
                isValid = false;
                destination.classList.add('error');
                destination.closest('.form-group').classList.add('error');

                if (typeof showNotification === 'function') {
                    showNotification('Origin and destination cannot be the same', 'error');
                }
            }

            if (isValid) {
                saveBookingData();
                showLoadingState();

                setTimeout(function () {
                    hideLoadingState();
                    showFlightsResults();
                }, 1500);
            }
        });
    }

    const debouncedScroll = window.debounce(function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, 100);

    function showLoadingState() {
        const loadingEl = document.getElementById('loading-state');
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
        }
    }

    function hideLoadingState() {
        const loadingEl = document.getElementById('loading-state');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    }

    function showFlightsResults() {
        const resultsSection = document.getElementById('flight-results');
        const searchSection = document.getElementById('book');

        if (searchSection) {
            searchSection.classList.add('hidden');
        }

        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            generateFlightCards();
        }

        debouncedScroll();
    }

    function generateFlightCards() {
        const flightsList = document.getElementById('flights-list');
        if (!flightsList) return;

        const flights = generateMockFlights(6);
        let html = '';

        flights.forEach(function (flight, index) {
            html += createFlightCard(flight, index);
        });

        flightsList.innerHTML = html;

        const flightCards = flightsList.querySelectorAll('.flight-card');
        const flightArray = flights;
        flightCards.forEach(function (card, index) {
            card.classList.add('stagger-item');
            card.style.animationDelay = (index * 100) + 'ms';

            const selectBtn = card.querySelector('.btn-select-flight');
            if (selectBtn) {
                selectBtn.addEventListener('click', function () {
                    selectFlight(flightArray[index], card);
                });
            }
        });
    }

    function generateMockFlights(count) {
        const airlines = ['Flyora Air', 'Flyora Express', 'Flyora Premium'];
        const basePrice = 200;
        const flights = [];

        for (let i = 0; i < count; i++) {
            const hours = 2 + Math.floor(Math.random() * 10);
            const minutes = Math.floor(Math.random() * 60);
            const stops = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : 2) : 0;
            const price = Math.max(50, basePrice + (hours * 50) + (stops * -20) + Math.floor(Math.random() * 100));

            flights.push({
                id: 'FL' + (1000 + i),
                airline: airlines[Math.floor(Math.random() * airlines.length)],
                departure: formatTime(addHours(new Date(), 6 + i * 2)),
                arrival: formatTime(addHours(new Date(), 6 + i * 2 + hours)),
                duration: hours + 'h ' + minutes + 'm',
                stops: stops,
                stopsText: stops === 0 ? 'Nonstop' : (stops === 1 ? '1 Stop' : stops + ' Stops'),
                price: price,
                origin: bookingData.origin,
                destination: bookingData.destination
            });
        }

        return flights.sort(function (a, b) { return a.price - b.price });
    }

    function createFlightCard(flight, index) {
        return '<article class="flight-card" data-flight-id="' + flight.id + '">' +
            '<div class="flight-card-main">' +
            '<div class="flight-time-block">' +
            '<div class="flight-time">' + flight.departure + '</div>' +
            '<div class="flight-code">' + flight.origin + '</div>' +
            '</div>' +
            '<div class="flight-duration-block">' +
            '<div class="flight-duration">' + flight.duration + '</div>' +
            '<div class="flight-stops">' + flight.stopsText + '</div>' +
            '<div class="flight-route-line">' +
            '<div class="route-line"></div>' +
            '</div>' +
            '<div class="flight-airline text-sm text-muted mt-sm">' + flight.airline + '</div>' +
            '</div>' +
            '<div class="flight-time-block">' +
            '<div class="flight-time">' + flight.arrival + '</div>' +
            '<div class="flight-code">' + flight.destination + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="flight-details">' +
            '<div class="flight-info">' +
            '<span>Aircraft: Boeing 787</span>' +
            '<span>Class: ' + capitalizeFirst(bookingData.cabinClass) + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-xl">' +
            '<div class="flight-price">$' + flight.price + '</div>' +
            '<button class="btn btn-primary btn-select-flight" type="button">Select</button>' +
            '</div>' +
            '</div>' +
            '</article>';
    }

    function selectFlight(flight, card) {
        document.querySelectorAll('.flight-card').forEach(function (c) {
            c.classList.remove('selected');
        });

        card.classList.add('selected');

        bookingData.selectedFlight = flight;

        updateStep1Review(flight);

        setTimeout(function () {
            const resultsSection = document.getElementById('flight-results');
            if (resultsSection) {
                resultsSection.classList.add('hidden');
            }

            const bookingSection = document.getElementById('booking-flow');
            if (bookingSection) {
                bookingSection.classList.remove('hidden');
                currentStep = 1;
                updateStepVisibility();
                updateBookingSummary();
            }

            debouncedScroll();
        }, 500);
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function formatDateDisplay(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }

    function getAirportName(code) {
        if (typeof window.getAirportName === 'function') {
            return window.getAirportName(code);
        }
        return code;
    }

    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function handlePaymentConfirmation() {
        const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
        const printTicketBtn = document.getElementById('print-ticket-btn');
        const bookAnotherBtn = document.getElementById('book-another-btn');

        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', doPaymentConfirmation);
        }
        if (printTicketBtn) {
            printTicketBtn.addEventListener('click', function () {
                window.print();
            });
        }
        if (bookAnotherBtn) {
            bookAnotherBtn.addEventListener('click', function () {
                location.reload();
            });
        }
    }

    function doPaymentConfirmation() {
        const paymentForm = document.getElementById('payment-form');
        let isValid = true;

        if (paymentForm) {
            const requiredFields = paymentForm.querySelectorAll('[required]');
            requiredFields.forEach(function (field) {
                const group = field.closest('.form-group');
                if (group) {
                    const errorEl = group.querySelector('.form-error');
                    if (!field.value.trim()) {
                        isValid = false;
                        group.classList.add('error');
                        if (errorEl) {
                            errorEl.textContent = 'This field is required';
                            errorEl.classList.add('visible');
                        }
                    } else {
                        group.classList.remove('error');
                        if (errorEl) {
                            errorEl.textContent = '';
                            errorEl.classList.remove('visible');
                        }
                    }
                }
            });
        }

        if (!isValid) {
            if (typeof showNotification === 'function') {
                showNotification('Please complete all payment details', 'error');
            }
            return;
        }

        showLoadingOverlay();

        setTimeout(function () {
            hideLoadingOverlay();

            const bookingRef = generateBookingReference();
            bookingData.bookingReference = bookingRef;

            const ticketRef = document.getElementById('booking-ref');
            const ticketOrigin = document.getElementById('ticket-origin');
            const ticketDestination = document.getElementById('ticket-destination');
            const ticketDate = document.getElementById('ticket-date');
            const ticketPassengers = document.getElementById('ticket-passengers');

            if (ticketRef) ticketRef.textContent = bookingRef;
            if (ticketOrigin) ticketOrigin.textContent = bookingData.origin;
            if (ticketDestination) ticketDestination.textContent = bookingData.destination;
            if (ticketDate) ticketDate.textContent = formatDateDisplay(bookingData.departureDate);
            if (ticketPassengers) ticketPassengers.textContent = bookingData.passengers;

            const totalPrice = document.getElementById('summary-total');
            if (totalPrice && bookingData.selectedFlight) {
                const price = bookingData.selectedFlight.price * bookingData.passengers;
                if (typeof window.formatCurrency === 'function') {
                    totalPrice.textContent = window.formatCurrency(price);
                } else {
                    totalPrice.textContent = '$' + price;
                }
            }

            currentStep = 5;
            updateStepVisibility();
            updateProgressIndicator();
            debouncedScroll();

            if (typeof showNotification === 'function') {
                showNotification('Booking confirmed! Reference: ' + bookingRef, 'success');
            }
        }, 2000);
    }

    function showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.style.cssText = 'position:fixed;inset:0;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;gap:16px;';
        overlay.innerHTML = '<div class="spinner spinner-large"></div><p>Processing your payment...</p>';
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    }

    function hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
        document.body.style.overflow = '';
    }

    function generateBookingReference() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'FLY';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    window.FlyoraApp = {
        bookingData: bookingData,
        currentStep: currentStep,
        totalSteps: totalSteps,
        goToStep: function (step) {
            if (step >= 1 && step <= totalSteps) {
                currentStep = step;
                updateStepVisibility();
                updateProgressIndicator();
                scrollToTop();
            }
        },
        getBookingData: function () {
            return bookingData;
        }
    };

    handlePaymentConfirmation();

})();