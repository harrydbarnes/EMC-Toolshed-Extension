const { getNextAlarmDate } = require('../background');

describe('getNextAlarmDate', () => {
    // Set a fixed date for consistent testing
    const constantDate = new Date('2024-07-26T10:00:00'); // A Friday

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(constantDate);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    test('should return the next Friday if the current day is Friday but the time has passed', () => {
        const nextAlarm = getNextAlarmDate('Friday', '09:00');
        const expectedDate = new Date(constantDate);
        expectedDate.setDate(constantDate.getDate() + 7);
        expectedDate.setHours(9, 0, 0, 0);
        // It's past 9:00 on Friday, so it should be next Friday
        expect(nextAlarm.getFullYear()).toBe(expectedDate.getFullYear());
        expect(nextAlarm.getMonth()).toBe(expectedDate.getMonth());
        expect(nextAlarm.getDate()).toBe(expectedDate.getDate());
        expect(nextAlarm.getDay()).toBe(5); // 5 = Friday
        expect(nextAlarm.getHours()).toBe(9);
        expect(nextAlarm.getMinutes()).toBe(0);
    });

    test('should return the upcoming Friday in the same week if the time has not passed', () => {
        const nextAlarm = getNextAlarmDate('Friday', '14:30');
        // It's before 14:30 on Friday, so it should be today
        expect(nextAlarm.getDay()).toBe(5); // 5 = Friday
        expect(nextAlarm.getDate()).toBe(constantDate.getDate());
        expect(nextAlarm.getHours()).toBe(14);
        expect(nextAlarm.getMinutes()).toBe(30);
    });

    test('should return next Monday if current day is Friday', () => {
        const nextAlarm = getNextAlarmDate('Monday', '09:30');
        const expectedDate = new Date(constantDate);
        expectedDate.setDate(constantDate.getDate() + 3); // Friday to Monday is 3 days
        expectedDate.setHours(9, 30, 0, 0);

        const actualAlarm = getNextAlarmDate('Monday', '09:30');

        expect(actualAlarm.getFullYear()).toBe(expectedDate.getFullYear());
        expect(actualAlarm.getMonth()).toBe(expectedDate.getMonth());
        expect(actualAlarm.getDate()).toBe(expectedDate.getDate());
        expect(actualAlarm.getDay()).toBe(1); // 1 = Monday
        expect(actualAlarm.getHours()).toBe(9);
        expect(actualAlarm.getMinutes()).toBe(30);
    });

    test('should handle month rollovers correctly', () => {
        // Set date to the end of the month
        const customDate = new Date('2024-08-30T15:00:00'); // A Friday
        jest.setSystemTime(customDate);

        const nextAlarm = getNextAlarmDate('Wednesday', '11:00');
        // Next Wednesday is in September
        expect(nextAlarm.getMonth()).toBe(8); // Month is 0-indexed, so 8 = September
        expect(nextAlarm.getDate()).toBe(4);
        expect(nextAlarm.getFullYear()).toBe(2024);
    });

    test('should handle year rollovers correctly', () => {
        // Set date to the end of the year
        const customDate = new Date('2024-12-30T10:00:00'); // A Monday
        jest.setSystemTime(customDate);

        const nextAlarm = getNextAlarmDate('Tuesday', '09:00');
        expect(nextAlarm.getFullYear()).toBe(2024);
        expect(nextAlarm.getMonth()).toBe(11); // 11 = December
        expect(nextAlarm.getDate()).toBe(31);
    });

    test('should return a date exactly 7 days in the future if the day is the same and time is earlier', () => {
        const customDate = new Date('2024-07-26T08:00:00'); // Friday morning
        jest.setSystemTime(customDate);

        const nextAlarm = getNextAlarmDate('Friday', '07:00'); // Time has passed
        const expectedDate = new Date(customDate);
        expectedDate.setDate(customDate.getDate() + 7);
        expectedDate.setHours(7, 0, 0, 0);

        expect(nextAlarm.getFullYear()).toBe(expectedDate.getFullYear());
        expect(nextAlarm.getMonth()).toBe(expectedDate.getMonth());
        expect(nextAlarm.getDate()).toBe(expectedDate.getDate());
    });
});
