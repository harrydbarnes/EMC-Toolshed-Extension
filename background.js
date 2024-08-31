chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function(data) {
    if (data.timesheetReminderEnabled !== false) {
      createTimesheetAlarm(data.reminderDay, data.reminderTime);
    }
    if (data.reminderDay === undefined || data.reminderTime === undefined) {
      chrome.storage.sync.set({ reminderDay: 'Friday', reminderTime: '14:30' });
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
        createTimesheetAlarm(request.day, request.time);
        sendResponse({status: "Alarm created"});
    } else if (request.action === "removeTimesheetAlarm") {
        chrome.alarms.clear('timesheetReminder');
        sendResponse({status: "Alarm removed"});
    }
    return true;  // Indicates that the response is sent asynchronously
});

function createTimesheetAlarm(day, time) {
  // Default to Friday at 14:30 if day or time is undefined
  day = day || 'Friday';
  time = time || '14:30';
  
  const nextAlarmDate = getNextAlarmDate(day, time);
  chrome.alarms.create('timesheetReminder', {
    when: nextAlarmDate.getTime(),
    periodInMinutes: 10080 // 7 days in minutes
  });
  console.log("Alarm set for:", nextAlarmDate);
}

function getNextAlarmDate(day, time) {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
  
  let nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (dayIndex + 7 - now.getDay()) % 7, hours, minutes);
  
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 7);
  }
  
  return nextDate;
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
      chrome.notifications.create('timesheetReminder', {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Timesheet Reminder',
        message: 'Don\'t forget to submit your timesheet!',
        buttons: [
          { title: 'Open My Timesheets' },
          { title: 'Snooze for 15 minutes' }
        ],
        priority: 2
      }, function(notificationId) {
        console.log("Notification created with ID:", notificationId);
        if (chrome.runtime.lastError) {
          console.error("Error creating notification:", chrome.runtime.lastError);
        }
        playAlarmSound();
      });
    }
  });
}

function playAlarmSound() {
  const audio = new Audio(chrome.runtime.getURL('alarm.mp3'));
  audio.play().catch(error => console.error('Error playing audio:', error));
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'timesheetReminder') {
    if (buttonIndex === 0) {
      chrome.tabs.create({ url: 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo' });
    } else if (buttonIndex === 1) {
      chrome.alarms.create('timesheetReminder', {
        delayInMinutes: 15
      });
    }
    chrome.notifications.clear(notificationId);
  }
});
