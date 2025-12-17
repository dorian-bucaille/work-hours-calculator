document.addEventListener('DOMContentLoaded', async () => {
    // Wait for i18n to initialize
    await new Promise(resolve => {
        if (window.i18n) {
            resolve();
        } else {
            document.addEventListener('i18n-ready', resolve, { once: true });
        }
    });

    const timeForm = document.getElementById('time-form');
    const dateInput = document.getElementById('date-input');
    const goalInput = document.getElementById('goal-input');
    const summaryFormatSelect = document.getElementById('summary-format');
    const startMorningInput = document.getElementById('start-morning');
    const endMorningInput = document.getElementById('end-morning');
    const startAfternoonInput = document.getElementById('start-afternoon');
    const endAfternoonInput = document.getElementById('end-afternoon');
    const themeToggleButton = document.getElementById('theme-toggle');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsButton = document.getElementById('close-settings');
    const settingsBackdrop = document.getElementById('settings-backdrop');
    const autoAdvanceCheckbox = document.getElementById('auto-advance');
    const balanceSign = document.getElementById('balance-sign');
    const balanceHHMM = document.getElementById('balance-hhmm');
    const resultDiv = document.getElementById('result');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    const exportHistoryBtn = document.getElementById('export-history');
    const historyContainer = document.getElementById('history-container');
    const historyTitle = historyContainer.querySelector('h2');
    const suggestedEndAfternoonDiv = document.getElementById('suggested-end-afternoon');
    const applyClipboardButton = document.getElementById('apply-clipboard-schedule');
    const pasteButtonToggle = document.getElementById('paste-button-toggle');
    const formInputs = [
        startMorningInput,
        endMorningInput,
        startAfternoonInput,
        endAfternoonInput
    ];

    const SUMMARY_FORMATS = {
        TIMES_ONLY: 'timesOnly',
        TIMES_WITH_DETAILS: 'timesWithDetails',
        DATE_TIMES_WITH_DETAILS: 'dateTimesWithDetails',
    };

    // Fonctions utilitaires pour le localStorage
    function getLocalStorageItem(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    }
    function setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {}
    }

    let savedThemePreference = getLocalStorageItem('theme', null);

    function updateThemeToggleUI(theme) {
        if (!themeToggleButton) return;
        const isDark = theme === 'dark';
        const labelSpan = themeToggleButton.querySelector('.theme-toggle__label');
        const labelKey = isDark ? 'darkMode' : 'lightMode';
        const ariaLabelKey = isDark ? 'aria_switchToLight' : 'aria_switchToDark';

        if (labelSpan && window.i18n) {
            labelSpan.setAttribute('data-i18n', labelKey);
            labelSpan.textContent = window.i18n.translate(labelKey);
        }

        if (window.i18n) {
            themeToggleButton.setAttribute('data-i18n-aria', ariaLabelKey);
            themeToggleButton.setAttribute('aria-label', window.i18n.translate(ariaLabelKey));
        }

        themeToggleButton.setAttribute('aria-pressed', String(isDark));
    }

    function applyTheme(theme, { persist = true } = {}) {
        const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
        document.body.classList.toggle('theme-dark', normalizedTheme === 'dark');
        document.body.classList.toggle('theme-light', normalizedTheme === 'light');

        if (persist) {
            savedThemePreference = normalizedTheme;
            setLocalStorageItem('theme', normalizedTheme);
        }

        updateThemeToggleUI(normalizedTheme);
    }

    const prefersDarkMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const initialTheme = (savedThemePreference === 'dark' || savedThemePreference === 'light')
        ? savedThemePreference
        : (prefersDarkMedia?.matches ? 'dark' : 'light');
    applyTheme(initialTheme, { persist: !!savedThemePreference });

    themeToggleButton?.addEventListener('click', () => {
        const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
        applyTheme(nextTheme);
    });

    if (prefersDarkMedia?.addEventListener) {
        prefersDarkMedia.addEventListener('change', (event) => {
            if (savedThemePreference) return;
            applyTheme(event.matches ? 'dark' : 'light', { persist: false });
        });
    } else if (prefersDarkMedia?.addListener) {
        prefersDarkMedia.addListener((event) => {
            if (savedThemePreference) return;
            applyTheme(event.matches ? 'dark' : 'light', { persist: false });
        });
    }

    document.addEventListener('i18n-language-changed', () => {
        const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
        updateThemeToggleUI(currentTheme);
    });

    // Sécurise l'injection de texte dans le DOM
    function escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]);
        });
    }

    function parseScheduleFromText(text) {
        const parts = text
            .trim()
            // Support dash variants that can appear when copying text
            .split(/[\s\-–—]+/)
            .map(part => part.trim())
            .filter(Boolean);

        if (parts.length !== 4) return null;

        const normalizedParts = [];
        for (const part of parts) {
            const match = part.match(/^(\d{1,2}):(\d{2})$/);
            if (!match) return null;

            const hours = match[1].padStart(2, '0');
            const minutes = match[2];
            const hoursNum = Number(hours);
            const minutesNum = Number(minutes);

            if (hoursNum > 23 || minutesNum > 59) return null;

            normalizedParts.push(`${hours}:${minutes}`);
        }

        return normalizedParts;
    }

    function autofillSchedule(parsedParts, { focusEndAfternoon = true } = {}) {
        isScheduleAutofilling = true;
        [
            startMorningInput.value,
            endMorningInput.value,
            startAfternoonInput.value,
            endAfternoonInput.value,
        ] = parsedParts;
        updateSuggestedEndAfternoon();
        if (focusEndAfternoon) {
            endAfternoonInput.focus();
        }
        isScheduleAutofilling = false;
    }

    function tryAutofillScheduleFromText(text, options = {}) {
        const parsed = parseScheduleFromText(text);
        if (!parsed) return false;

        autofillSchedule(parsed, options);
        return true;
    }

    async function handleClipboardButtonClick() {
        console.info('Paste helper: attempting to read clipboard or fallback text.');
        let pastedText = '';

        if (navigator.clipboard?.readText) {
            try {
                pastedText = await navigator.clipboard.readText();
            } catch (error) {
                console.warn('Paste helper: clipboard read failed.', error);
            }
        }

        if (!pastedText) {
            const fallbackText = startMorningInput.value;
            if (fallbackText) {
                console.info('Paste helper: clipboard empty, using start morning field as fallback.');
                pastedText = fallbackText;
            }
        }

        if (!pastedText) {
            console.info('Paste helper: no text available for parsing.');
            return;
        }

        const success = tryAutofillScheduleFromText(pastedText, { focusEndAfternoon: true });
        if (success) {
            console.info('Paste helper: schedule parsed successfully from text:', pastedText);
        } else {
            console.info('Paste helper: unable to parse schedule from text:', pastedText);
        }
    }

    // Pré-remplir la date du jour
    dateInput.valueAsDate = new Date();
    goalInput.value = getLocalStorageItem('workHoursGoal', '07:22');
    // Ne pas remplir automatiquement endAfternoon, mais afficher une suggestion
    function updateSuggestedEndAfternoon() {
        // On ne suggère que si tous les champs nécessaires sont remplis
        const startMorning = startMorningInput.value;
        const endMorning = endMorningInput.value;
        const startAfternoon = startAfternoonInput.value;
        const goal = goalInput.value;
        if (startMorning && endMorning && startAfternoon && goal) {
            try {
                const workedSoFar = timeStringToMinutes(endMorning) - timeStringToMinutes(startMorning);
                const goalMinutes = parseHHMM(goal);
                const lunchBreak = timeStringToMinutes(startAfternoon) - timeStringToMinutes(endMorning);
                if (workedSoFar >= 0 && lunchBreak >= 0) {
                    const remaining = goalMinutes - workedSoFar;
                    if (remaining > 0) {
                        const suggested = timeStringToMinutes(startAfternoon) + remaining;
                        const hours = String(Math.floor(suggested / 60)).padStart(2, '0');
                        const minutes = String(suggested % 60).padStart(2, '0');
                        suggestedEndAfternoonDiv.innerHTML = `<em>Suggestion : ${hours}:${minutes}</em>`;
                        return;
                    }
                }
            } catch {}
        }
        suggestedEndAfternoonDiv.innerHTML = '';
    }
    startMorningInput.addEventListener('input', updateSuggestedEndAfternoon);
    endMorningInput.addEventListener('input', updateSuggestedEndAfternoon);
    startAfternoonInput.addEventListener('input', updateSuggestedEndAfternoon);
    goalInput.addEventListener('input', updateSuggestedEndAfternoon);
    // Initialiser la suggestion au chargement
    updateSuggestedEndAfternoon();

    let isScheduleAutofilling = false;

    startMorningInput.addEventListener('input', () => {
        if (isScheduleAutofilling) return;

        const rawValue = startMorningInput.value;
        if (!rawValue || !/[\s\-–—]/.test(rawValue)) return;

        tryAutofillScheduleFromText(rawValue);
    });

    startMorningInput.addEventListener('paste', async (event) => {
        let pastedText = event.clipboardData?.getData('text') || '';

        if (!pastedText && navigator.clipboard?.readText) {
            try {
                pastedText = await navigator.clipboard.readText();
            } catch {}
        }

        if (!tryAutofillScheduleFromText(pastedText, { focusEndAfternoon: true })) return;

        event.preventDefault();
    });

    // Initialisation du solde à la première visite
    let lastBalance = getLocalStorageItem('workHoursBalance', null);

    // Gestion des paramètres
    // Charger l'état du paramètre auto-advance depuis localStorage
    const autoAdvanceEnabled = getLocalStorageItem('autoAdvanceEnabled', true);
    autoAdvanceCheckbox.checked = autoAdvanceEnabled;

    const pasteButtonEnabled = getLocalStorageItem('pasteButtonEnabled', false);

    function updatePasteButtonState(enabled) {
        if (!applyClipboardButton) return;
        applyClipboardButton.disabled = !enabled;
        applyClipboardButton.hidden = !enabled;
    }

    if (pasteButtonToggle) {
        pasteButtonToggle.checked = pasteButtonEnabled;
        updatePasteButtonState(pasteButtonEnabled);
    } else {
        updatePasteButtonState(pasteButtonEnabled);
    }

    const savedSummaryFormat = getLocalStorageItem('summaryFormat', SUMMARY_FORMATS.DATE_TIMES_WITH_DETAILS);
    const summaryFormatToUse = Object.values(SUMMARY_FORMATS).includes(savedSummaryFormat)
        ? savedSummaryFormat
        : SUMMARY_FORMATS.DATE_TIMES_WITH_DETAILS;
    if (summaryFormatSelect) {
        summaryFormatSelect.value = summaryFormatToUse;
    }

    // Fonction pour passer au champ suivant
    function focusNextInput(currentInput) {
        if (!autoAdvanceCheckbox.checked) return;
        
        const currentIndex = formInputs.indexOf(currentInput);
        if (currentIndex === -1) return;
        
        const nextIndex = currentIndex + 1;
        if (nextIndex < formInputs.length) {
            formInputs[nextIndex].focus();
        }
    }

    // Ajouter des écouteurs d'événements pour chaque champ de temps
    formInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Vérifier si le champ contient 4 ou 5 caractères (format HH:MM)
            if (this.value.length === 5) {
                focusNextInput(this);
            }
        });
    });

    // Gérer l'ouverture/fermeture du panneau des paramètres
    let lastFocusedElement = null;

    function openSettingsPanel() {
        if (!settingsPanel || settingsPanel.classList.contains('open')) return;
        lastFocusedElement = document.activeElement;
        settingsPanel.classList.add('open');
        settingsPanel.setAttribute('aria-hidden', 'false');
        document.body.classList.add('settings-open');
        if (settingsBackdrop) {
            settingsBackdrop.hidden = false;
            settingsBackdrop.classList.add('is-visible');
        }
        requestAnimationFrame(() => {
            closeSettingsButton?.focus();
        });
    }

    function closeSettingsPanel({ restoreFocus = true } = {}) {
        if (!settingsPanel || !settingsPanel.classList.contains('open')) return;
        settingsPanel.classList.remove('open');
        settingsPanel.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('settings-open');
        if (settingsBackdrop) {
            settingsBackdrop.classList.remove('is-visible');
            settingsBackdrop.hidden = true;
        }
        if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
            lastFocusedElement.focus();
        }
    }

    settingsButton?.addEventListener('click', () => {
        if (settingsPanel.classList.contains('open')) {
            closeSettingsPanel();
        } else {
            openSettingsPanel();
        }
    });

    closeSettingsButton?.addEventListener('click', () => {
        closeSettingsPanel();
    });

    settingsBackdrop?.addEventListener('click', () => {
        closeSettingsPanel();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && settingsPanel.classList.contains('open')) {
            event.preventDefault();
            closeSettingsPanel();
        }
    });

    // Sauvegarder le paramètre auto-advance
    autoAdvanceCheckbox.addEventListener('change', () => {
        setLocalStorageItem('autoAdvanceEnabled', autoAdvanceCheckbox.checked);
    });

    pasteButtonToggle?.addEventListener('change', () => {
        const enabled = pasteButtonToggle.checked;
        setLocalStorageItem('pasteButtonEnabled', enabled);
        updatePasteButtonState(enabled);
    });

    applyClipboardButton?.addEventListener('click', async () => {
        if (applyClipboardButton.disabled) return;
        await handleClipboardButtonClick();
    });

    summaryFormatSelect?.addEventListener('change', () => {
        setLocalStorageItem('summaryFormat', summaryFormatSelect.value);
    });
    if (!lastBalance) {
        lastBalance = '+00:00';
        setLocalStorageItem('workHoursBalance', lastBalance);
    }
    const match = lastBalance.match(/([+-])(\d{2}):(\d{2})/);
    if (match) {
        balanceSign.value = match[1];
        // Pour <input type="time">, il faut le format HH:mm sans le signe
        balanceHHMM.value = `${match[2]}:${match[3]}`;
    } else {
        balanceSign.value = '+';
        balanceHHMM.value = '00:00';
    }
    
    // Récupérer l'ordre d'affichage depuis localStorage, par défaut 'desc'
    let historyOrder = getLocalStorageItem('historyOrder', 'desc');
    // Mettre à jour le sélecteur avec l'ordre actuel
    const historyOrderSelect = document.getElementById('history-order');
    if (historyOrderSelect) {
        historyOrderSelect.value = historyOrder;
        // Ajouter un écouteur d'événement pour changer l'ordre
        historyOrderSelect.addEventListener('change', function() {
            historyOrder = this.value;
            setLocalStorageItem('historyOrder', historyOrder);
            // Recharger l'historique avec le nouvel ordre
            loadHistory();
        });
    }

    // Fonction pour charger et afficher l'historique
    function loadHistory() {
        const history = getLocalStorageItem('workHoursHistory', []);
        // Trier l'historique selon l'ordre sélectionné
        const sortedHistory = historyOrder === 'desc' 
            ? [...history].reverse() 
            : [...history];
        // Vider la liste actuelle
        historyList.innerHTML = '';
        // Ajouter chaque entrée dans l'ordre correct
        sortedHistory.forEach((item, idx) => {
            // Calculer l'index réel dans l'historique complet
            const realIdx = historyOrder === 'desc' ? (history.length - 1 - idx) : idx;
            addHistoryEntry(item, realIdx);
        });
        updateHistoryVisibility();
    }

    // Charger l'historique au démarrage
    loadHistory();

    timeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        resultDiv.classList.add('visible');

        const timeValues = {
            startMorning: startMorningInput.value,
            endMorning: endMorningInput.value,
            startAfternoon: startAfternoonInput.value,
            endAfternoon: endAfternoonInput.value,
        };
        const dateValue = dateInput.value;
        const goalString = goalInput.value;
        setLocalStorageItem('workHoursGoal', goalString);
        const dailyGoalMinutes = parseHHMM(goalString);
        const currentBalanceString = `${balanceSign.value}${balanceHHMM.value.padStart(5, '0')}`;
        const summaryFormat = summaryFormatSelect?.value || SUMMARY_FORMATS.DATE_TIMES_WITH_DETAILS;
        // Pour <input type="time">, balanceHHMM.value est déjà au format HH:mm

        let history = getLocalStorageItem('workHoursHistory', []);
        if (!Array.isArray(history)) history = [];

        try {
            const workedMinutes = calculateWorkedMinutes(timeValues);
            const dailyDiffMinutes = workedMinutes - dailyGoalMinutes;
            const currentBalanceMinutes = parseBalance(currentBalanceString);
            const newBalanceMinutes = currentBalanceMinutes + dailyDiffMinutes;

            const newBalanceString = formatMinutesToSignedHours(newBalanceMinutes);

            const summaryLine = generateSummaryLine(dateValue, timeValues, workedMinutes, dailyDiffMinutes, newBalanceMinutes, goalString, summaryFormat);

            // Save new balance and history to localStorage
            setLocalStorageItem('workHoursBalance', newBalanceString);
            history.push(summaryLine);
            setLocalStorageItem('workHoursHistory', history);
            displayResult(workedMinutes, dailyDiffMinutes, newBalanceString, summaryLine, goalString);
            addHistoryEntry(summaryLine);
            
            // Clear time inputs for the next entry
            timeForm.reset();
            // Remettre la date du jour, l'objectif et le nouveau solde
            dateInput.valueAsDate = new Date();
            goalInput.value = getLocalStorageItem('workHoursGoal', '07:22');
            balanceSign.value = newBalanceString[0];
            // Pour <input type="time">, on enlève le signe
            balanceHHMM.value = `${newBalanceString.slice(1,3)}:${newBalanceString.slice(4,6)}`;
            updateSuggestedEndAfternoon();

        } catch (error) {
            resultDiv.innerHTML = `<p role="alert">Erreur: ${escapeHTML(error.message)}</p>`;
            resultDiv.classList.add('visible');
        }
    });

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('workHoursHistory');
        historyList.innerHTML = '';
        updateHistoryVisibility();
    });

    exportHistoryBtn.addEventListener('click', () => {
        const currentHistory = getLocalStorageItem('workHoursHistory', []);
        const blob = new Blob([JSON.stringify(currentHistory, null, 2)], { type: 'application/json' });
        const now = new Date();
        const dateStr = now.toISOString().slice(0,10); // YYYY-MM-DD
        const filename = `${dateStr}-historique-heures-travail.json`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });

    function timeStringToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function parseHHMM(hhmm) {
        const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) throw new Error("Format d'heure invalide pour l'objectif ou le solde (HH:mm)");
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }

    function calculateWorkedMinutes(times) {
        const start1 = timeStringToMinutes(times.startMorning);
        const end1 = timeStringToMinutes(times.endMorning);
        const start2 = timeStringToMinutes(times.startAfternoon);
        const end2 = timeStringToMinutes(times.endAfternoon);

        const morningMinutes = end1 - start1;
        const afternoonMinutes = end2 - start2;

        if (morningMinutes < 0 || afternoonMinutes < 0) {
            throw new Error("L'heure de fin doit être après l'heure de début pour chaque période.");
        }

        return morningMinutes + afternoonMinutes;
    }

    function parseBalance(balanceString) {
        if (!balanceString) return 0;
        
        const balanceRegex = /([+-])(\d{1,2}):(\d{2})/;
        const match = balanceString.match(balanceRegex);

        if (!match) {
            throw new Error("Format de solde invalide. Utilisez le sélecteur et le champ HH:mm.");
        }

        const sign = match[1] === '-' ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10);

        return sign * (hours * 60 + minutes);
    }

    function formatMinutesToSignedHours(totalMinutes) {
        const sign = totalMinutes < 0 ? '-' : '+';
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;
        return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    function formatMinutesForDisplay(totalMinutes) {
        if (totalMinutes === 0) return "0 min";
        const sign = totalMinutes < 0 ? '-' : '+';
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;

        let result = [];
        if (hours > 0) result.push(`${hours} h`);
        if (minutes > 0) result.push(`${minutes} min`);
        
        return (sign === '+' ? '+' : '- ') + result.join(' ');
    }
    
    function formatMinutesToHoursAndMinutes(totalMinutes) {
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;
        return `${hours} h ${String(minutes).padStart(2, '0')} min`;
    }

    function generateSummaryLine(dateValue, times, workedMinutes, dailyDiffMinutes, newBalanceMinutes, goalString, summaryFormat = SUMMARY_FORMATS.DATE_TIMES_WITH_DETAILS) {
        const workedStr = formatMinutesToHoursAndMinutes(workedMinutes);
        const diffStr = formatMinutesForDisplay(dailyDiffMinutes);
        const newBalanceStr = formatMinutesToSignedHours(newBalanceMinutes).replace(':', ' h ') + ' min';
        const dateStr = dateValue ? dateValue.split('-').reverse().join('/') + ' ' : '';
        const goalWord = window.i18n.translate('goalWord');
        const schedule = `${times.startMorning}-${times.endMorning}-${times.startAfternoon}-${times.endAfternoon}`;
        const details = `${schedule} (${workedStr} : ${diffStr} : ${newBalanceStr} | ${goalWord} ${goalString})`;

        switch (summaryFormat) {
            case SUMMARY_FORMATS.TIMES_ONLY:
                return schedule;
            case SUMMARY_FORMATS.TIMES_WITH_DETAILS:
                return details;
            case SUMMARY_FORMATS.DATE_TIMES_WITH_DETAILS:
            default:
                return `${dateStr}${details}`;
        }
    }

    function displayResult(workedMinutes, dailyDiffMinutes, newBalanceString, summaryLine, goalString) {
        const workedHours = formatMinutesToHoursAndMinutes(workedMinutes);
        const dailyDiffString = formatMinutesForDisplay(dailyDiffMinutes);

        const i18n = window.i18n;
        resultDiv.innerHTML = `
            <p class="result-line"><strong>${i18n.translate('workedToday')}</strong> ${workedHours}</p>
            <p class="result-line"><strong>${i18n.translate('dailyDiff')} ${goalString}) :</strong> ${dailyDiffString}</p>
            <p class="result-line"><strong>${i18n.translate('newBalance')}</strong> ${newBalanceString.replace(':', 'h')}</p>
            <div class="result-summary">
                <p class="result-line"><strong>${i18n.translate('summaryLine')}</strong></p>
                <div class="result-summary__content">
                    <code class="result-summary__code">${summaryLine}</code>
                    <button id="copyScheduleButton" class="copy-button" data-i18n-aria="aria_copySchedule">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Ajouter l'événement de copie
        document.getElementById('copyScheduleButton').addEventListener('click', () => {
            navigator.clipboard.writeText(summaryLine).then(() => {
                const button = document.getElementById('copyScheduleButton');
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
                button.classList.add('copied');
                setTimeout(() => {
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                    button.classList.remove('copied');
                }, 2000);
            });
        });
    }

    function updateHistoryVisibility() {
        const hasHistory = historyList.children.length > 0;
        if (hasHistory) {
            historyContainer.classList.add('has-history');
        } else {
            historyContainer.classList.remove('has-history');
        }
        historyTitle.style.display = hasHistory ? '' : 'none';
        clearHistoryBtn.style.display = hasHistory ? '' : 'none';
        exportHistoryBtn.style.display = hasHistory ? '' : 'none';
        if (historyOrderSelect) {
            const orderWrapper = historyOrderSelect.closest('.history-order-control');
            if (orderWrapper) {
                orderWrapper.style.display = hasHistory ? '' : 'none';
            }
        }
    }

    function addHistoryEntry(summaryLine, idx) {
        const li = document.createElement('li');
        li.textContent = summaryLine;
        const delBtn = document.createElement('button');
        delBtn.classList.add('history-delete-button');
        delBtn.textContent = '✕';
        const deleteText = window.i18n.translate('aria_deleteEntry');
        delBtn.title = deleteText;
        delBtn.setAttribute('aria-label', deleteText);
        delBtn.addEventListener('click', () => {
            // Supprimer l'entrée de l'historique
            const currentHistory = getLocalStorageItem('workHoursHistory', []);
            currentHistory.splice(idx, 1);
            setLocalStorageItem('workHoursHistory', currentHistory);
            li.remove();
            updateHistoryVisibility();
        });
        li.appendChild(delBtn);
        historyList.appendChild(li);
        updateHistoryVisibility();
    }
});
