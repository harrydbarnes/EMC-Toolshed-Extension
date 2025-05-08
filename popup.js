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
    const reminderSettings = document.getElementById('reminderSettings');
    const saveReminderSettingsButton = document.getElementById('saveReminderSettings');
    const reminderUpdateMessage = document.getElementById('reminderUpdateMessage');

    console.log("[Popup Load] DOMContentLoaded event fired.");

    if (triggerMetaReminderButton) {
        console.log("[Popup Load] 'triggerMetaReminderButton' element found. Initial outerHTML:", triggerMetaReminderButton.outerHTML);
        // Button starts hidden via "hidden-initially" class in HTML.
        // We will remove the class if on a Prisma page.
        triggerMetaReminderButton.title = "This test feature only works on Prisma pages."; // Default title

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            console.log("[Popup Load] chrome.tabs.query callback. Tabs array:", tabs);
            if (tabs && tabs.length > 0 && tabs[0]) {
                const currentTab = tabs[0];
                if (currentTab.url) {
                    const currentUrl = currentTab.url;
                    console.log("[Popup Load] Current URL determined:", currentUrl);
                    if (currentUrl.startsWith("https://groupmuk-prisma.mediaocean.com/")) {
                        console.log("[Popup Load] Current URL IS a Prisma page. Showing button.");
                        triggerMetaReminderButton.classList.remove('hidden-initially');
                        triggerMetaReminderButton.title = "Test the Meta Reconciliation Reminder on this page.";
                    } else {
                        console.log("[Popup Load] Current URL is NOT a Prisma page. Ensuring button remains hidden.");
                        triggerMetaReminderButton.classList.add('hidden-initially'); // Ensure it's hidden
                        triggerMetaReminderButton.title = "This test feature only works on Prisma pages.";
                    }
                } else {
                    console.log("[Popup Load] Active tab URL is not accessible. Ensuring button remains hidden.");
                    triggerMetaReminderButton.classList.add('hidden-initially');
                    triggerMetaReminderButton.title = "Cannot determine current page URL for this test.";
                }
            } else {
                console.log("[Popup Load] No active tab found. Ensuring button remains hidden.");
                triggerMetaReminderButton.classList.add('hidden-initially');
                triggerMetaReminderButton.title = "Could not identify an active tab for this test.";
            }
            console.log("[Popup Load] Final button outerHTML after visibility check:", triggerMetaReminderButton.outerHTML);
        });
    } else {
        console.error("[Popup Load] CRITICAL: 'triggerMetaReminderButton' element NOT found in the DOM.");
    }

    // Event Listeners
    if (triggerMetaReminderButton) {
        triggerMetaReminderButton.addEventListener('click', function() {
            // This listener will only be triggered if the button is visible and clicked.
            // By design, it's only visible on Prisma pages.
            console.log("--------------------------------------------------");
            console.log("[BUTTON CLICK] 'Test Meta Reminder' button clicked.");
            console.log("[BUTTON CLICK] Button HTML at click time:", this.outerHTML);
            // No need to check this.disabled anymore, as it's controlled by visibility.

            console.log("[BUTTON CLICK] Proceeding to send message (button is visible).");
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs.length > 0 && tabs[0] && tabs[0].id) {
                    console.log("[BUTTON CLICK] Sending 'showMetaReminder' message to tab ID:", tabs[0].id);
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "showMetaReminder"
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error("[BUTTON CLICK] Error sending message to tab (Meta Reminder):", chrome.runtime.lastError.message);
                        } else {
                            console.log("[BUTTON CLICK] Meta reminder triggered via tab:", response?.status || "No response from tab");
                        }
                        console.log("--------------------------------------------------");
                    });
                } else {
                    console.error("[BUTTON CLICK] No active tab found to send message for Meta Reminder.");
                    console.log("--------------------------------------------------");
                }
            });
        });
    }

    // --- Rest of your popup.js code remains the same ---
    // (Make sure to include all functions like setLogoToggleState, handleGenerateUrl, etc.)

    // Set logo replacement on by default
    chrome.storage.sync.get('logoReplaceEnabled', setLogoToggleState);
    // Set Meta reminder on by default
    chrome.storage.sync.get('metaReminderEnabled', setMetaReminderToggleState);
    // Load saved state for timesheet reminder, day, and time
    chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function(data) {
        setTimesheetReminderToggleState(data);
        if (reminderDay && data.reminderDay) {
            reminderDay.value = data.reminderDay;
        }
        updateTimeOptions(reminderDay ? reminderDay.value : 'Friday'); // Pass current or default day
        if (reminderTime && data.reminderTime) {
            reminderTime.value = data.reminderTime;
        }
    });

    if(generateUrlButton) generateUrlButton.addEventListener('click', handleGenerateUrl);
    if(logoToggle) logoToggle.addEventListener('change', handleLogoToggle);
    if(metaReminderToggle) metaReminderToggle.addEventListener('change', handleMetaReminderToggle);
    if(timesheetReminderToggle) timesheetReminderToggle.addEventListener('change', handleTimesheetReminderToggle);
    if(reminderDay) reminderDay.addEventListener('change', handleReminderDayChange);
    if(reminderTime) reminderTime.addEventListener('change', handleReminderTimeChange);

    if(settingsToggle) {
        settingsToggle.addEventListener('click', function() {
            if(settingsContent && settingsIcon) {
                settingsContent.style.maxHeight = settingsContent.style.maxHeight ? null : settingsContent.scrollHeight + "px";
                settingsIcon.classList.toggle('fa-chevron-down');
                settingsIcon.classList.toggle('fa-chevron-up');
            }
        });
    }

    if (triggerTimesheetReminderButton) {
        triggerTimesheetReminderButton.addEventListener('click', function() {
            console.log("Trigger timesheet button clicked");
            chrome.runtime.sendMessage({action: "showTimesheetNotification"}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message for timesheet notification:", chrome.runtime.lastError.message);
                } else {
                    console.log("Timesheet reminder triggered:", response?.status || "No response");
                }
            });
        });
    }

    if (saveReminderSettingsButton && reminderDay && reminderTime && reminderUpdateMessage) {
        saveReminderSettingsButton.addEventListener('click', function() {
            const dayValue = reminderDay.value;
            const timeValue = reminderTime.value;
            chrome.storage.sync.set({reminderDay: dayValue, reminderTime: timeValue}, function() {
                updateAlarm();
                reminderUpdateMessage.textContent = `Updated! You will be reminded on ${dayValue} at ${timeValue}`;
                if(reminderUpdateMessage.classList) reminderUpdateMessage.classList.remove('hidden-initially');
                setTimeout(() => {
                    if(reminderUpdateMessage.classList) reminderUpdateMessage.classList.add('hidden-initially');
                }, 3000);
            });
        });
    }

    addClickListener('prismaButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns');
    addClickListener('metaHandbookButton', 'https://insidemedia.sharepoint.com/sites/GRM-UK-GMS/Files%20Library/Forms/AllItems.aspx?id=%2Fsites%2FGRM%2DUK%2DGMS%2FFiles%20Library%2FChannel%5FSocial%2FPaid%20Social%20Prisma%20Integration%20Resources%2FLatest%20Handbook&p=true&ga=1');
    addClickListener('timesheetsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo');
    addClickListener('approvalsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheetApprovals/AwaitingMe');
    addClickListener('officeHoursButton', 'https://harrydbarnes.github.io/EssenceMediacomTools/');
    addClickListener('addCampaignButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns&osModalId=prsm-cm-cmpadd&osMOpts=lb');

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
        timesheetReminderToggle.checked = data.timesheetReminderEnabled !== false;
        if (timesheetReminderToggle.checked) {
            if(reminderSettings.classList) reminderSettings.classList.remove('hidden-initially');
        } else {
            if(reminderSettings.classList) reminderSettings.classList.add('hidden-initially');
        }
    }
}

function handleGenerateUrl() {
    const campaignIdInput = document.getElementById('campaignId');
    const campaignDateInput = document.getElementById('campaignDate');
    if (!campaignIdInput || !campaignDateInput) return;

    const campaignId = campaignIdInput.value;
    let campaignDateStr = campaignDateInput.value; // Renamed for clarity

    if (campaignId) {
        let dateToUse = new Date(); // Default to current date
        // Try to parse the date string if provided
        if (campaignDateStr) {
            // Attempt to parse formats like "Month YYYY" (e.g., "May 2024") or "MM/YYYY" (e.g., "05/2024")
            // This is a basic parser; more robust parsing might be needed for other formats.
            let parsedDate;
            const monthYearMatch = campaignDateStr.match(/^([a-zA-Z]+) (\d{4})$/); // "May 2024"
            const slashMonthYearMatch = campaignDateStr.match(/^(\d{1,2})\/(\d{4})$/); // "05/2024" or "5/2024"

            if (monthYearMatch) {
                parsedDate = new Date(monthYearMatch[1] + " 1, " + monthYearMatch[2]);
            } else if (slashMonthYearMatch) {
                // Month is 0-indexed in JS Date, so subtract 1
                parsedDate = new Date(parseInt(slashMonthYearMatch[2], 10), parseInt(slashMonthYearMatch[1], 10) - 1, 1);
            }

            if (parsedDate && !isNaN(parsedDate)) {
                dateToUse = parsedDate;
            } else {
                console.warn("Could not parse campaign date string:", campaignDateStr, ". Using current month.");
            }
        }

        const formattedDate = `${dateToUse.getFullYear()}-${String(dateToUse.getMonth() + 1).padStart(2, '0')}-01`;

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
            if (tabs.length > 0 && tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "checkLogoReplaceEnabled",
                    enabled: isEnabled
                }, function(response) {
                    if (chrome.runtime.lastError) {
                         console.warn("Could not send message to tab for logo toggle (not on a Prisma page or content script not ready):", chrome.runtime.lastError.message);
                    }
                });
            } else {
                console.warn("No active tab found for logo toggle message.");
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
            if(reminderSettings.classList) reminderSettings.classList.remove('hidden-initially');
        } else {
            if(reminderSettings.classList) reminderSettings.classList.add('hidden-initially');
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
        updateTimeOptions(reminderDaySelect.value); // This will re-populate and set a default time or stored time
        updateAlarm(); // Then update the alarm with the newly selected day and current/default time
    }
}

function handleReminderTimeChange() {
    updateAlarm(); // updateAlarm will get values from DOM
}

function updateTimeOptions(day) {
    const reminderTimeSelect = document.getElementById('reminderTime');
    if (!reminderTimeSelect) return;

    const currentSelectedTime = reminderTimeSelect.value; // Preserve current time if possible
    reminderTimeSelect.innerHTML = '';
    let startTime, endTime;
    if (day === 'Friday') {
        startTime = 14 * 60;
        endTime = 16 * 60;
    } else { // Monday, Tuesday
        startTime = 9 * 60;
        endTime = 17 * 60 + 30;
    }
    let timeWasSetFromStorage = false;

    for (let i = startTime; i <= endTime; i += 15) {
        const hour = Math.floor(i / 60);
        const minute = i % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = timeString;
        option.textContent = timeString;
        reminderTimeSelect.appendChild(option);
    }
    
    // Try to set the previously selected/stored time after populating
    chrome.storage.sync.get('reminderTime', function(data) {
        if (data.reminderTime && reminderTimeSelect.querySelector(`option[value="${data.reminderTime}"]`)) {
            reminderTimeSelect.value = data.reminderTime;
            timeWasSetFromStorage = true;
        } else if (currentSelectedTime && reminderTimeSelect.querySelector(`option[value="${currentSelectedTime}"]`)) {
            // If stored time for selected day isn't valid, but a time was already selected, keep it if still valid
            reminderTimeSelect.value = currentSelectedTime;
        } else if (reminderTimeSelect.options.length > 0) {
             // Default to a sensible time if no specific preference, e.g., first available, or a hardcoded default for the day
            if (day === 'Friday' && reminderTimeSelect.querySelector(`option[value="14:30"]`)) {
                reminderTimeSelect.value = "14:30";
            } else if (day !== 'Friday' && reminderTimeSelect.querySelector(`option[value="09:00"]`)){
                reminderTimeSelect.value = "09:00";
            } else {
                reminderTimeSelect.value = reminderTimeSelect.options[0].value; // Fallback to first
            }
        }
    });
}

function updateAlarm() {
    const reminderDaySelect = document.getElementById('reminderDay');
    const reminderTimeSelect = document.getElementById('reminderTime');
    
    // Ensure elements and their values exist before proceeding
    if (!reminderDaySelect || !reminderTimeSelect || !reminderDaySelect.value || !reminderTimeSelect.value) {
        console.warn("Cannot update alarm, day or time not properly selected or available in the DOM.");
        return; 
    }

    const reminderDayValue = reminderDaySelect.value;
    const reminderTimeValue = reminderTimeSelect.value;

    chrome.storage.sync.set({reminderDay: reminderDayValue, reminderTime: reminderTimeValue}, function() {
        if (chrome.runtime.lastError) {
            console.error("Error setting reminderDay/Time in storage:", chrome.runtime.lastError.message);
            return;
        }
        chrome.runtime.sendMessage({action: "createTimesheetAlarm", day: reminderDayValue, time: reminderTimeValue}, function(response){
            if (chrome.runtime.lastError) {
                console.error("Error sending createTimesheetAlarm message:", chrome.runtime.lastError.message);
            } else {
                console.log("createTimesheetAlarm message sent, response:", response?.status);
            }
        });
    });
}

function addClickListener(id, url) {
    const button = document.getElementById(id);
    if (button) {
        button.addEventListener('click', () => {
            // console.log(`Button ${id} clicked`); // Less verbose logging for general buttons
            if (url) {
                chrome.tabs.create({ url: url });
            }
        });
    }
}
