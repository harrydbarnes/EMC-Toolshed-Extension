const IS_DEVELOPMENT = false; // Set to true for development console logs

chrome.runtime.onInstalled.addListener(() => {
  if (IS_DEVELOPMENT) console.log("[Background] Extension installed or updated.");
  chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function(data) {
    if (chrome.runtime.lastError) {
      if (IS_DEVELOPMENT) console.error("[Background] Error getting initial settings:", chrome.runtime.lastError.message);
      return;
    }
    if (data.timesheetReminderEnabled !== false) {
      // Default values are handled within createTimesheetAlarm if data.reminderDay or data.reminderTime are undefined
      createTimesheetAlarm(data.reminderDay, data.reminderTime);
    }
    // Ensure default reminder day and time are set if they've never been set before.
    if (data.reminderDay === undefined || data.reminderTime === undefined) {
      chrome.storage.sync.set({ reminderDay: 'Friday', reminderTime: '14:30' }, () => {
        if (chrome.runtime.lastError) {
          if (IS_DEVELOPMENT) console.error("[Background] Error setting default reminderDay/Time:", chrome.runtime.lastError.message);
        } else {
          if (IS_DEVELOPMENT) console.log("[Background] Default reminderDay and reminderTime set.");
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (IS_DEVELOPMENT) console.log("[Background] Received message:", request);
    switch (request.action) {
        case "showTimesheetNotification":
            if (IS_DEVELOPMENT) console.log("[Background] Showing timesheet notification");
            showTimesheetNotification();
            sendResponse({status: "Notification process initiated"});
            break;
        case "createTimesheetAlarm":
            createTimesheetAlarm(request.day, request.time);
            sendResponse({status: "Alarm creation process initiated"});
            break;
        case "removeTimesheetAlarm":
            chrome.alarms.clear('timesheetReminder', (wasCleared) => {
                if (chrome.runtime.lastError) {
                    if (IS_DEVELOPMENT) console.error("[Background] Error clearing alarm:", chrome.runtime.lastError.message);
                    sendResponse({status: "Error clearing alarm", error: chrome.runtime.lastError.message});
                } else {
                    if (IS_DEVELOPMENT) console.log("[Background] Timesheet reminder alarm cleared:", wasCleared);
                    sendResponse({status: "Alarm removed", cleared: wasCleared});
                }
            });
            break;
        default:
            if (IS_DEVELOPMENT) console.warn("[Background] Unknown action received:", request.action);
            sendResponse({status: "Unknown action"});
            break;
    }
    return true;  // Indicates that the response can be sent asynchronously
});

function createTimesheetAlarm(day, time) {
  // Default to Friday at 14:30 if day or time is undefined/null
  const effectiveDay = day || 'Friday';
  const effectiveTime = time || '14:30';

  const nextAlarmDate = getNextAlarmDate(effectiveDay, effectiveTime);
  chrome.alarms.create('timesheetReminder', {
    when: nextAlarmDate.getTime(),
    periodInMinutes: 10080 // 7 days in minutes
  }, () => {
    if (chrome.runtime.lastError) {
        if (IS_DEVELOPMENT) console.error("[Background] Error creating alarm 'timesheetReminder':", chrome.runtime.lastError.message);
    } else {
        if (IS_DEVELOPMENT) console.log("[Background] Alarm 'timesheetReminder' set for:", nextAlarmDate.toISOString(), "Day:", effectiveDay, "Time:", effectiveTime);
    }
  });
}

function getNextAlarmDate(day, time) {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const dayMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = dayMapping.indexOf(day);

  if (dayIndex === -1) {
    if (IS_DEVELOPMENT) console.error("[Background] Invalid day provided for alarm:", day);
    return now; // Fallback or handle error appropriately
  }

  let nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  
  // Adjust to the target day of the week
  const currentDay = nextDate.getDay();
  let daysToAdd = (dayIndex - currentDay + 7) % 7;
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  // If the calculated date/time is in the past (or too close to now), schedule for the next week
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 7);
  }
  
  // If after adjustment for day, the time is still in the past for *that specific day*, it implies we need to go to next week's occurrence of that day.
  // This condition is usually covered by the `nextDate <= now` after day adjustment, but can be an edge case if `now` is very close to alarm time on the same day.
  const checkTime = new Date(nextDate); // Create a copy to only compare time parts
  if (checkTime.getHours() < hours || (checkTime.getHours() === hours && checkTime.getMinutes() < minutes)) {
     if (daysToAdd === 0 && nextDate <= now) { // If it was today but time already passed
        nextDate.setDate(nextDate.getDate() + 7);
     }
  }


  return nextDate;
}

// Check if an offscreen document is already open
async function hasOffscreenDocument(path) {
  if (!chrome.runtime.getManifest().offscreen || !chrome.offscreen) {
    if (IS_DEVELOPMENT) console.warn("[Background] Offscreen API not available or not declared in manifest.");
    return false;
  }
  const matchedClients = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  for (const client of matchedClients) {
    if (client.url.endsWith(path)) {
      return true;
    }
  }
  return false;
}

// Create the offscreen document if it doesn't exist
async function createOffscreenDocument() {
  const offscreenDocumentPath = 'offscreen.html';
  if (await hasOffscreenDocument(offscreenDocumentPath)) {
    if (IS_DEVELOPMENT) console.log("[Background] Offscreen document already exists.");
    return;
  }
  try {
    if (IS_DEVELOPMENT) console.log("[Background] Creating offscreen document.");
    await chrome.offscreen.createDocument({
      url: offscreenDocumentPath,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Plays alarm sound for timesheet reminders',
    });
  } catch (error) {
    if (IS_DEVELOPMENT) console.error("[Background] Error creating offscreen document:", error.message, error);
  }
}

async function playAlarmSound() {
  if (IS_DEVELOPMENT) console.log("[Background] playAlarmSound function called");
  chrome.storage.sync.get('timesheetReminderEnabled', async function(data) {
    if (chrome.runtime.lastError) {
      if (IS_DEVELOPMENT) console.error("[Background] Error getting timesheetReminderEnabled:", chrome.runtime.lastError.message);
      return;
    }
    if (IS_DEVELOPMENT) console.log("[Background] Timesheet reminder enabled status for sound:", data.timesheetReminderEnabled);
    if (data.timesheetReminderEnabled !== false) {
      await createOffscreenDocument(); // Ensure offscreen document exists

      const soundURL = chrome.runtime.getURL('alarm.mp3');
      if (IS_DEVELOPMENT) console.log("[Background] Attempting to play sound from:", soundURL);

      chrome.runtime.sendMessage({
          target: 'offscreen', // Custom property to help offscreen document identify message
          action: 'playAlarm',
          sound: soundURL
      }, response => {
          if (chrome.runtime.lastError) {
              if (IS_DEVELOPMENT) console.error('[Background] Error sending playAlarm message to offscreen:', chrome.runtime.lastError.message);
          } else {
              if (IS_DEVELOPMENT) console.log('[Background] playAlarm message sent to offscreen, response:', response?.status);
          }
      });
    }
  });
}

async function showTimesheetNotification() {
    if (IS_DEVELOPMENT) console.log("[Background] showTimesheetNotification function called");
    chrome.storage.sync.get('timesheetReminderEnabled', async function(data) {
        if (chrome.runtime.lastError) {
          if (IS_DEVELOPMENT) console.error("[Background] Error getting timesheetReminderEnabled for notification:", chrome.runtime.lastError.message);
          return;
        }
        if (IS_DEVELOPMENT) console.log("[Background] Timesheet reminder enabled status for notification:", data.timesheetReminderEnabled);
        if (data.timesheetReminderEnabled !== false) {
            await playAlarmSound(); // Play sound via offscreen document

            chrome.notifications.create('timesheetReminder', {
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'Timesheet Reminder',
                message: 'Don\'t forget to submit your timesheet!',
                buttons: [
                    { title: 'Open My Timesheets' },
                    { title: 'Snooze for 15 minutes' }
                ],
                priority: 2,
                requireInteraction: true // Keeps the notification up until user interacts
            }, function(notificationId) {
                if (chrome.runtime.lastError) {
                    if (IS_DEVELOPMENT) console.error("[Background] Error creating notification:", chrome.runtime.lastError.message);
                } else {
                    if (IS_DEVELOPMENT) console.log("[Background] Notification created with ID:", notificationId);
                }
            });
        }
    });
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'timesheetReminder') {
    chrome.notifications.clear(notificationId, (wasCleared) => {
        if (chrome.runtime.lastError) {
            if (IS_DEVELOPMENT) console.error("[Background] Error clearing notification:", chrome.runtime.lastError.message);
        } else {
            if (IS_DEVELOPMENT) console.log("[Background] Notification cleared after button click:", wasCleared);
        }
    });
    if (buttonIndex === 0) { // Open My Timesheets
      chrome.tabs.create({ url: 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo' });
    } else if (buttonIndex === 1) { // Snooze for 15 minutes
      chrome.alarms.create('timesheetReminderSnooze', { // Use a different alarm name for snooze
        delayInMinutes: 15
      });
      if (IS_DEVELOPMENT) console.log("[Background] Timesheet reminder snoozed for 15 minutes.");
    }
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (IS_DEVELOPMENT) console.log("[Background] Alarm fired:", alarm.name);
  if (alarm.name === 'timesheetReminder' || alarm.name === 'timesheetReminderSnooze') {
    showTimesheetNotification();
    // If it's the main periodic alarm, it will automatically reschedule due to 'periodInMinutes'.
    // If it's the snooze alarm, it was a one-time delay.
    // We might want to re-establish the main alarm if a snooze happened near the main alarm time.
    // However, the current logic for `getNextAlarmDate` and `periodInMinutes` should handle this okay,
    // ensuring the next main alarm is set for the following week.
  }
});
