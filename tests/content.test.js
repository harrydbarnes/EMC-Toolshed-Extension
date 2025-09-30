const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const contentScript = fs.readFileSync(path.resolve(__dirname, '../content.js'), 'utf8');

describe('Content Script Main Logic', () => {
    let window;
    let document;
    let consoleSpy;

    const setupJSDOM = (url, timeBombActive = false, customReminders = []) => {
        require('./mocks/chrome');
        chrome.storage.local.__getStore().timeBombActive = timeBombActive;
        chrome.storage.sync.__getStore().customReminders = customReminders;

        const dom = new JSDOM('<!DOCTYPE html><html><body><p>Some initial content</p></body></html>', { url, runScripts: 'dangerously' });
        window = dom.window;
        document = window.document;
        window.chrome = global.chrome;

        const mutationCallbackMap = new Map();
        window.MutationObserver = jest.fn(function(callback) {
            const instance = {
                observe: jest.fn(() => mutationCallbackMap.set(this, callback)),
                disconnect: jest.fn(() => mutationCallbackMap.delete(this)),
                __trigger: (mutations) => {
                    const cb = mutationCallbackMap.get(this);
                    if (cb) cb(mutations, this);
                }
            };
            return instance;
        });

        const scriptEl = document.createElement('script');
        scriptEl.textContent = contentScript;
        document.head.appendChild(scriptEl);

        return { window, document };
    };

    beforeEach(() => {
        if (typeof resetMocks === 'function') resetMocks();
        jest.useFakeTimers();
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        if (window) window.close();
        jest.useRealTimers();
        consoleSpy.mockRestore();
        jest.clearAllMocks();
    });

    test('should NOT initialize features if time bomb is active', () => {
        setupJSDOM('https://groupmuk-prisma.mediaocean.com/', true);
        jest.advanceTimersByTime(100);
        expect(consoleSpy).toHaveBeenCalledWith('Ops Toolshed features disabled due to time bomb.');
    });

    test('should initialize features if time bomb is NOT active', () => {
        setupJSDOM('https://groupmuk-prisma.mediaocean.com/', false);
        jest.advanceTimersByTime(100);
        const hasInitializationLog = consoleSpy.mock.calls.some(call => call.join(' ').includes('[ContentScript Prisma] Script Injected'));
        expect(hasInitializationLog).toBe(true);
    });

    test('should show a custom reminder when conditions are met', (done) => {
        const reminder = {
            id: 'test1', name: 'Test Reminder',
            urlPattern: '*mediaocean.com*', textTrigger: 'initial content',
            popupMessage: '<h3>A Sub-Title</h3>', enabled: true,
        };
        const { document } = setupJSDOM('https://groupmuk-prisma.mediaocean.com/', false, [reminder]);

        // Wait for the async setup to complete before checking the observer
        setTimeout(() => {
            const observerInstance = window.MutationObserver.mock.results[0].value;
            expect(observerInstance).toBeDefined();

            observerInstance.__trigger([{}]); // Manually trigger the observer
            jest.advanceTimersByTime(3000); // Advance timers for script's internal logic

            const popup = document.getElementById('custom-reminder-display-popup');
            expect(popup).not.toBeNull();
            expect(popup.textContent).toContain('Test Reminder');
            done();
        }, 100);
    });
});