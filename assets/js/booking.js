// Studio booking page controller.
// Handles availability rendering, hourly estimate calculation, and booking submission to n8n webhooks.
(function initStudioBookingPage() {
    const app = document.querySelector('[data-booking-app]');
    if (!app) {
        return;
    }

    const elements = {
        duration: app.querySelector('[data-booking-duration]'),
        estimate: app.querySelector('[data-booking-estimate]'),
        monthLabel: app.querySelector('[data-booking-month-label]'),
        prevMonth: app.querySelector('[data-booking-prev-month]'),
        nextMonth: app.querySelector('[data-booking-next-month]'),
        calendarDays: app.querySelector('[data-booking-days]'),
        slotsHeading: app.querySelector('[data-booking-slots-heading]'),
        slots: app.querySelector('[data-booking-slots]'),
        loadStatus: app.querySelector('[data-booking-load-status]'),
        form: app.querySelector('[data-booking-form]'),
        formStatus: app.querySelector('[data-booking-status]'),
        submit: app.querySelector('[data-booking-submit]'),
        summaryDate: app.querySelector('[data-booking-summary-date]'),
        summaryStart: app.querySelector('[data-booking-summary-start]'),
        summaryEnd: app.querySelector('[data-booking-summary-end]'),
        summaryDuration: app.querySelector('[data-booking-summary-duration]'),
        summaryEstimate: app.querySelector('[data-booking-summary-estimate]'),
    };

    if (!elements.duration || !elements.calendarDays || !elements.form) {
        return;
    }

    const config = {
        availabilityEndpoint: (app.dataset.availabilityEndpoint || '').trim(),
        bookingEndpoint: (app.dataset.bookingEndpoint || '').trim(),
        timezone: app.dataset.timezone || 'America/Vancouver',
        businessStart: app.dataset.businessStart || '09:00',
        businessEnd: app.dataset.businessEnd || '17:00',
        currency: app.dataset.currency || 'CAD',
        daysAhead: clampNumber(parseInt(app.dataset.daysAhead, 10), 14, 120, 60),
        hourlyRate: clampNumber(parseFloat(app.dataset.hourlyRate), 25, 20000, 150),
        minHours: clampNumber(parseInt(app.dataset.minHours, 10), 2, 24, 2),
        maxHours: clampNumber(parseInt(app.dataset.maxHours, 10), 2, 24, 12),
        refreshMs: clampNumber(parseInt(app.dataset.refreshMs, 10), 5000, 300000, 30000),
    };

    config.maxHours = Math.max(config.minHours, config.maxHours);

    const today = startOfDay(new Date());
    const rangeEnd = addDays(today, config.daysAhead);

    const state = {
        currentMonth: new Date(today.getFullYear(), today.getMonth(), 1),
        durationHours: config.minHours,
        blockedRanges: [],
        slotCache: new Map(),
        selectedDateKey: null,
        selectedSlotId: null,
        activeSlot: null,
        loading: false,
        refreshTimerId: null,
    };

    setupDurationOptions();
    bindEvents();
    loadAvailability();
    setupAutoRefresh();

    function bindEvents() {
        elements.duration.addEventListener('change', () => {
            const parsed = parseInt(elements.duration.value, 10);
            state.durationHours = Number.isFinite(parsed) ? parsed : config.minHours;
            state.selectedSlotId = null;
            state.activeSlot = null;
            state.slotCache.clear();
            updateEstimate();
            ensureSelectedDate();
            renderCalendar();
            renderSlots();
            refreshFormSummary();
            refreshSubmitState();
        });

        elements.prevMonth.addEventListener('click', () => {
            const previousMonth = new Date(
                state.currentMonth.getFullYear(),
                state.currentMonth.getMonth() - 1,
                1
            );
            if (previousMonth >= monthStart(today)) {
                state.currentMonth = previousMonth;
                renderCalendar();
            }
        });

        elements.nextMonth.addEventListener('click', () => {
            const nextMonth = new Date(
                state.currentMonth.getFullYear(),
                state.currentMonth.getMonth() + 1,
                1
            );
            if (nextMonth <= monthStart(rangeEnd)) {
                state.currentMonth = nextMonth;
                renderCalendar();
            }
        });

        elements.form.addEventListener('input', () => {
            refreshSubmitState();
        });

        elements.form.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearFormStatus();

            if (!state.activeSlot) {
                setFormStatus('Select an available start time before submitting.', true);
                return;
            }

            if (!isConfiguredEndpoint(config.bookingEndpoint)) {
                setFormStatus('Booking webhook URL is not configured yet.', true);
                return;
            }

            if (!elements.form.reportValidity()) {
                return;
            }

            const submitButton = elements.submit;
            if (submitButton) submitButton.disabled = true;
            setFormStatus('Sending booking request...', false);

            const formData = new FormData(elements.form);
            const payload = buildBookingPayload(formData);

            try {
                const response = await fetch(config.bookingEndpoint, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`Webhook returned ${response.status}`);
                }

                setFormStatus('Booking request received. We sent a pending confirmation email.', false);
                clearClientFields();
                state.selectedSlotId = null;
                state.activeSlot = null;
                refreshFormSummary();
                renderSlots();
                refreshSubmitState();
            } catch (error) {
                setFormStatus('We could not submit right now. Please try again in a minute.', true);
            } finally {
                refreshSubmitState();
            }
        });
    }

    async function loadAvailability() {
        if (state.loading) {
            return;
        }
        state.loading = true;
        setLoadStatus('Loading live availability...', false);

        const isConfigured = isConfiguredEndpoint(config.availabilityEndpoint);

        if (!isConfigured) {
            state.blockedRanges = buildDemoBlockedRanges();
            state.loading = false;
            setLoadStatus(
                'Live availability webhook not configured. Showing demo schedule until n8n URL is added.',
                true
            );
            finishAvailabilityLoad();
            return;
        }

        try {
            const url = new URL(config.availabilityEndpoint);
            url.searchParams.set('start', toDateKey(today));
            url.searchParams.set('end', toDateKey(rangeEnd));
            url.searchParams.set('timezone', config.timezone);
            // Avoid stale edge/browser cache when calendar state changes frequently.
            url.searchParams.set('_ts', String(Date.now()));

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Availability webhook returned ${response.status}`);
            }

            const payload = await response.json();
            applyAvailabilityConfig(payload);
            state.blockedRanges = normalizeBlockedRanges(payload);
            setLoadStatus(`Live availability loaded (${state.blockedRanges.length} blocked windows).`, false);
        } catch (error) {
            if (!state.blockedRanges.length) {
                // Fail closed when no synced data exists to avoid accidental overbooking.
                state.blockedRanges = buildFailClosedBlockedRanges();
                setLoadStatus(
                    'Live availability could not be loaded. Booking is temporarily paused until calendar sync recovers.',
                    true
                );
            } else {
                setLoadStatus(
                    'Live availability refresh failed. Showing last synced blocked windows.',
                    true
                );
            }
        } finally {
            state.loading = false;
            finishAvailabilityLoad();
        }
    }

    function finishAvailabilityLoad() {
        state.slotCache.clear();
        updateEstimate();
        ensureSelectedDate();
        renderCalendar();
        renderSlots();
        refreshFormSummary();
        refreshSubmitState();
    }

    function setupAutoRefresh() {
        if (state.refreshTimerId) {
            clearInterval(state.refreshTimerId);
        }

        state.refreshTimerId = window.setInterval(() => {
            loadAvailability();
        }, config.refreshMs);

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                loadAvailability();
            }
        });

        window.addEventListener('focus', () => {
            loadAvailability();
        });
    }

    function applyAvailabilityConfig(payload) {
        const root = normalizeRoot(payload);
        const businessHours = root.businessHours || root.business_hours || null;

        const apiHourlyRate = parseFloat(root.hourlyRate || root.hourly_rate);
        if (Number.isFinite(apiHourlyRate) && apiHourlyRate > 0) {
            config.hourlyRate = apiHourlyRate;
        }

        const apiMinimum = parseInt(root.minimumHours || root.minimum_hours, 10);
        if (Number.isFinite(apiMinimum) && apiMinimum >= 2) {
            config.minHours = apiMinimum;
            config.maxHours = Math.max(config.minHours, config.maxHours);
        }

        if (businessHours && typeof businessHours === 'object') {
            if (isValidTimeString(businessHours.start)) {
                config.businessStart = businessHours.start;
            }
            if (isValidTimeString(businessHours.end)) {
                config.businessEnd = businessHours.end;
            }
        }

        const apiTimezone = root.timezone || root.tz;
        if (typeof apiTimezone === 'string' && apiTimezone.trim()) {
            config.timezone = apiTimezone.trim();
        }

        setupDurationOptions();
    }

    function setupDurationOptions() {
        const currentValue = parseInt(elements.duration.value, 10);
        elements.duration.innerHTML = '';

        for (let hours = config.minHours; hours <= config.maxHours; hours += 1) {
            const option = document.createElement('option');
            option.value = String(hours);
            option.textContent = `${hours} hour${hours === 1 ? '' : 's'}`;
            elements.duration.appendChild(option);
        }

        const nextValue = Number.isFinite(currentValue)
            ? clampNumber(currentValue, config.minHours, config.maxHours, config.minHours)
            : state.durationHours;

        state.durationHours = clampNumber(nextValue, config.minHours, config.maxHours, config.minHours);
        elements.duration.value = String(state.durationHours);
        updateEstimate();
    }

    function renderCalendar() {
        elements.calendarDays.innerHTML = '';

        const firstDay = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), 1);
        const lastDay = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 0);
        const firstDayWeekIndex = firstDay.getDay();
        const monthLabel = firstDay.toLocaleDateString('en-CA', {
            month: 'long',
            year: 'numeric',
            timeZone: config.timezone,
        });

        elements.monthLabel.textContent = monthLabel;
        elements.prevMonth.disabled = firstDay <= monthStart(today);
        elements.nextMonth.disabled = firstDay >= monthStart(rangeEnd);

        for (let i = 0; i < firstDayWeekIndex; i += 1) {
            const padCell = document.createElement('div');
            padCell.className = 'booking-day booking-day-pad';
            elements.calendarDays.appendChild(padCell);
        }

        for (let day = 1; day <= lastDay.getDate(); day += 1) {
            const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
            const dateKey = toDateKey(date);
            const withinRange = date >= today && date <= rangeEnd;
            const slots = withinRange ? getAvailableSlots(dateKey, state.durationHours) : [];
            const slotCount = slots.length;
            const isSelected = state.selectedDateKey === dateKey;

            const dayButton = document.createElement('button');
            dayButton.type = 'button';
            dayButton.className = 'booking-day';
            dayButton.dataset.date = dateKey;
            dayButton.disabled = !withinRange || slotCount === 0;
            dayButton.setAttribute(
                'aria-label',
                `${date.toLocaleDateString('en-CA', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                })} (${slotCount} available starts)`
            );

            if (dayButton.disabled) {
                dayButton.classList.add('is-unavailable');
            } else {
                dayButton.classList.add('is-available');
            }

            if (isSelected) {
                dayButton.classList.add('is-selected');
            }

            dayButton.innerHTML = `
                <span class="booking-day-number">${day}</span>
                <span class="booking-day-count">${slotCount > 0 ? `${slotCount} slots` : 'Full'}</span>
            `;

            dayButton.addEventListener('click', () => {
                state.selectedDateKey = dateKey;
                state.selectedSlotId = null;
                state.activeSlot = null;
                renderCalendar();
                renderSlots();
                refreshFormSummary();
                refreshSubmitState();
            });

            elements.calendarDays.appendChild(dayButton);
        }
    }

    function renderSlots() {
        elements.slots.innerHTML = '';

        if (!state.selectedDateKey) {
            elements.slotsHeading.textContent = 'Select a date to view start times';
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'booking-slots-empty';
            emptyMessage.textContent = 'Choose any date with available slots in the calendar.';
            elements.slots.appendChild(emptyMessage);
            return;
        }

        const dateObject = fromDateKey(state.selectedDateKey);
        elements.slotsHeading.textContent = dateObject.toLocaleDateString('en-CA', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: config.timezone,
        });

        const slots = getAvailableSlots(state.selectedDateKey, state.durationHours);

        if (!slots.length) {
            const noSlots = document.createElement('p');
            noSlots.className = 'booking-slots-empty';
            noSlots.textContent = 'No starts available for this duration. Try another date or a shorter booking.';
            elements.slots.appendChild(noSlots);
            state.selectedSlotId = null;
            state.activeSlot = null;
            return;
        }

        slots.forEach((slot) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'booking-slot';
            button.dataset.slotId = slot.id;
            button.innerHTML = `
                <span>${slot.startLabel}</span>
                <small>to ${slot.endLabel}</small>
            `;

            if (state.selectedSlotId === slot.id) {
                button.classList.add('is-selected');
            }

            button.addEventListener('click', () => {
                state.selectedSlotId = slot.id;
                state.activeSlot = slot;
                renderSlots();
                refreshFormSummary();
                refreshSubmitState();
            });

            elements.slots.appendChild(button);
        });
    }

    function ensureSelectedDate() {
        if (state.selectedDateKey) {
            const existing = getAvailableSlots(state.selectedDateKey, state.durationHours);
            if (existing.length > 0) {
                return;
            }
        }

        let cursor = new Date(today.getTime());
        state.selectedDateKey = null;

        while (cursor <= rangeEnd) {
            const key = toDateKey(cursor);
            const options = getAvailableSlots(key, state.durationHours);
            if (options.length > 0) {
                state.selectedDateKey = key;
                state.currentMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
                return;
            }
            cursor = addDays(cursor, 1);
        }
    }

    function getAvailableSlots(dateKey, durationHours) {
        const cacheKey = `${dateKey}|${durationHours}`;
        if (state.slotCache.has(cacheKey)) {
            return state.slotCache.get(cacheKey);
        }

        const day = fromDateKey(dateKey);
        const now = new Date();
        const startMinutes = parseHourMinute(config.businessStart);
        const endMinutes = parseHourMinute(config.businessEnd);
        const slotLengthMinutes = durationHours * 60;
        const latestStart = endMinutes - slotLengthMinutes;

        if (startMinutes >= endMinutes || latestStart < startMinutes) {
            state.slotCache.set(cacheKey, []);
            return [];
        }

        const slots = [];

        for (let minute = startMinutes; minute <= latestStart; minute += 60) {
            const start = buildDateTime(day, minute);
            const end = new Date(start.getTime() + slotLengthMinutes * 60 * 1000);

            if (start < now) {
                continue;
            }

            if (intersectsBlocked(start, end)) {
                continue;
            }

            const id = `${dateKey}-${minute}-${durationHours}`;
            slots.push({
                id,
                dateKey,
                start,
                end,
                startLabel: formatTime(start),
                endLabel: formatTime(end),
            });
        }

        state.slotCache.set(cacheKey, slots);
        return slots;
    }

    function intersectsBlocked(start, end) {
        for (let i = 0; i < state.blockedRanges.length; i += 1) {
            const range = state.blockedRanges[i];
            if (start < range.end && end > range.start) {
                return true;
            }
        }
        return false;
    }

    function refreshFormSummary() {
        const estimatedPrice = state.durationHours * config.hourlyRate;

        if (!state.activeSlot) {
            elements.summaryDate.value = '';
            elements.summaryStart.value = '';
            elements.summaryEnd.value = '';
            elements.summaryDuration.value = `${state.durationHours} hours`;
            elements.summaryEstimate.value = formatMoney(estimatedPrice);
            return;
        }

        elements.summaryDate.value = state.activeSlot.start.toLocaleDateString('en-CA', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: config.timezone,
        });
        elements.summaryStart.value = state.activeSlot.startLabel;
        elements.summaryEnd.value = state.activeSlot.endLabel;
        elements.summaryDuration.value = `${state.durationHours} hours`;
        elements.summaryEstimate.value = formatMoney(estimatedPrice);
    }

    function refreshSubmitState() {
        if (!elements.submit) {
            return;
        }

        const ready =
            Boolean(state.activeSlot) &&
            elements.form.checkValidity() &&
            !state.loading;

        elements.submit.disabled = !ready;
    }

    function updateEstimate() {
        const value = state.durationHours * config.hourlyRate;
        elements.estimate.textContent = `${formatMoney(value)} estimate`;
    }

    function buildBookingPayload(formData) {
        const estimatedPrice = state.durationHours * config.hourlyRate;

        return {
            source: window.location.pathname || '/booking/',
            submitted_at: new Date().toISOString(),
            status: 'Requested',
            timezone: config.timezone,
            client_name: String(formData.get('client_name') || '').trim(),
            client_email: String(formData.get('client_email') || '').trim(),
            client_phone: String(formData.get('client_phone') || '').trim(),
            company_name: String(formData.get('company_name') || '').trim(),
            project_type: String(formData.get('project_type') || '').trim(),
            project_notes: String(formData.get('project_notes') || '').trim(),
            booking_date: state.activeSlot ? state.activeSlot.dateKey : '',
            start_time: state.activeSlot ? state.activeSlot.startLabel : '',
            end_time: state.activeSlot ? state.activeSlot.endLabel : '',
            start_iso: state.activeSlot ? state.activeSlot.start.toISOString() : '',
            end_iso: state.activeSlot ? state.activeSlot.end.toISOString() : '',
            duration_hours: state.durationHours,
            hourly_rate: config.hourlyRate,
            estimated_price: estimatedPrice,
            currency: config.currency,
        };
    }

    function clearClientFields() {
        ['client_name', 'client_email', 'client_phone', 'company_name', 'project_type', 'project_notes'].forEach(
            (name) => {
                const field = elements.form.querySelector(`[name="${name}"]`);
                if (field) {
                    field.value = '';
                }
            }
        );
    }

    function normalizeBlockedRanges(payload) {
        const root = normalizeRoot(payload);
        const ranges = collectBlockedCandidates(root, payload);

        return ranges
            .map((item) => {
                const startValue =
                    item.start ||
                    item.start_time ||
                    item.startTime ||
                    item.startDateTime ||
                    item.start_date_time ||
                    item.dateTimeStart;
                const endValue =
                    item.end ||
                    item.end_time ||
                    item.endTime ||
                    item.endDateTime ||
                    item.end_date_time ||
                    item.dateTimeEnd;
                const start = parseRangeDate(startValue, false);
                const end = parseRangeDate(endValue, true);

                if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
                    return null;
                }

                if (end <= start) {
                    return null;
                }

                return { start, end };
            })
            .filter(Boolean);
    }

    function collectBlockedCandidates(root, payload) {
        if (Array.isArray(payload)) {
            return payload;
        }

        if (Array.isArray(root)) {
            return root;
        }

        const direct =
            root.blocked ||
            root.busy ||
            root.calendarBusy ||
            root.calendar_busy ||
            root.events ||
            root.items ||
            root.data;

        if (Array.isArray(direct)) {
            return direct;
        }

        // Google FreeBusy response shape: { calendars: { "<id>": { busy: [] } } }
        if (root.calendars && typeof root.calendars === 'object') {
            const merged = [];
            Object.keys(root.calendars).forEach((calendarKey) => {
                const calendar = root.calendars[calendarKey];
                if (calendar && Array.isArray(calendar.busy)) {
                    merged.push(...calendar.busy);
                }
            });
            if (merged.length) {
                return merged;
            }
        }

        return [];
    }

    function parseRangeDate(value, isEnd) {
        if (value instanceof Date) {
            return value;
        }

        if (typeof value === 'number') {
            return new Date(value);
        }

        if (typeof value === 'string') {
            const directParsed = new Date(value);
            if (Number.isFinite(directParsed.getTime())) {
                return directParsed;
            }

            // Handle simple local format values from integrations: "YYYY-MM-DD HH:mm[:ss]"
            const localMatch = value.match(
                /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
            );
            if (localMatch) {
                const year = parseInt(localMatch[1], 10);
                const month = parseInt(localMatch[2], 10) - 1;
                const day = parseInt(localMatch[3], 10);
                const hours = parseInt(localMatch[4], 10);
                const minutes = parseInt(localMatch[5], 10);
                const seconds = parseInt(localMatch[6] || '0', 10);
                return new Date(year, month, day, hours, minutes, seconds, 0);
            }

            return new Date(NaN);
        }

        if (value && typeof value === 'object') {
            const dateTimeValue =
                value.dateTime ||
                value.date_time ||
                value.datetime ||
                value.start ||
                value.end;
            if (dateTimeValue) {
                return parseRangeDate(dateTimeValue, isEnd);
            }

            // Google all-day events use date only. end.date is exclusive.
            if (typeof value.date === 'string') {
                const dateOnly = parseDateOnly(value.date);
                if (!Number.isFinite(dateOnly.getTime())) {
                    return new Date(NaN);
                }
                if (isEnd) {
                    return dateOnly;
                }
                return dateOnly;
            }
        }

        return new Date(NaN);
    }

    function parseDateOnly(value) {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            return new Date(value);
        }
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        return new Date(year, month, day, 0, 0, 0, 0);
    }

    function normalizeRoot(payload) {
        if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object') {
            return payload.data;
        }
        return payload && typeof payload === 'object' ? payload : {};
    }

    function setLoadStatus(message, isError) {
        if (!elements.loadStatus) {
            return;
        }
        elements.loadStatus.textContent = message;
        elements.loadStatus.classList.toggle('is-error', Boolean(isError));
    }

    function setFormStatus(message, isError) {
        if (!elements.formStatus) {
            return;
        }
        elements.formStatus.textContent = message;
        elements.formStatus.classList.toggle('is-error', Boolean(isError));
    }

    function clearFormStatus() {
        setFormStatus('', false);
    }

    function isConfiguredEndpoint(value) {
        if (!value) return false;
        if (!/^https?:\/\//i.test(value)) return false;
        return !/YOUR_|example\.com/i.test(value);
    }

    function buildDemoBlockedRanges() {
        const ranges = [];
        for (let i = 0; i <= config.daysAhead; i += 1) {
            const date = addDays(today, i);
            const weekday = date.getDay();

            if (weekday === 0) {
                ranges.push({
                    start: buildDateTime(date, parseHourMinute('09:00')),
                    end: buildDateTime(date, parseHourMinute('15:00')),
                });
            } else if (weekday === 6) {
                ranges.push({
                    start: buildDateTime(date, parseHourMinute('13:00')),
                    end: buildDateTime(date, parseHourMinute('17:00')),
                });
            }

            if (i % 3 === 0) {
                ranges.push({
                    start: buildDateTime(date, parseHourMinute('12:00')),
                    end: buildDateTime(date, parseHourMinute('14:00')),
                });
            }

            if (i % 5 === 0) {
                ranges.push({
                    start: buildDateTime(date, parseHourMinute('16:00')),
                    end: buildDateTime(date, parseHourMinute('18:00')),
                });
            }
        }

        return ranges;
    }

    function buildFailClosedBlockedRanges() {
        const ranges = [];
        const businessStart = parseHourMinute(config.businessStart);
        const businessEnd = parseHourMinute(config.businessEnd);

        for (let i = 0; i <= config.daysAhead; i += 1) {
            const date = addDays(today, i);
            ranges.push({
                start: buildDateTime(date, businessStart),
                end: buildDateTime(date, businessEnd),
            });
        }

        return ranges;
    }

    function parseHourMinute(value) {
        if (!isValidTimeString(value)) {
            return 9 * 60;
        }
        const [hour, minute] = value.split(':').map((part) => parseInt(part, 10));
        return hour * 60 + minute;
    }

    function isValidTimeString(value) {
        return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-CA', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: config.timezone,
        });
    }

    function formatMoney(amount) {
        try {
            return new Intl.NumberFormat('en-CA', {
                style: 'currency',
                currency: config.currency,
                maximumFractionDigits: 0,
            }).format(amount);
        } catch (error) {
            return `$${Math.round(amount)}`;
        }
    }

    function toDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function fromDateKey(value) {
        const [year, month, day] = value.split('-').map((part) => parseInt(part, 10));
        return new Date(year, month - 1, day);
    }

    function monthStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function addDays(date, amount) {
        const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        next.setDate(next.getDate() + amount);
        return next;
    }

    function buildDateTime(dayDate, totalMinutes) {
        const result = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0);
        result.setMinutes(totalMinutes);
        return result;
    }

    function clampNumber(value, min, max, fallback) {
        if (!Number.isFinite(value)) {
            return fallback;
        }
        return Math.min(Math.max(value, min), max);
    }
})();
