(function (global) {
    'use strict';

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

        const balanceRegex = /([+-])(\d+):(\d{2})/;
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

        const result = [];
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

    function parseScheduleFromText(text) {
        const parts = text
            .trim()
            // Support dash variants that can appear when copying text
            .split(/[\s\-\u2013\u2014]+/)
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

    const workHoursCore = {
        timeStringToMinutes,
        parseHHMM,
        calculateWorkedMinutes,
        parseBalance,
        formatMinutesToSignedHours,
        formatMinutesForDisplay,
        formatMinutesToHoursAndMinutes,
        parseScheduleFromText,
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = workHoursCore;
    }

    if (global) {
        global.workHoursCore = workHoursCore;
    }
})(typeof window !== 'undefined' ? window : globalThis);
