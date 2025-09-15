const { generateUrlFromData } = require('../popup');

describe('generateUrlFromData', () => {
    const campaignId = 'TEST_CAMPAIGN';

    beforeAll(() => {
        // Set a fixed date for consistent testing, e.g., '2024-07-26'
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-07-26T10:00:00'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    test('should return null if campaignId is not provided', () => {
        expect(generateUrlFromData('', 'July 25')).toBeNull();
        expect(generateUrlFromData(null, 'July 25')).toBeNull();
    });

    test('should generate a URL with the current month if date string is empty', () => {
        const expectedUrl = `https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=${campaignId}&route=actualize&mos=2024-07-01`;
        expect(generateUrlFromData(campaignId, '')).toBe(expectedUrl);
    });

    test('should return null for an completely invalid date string', () => {
        expect(generateUrlFromData(campaignId, 'invalid-date')).toBeNull();
    });

    // Test various valid date formats
    const testCases = [
        { input: 'July 25', expected: '2025-07-01' },
        { input: '07/25', expected: '2025-07-01' },
        { input: 'July 2025', expected: '2025-07-01' },
        { input: '07/2025', expected: '2025-07-01' },
        { input: '2025-07', expected: '2025-07-01' },
        { input: '2025-07-15', expected: '2025-07-01' },
        { input: 'Aug 24', expected: '2024-08-01' },
    ];

    testCases.forEach(({ input, expected }) => {
        test(`should correctly parse date format "${input}"`, () => {
            const expectedUrl = `https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=${campaignId}&route=actualize&mos=${expected}`;
            expect(generateUrlFromData(campaignId, input)).toBe(expectedUrl);
        });
    });

    test('should handle different campaign IDs correctly', () => {
        const newCampaignId = 'ANOTHER-ID-123';
        const expectedUrl = `https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=${encodeURIComponent(newCampaignId)}&route=actualize&mos=2024-07-01`;
        expect(generateUrlFromData(newCampaignId, '')).toBe(expectedUrl);
    });
});
