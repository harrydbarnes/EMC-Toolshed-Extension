global.chrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
    },
    onMessage: {
      addListener: jest.fn(),
    },
    getURL: jest.fn(path => 'mock-url/' + path),
  },
  storage: {
    sync: {
      get: jest.fn((keys, callback) => callback({})),
      set: jest.fn((items, callback) => callback()),
    },
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
  },
  scripting: {
    executeScript: jest.fn(),
  },
};
