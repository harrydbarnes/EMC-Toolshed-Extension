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

// Check if an offscreen document is already open
async function hasOffscreenDocument(path) {
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
  if (await hasOffscreenDocument('offscreen.html')) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'], // Corrected reason to uppercase
    justification: 'Plays alarm sound for timesheet reminders',
  });
}

// Modify playAlarmSound to use the offscreen document
async function playAlarmSound() {
  console.log("playAlarmSound function called");
  chrome.storage.sync.get('timesheetReminderEnabled', async function(data) {
    console.log("Timesheet reminder enabled:", data.timesheetReminderEnabled);
    if (data.timesheetReminderEnabled !== false) {
      // Create offscreen document before playing sound
      await createOffscreenDocument(); // Wait for the offscreen document

      // Send message to the offscreen document to play the sound
      chrome.runtime.sendMessage({
          action: 'playAlarm',
          sound: chrome.runtime.getURL('alarm.mp3') // Use chrome.runtime.getURL for the sound file
      }).catch(error => console.error('Error sending message to offscreen document:', error));
    }
  });
}


chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timesheetReminder') {
    showTimesheetNotification(); // This will now trigger the notification and sound via offscreen document
  }
});

async function showTimesheetNotification() {
    console.log("showTimesheetNotification function called");
    chrome.storage.sync.get('timesheetReminderEnabled', async function(data) {
        console.log("Timesheet reminder enabled:", data.timesheetReminderEnabled);
        if (data.timesheetReminderEnabled !== false) {
            // Trigger the sound playback via the offscreen document
            await playAlarmSound();

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
            });
        }
    });
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


// --- Meta Billing Check Logic ---

// This listener handles the request from popup.js.
// It is added to the existing listener block to avoid conflicts.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "metaBillingCheck") {
        (async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                console.error("No active tab found.");
                sendResponse({ status: 'error', message: 'Could not find active tab.' });
                return;
            }

            if (tab.url && tab.url.includes('adsmanager.facebook.com/adsmanager/manage/campaigns')) {
                try {
                    // Inject both the library and the scraper script in a single call.
                    // This ensures they execute in the same world and the library is available.
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['lib/xlsx.full.min.js', 'scrapers/meta-billing-scraper.js'],
                    });
                    sendResponse({ status: 'success', message: 'Scraping process initiated.' });
                } catch (e) {
                    console.error("Failed to inject scripts:", e);
                    sendResponse({ status: 'error', message: `Failed to start scraper: ${e.message}` });
                }
            } else {
                sendResponse({ status: 'error', message: 'You need to be on the Meta Ads Manager campaigns page for this to work.' });
            }
        })();
        return true; // Required for async sendResponse
    }
    // Keep the return true from the original listener if it exists.
    // The previous code had a return true, so we maintain it.
    return true;
});
