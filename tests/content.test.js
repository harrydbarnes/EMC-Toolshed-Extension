const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const contentScript = fs.readFileSync(path.resolve(__dirname, '../content.js'), 'utf8');
const testableContentScript = contentScript + '\nwindow.createCustomReminderPopup = createCustomReminderPopup;';

// Mock chrome APIs - we need a slightly more advanced one for this test
global.chrome = {
  runtime: {
    getURL: jest.fn(path => 'mock-url/' + path),
    onMessage: { addListener: jest.fn() },
  },
  storage: {
    sync: {
      // Make the mock return a specific structure for customReminders
      get: jest.fn((keys, callback) => {
        if (keys && keys.customReminders) {
          callback({ customReminders: [] });
        } else {
          callback({});
        }
      }),
      set: jest.fn((items, callback) => callback()),
    },
  },
};


describe('Custom Reminder Popup in content.js', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://groupmuk-prisma.mediaocean.com/',
      runScripts: 'dangerously'
    });
    window = dom.window;
    document = window.document;

    window.chrome = global.chrome;

    window.MutationObserver = jest.fn(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
    window.setInterval = jest.fn();
    window.setTimeout = jest.fn((callback) => callback());

    const scriptEl = document.createElement('script');
    scriptEl.textContent = testableContentScript;
    document.head.appendChild(scriptEl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createCustomReminderPopup should correctly render HTML from popupMessage', () => {
    const reminder = {
      id: 'test1',
      name: 'Test Reminder',
      popupMessage: '<h3>A Sub-Title</h3><p>This is a paragraph.</p><ul><li>Bullet 1</li></ul>'
    };

    window.createCustomReminderPopup(reminder);

    const popup = document.getElementById('custom-reminder-display-popup');
    expect(popup).not.toBeNull();

    // The structure has two H3s. The first is the name, the second is the sub-title.
    const allTitles = popup.querySelectorAll('h3');
    expect(allTitles.length).toBe(2);

    // Check main title (from reminder.name)
    expect(allTitles[0].textContent).toBe(reminder.name);

    // Check sub-title (from popupMessage)
    expect(allTitles[1].textContent).toBe('A Sub-Title');

    const paragraph = popup.querySelector('p');
    expect(paragraph).not.toBeNull();
    expect(paragraph.textContent).toBe('This is a paragraph.');

    const listItem = popup.querySelector('li');
    expect(listItem).not.toBeNull();
    expect(listItem.textContent).toBe('Bullet 1');
  });
});
