// Set up the alarm when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('timesheetReminderEnabled', function(data) {
    if (data.timesheetReminderEnabled !== false) {
      createTimesheetAlarm();
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message:", request);
    if (request.action === "showTimesheetNotification") {
        console.log("Showing timesheet notification");
        showTimesheetNotification();
        sendResponse({status: "Notification shown"});
        console.log("Response sent");
    } else if (request.action === "createTimesheetAlarm") {
        createTimesheetAlarm();
        sendResponse({status: "Alarm created"});
    } else if (request.action === "removeTimesheetAlarm") {
        chrome.alarms.clear('timesheetReminder');
        sendResponse({status: "Alarm removed"});
    }
    return true;  // Indicates that the response is sent asynchronously
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
  console.log("showTimesheetNotification function called");
  chrome.storage.sync.get('timesheetReminderEnabled', function(data) {
    console.log("Timesheet reminder enabled:", data.timesheetReminderEnabled);
    if (data.timesheetReminderEnabled !== false) {
      chrome.notifications.create('timesheetReminder', {
        // ... notification options ...
      }, function(notificationId) {
        console.log("Notification created with ID:", notificationId);
        if (chrome.runtime.lastError) {
          console.error("Error creating notification:", chrome.runtime.lastError);
        }
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
