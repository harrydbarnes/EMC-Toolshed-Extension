describe('Time Bomb Feature in background.js', () => {
    beforeEach(() => {
        // Reset all mocks and storage before each test
        if (typeof resetMocks === 'function') {
            resetMocks();
        }
        jest.resetModules(); // This is crucial to get a fresh module
    });

    afterEach(() => {
        jest.useRealTimers(); // Clean up fake timers after each test
    });

    test('should set initial deadline correctly when installed on a Monday', () => {
        // Set the fake time BEFORE running the setup
        jest.useFakeTimers().setSystemTime(new Date('2024-07-29T10:00:00')); // A Monday

        // Load the module, which registers the listener
        jest.isolateModules(() => {
            require('../background');
        });

        // Manually trigger the onInstalled event to simulate installation
        if (chrome.runtime.onInstalled.listener) {
            chrome.runtime.onInstalled.listener();
        }

        // Run timers to ensure the async storage operations complete
        jest.runAllTimers();

        // Now check the storage
        const storage = chrome.storage.local.__getStore();
        expect(storage.initialDeadline).toBeDefined();
        expect(storage.timeBombActive).toBe(false);

        const expectedDeadline = new Date('2024-07-30T23:59:00');
        expect(storage.initialDeadline).toBe(expectedDeadline.getTime());
    });

    test('should set deadline for next week if installed after the deadline on a Tuesday', () => {
        // Set the fake time AFTER the deadline time on a Tuesday
        jest.useFakeTimers().setSystemTime(new Date('2024-07-30T23:59:01'));

        jest.isolateModules(() => {
            require('../background');
        });

        // Manually trigger the onInstalled event
        if (chrome.runtime.onInstalled.listener) {
            chrome.runtime.onInstalled.listener();
        }

        // Run timers to ensure the async storage operations complete
        jest.runAllTimers();

        const storage = chrome.storage.local.__getStore();
        const expectedDeadline = new Date('2024-08-06T23:59:00');
        expect(storage.initialDeadline).toBe(expectedDeadline.getTime());
    });

    test('should become active after the deadline has passed', async () => {
        // Pre-populate storage with an existing deadline
        const initialDeadline = new Date('2024-07-30T23:59:00').getTime();
        chrome.storage.local.__getStore().initialDeadline = initialDeadline;

        // Set time to AFTER the deadline
        jest.useFakeTimers().setSystemTime(new Date('2024-07-31T00:00:01'));

        let checkTimeBomb;
        jest.isolateModules(() => {
            // We require it again to get the function, but the initial run won't affect our pre-populated state
            checkTimeBomb = require('../background').checkTimeBomb;
        });

        // Run the check again at the new time
        checkTimeBomb();
        jest.runAllTimers(); // Wait for the async storage operations to complete

        const storage = await chrome.storage.local.get('timeBombActive');
        expect(storage.timeBombActive).toBe(true);
    });

    test('should remain inactive before the deadline has passed', async () => {
        const initialDeadline = new Date('2024-07-30T23:59:00').getTime();
        chrome.storage.local.__getStore().initialDeadline = initialDeadline;

        // Set time to BEFORE the deadline
        jest.useFakeTimers().setSystemTime(new Date('2024-07-30T23:58:59'));

        let checkTimeBomb;
        jest.isolateModules(() => {
            checkTimeBomb = require('../background').checkTimeBomb;
        });

        checkTimeBomb();
        jest.runAllTimers(); // Wait for the async storage operations to complete

        const storage = await chrome.storage.local.get('timeBombActive');
        expect(storage.timeBombActive).toBe(false);
    });
});

describe('getNextAlarmDate (existing tests)', () => {
    let getNextAlarmDate;

     beforeAll(() => {
        const background = require('../background');
        getNextAlarmDate = background.getNextAlarmDate;
    });

    const constantDate = new Date('2024-07-26T10:00:00'); // A Friday

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(constantDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should return the next Friday if the current day is Friday but the time has passed', () => {
        const nextAlarm = getNextAlarmDate('Friday', '09:00');
        const expectedDate = new Date(constantDate);
        expectedDate.setDate(constantDate.getDate() + 7);
        expectedDate.setHours(9, 0, 0, 0);
        expect(nextAlarm.getTime()).toBe(expectedDate.getTime());
    });

    test('should return the upcoming Friday in the same week if the time has not passed', () => {
        const nextAlarm = getNextAlarmDate('Friday', '14:30');
        const expectedDate = new Date(constantDate);
        expectedDate.setHours(14, 30, 0, 0);
        expect(nextAlarm.getTime()).toBe(expectedDate.getTime());
    });

    test('should return next Monday if current day is Friday', () => {
        const nextAlarm = getNextAlarmDate('Monday', '09:30');
        const expectedDate = new Date('2024-07-29T09:30:00');
        expect(nextAlarm.getTime()).toBe(expectedDate.getTime());
    });

    test('should handle month rollovers correctly', () => {
        jest.setSystemTime(new Date('2024-08-30T15:00:00')); // A Friday
        const nextAlarm = getNextAlarmDate('Wednesday', '11:00');
        const expectedDate = new Date('2024-09-04T11:00:00');
        expect(nextAlarm.getTime()).toBe(expectedDate.getTime());
    });

    test('should handle year rollovers correctly', () => {
        jest.setSystemTime(new Date('2024-12-30T10:00:00')); // A Monday
        const nextAlarm = getNextAlarmDate('Tuesday', '09:00');
        const expectedDate = new Date('2024-12-31T09:00:00');
        expect(nextAlarm.getTime()).toBe(expectedDate.getTime());
    });

    test('should return a date exactly 7 days in the future if the day is the same and time is earlier', () => {
        jest.setSystemTime(new Date('2024-07-26T08:00:00')); // Friday morning
        const nextAlarm = getNextAlarmDate('Friday', '07:00'); // Time has passed
        const expectedDate = new Date('2024-08-02T07:00:00');
        expect(nextAlarm.getTime()).toBe(expectedDate.getTime());
    });
});