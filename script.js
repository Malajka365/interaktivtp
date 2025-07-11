document.addEventListener('DOMContentLoaded', function() {
    // DOM Elemek
    const currentMonthYearElement = document.getElementById('currentMonthYear');
    const calendarGridElement = document.getElementById('calendarGrid');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const viewSelector = document.getElementById('viewSelector');

    // Ciklusok
    const addCycleBtn = document.getElementById('addCycleBtn');
    const cycleModal = document.getElementById('cycleModal');
    const closeCycleModalBtn = cycleModal.querySelector('.close-btn');
    const saveCycleBtn = document.getElementById('saveCycleBtn');
    // const cycleListElement = document.getElementById('cycleList'); // Régi oldalsáv lista, már nem használjuk közvetlenül így
    let cycles = []; // { name, startDate, endDate, color, id }
    let editingCycleId = null;

    // Ciklusok Kezelése Modal
    const manageCyclesBtn = document.getElementById('manageCyclesBtn');
    const manageCyclesModal = document.getElementById('manageCyclesModal');
    const closeManageCyclesBtn = manageCyclesModal.querySelector('.close-manage-cycles-btn');
    const modalCycleListElement = document.getElementById('modalCycleList');


    // Események (Edzések/Mérkőzések)
    const eventModal = document.getElementById('eventModal');
    const closeEventModalBtn = eventModal.querySelector('.close-event-btn');
    const saveEventBtn = document.getElementById('saveEventBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    let events = []; // { date, type, ability, load, details, id, cycleId (opcionális) }
    let editingEventId = null;

    // Részletes napi nézet
    const dailyDetailViewModal = document.getElementById('dailyDetailView');
    const closeDailyViewBtn = dailyDetailViewModal.querySelector('.close-daily-view-btn');
    const dailyViewDateElement = document.getElementById('dailyViewDate');
    const dailyEventsListElement = document.getElementById('dailyEventsList');

    // Szűrés
    const filterEventTypeElement = document.getElementById('filterEventType');
    const filterAbilityElement = document.getElementById('filterAbility');
    const applyFilterBtn = document.getElementById('applyFilterBtn');

    // Állapot
    let currentDate = new Date();
    let currentView = 'monthly'; // 'monthly' or 'weekly'

    // --- INICIALIZÁLÁS ---
    function init() {
        loadData(); // Adatok betöltése (localStorage vagy alapértelmezett)
        populateFilterOptions(); // Szűrő opciók feltöltése
        renderCalendar();
        // renderCycleList(); // Már nem hívjuk itt, a "Ciklusok Kezelése" modális nyitásakor fog frissülni
        addEventListeners();
    }

    // --- ADATKEZELÉS (localStorage) ---
    function saveData() {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        localStorage.setItem('calendarCycles', JSON.stringify(cycles));
    }

    function loadData() {
        const storedEvents = localStorage.getItem('calendarEvents');
        const storedCycles = localStorage.getItem('calendarCycles');
        if (storedEvents) events = JSON.parse(storedEvents);
        if (storedCycles) cycles = JSON.parse(storedCycles);
    }

    // --- SZŰRŐ OPCIÓK FELTÖLTÉSE (dinamikusan az adatokból) ---
    function populateFilterOptions() {
        // Edzéstípusok (az alap HTML-ben definiáltakon felül, ha szükséges)
        // const eventTypes = ['Kültéri futás', 'Konditermi edzés', 'Labdás edzés', 'Edzőmérkőzés', 'Tétmérkőzés'];
        // eventTypes.forEach(type => {
        //     if (!Array.from(filterEventTypeElement.options).find(opt => opt.value === type)) {
        //         const option = new Option(type, type);
        //         filterEventTypeElement.add(option);
        //     }
        // });

        // Fejlesztendő képességek (az alap HTML-ben definiáltakon felül, ha szükséges)
        // const abilities = ['Stabilizációs állóképesség', ...];
        // abilities.forEach(ability => {
        //     if (!Array.from(filterAbilityElement.options).find(opt => opt.value === ability)) {
        //         const option = new Option(ability, ability);
        //         filterAbilityElement.add(option);
        //     }
        // });
    }

    function createWeekCycleElement(dateStr) {
        const cycle = getCycleForDate(dateStr);
        if (cycle) {
            const weekCycleElement = document.createElement('div');
            weekCycleElement.classList.add('week-cycle-info');
            weekCycleElement.textContent = cycle.name.length > 20 ? cycle.name.substring(0,17) + '...' : cycle.name; // Rövidítés, ha túl hosszú
            weekCycleElement.title = `${cycle.name} (${cycle.startDate} - ${cycle.endDate})`; // Teljes név tooltipként
            // A háttérszínt és a border-t a CSS fogja kezelni a .week-cycle-info és a ciklus-specifikus class alapján.
            // De hozzáadhatunk egy általánosabb stílust, vagy a ciklus színét itt is:
            weekCycleElement.style.backgroundColor = hexToRgba(cycle.color, 0.25); // Enyhe háttér a ciklus színével
            weekCycleElement.style.borderLeft = `3px solid ${cycle.color}`;


            weekCycleElement.addEventListener('click', (e) => {
                e.stopPropagation();
                openCycleModal(cycle.id); // Lehetővé teszi a ciklus szerkesztését a sávra kattintva
            });
            return weekCycleElement;
        }
        return null;
    }


    // --- NAPTÁR MEGJELENÍTÉS ---
    function renderCalendar() {
        calendarGridElement.innerHTML = ''; // Töröljük a régi rácsot
        currentMonthYearElement.textContent = `${currentDate.getFullYear()} ${currentDate.toLocaleString('hu-HU', { month: 'long' })}`;

        if (currentView === 'monthly') {
            renderMonthlyView();
        } else {
            renderWeeklyView();
        }
        addDragAndDropListeners();
    }

    function renderMonthlyView() {
        calendarGridElement.className = 'calendar-grid'; // Visszaállítás havi nézetre
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Napok fejléc
        const daysOfWeek = ['Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo', 'Va'];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('calendar-header');
            dayHeader.textContent = day;
            calendarGridElement.appendChild(dayHeader);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 (Hétfő) - 6 (Vasárnap)
        const totalDays = lastDayOfMonth.getDate();

        // Üres cellák a hónap elején
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'other-month');
            calendarGridElement.appendChild(emptyCell);
        }

        // Hónap napjai
        for (let day = 1; day <= totalDays; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;

            const dayNumber = document.createElement('span');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;

            // Ciklus nevének megjelenítése a hét első napján (Hétfő)
            const currentDayObject = new Date(year, month, day);
            if (currentDayObject.getDay() === 1 || (firstDayOfWeek === 0 && day ===1 )) { // Hétfő (1) vagy ha a hónap első napja hétfő
                // Vagy egyszerűbben: ha i % 7 === 0 a rácsban (de az üres cellákat is figyelembe kell venni)
                // Inkább a dátum alapján:
                const weekCycleElement = createWeekCycleElement(dateStr);
                if (weekCycleElement) {
                    // A dayCell elejére szúrjuk be, a dayNumber elé
                    dayCell.appendChild(weekCycleElement); // Vagy dayCell.insertBefore(weekCycleElement, dayNumber);
                }
            }
            dayCell.appendChild(dayNumber); // A dayNumber a ciklus sáv után jöjjön


            // Ciklus vizuális jelölése (háttér/border a nap celláján)
            applyCycleStyling(dayCell, dateStr);

            // Események megjelenítése a napon
            const dayEvents = getEventsForDate(dateStr);
            dayEvents.forEach(event => {
                const eventElement = createEventElement(event);
                dayCell.appendChild(eventElement);
            });

            // Nap kiemelése, ha van mérkőzés vagy edzés
            if (hasMatchTypeOnDate(dateStr)) dayCell.classList.add('highlight-match-day');
            // if (hasTrainingTypeOnDate(dateStr)) dayCell.classList.add('highlight-training-day');


            dayCell.addEventListener('click', () => openEventModal(dateStr));
            dayCell.addEventListener('dblclick', (e) => {
                // Csak akkor nyissa meg a napi nézetet, ha nem egy eseményre kattintottunk duplán
                if (e.target.closest('.event')) return;
                if (e.target === dayCell || e.target.classList.contains('day-number') || e.target.classList.contains('day-events-container')) {
                    openDailyDetailView(dateStr);
                }
            });

            // Konténer az eseményeknek a napon belül, hogy jobban kezelhető legyen a túlcsordulás
            const eventsContainer = document.createElement('div');
            eventsContainer.classList.add('day-events-container');
            dayEvents.forEach(event => { // Újrahasznosítjuk a dayEvents változót
                const eventElement = createEventElement(event);
                eventsContainer.appendChild(eventElement);
            });
            dayCell.appendChild(eventsContainer);

            calendarGridElement.appendChild(dayCell);
        }

        // Üres cellák a hónap végén, hogy a rács teljes legyen
        const remainingCells = (7 - ( (firstDayOfWeek + totalDays) % 7 )) % 7;
        for (let i = 0; i < remainingCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'other-month');
            calendarGridElement.appendChild(emptyCell);
        }
    }

    function renderWeeklyView() {
        calendarGridElement.className = 'weekly-grid'; // Váltás heti nézetre
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();

        const currentDayOfWeek = (currentDate.getDay() + 6) % 7; // 0 (Hétfő) - 6 (Vasárnap)
        const weekStart = new Date(year, month, day - currentDayOfWeek);

        const daysOfWeekFull = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

        for (let i = 0; i < 7; i++) {
            const dayInWeek = new Date(weekStart);
            dayInWeek.setDate(weekStart.getDate() + i);

            const dayCell = document.createElement('div');
            dayCell.classList.add('weekly-day');
            const dateStr = `${dayInWeek.getFullYear()}-${String(dayInWeek.getMonth() + 1).padStart(2, '0')}-${String(dayInWeek.getDate()).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;

            const dayNameElement = document.createElement('div');
            dayNameElement.classList.add('day-name');
            dayNameElement.textContent = `${daysOfWeekFull[i]} (${dayInWeek.getDate()})`;
            dayCell.appendChild(dayNameElement);

            // Ciklus nevének megjelenítése a heti nézet minden napján (vagy csak a hét elején)
            // Most minden napra tesszük, de lehet, hogy csak a hét első napjára kellene,
            // vagy egy közös sáv a hét fölé (ami bonyolultabb DOM struktúrát igényelne).
            const weekCycleElement = createWeekCycleElement(dateStr);
            if (weekCycleElement) {
                // A dayNameElement után, de az események konténere elé
                dayCell.insertBefore(weekCycleElement, dayCell.querySelector('.day-events-container'));
            }

            // Ciklus vizuális jelölése (háttér/border a nap celláján)
            applyCycleStyling(dayCell, dateStr);

            // Események
            const dayEvents = getEventsForDate(dateStr);
            const eventsContainer = document.createElement('div');
            eventsContainer.classList.add('day-events-container');
            dayEvents.forEach(event => {
                const eventElement = createEventElement(event);
                eventsContainer.appendChild(eventElement);
            });
            dayCell.appendChild(eventsContainer);


            if (hasMatchTypeOnDate(dateStr)) dayCell.classList.add('highlight-match-day');

            dayCell.addEventListener('click', () => openEventModal(dateStr));
            dayCell.addEventListener('dblclick', (e) => {
                if (e.target.closest('.event')) return;
                if (e.target === dayCell || e.target.classList.contains('day-name') || e.target.classList.contains('day-events-container')) {
                    openDailyDetailView(dateStr);
                }
            });
            calendarGridElement.appendChild(dayCell);
        }
    }

    function applyCycleStyling(dayCell, dateStr) {
        const cycle = getCycleForDate(dateStr);
        if (cycle) {
            // Egyedi class hozzáadása a specifikus ciklus stílusokhoz (CSS-ben definiálva)
            const cycleClass = `cycle-${cycle.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            dayCell.classList.add(cycleClass);
            // Alternatívaként, vagy mellette, a direkt háttérszín is maradhat, ha a class nem elég
            // dayCell.style.backgroundColor = hexToRgba(cycle.color, 0.2); // Kisebb alpha, hogy a class alapúak érvényesüljenek

            // Ciklus nevének megjelenítése a napon (opcionális, lehet zsúfolt)
            // const cycleNameSpan = document.createElement('span');
            // cycleNameSpan.classList.add('cycle-name-on-day');
            // cycleNameSpan.textContent = cycle.name.substring(0, 3); // Rövidítve
            // cycleNameSpan.style.backgroundColor = cycle.color;
            // dayCell.insertBefore(cycleNameSpan, dayCell.firstChild); // Elsőként szúrja be
        }
    }


    function createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.classList.add('event'); // Alap class

        // CSS class hozzáadása a típus alapján a színezéshez
        const typeClass = `event-${event.type.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
        eventElement.classList.add(typeClass);

        if (event.type === 'Tétmérkőzés' || event.type === 'Edzőmérkőzés') {
            eventElement.classList.add('highlight-match-event');
        }

        eventElement.draggable = true;
        eventElement.dataset.eventId = event.id;

        // Tooltip összeállítása (edzés típusa nélkül, ha van más adat)
        let tooltipText = `Képesség: ${event.ability || '-'}\nTerhelés: ${event.load || '-'}\nRészletek: ${event.details || '-'}`;
        if (!event.ability && !event.load && !event.details) {
            tooltipText = event.type; // Ha nincs más info, a tooltip legyen a típus
        }
        eventElement.title = tooltipText;

        // Látható szöveg beállítása (rövidített edzéstípus)
        const shortText = event.type.length > 15 ? event.type.substring(0, 12) + '...' : event.type;
        // Defenzív beállítás: először töröljük a tartalmat, majd text node-ként adjuk hozzá.
        eventElement.textContent = '';
        eventElement.appendChild(document.createTextNode(shortText));

        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            openEventModal(event.date, event.id);
        });
        return eventElement;
    }

    function getEventColor(type) { // Ezt a funkciót meghagyhatjuk fallbacknek, vagy ha a CSS classok nem elegendőek. Jelenleg nem aktívan használt.
        const colors = {
            'Kültéri futás': '#2ecc71',
            'Konditermi edzés': '#3498db',
            'Labdás edzés': '#f1c40f',
            'Edzőmérkőzés': '#e67e22',
            'Tétmérkőzés': '#e74c3c',
        };
        return colors[type] || '#7f8c8d'; // Alapértelmezett szürke
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // --- CIKLUSOK KEZELÉSE ---
    function renderCycleList() { // Most a modalCycleListElement-be renderel
        modalCycleListElement.innerHTML = '';
        if (cycles.length === 0) {
            modalCycleListElement.innerHTML = '<p>Nincsenek még ciklusok felvéve.</p>';
            return;
        }
        cycles.forEach(cycle => {
            const li = document.createElement('li');
            li.dataset.cycleId = cycle.id;

            const cycleText = document.createElement('span');
            // Rövidítjük a nevet, ha túl hosszú a listában is
            const displayName = cycle.name.length > 25 ? cycle.name.substring(0, 22) + '...' : cycle.name;
            cycleText.textContent = `${displayName} (${cycle.startDate} - ${cycle.endDate})`;
            cycleText.title = `${cycle.name} (${cycle.startDate} - ${cycle.endDate})`; // Teljes név tooltipben
            cycleText.style.borderLeft = `5px solid ${cycle.color}`;
            // cycleText.style.paddingLeft = '5px'; // Ezt a CSS-ből kapja a li paddingja miatt
            // cycleText.style.flexGrow = '1'; // Ezt a CSS-ből kapja a li span-ja

            const editBtn = document.createElement('button');
            editBtn.innerHTML = "&#9998;"; // ceruza ikon
            editBtn.classList.add('cycle-action-btn');
            editBtn.title = "Ciklus szerkesztése";
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeManageCyclesModal(); // Bezárjuk a lista modalt
                openCycleModal(cycle.id);   // Megnyitjuk a szerkesztő modalt
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = "&#128465;"; // kuka ikon
            deleteBtn.classList.add('cycle-action-btn', 'delete');
            deleteBtn.title = "Ciklus törlése";
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCycle(cycle.id);
                // A deleteCycle már frissíti a listát a renderCycleList hívásával, ha a modális nyitva van
                // De ha nincs nyitva, akkor is lefut, ami felesleges.
                // Jobb lenne, ha a deleteCycle csak az adatokat módosítaná, és a renderCycleList-et csak itt hívnánk meg.
                // De a jelenlegi struktúra miatt a deleteCycle() végén lévő renderCycleList() frissíti a modális tartalmát, ha az nyitva van.
            });

            li.appendChild(cycleText);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            modalCycleListElement.appendChild(li);
        });
    }

    function openCycleModal(cycleId = null) {
        cycleModal.style.display = 'block';
        editingCycleId = cycleId;
        const modalTitle = cycleModal.querySelector('h3');

        if (cycleId) {
            const cycle = cycles.find(c => c.id === cycleId);
            if (cycle) {
                modalTitle.textContent = 'Ciklus Szerkesztése';
                document.getElementById('cycleName').value = cycle.name;
                document.getElementById('cycleStartDate').value = cycle.startDate;
                document.getElementById('cycleEndDate').value = cycle.endDate;
                document.getElementById('cycleColor').value = cycle.color;
            }
        } else {
            modalTitle.textContent = 'Új Ciklus';
            document.getElementById('cycleName').value = '';
            document.getElementById('cycleStartDate').value = '';
            document.getElementById('cycleEndDate').value = '';
            document.getElementById('cycleColor').value = '#e0e0e0';
        }
    }

    function closeCycleModal() {
        cycleModal.style.display = 'none';
        editingCycleId = null;
    }

    function saveCycle() {
        const name = document.getElementById('cycleName').value.trim();
        const startDate = document.getElementById('cycleStartDate').value;
        const endDate = document.getElementById('cycleEndDate').value;
        const color = document.getElementById('cycleColor').value;

        if (!name || !startDate || !endDate) {
            alert('Kérlek tölts ki minden mezőt a ciklushoz!');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            alert('A kezdő dátum nem lehet későbbi, mint a befejező dátum!');
            return;
        }

        if (editingCycleId) {
            const cycleIndex = cycles.findIndex(c => c.id === editingCycleId);
            if (cycleIndex > -1) {
                cycles[cycleIndex] = { ...cycles[cycleIndex], name, startDate, endDate, color };
            }
        } else {
            cycles.push({ id: Date.now().toString(), name, startDate, endDate, color });
        }

        cycles.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        saveData();
        renderCalendar(); // Naptár mindig frissül
        // Cikluslista a modálisban csak akkor frissül, ha az nyitva van
        if (manageCyclesModal.style.display === 'block') {
            renderCycleList();
        }
        closeCycleModal();
    }

    function deleteCycle(cycleId) {
        if (!confirm('Biztosan törölni szeretnéd ezt a ciklust? A hozzárendelt eseményekről a ciklus jelölés elvész.')) {
            return;
        }
        cycles = cycles.filter(c => c.id !== cycleId);
        // Opcionálisan: frissítsd az eseményeket, hogy ne hivatkozzanak a törölt ciklusra
        // events.forEach(event => {
        //     if (event.cycleId === cycleId) {
        //         event.cycleId = null; // Vagy valamilyen alapértelmezett érték
        //     }
        // });
        saveData();
        renderCalendar(); // Frissítjük a naptárat, hogy a ciklus színei eltűnjenek
        // Ha a "Ciklusok Kezelése" modális nyitva van, frissítsük a listát benne
        if (manageCyclesModal.style.display === 'block') {
            renderCycleList();
        }
    }

    function getCycleForDate(dateStr) {
        const date = new Date(dateStr);
        return cycles.find(cycle => {
            const startDate = new Date(cycle.startDate);
            const endDate = new Date(cycle.endDate);
            // Az endDate-hez hozzáadunk egy napot, hogy az aznapi események is beletartozzanak
            const inclusiveEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
            return date >= startDate && date < inclusiveEndDate;
        });
    }


    // --- ESEMÉNYEK (EDZÉSEK/MÉRKŐZÉSEK) KEZELÉSE ---
    function openEventModal(dateStr, eventId = null) {
        eventModal.style.display = 'block';
        document.getElementById('eventDate').value = dateStr;
        editingEventId = eventId;

        if (eventId) {
            const event = events.find(e => e.id === eventId);
            document.getElementById('eventModalTitle').textContent = 'Esemény Szerkesztése';
            document.getElementById('eventType').value = event.type;
            document.getElementById('eventAbility').value = event.ability;
            document.getElementById('eventLoad').value = event.load;
            document.getElementById('eventDetails').value = event.details;
            deleteEventBtn.style.display = 'inline-block';
        } else {
            document.getElementById('eventModalTitle').textContent = `Új Esemény (${dateStr})`;
            document.getElementById('eventType').value = 'Kültéri futás'; // Alapértelmezett
            document.getElementById('eventAbility').value = '';
            document.getElementById('eventLoad').value = '';
            document.getElementById('eventDetails').value = '';
            deleteEventBtn.style.display = 'none';
        }
    }

    function closeEventModal() {
        eventModal.style.display = 'none';
        editingEventId = null;
    }

    function saveEvent() {
        const date = document.getElementById('eventDate').value;
        const type = document.getElementById('eventType').value;
        const ability = document.getElementById('eventAbility').value;
        const load = document.getElementById('eventLoad').value.trim();
        const details = document.getElementById('eventDetails').value.trim();

        if (!type) {
            alert('Kérlek válassz edzéstípust!');
            return;
        }

        if (editingEventId) {
            // Szerkesztés
            const eventIndex = events.findIndex(e => e.id === editingEventId);
            if (eventIndex > -1) {
                events[eventIndex] = { ...events[eventIndex], type, ability, load, details, date };
            }
        } else {
            // Új esemény
            events.push({ id: Date.now().toString(), date, type, ability, load, details });
        }
        saveData();
        renderCalendar();
        closeEventModal();
    }

    function deleteEvent() {
        if (editingEventId) {
            events = events.filter(e => e.id !== editingEventId);
            saveData();
            renderCalendar();
            closeEventModal();
        }
    }

    function getEventsForDate(dateStr) {
        let filteredEvents = events.filter(event => event.date === dateStr);

        // Szűrők alkalmazása
        const typeFilter = filterEventTypeElement.value;
        const abilityFilter = filterAbilityElement.value;

        if (typeFilter) {
            filteredEvents = filteredEvents.filter(event => event.type === typeFilter);
        }
        if (abilityFilter) {
            filteredEvents = filteredEvents.filter(event => event.ability === abilityFilter);
        }
        return filteredEvents;
    }

    // --- RÉSZLETES NAPI NÉZET ---
    function openDailyDetailView(dateStr) {
        dailyDetailViewModal.style.display = 'block';
        const dateObj = new Date(dateStr);
        dailyViewDateElement.textContent = `${dateObj.getFullYear()}. ${dateObj.toLocaleString('hu-HU', { month: 'long' })} ${dateObj.getDate()}.`;
        dailyEventsListElement.innerHTML = '';

        const dayEvents = getEventsForDate(dateStr); // Itt már a szűrt eseményeket kapjuk, ha aktív a szűrés
        if (dayEvents.length === 0) {
            dailyEventsListElement.innerHTML = '<p>Nincsenek események ezen a napon.</p>';
            return;
        }

        dayEvents.forEach(event => {
            const item = document.createElement('div');
            item.classList.add('daily-event-item');
            item.style.borderLeft = `5px solid ${getEventColor(event.type)}`;

            let content = `<h4>${event.type}</h4>`;
            if (event.ability) content += `<p><strong>Képesség:</strong> ${event.ability}</p>`;
            if (event.load) content += `<p><strong>Terhelés:</strong> ${event.load}</p>`;
            if (event.details) content += `<p><strong>Részletek:</strong> ${event.details.replace(/\n/g, '<br>')}</p>`;
            // Gomb az esemény szerkesztéséhez
            const editButton = document.createElement('button');
            editButton.textContent = 'Szerkesztés';
            editButton.style.fontSize = '0.8em';
            editButton.style.padding = '5px 8px';
            editButton.style.marginRight = '5px';
            editButton.onclick = () => {
                closeDailyDetailView();
                openEventModal(event.date, event.id);
            };
            item.innerHTML = content;
            item.appendChild(editButton);
            dailyEventsListElement.appendChild(item);
        });
    }

    function closeDailyDetailView() {
        dailyDetailViewModal.style.display = 'none';
    }

    // --- NAVIGÁCIÓ ÉS NÉZETVÁLTÁS ---
    function changeMonth(offset) {
        if (currentView === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + offset);
        } else { // weekly
            currentDate.setDate(currentDate.getDate() + (offset * 7));
        }
        renderCalendar();
    }

    function changeView(view) {
        currentView = view;
        // Ha hetiről havira váltunk, és a hét nem az aktuális hónapban van, akkor igazítunk
        if (currentView === 'monthly') {
            const today = new Date();
            if (currentDate.getFullYear() !== today.getFullYear() || currentDate.getMonth() !== today.getMonth()){
                 // Ha a hét egy másik hónapban van, maradjunk a hét első napjának hónapjánál
                 // Vagy ugorjunk vissza az "aktuális" hónapra (pl. a mai nap hónapjára)
                 // Most az egyszerűség kedvéért a hét első napjának hónapját vesszük
            }
        }
        renderCalendar();
    }

    // --- DRAG AND DROP ---
// Nincs már szükség globális draggedEventId-re, a dataTransfer objektumot használjuk

    function addDragAndDropListeners() {
    // Fontos, hogy ezeket a listenereket a renderCalendar után mindig újra hozzáadjuk a friss elemekhez.
        const eventElements = document.querySelectorAll('.event');
        eventElements.forEach(el => {
        // Régi listener eltávolítása, ha már volt (biztonsági okokból, elkerülendő a duplikált listenereket)
        // Bár a teljes calendarGrid újraírásakor ez nem feltétlenül szükséges, de jó gyakorlat lehet komplexebb DOM manipulációknál.
        // el.removeEventListener('dragstart', handleDragStart); // Ha nem írjuk újra a teljes eventElementet
            el.addEventListener('dragstart', handleDragStart);
        });

        const dayCells = document.querySelectorAll('.calendar-day, .weekly-day');
        dayCells.forEach(cell => {
        // cell.removeEventListener('dragover', handleDragOver);
        // cell.removeEventListener('dragleave', handleDragLeave);
        // cell.removeEventListener('drop', handleDrop);
        // cell.removeEventListener('dragenter', handleDragEnter); // Ha használnánk

            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
        // cell.addEventListener('dragenter', handleDragEnter); // Új listener, ha szükséges
        });
    }

    function handleDragStart(e) {
    if (!e.target.classList.contains('event')) return; // Csak .event elemek legyenek húzhatók

    e.dataTransfer.setData('text/plain', e.target.dataset.eventId);
        e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
    // console.log('Drag started for event:', e.target.dataset.eventId); // DEBUG
    }

// function handleDragEnter(e) { // DEBUG
//     e.preventDefault(); // Szükséges lehet bizonyos böngészőkben
//     const targetCell = e.target.closest('.calendar-day, .weekly-day');
//     if (targetCell) {
//         targetCell.classList.add('drop-target');
//         // console.log('Drag enter on:', targetCell.dataset.date);
//     }
// }

    function handleDragOver(e) {
    e.preventDefault(); // Szükséges a drop esemény engedélyezéséhez
    e.dataTransfer.dropEffect = 'move'; // Vizuális visszajelzés a kurzornak
    const targetCell = e.target.closest('.calendar-day, .weekly-day');
    if (targetCell) {
        targetCell.classList.add('drop-target'); // Vizuális jelzés a célterületen
        }
    }

    function handleDragLeave(e) {
    const cell = e.target.closest('.calendar-day, .weekly-day');
    // Csak akkor távolítsuk el a 'drop-target' classt, ha az egér ténylegesen elhagyja a cellát,
    // és nem csak egy belső elemét (pl. egy másik eventet a cellán belül).
    // e.relatedTarget az az elem, amelyre az egérkurzor átlépett.
    if (cell && (!e.relatedTarget || !cell.contains(e.relatedTarget))) {
        cell.classList.remove('drop-target');
        // console.log('Drag leave from:', cell.dataset.date); // DEBUG
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const targetCell = e.target.closest('.calendar-day, .weekly-day');
    const droppedEventId = e.dataTransfer.getData('text/plain');

    // Takarítás: távolítsuk el a 'dragging' és 'drop-target' osztályokat minden releváns elemről
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));

    if (!targetCell || !droppedEventId) {
        console.warn("Drop a nem megfelelő célra vagy nincs droppedEventId. TargetCell:", targetCell, "DroppedEventId:", droppedEventId);
        return;
    }

        const newDate = targetCell.dataset.date;
    const eventToMove = events.find(ev => ev.id === droppedEventId);

    if (eventToMove && newDate) {
        if (eventToMove.date === newDate) {
            // console.log("Esemény ugyanarra a napra lett húzva, nincs változás."); // DEBUG
            return; // Nincs szükség újrarenderelésre, ha nem változott a dátum
        }
        // console.log(`Esemény mozgatása: ${droppedEventId} -> ${newDate}`); // DEBUG
        eventToMove.date = newDate;
            saveData();
            renderCalendar(); // Újrarenderelés az esemény új helyén
    } else {
        console.error("Hiba az esemény áthelyezésekor: esemény vagy új dátum nem található.", "Event:", eventToMove, "NewDate:", newDate, "DroppedEventId:", droppedEventId);
        }
    }

    // --- SZŰRÉS ---
    function applyFilters() {
        renderCalendar(); // A naptár újrarenderelésekor a getEventsForDate már figyelembe veszi a szűrőket
    }

    // --- SEGÉDFÜGGVÉNYEK ---
    function hasMatchTypeOnDate(dateStr) {
        return getEventsForDate(dateStr).some(event => event.type === 'Tétmérkőzés' || event.type === 'Edzőmérkőzés');
    }
    // function hasTrainingTypeOnDate(dateStr) { // Ha külön kell jelölni az edzésnapokat
    //     return getEventsForDate(dateStr).some(event => event.type !== 'Tétmérkőzés' && event.type !== 'Edzőmérkőzés');
    // }


    // --- ESEMÉNYFIGYELŐK ---
    function addEventListeners() {
        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
        viewSelector.addEventListener('change', (e) => changeView(e.target.value));

        // Ciklusok
        addCycleBtn.addEventListener('click', openCycleModal);
        closeCycleModalBtn.addEventListener('click', closeCycleModal);
        saveCycleBtn.addEventListener('click', saveCycle);

        // Események
        closeEventModalBtn.addEventListener('click', closeEventModal);
        saveEventBtn.addEventListener('click', saveEvent);
        deleteEventBtn.addEventListener('click', deleteEvent);

        // Részletes napi nézet
        closeDailyViewBtn.addEventListener('click', closeDailyDetailView);

        // Szűrés
        applyFilterBtn.addEventListener('click', applyFilters);
        filterEventTypeElement.addEventListener('change', applyFilters); // Automatikus szűrés változtatáskor
        filterAbilityElement.addEventListener('change', applyFilters);  // Automatikus szűrés változtatáskor


        // Modális ablak bezárása külső kattintásra
        window.onclick = function(event) {
            if (event.target == cycleModal) {
                closeCycleModal();
            }
            if (event.target == eventModal) {
                closeEventModal();
            }
            if (event.target == dailyDetailViewModal) {
                closeDailyDetailView();
            }
            if (event.target == manageCyclesModal) { // Új: Cikluskezelő modál bezárása
                closeManageCyclesModal();
            }
        }

        // Ciklusok Kezelése Modal eseményfigyelői
        manageCyclesBtn.addEventListener('click', openManageCyclesModal);
        closeManageCyclesBtn.addEventListener('click', closeManageCyclesModal);
    }

    function openManageCyclesModal() {
        manageCyclesModal.style.display = 'block';
        renderCycleList(); // Frissítjük a listát minden megnyitáskor
    }

    function closeManageCyclesModal() {
        manageCyclesModal.style.display = 'none';
    }

    // Alkalmazás indítása
    init();
});
