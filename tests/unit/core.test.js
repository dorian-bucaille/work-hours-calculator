const assert = require('node:assert/strict');
const test = require('node:test');

const core = require('../../js/core.js');

test('parseScheduleFromText normalizes 4 time segments', () => {
    const parsed = core.parseScheduleFromText('8:05-12:15-13:15-17:20');
    assert.deepEqual(parsed, ['08:05', '12:15', '13:15', '17:20']);
});

test('parseScheduleFromText handles dash variants and spaces', () => {
    const text = `08:00 \u2013 12:00 \u2014 13:00 - 17:00`;
    const parsed = core.parseScheduleFromText(text);
    assert.deepEqual(parsed, ['08:00', '12:00', '13:00', '17:00']);
});

test('parseScheduleFromText rejects invalid inputs', () => {
    assert.equal(core.parseScheduleFromText('08:00-12:00'), null);
    assert.equal(core.parseScheduleFromText('25:00-12:00-13:00-17:00'), null);
    assert.equal(core.parseScheduleFromText('08:00-12:00-13:00-17:99'), null);
});

test('timeStringToMinutes converts HH:MM to minutes', () => {
    assert.equal(core.timeStringToMinutes('08:30'), 510);
});

test('parseHHMM returns total minutes and rejects bad formats', () => {
    assert.equal(core.parseHHMM('07:22'), 442);
    assert.throws(() => core.parseHHMM('7:2'));
});

test('calculateWorkedMinutes sums morning and afternoon', () => {
    const minutes = core.calculateWorkedMinutes({
        startMorning: '08:00',
        endMorning: '12:00',
        startAfternoon: '13:00',
        endAfternoon: '17:00',
    });
    assert.equal(minutes, 480);
    assert.throws(() => core.calculateWorkedMinutes({
        startMorning: '12:00',
        endMorning: '08:00',
        startAfternoon: '13:00',
        endAfternoon: '17:00',
    }));
});

test('parseBalance handles signed balances and empty values', () => {
    assert.equal(core.parseBalance(''), 0);
    assert.equal(core.parseBalance('+01:15'), 75);
    assert.equal(core.parseBalance('-00:30'), -30);
    assert.throws(() => core.parseBalance('01:15'));
});

test('formatMinutesToSignedHours returns signed HH:MM', () => {
    assert.equal(core.formatMinutesToSignedHours(0), '+00:00');
    assert.equal(core.formatMinutesToSignedHours(75), '+01:15');
    assert.equal(core.formatMinutesToSignedHours(-90), '-01:30');
});

test('formatMinutesForDisplay returns human readable strings', () => {
    assert.equal(core.formatMinutesForDisplay(0), '0 min');
    assert.equal(core.formatMinutesForDisplay(45), '+45 min');
    assert.equal(core.formatMinutesForDisplay(-75), '- 1 h 15 min');
});

test('formatMinutesToHoursAndMinutes pads minutes', () => {
    assert.equal(core.formatMinutesToHoursAndMinutes(5), '0 h 05 min');
    assert.equal(core.formatMinutesToHoursAndMinutes(125), '2 h 05 min');
});
