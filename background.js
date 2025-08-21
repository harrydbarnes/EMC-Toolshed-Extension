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

// This listener handles the request from popup.js
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
                    // 1. Inject the XLSX library
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['lib/xlsx.full.min.js'],
                    });

                    // 2. Inject and execute the scraping function
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: scrapeAndDownload,
                    });

                    sendResponse({ status: 'success', message: 'Scraping process initiated.' });

                } catch (e) {
                    console.error("Failed to inject scripts:", e);
                    sendResponse({ status: 'error', message: `Failed to start scraper: ${e.message}` });
                }
            } else {
                sendResponse({ status: 'error', message: 'You need to be on Meta Ads Manager for this to work.' });
            }
        })();
        return true; // Required for async sendResponse
    }
});


// This function contains the full scraping and UI logic.
// It will be injected into the target page by chrome.scripting.executeScript.
function scrapeAndDownload() {
    (async () => {
        // --- UI Setup ---
        const overlay = document.createElement('div');
        overlay.id = 'scraping-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: '10000', backdropFilter: 'blur(5px)'
        });

        const messageBox = document.createElement('div');
        messageBox.id = 'scraping-in-progress-message';
        Object.assign(messageBox.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)', color: 'white', padding: '25px',
            borderRadius: '10px', zIndex: '10001', fontSize: '18px', textAlign: 'center',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
        });
        messageBox.innerHTML = 'Scraping data... Please wait.<br><br>Scraped 0 rows.';

        document.body.appendChild(overlay);
        document.body.appendChild(messageBox);

        const cleanupUI = () => {
            if (document.getElementById('scraping-overlay')) document.getElementById('scraping-overlay').remove();
            if (document.getElementById('scraping-in-progress-message')) document.getElementById('scraping-in-progress-message').remove();
        };

        // --- Scraping Logic ---
        const delay = ms => new Promise(res => setTimeout(res, ms));

        try {
            const wantedHeaders = ["Campaign", "Starts", "Ends", "Tags", "Impressions", "Budget", "Amount spent"];
            const grid = document.querySelector('[role="table"]');
            if (!grid) throw new Error("Could not find the main data table.");

            let scrollContainer = grid.parentElement;
            while(scrollContainer && scrollContainer.scrollHeight <= scrollContainer.clientHeight && scrollContainer.tagName !== 'BODY') {
                scrollContainer = scrollContainer.parentElement;
            }
            if (!scrollContainer || scrollContainer.tagName === 'BODY') {
                scrollContainer = document.querySelector('div._7mkk') || window;
            }

            const allHeaderElements = Array.from(grid.querySelectorAll('[role="columnheader"]'));
            const allHeaderTexts = allHeaderElements.map(el => el.innerText.trim());
            const wantedHeaderInfo = wantedHeaders.map(wantedHeader => {
                const index = allHeaderTexts.findIndex(header => header.startsWith(wantedHeader));
                if (index === -1) throw new Error(`Could not find column: "${wantedHeader}"`);
                return { name: wantedHeader, index: index + 1 };
            });

            const allRowsData = [];
            const processedRowKeys = new Set();
            let consecutiveNoNewRows = 0;

            while (consecutiveNoNewRows < 3) {
                const currentScrollTop = scrollContainer.scrollTop || window.scrollY;
                const dataRowElements = Array.from(grid.querySelectorAll('._1gda'));
                if (dataRowElements.length === 0 && allRowsData.length === 0) throw new Error("Found table headers, but no data rows.");

                let newRowsFoundInThisPass = false;
                const getCellText = (cell, headerName) => {
                    if (!cell) return "";
                    let text = cell.innerText;
                    if (headerName === "Amount spent" || headerName === "Budget") return text.replace(/[£,Â]/g, '').split('\n')[0].trim();
                    if (headerName === "Ends") return text.split('\n')[0];
                    return text.replace(/\n/g, ' ').trim();
                };

                for (const rowEl of dataRowElements) {
                    const cellElements = Array.from(rowEl.querySelectorAll('._4lg0'));
                    const campaignCell = cellElements[wantedHeaderInfo.find(h => h.name === 'Campaign').index];
                    const startsCell = cellElements[wantedHeaderInfo.find(h => h.name === 'Starts').index];
                    const rowKey = (campaignCell?.innerText || '') + '||' + (startsCell?.innerText || '');

                    if (rowKey && !processedRowKeys.has(rowKey)) {
                        processedRowKeys.add(rowKey);
                        newRowsFoundInThisPass = true;
                        const rowData = {};
                        wantedHeaderInfo.forEach(info => {
                            const cell = cellElements[info.index];
                            rowData[info.name] = getCellText(cell, info.name);
                        });
                        allRowsData.push(rowData);
                    }
                }

                messageBox.innerHTML = `Scraping data... Please wait.<br><br>Scraped ${allRowsData.length} rows.`;
                if (newRowsFoundInThisPass) consecutiveNoNewRows = 0; else consecutiveNoNewRows++;

                if (scrollContainer === window) window.scrollBy(0, window.innerHeight * 0.8);
                else scrollContainer.scrollBy(0, scrollContainer.clientHeight * 0.8);

                await delay(1000);
                if ((scrollContainer.scrollTop || window.scrollY) === currentScrollTop && !newRowsFoundInThisPass) break;
            }

            // --- XLSX Generation ---
            const worksheet = XLSX.utils.json_to_sheet(allRowsData, { header: wantedHeaders });
            const redFill = { fgColor: { rgb: "c54841" } };
            const tagsColIndex = wantedHeaders.indexOf("Tags");
            if (tagsColIndex !== -1) {
                const range = XLSX.utils.decode_range(worksheet['!ref']);
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    const cell_address = { c: tagsColIndex, r: R };
                    const cell_ref = XLSX.utils.encode_cell(cell_address);
                    const cell = worksheet[cell_ref];
                    if (!cell || !cell.v || (typeof cell.v === 'string' && cell.v.trim() === '')) {
                        if (!worksheet[cell_ref]) worksheet[cell_ref] = { t: 's', v: '' };
                        worksheet[cell_ref].s = redFill;
                    }
                }
            }

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Meta Billing Data");
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = 'meta_billing_check.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error("Error during Meta Billing Check:", e);
            alert("An error occurred while scraping: " + e.message);
        } finally {
            cleanupUI();
        }
    })();
}
