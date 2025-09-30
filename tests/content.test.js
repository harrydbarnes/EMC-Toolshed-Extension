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

        // We need a real MutationObserver mock for this to work
        const mutationCallbackMap = new Map();
        window.MutationObserver = jest.fn(function(callback) {
            const instance = {
                observe: jest.fn((element, options) => {
                    mutationCallbackMap.set(this, callback);
                }),
                disconnect: jest.fn(() => {
                    mutationCallbackMap.delete(this);
                }),
                // A helper to manually trigger the observer for tests
                __trigger: (mutations) => {
                    const cb = mutationCallbackMap.get(this);
                    if (cb) {
                        cb(mutations, this);
                    }
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
        expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[ContentScript Prisma] Script Injected'));
    });

    test('should initialize features if time bomb is NOT active', () => {
        setupJSDOM('https://groupmuk-prisma.mediaocean.com/', false);
        jest.advanceTimersByTime(100);
        const hasInitializationLog = consoleSpy.mock.calls.some(call => call.join(' ').includes('[ContentScript Prisma] Script Injected'));
        expect(consoleSpy).not.toHaveBeenCalledWith('Ops Toolshed features disabled due to time bomb.');
        expect(hasInitializationLog).toBe(true);
    });

    test('should show a custom reminder when conditions are met', () => {
        const reminder = {
            id: 'test1', name: 'Test Reminder',
            urlPattern: '*mediaocean.com*', textTrigger: 'initial content',
            popupMessage: '<h3>A Sub-Title</h3>', enabled: true,
        };
        const { document } = setupJSDOM('https://groupmuk-prisma.mediaocean.com/', false, [reminder]);

        // Manually trigger the mutation observer, which is what the script relies on
        const observerInstance = window.MutationObserver.mock.results[0].value;
        observerInstance.__trigger([{}]); // Trigger with a mock mutation record

        // Advance timers to allow the script's internal setTimeouts to run
        jest.advanceTimersByTime(3000);

        const popup = document.getElementById('custom-reminder-display-popup');
        expect(popup).not.toBeNull();
        expect(popup.textContent).toContain('Test Reminder');
    });
});