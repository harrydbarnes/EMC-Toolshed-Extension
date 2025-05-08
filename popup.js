document.addEventListener('DOMContentLoaded', function() {
    const generateUrlButton = document.getElementById('generateUrl');
    const logoToggle = document.getElementById('logoToggle');
    const metaReminderToggle = document.getElementById('metaReminderToggle');
    const timesheetReminderToggle = document.getElementById('timesheetReminderToggle');
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsContent');
    const settingsIcon = settingsToggle.querySelector('i');
    const triggerTimesheetReminderButton = document.getElementById('triggerTimesheetReminder');
    const triggerMetaReminderButton = document.getElementById('triggerMetaReminder');
    const reminderDay = document.getElementById('reminderDay');
    const reminderTime = document.getElementById('reminderTime');
    const reminderSettings = document.getElementById('reminderSettings'); // Keep reference
    const saveReminderSettingsButton = document.getElementById('saveReminderSettings'); // Use specific ID
    const reminderUpdateMessage = document.getElementById('reminderUpdateMessage'); // Keep reference

    // Set logo replacement on by default
    chrome.storage.sync.get('logoReplaceEnabled', setLogoToggleState);

    // Set Meta reminder on by default
    chrome.storage.sync.get('metaReminderEnabled', setMetaReminderToggleState);

    // Load saved state for timesheet reminder, day, and time
    chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function(data) {
        setTimesheetReminderToggleState(data); // This will handle reminderSettings visibility
        if (data.reminderDay) {
            reminderDay.value = data.reminderDay;
        }
        updateTimeOptions(data.reminderDay);
        if (data.reminderTime) {
            reminderTime.value = data.reminderTime;
        }
    });

    generateUrlButton.addEventListener('click', handleGenerateUrl);
    logoToggle.addEventListener('change', handleLogoToggle);
    metaReminderToggle.addEventListener('change', handleMetaReminderToggle);
    timesheetReminderToggle.addEventListener('change', handleTimesheetReminderToggle); // This will handle reminderSettings visibility
    reminderDay.addEventListener('change', handleReminderDayChange);
    reminderTime.addEventListener('change', handleReminderTimeChange);

    settingsToggle.addEventListener('click', function() {
        settingsContent.style.maxHeight = settingsContent.style.maxHeight ? null : settingsContent.scrollHeight + "px";
        settingsIcon.classList.toggle('fa-chevron-down');
        settingsIcon.classList.toggle('fa-chevron-up');
    });

    if (triggerTimesheetReminderButton) {
        triggerTimesheetReminderButton.addEventListener('click', function() {
            console.log("Trigger timesheet button clicked");
            chrome.runtime.sendMessage({action: "showTimesheetNotification"}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message:", chrome.runtime.lastError);
                } else {
                    console.log("Timesheet reminder triggered:", response?.status || "No response");
                }
            });
        });
    }

    if (triggerMetaReminderButton) {
        triggerMetaReminderButton.addEventListener('click', function() {
            console.log("Trigger Meta reminder button clicked");
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs.length > 0 && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "showMetaReminder"
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error("Error sending message to tab:", chrome.runtime.lastError.message);
                        } else {
                            console.log("Meta reminder triggered via tab:", response?.status || "No response from tab");
                        }
                    });
                } else {
                    console.error("No active tab found to send message.");
                }
            });
        });
    }

    // Ensure reminderSettings and reminderUpdateMessage are valid elements before manipulating classes
    if (saveReminderSettingsButton && reminderSettings && reminderUpdateMessage) {
        saveReminderSettingsButton.addEventListener('click', function() {
            const day = reminderDay.value;
            const time = reminderTime.value;
            chrome.storage.sync.set({reminderDay: day, reminderTime: time}, function() {
                updateAlarm();
                reminderUpdateMessage.textContent = `Updated! You will be reminded on ${day} at ${time}`;
                reminderUpdateMessage.classList.remove('hidden-initially');
                setTimeout(() => {
                    reminderUpdateMessage.classList.add('hidden-initially');
                }, 3000);
            });
        });
    }


    // Navigation buttons
    addClickListener('prismaButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns');
    addClickListener('metaHandbookButton', 'https://insidemedia.sharepoint.com/sites/GRM-UK-GMS/Files%20Library/Forms/AllItems.aspx?id=%2Fsites%2FGRM%2DUK%2DGMS%2FFiles%20Library%2FChannel%5FSocial%2FPaid%20Social%20Prisma%20Integration%20Resources%2FLatest%20Handbook&p=true&ga=1');
    addClickListener('timesheetsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo');
    addClickListener('approvalsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheetApprovals/AwaitingMe');
    addClickListener('officeHoursButton', 'https://harrydbarnes.github.io/EssenceMediacomTools/');
    addClickListener('addCampaignButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns&osModalId=prsm-cm-cmpadd&osMOpts=lb');


    // Location buttons
    addClickListener('ngmclonButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DTE9OIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngmcintButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DSU5UIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngmcscoButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DU0NPIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngopenButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR09QRU4ifX0sImZyb20iOnsiaWQiOiIzNS1SRUlLV1hILTYiLCJzdWJDb250ZXh0Ijp7ImlkIjoiTkdNQ0lOVCJ9fX0=');
});

function setLogoToggleState(data) {
    const logoToggle = document.getElementById('logoToggle');
    if (logoToggle) {
        if (data.logoReplaceEnabled === undefined) {
            chrome.storage.sync.set({logoReplaceEnabled: true});
            logoToggle.checked = true;
        } else {
            logoToggle.checked = data.logoReplaceEnabled;
        }
    }
}

function setMetaReminderToggleState(data) {
    const metaReminderToggle = document.getElementById('metaReminderToggle');
    if (metaReminderToggle) {
        if (data.metaReminderEnabled === undefined) {
            chrome.storage.sync.set({metaReminderEnabled: true});
            metaReminderToggle.checked = true;
        } else {
            metaReminderToggle.checked = data.metaReminderEnabled;
        }
    }
}

function setTimesheetReminderToggleState(data) {
    const timesheetReminderToggle = document.getElementById('timesheetReminderToggle');
    const reminderSettings = document.getElementById('reminderSettings');
    if (timesheetReminderToggle && reminderSettings) {
        timesheetReminderToggle.checked = data.timesheetReminderEnabled !== false; // Default to true if undefined
        if (timesheetReminderToggle.checked) {
            reminderSettings.classList.remove('hidden-initially');
        } else {
            reminderSettings.classList.add('hidden-initially');
        }
    }
}

function handleGenerateUrl() {
    const campaignIdInput = document.getElementById('campaignId');
    const campaignDateInput = document.getElementById('campaignDate');
    if (!campaignIdInput || !campaignDateInput) return;

    const campaignId = campaignIdInput.value;
    let campaignDate = campaignDateInput.value;

    if (campaignId) {
        const year = new Date().getFullYear();
        const date = campaignDate ? new Date(`${campaignDate} 1, ${year}`) : new Date();
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

        const baseUrl = 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=';
        const finalUrl = `${baseUrl}${encodeURIComponent(campaignId)}&route=actualize&mos=${formattedDate}`;

        chrome.tabs.create({ url: finalUrl });
    } else {
        alert('Please enter a Campaign ID.');
    }
}

function handleLogoToggle() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({logoReplaceEnabled: isEnabled}, function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0 && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "checkLogoReplaceEnabled",
                    enabled: isEnabled
                }, function(response) {
                    if (chrome.runtime.lastError) {
                         console.warn("Could not send message to tab for logo toggle (perhaps not on a Prisma page):", chrome.runtime.lastError.message);
                    }
                });
            }
        });
    });
}

function handleMetaReminderToggle() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({metaReminderEnabled: isEnabled}, function() {
        console.log("Meta reminder set to:", isEnabled);
    });
}

function handleTimesheetReminderToggle() {
    const isEnabled = this.checked;
    const reminderSettings = document.getElementById('reminderSettings');
    if (reminderSettings) {
        if (isEnabled) {
            reminderSettings.classList.remove('hidden-initially');
        } else {
            reminderSettings.classList.add('hidden-initially');
        }
    }
    chrome.storage.sync.set({timesheetReminderEnabled: isEnabled}, function() {
        if (isEnabled) {
            updateAlarm();
        } else {
            chrome.runtime.sendMessage({action: "removeTimesheetAlarm"});
        }
    });
}

function handleReminderDayChange() {
    const reminderDaySelect = document.getElementById('reminderDay');
    if (reminderDaySelect) {
        updateTimeOptions(reminderDaySelect.value);
        updateAlarm();
    }
}

function handleReminderTimeChange() {
    updateAlarm();
}

function updateTimeOptions(day) {
    const reminderTimeSelect = document.getElementById('reminderTime');
    if (!reminderTimeSelect) return;

    reminderTimeSelect.innerHTML = ''; // Clear existing options
    let startTime, endTime;
    if (day === 'Friday') {
        startTime = 14 * 60; // 2 PM
        endTime = 16 * 60;   // 4 PM
    } else { // Monday, Tuesday
        startTime = 9 * 60;  // 9 AM
        endTime = 17 * 60 + 30; // 5:30 PM
    }
    for (let i = startTime; i <= endTime; i += 15) { // 15-minute intervals
        const hour = Math.floor(i / 60);
        const minute = i % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = timeString;
        option.textContent = timeString;
        reminderTimeSelect.appendChild(option);
    }
}

function updateAlarm() {
    const reminderDaySelect = document.getElementById('reminderDay');
    const reminderTimeSelect = document.getElementById('reminderTime');
    if (!reminderDaySelect || !reminderTimeSelect) return;

    const reminderDayValue = reminderDaySelect.value;
    const reminderTimeValue = reminderTimeSelect.value;
    chrome.storage.sync.set({reminderDay: reminderDayValue, reminderTime: reminderTimeValue}, function() {
        chrome.runtime.sendMessage({action: "createTimesheetAlarm", day: reminderDayValue, time: reminderTimeValue});
    });
}

function addClickListener(id, url) {
    const button = document.getElementById(id);
    if (button) {
        button.addEventListener('click', () => {
            console.log(`Button ${id} clicked`);
            if (url) {
                chrome.tabs.create({ url: url });
            }
        });
    } else {
        console.warn(`Button with id ${id} not found`);
    }
}

// Note: The duplicate event listener for 'saveReminderSettings' that was previously at the end of the file has been removed.
// The primary one is inside the DOMContentLoaded listener.
