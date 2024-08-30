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
    } else if (request.action === "createTimesheetAlarm") {
        createTimesheetAlarm();
        sendResponse({status: "Alarm created"});
    } else if (request.action === "removeTimesheetAlarm") {
        chrome.alarms.clear('timesheetReminder');
        sendResponse({status: "Alarm removed"});
    }
    return true;  // Indicates that the response is sent asynchronously
});

function createTimesheetAlarm() {
  const nextFriday = getNextFriday();
  chrome.alarms.create('timesheetReminder', {
    when: nextFriday.getTime(),
    periodInMinutes: 10080 // 7 days in minutes
  });
  console.log("Alarm set for:", nextFriday);
}

function getNextFriday() {
  const now = new Date();
  const nextFriday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (5 - now.getDay() + 7) % 7, 14, 30);
  if (nextFriday <= now) {
    nextFriday.setDate(nextFriday.getDate() + 7);
  }
  return nextFriday;
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timesheetReminder') {
    showTimesheetNotification();
  }
});

function showTimesheetNotification() {
  console.log("showTimesheetNotification function called");
  chrome.storage.sync.get('timesheetReminderEnabled', function(data) {
    console.log("Timesheet reminder enabled:", data.timesheetReminderEnabled);
    if (data.timesheetReminderEnabled !== false) {
      chrome.windows.create({
        url: chrome.runtime.getURL("notification.html"),
        type: "popup",
        width: 400,
        height: 300
      });
    }
  });
}
