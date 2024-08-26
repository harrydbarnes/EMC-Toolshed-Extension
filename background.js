// Set up the alarm when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('timesheetReminderEnabled', function(data) {
    if (data.timesheetReminderEnabled !== false) {
      createTimesheetAlarm();
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showTimesheetNotification") {
        showTimesheetNotification();
    } else if (request.action === "createTimesheetAlarm") {
        createTimesheetAlarm();
    } else if (request.action === "removeTimesheetAlarm") {
        chrome.alarms.clear('timesheetReminder');
    }
});

// Create the alarm for Friday at 2:30 PM
function createTimesheetAlarm() {
  chrome.alarms.create('timesheetReminder', {
    when: getNextFriday().getTime(),
    periodInMinutes: 10080 // 7 days in minutes
  });
}

// Get the next Friday at 2:30 PM
function getNextFriday() {
  const now = new Date();
  const nextFriday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (5 - now.getDay() + 7) % 7, 14, 30);
  if (nextFriday <= now) {
    nextFriday.setDate(nextFriday.getDate() + 7);
  }
  return nextFriday;
}

// Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timesheetReminder') {
    showTimesheetNotification();
  }
});

// Show the notification
function showTimesheetNotification() {
  chrome.storage.sync.get('timesheetReminderEnabled', function(data) {
    if (data.timesheetReminderEnabled !== false) {
      chrome.notifications.create('timesheetReminder', {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Timesheet Reminder',
        message: 'Don\'t forget to complete your timesheet!',
        buttons: [
          { title: 'My Timesheets' },
          { title: 'Timelock Me!' }
        ],
        requireInteraction: true
      });
    }
  });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'timesheetReminder') {
    if (buttonIndex === 0) {
      // Open My Timesheets
      chrome.tabs.create({ url: 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo' });
    } else if (buttonIndex === 1) {
      // Snooze for 15 minutes
      chrome.alarms.create('timesheetReminder', {
        delayInMinutes: 15
      });
    }
    chrome.notifications.clear(notificationId);
  }
});
