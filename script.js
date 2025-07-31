document.addEventListener('DOMContentLoaded', () => {
    const timeForm = document.getElementById('time-form');
    const dateInput = document.getElementById('date-input');
    const goalInput = document.getElementById('goal-input');
    const startMorningInput = document.getElementById('start-morning');
    const endMorningInput = document.getElementById('end-morning');
    const startAfternoonInput = document.getElementById('start-afternoon');
    const endAfternoonInput = document.getElementById('end-afternoon');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsButton = document.getElementById('close-settings');
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
    const formInputs = [
        startMorningInput,
        endMorningInput,
        startAfternoonInput,
        endAfternoonInput
    ];

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

    // Sécurise l'injection de texte dans le DOM
    function escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]);
        });
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

    // Initialisation du solde à la première visite
    let lastBalance = getLocalStorageItem('workHoursBalance', null);

    // Gestion des paramètres
    // Charger l'état du paramètre auto-advance depuis localStorage
    const autoAdvanceEnabled = getLocalStorageItem('autoAdvanceEnabled', true);
    autoAdvanceCheckbox.checked = autoAdvanceEnabled;

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
    settingsButton.addEventListener('click', () => {
        settingsPanel.classList.add('open');
    });

    closeSettingsButton.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
    });

    // Fermer le panneau des paramètres en cliquant en dehors
    settingsPanel.addEventListener('click', (e) => {
        if (e.target === settingsPanel) {
            settingsPanel.classList.remove('open');
        }
    });

    // Sauvegarder le paramètre auto-advance
    autoAdvanceCheckbox.addEventListener('change', () => {
        setLocalStorageItem('autoAdvanceEnabled', autoAdvanceCheckbox.checked);
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
    
    const history = getLocalStorageItem('workHoursHistory', []);
    history.forEach((item, idx) => addHistoryEntry(item, idx));
    updateHistoryVisibility();

    timeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        resultDiv.style.display = 'block';

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
        // Pour <input type="time">, balanceHHMM.value est déjà au format HH:mm

        try {
            const workedMinutes = calculateWorkedMinutes(timeValues);
            const dailyDiffMinutes = workedMinutes - dailyGoalMinutes;
            const currentBalanceMinutes = parseBalance(currentBalanceString);
            const newBalanceMinutes = currentBalanceMinutes + dailyDiffMinutes;

            const newBalanceString = formatMinutesToSignedHours(newBalanceMinutes);
            
            const summaryLine = generateSummaryLine(dateValue, timeValues, workedMinutes, dailyDiffMinutes, newBalanceMinutes, goalString);

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

        } catch (error) {
            resultDiv.innerHTML = `<p role="alert">Erreur: ${escapeHTML(error.message)}</p>`;
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

    function generateSummaryLine(dateValue, times, workedMinutes, dailyDiffMinutes, newBalanceMinutes, goalString) {
        const workedStr = formatMinutesToHoursAndMinutes(workedMinutes);
        const diffStr = formatMinutesForDisplay(dailyDiffMinutes);
        const newBalanceStr = formatMinutesToSignedHours(newBalanceMinutes).replace(':', ' h ') + ' min';
        const dateStr = dateValue ? dateValue.split('-').reverse().join('/') + ' ' : '';
        return `${dateStr}${times.startMorning}-${times.endMorning}-${times.startAfternoon}-${times.endAfternoon} (${workedStr} : ${diffStr} : ${newBalanceStr} | objectif ${goalString})`;
    }

    function displayResult(workedMinutes, dailyDiffMinutes, newBalanceString, summaryLine, goalString) {
        const workedHours = formatMinutesToHoursAndMinutes(workedMinutes);
        const dailyDiffString = formatMinutesForDisplay(dailyDiffMinutes);

        resultDiv.innerHTML = `
            <p><strong>Temps travaillé aujourd'hui :</strong> ${workedHours}</p>
            <p><strong>Différence du jour (objectif ${goalString}) :</strong> ${dailyDiffString}</p>
            <p><strong>Nouveau solde :</strong> ${newBalanceString.replace(':', 'h')}</p>
            <hr>
            <p><strong>Ligne de résumé :</strong></p>
            <code style=\"display: block; background-color: #eee; padding: 8px; border-radius: 4px;\">${summaryLine}</code>
        `;
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
    }

    function addHistoryEntry(summaryLine, idx) {
        const li = document.createElement('li');
        li.textContent = summaryLine;
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        const delBtn = document.createElement('button');
        delBtn.textContent = '✕';
        delBtn.title = 'Supprimer cette entrée';
        delBtn.setAttribute('aria-label', 'Supprimer cette entrée');
        delBtn.style.marginLeft = '1em';
        delBtn.style.background = 'none';
        delBtn.style.border = 'none';
        delBtn.style.color = '#b00';
        delBtn.style.fontSize = '1.2em';
        delBtn.style.cursor = 'pointer';
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
