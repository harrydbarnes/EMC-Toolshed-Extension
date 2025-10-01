// A simple in-memory storage implementation for the mock
const createStorageAreaMock = () => {
  let storage = {};
  return {
    get: jest.fn((keys, callback) => {
      const result = {};
      if (!keys) { // Get all items
          Object.assign(result, storage);
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (storage[key] !== undefined) {
            result[key] = storage[key];
          }
        });
      } else if (typeof keys === 'object' && keys !== null) {
        Object.keys(keys).forEach(key => {
          result[key] = storage[key] === undefined ? keys[key] : storage[key];
        });
      } else if (typeof keys === 'string') {
        if(storage[keys] !== undefined) {
            result[keys] = storage[keys];
        }
      }
      if (callback) callback(result);
      return Promise.resolve(result);
    }),
    set: jest.fn((items, callback) => {
      Object.assign(storage, items);
      if (callback) callback();
      return Promise.resolve();
    }),
    remove: jest.fn((keys, callback) => {
        if (Array.isArray(keys)) {
            keys.forEach(key => delete storage[key]);
        } else if (typeof keys === 'string') {
            delete storage[keys];
        }
        if (callback) callback();
        return Promise.resolve();
    }),
    clear: jest.fn((callback) => {
      storage = {};
      if (callback) callback();
      return Promise.resolve();
    }),
    // Helper to view the storage content in tests
    __getStore: () => storage,
    // Helper to reset the storage before each test
    __resetStore: () => { storage = {}; }
  };
};

const syncStorage = createStorageAreaMock();
const localStorage = createStorageAreaMock();


global.chrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn((listener) => {
        global.chrome.runtime.onInstalled.listener = listener;
      }),
      listener: null,
    },
    onMessage: {
      addListener: jest.fn((listener) => {
        // You can store the listener if you need to simulate message events
        global.chrome.runtime.onMessage.listener = listener;
      }),
      listener: null, // to hold the registered listener
    },
    getURL: jest.fn(path => 'mock-url/' + path),
    lastError: undefined,
  },
  storage: {
    sync: syncStorage,
    local: localStorage,
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn(),
    onButtonClicked: {
      addListener: jest.fn(),
    },
    clear: jest.fn(),
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
    },
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

// Function to reset mocks before each test
global.resetMocks = () => {
    // Reset all jest.fn() calls
    global.chrome.runtime.onInstalled.addListener.mockClear();
    global.chrome.runtime.onInstalled.listener = null;
    global.chrome.runtime.onMessage.addListener.mockClear();
    global.chrome.runtime.onMessage.listener = null;
    global.chrome.runtime.getURL.mockClear();
    global.chrome.alarms.create.mockClear();
    global.chrome.alarms.clear.mockClear();
    global.chrome.alarms.onAlarm.addListener.mockClear();
    global.chrome.notifications.create.mockClear();
    global.chrome.notifications.onButtonClicked.addListener.mockClear();
    global.chrome.notifications.clear.mockClear();
    global.chrome.tabs.create.mockClear();
    global.chrome.tabs.query.mockClear();
    global.chrome.tabs.update.mockClear();
    global.chrome.tabs.onUpdated.addListener.mockClear();
    global.chrome.scripting.executeScript.mockClear();

    // Reset storage mocks
    global.chrome.storage.sync.get.mockClear();
    global.chrome.storage.sync.set.mockClear();
    global.chrome.storage.sync.remove.mockClear();
    global.chrome.storage.sync.clear.mockClear();
    global.chrome.storage.sync.__resetStore();

    global.chrome.storage.local.get.mockClear();
    global.chrome.storage.local.set.mockClear();
    global.chrome.storage.local.remove.mockClear();
    global.chrome.storage.local.clear.mockClear();
    global.chrome.storage.local.__resetStore();

    // Reset lastError
    global.chrome.runtime.lastError = undefined;
};