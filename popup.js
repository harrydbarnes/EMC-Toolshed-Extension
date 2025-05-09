const IS_DEVELOPMENT = false; // Set to true for development console logs

document.addEventListener('DOMContentLoaded', function() {
    // Element getters
    const campaignIdInput = document.getElementById('campaignId');
    const campaignDateInput = document.getElementById('campaignDate');
    const generateUrlButton = document.getElementById('generateUrl');

    const logoToggle = document.getElementById('logoToggle');
    const metaReminderToggle = document.getElementById('metaReminderToggle');
    const timesheetReminderToggle = document.getElementById('timesheetReminderToggle');

    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsContent');
    const settingsIcon = settingsToggle ? settingsToggle.querySelector('i') : null;

    const triggerTimesheetReminderButton = document.getElementById('triggerTimesheetReminder');
    const triggerMetaReminderButton = document.getElementById('triggerMetaReminder');

    const reminderDaySelect = document.getElementById('reminderDay');
    const reminderTimeSelect = document.getElementById('reminderTime');
    const reminderSettingsDiv = document.getElementById('reminderSettings');
    const saveReminderSettingsButton = document.getElementById('saveReminderSettings');
    const reminderUpdateMessageP = document.getElementById('reminderUpdateMessage');

    if (IS_DEVELOPMENT) console.log("[Popup Load] DOMContentLoaded event fired.");

    // --- Meta Reminder Test Button Visibility ---
    if (triggerMetaReminderButton) {
        if (IS_DEVELOPMENT) console.log("[Popup Load] 'triggerMetaReminderButton' element found.");
        triggerMetaReminderButton.title = "This test feature only works on Prisma pages."; // Default title

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (chrome.runtime.lastError) {
                if (IS_DEVELOPMENT) console.error("[Popup Load] Error querying tabs:", chrome.runtime.lastError.message);
                triggerMetaReminderButton.classList.add('hidden-initially');
                triggerMetaReminderButton.title = "Error determining current page URL.";
                return;
            }

            if (tabs && tabs.length > 0 && tabs[0]) {
                const currentTab = tabs[0];
                if (currentTab.url) {
                    const currentUrl = currentTab.url;
                    if (IS_DEVELOPMENT) console.log("[Popup Load] Current URL for Meta button visibility:", currentUrl);
                    if (currentUrl.startsWith("https://groupmuk-prisma.mediaocean.com/")) {
                        if (IS_DEVELOPMENT) console.log("[Popup Load] Current URL IS a Prisma page. Showing Meta test button.");
                        triggerMetaReminderButton.classList.remove('hidden-initially');
                        triggerMetaReminderButton.title = "Test the Meta Reconciliation Reminder on this page.";
                    } else {
                        triggerMetaReminderButton.classList.add('hidden-initially');
                        if (IS_DEVELOPMENT) console.log("[Popup Load] Current URL is NOT a Prisma page. Hiding Meta test button.");
                    }
                } else {
                    if (IS_DEVELOPMENT) console.warn("[Popup Load] Active tab URL is not accessible.");
                    triggerMetaReminderButton.classList.add('hidden-initially');
                }
            } else {
                if (IS_DEVELOPMENT) console.warn("[Popup Load] No active tab found.");
                triggerMetaReminderButton.classList.add('hidden-initially');
            }
        });

        triggerMetaReminderButton.addEventListener('click', function() {
            if (IS_DEVELOPMENT) console.log("[BUTTON CLICK] 'Test Meta Reminder' button clicked.");
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (chrome.runtime.lastError) {
                    if (IS_DEVELOPMENT) console.error("[BUTTON CLICK] Error querying tabs for Meta Reminder:", chrome.runtime.lastError.message);
                    alert("Could not send message to tab: " + chrome.runtime.lastError.message);
                    return;
                }
                if (tabs.length > 0 && tabs[0] && tabs[0].id) {
                    if (IS_DEVELOPMENT) console.log("[BUTTON CLICK] Sending 'showMetaReminder' message to tab ID:", tabs[0].id);
                    chrome.tabs.sendMessage(tabs[0].id, { action: "showMetaReminder" }, function(response) {
                        if (chrome.runtime.lastError) {
                            if (IS_DEVELOPMENT) console.error("[BUTTON CLICK] Error sending 'showMetaReminder' message:", chrome.runtime.lastError.message);
                            // alert("Failed to trigger Meta reminder on page. Content script might not be responding.\nError: " + chrome.runtime.lastError.message);
                        } else {
                            if (IS_DEVELOPMENT) console.log("[BUTTON CLICK] Meta reminder message sent, response:", response?.status);
                        }
                    });
                } else {
                    if (IS_DEVELOPMENT) console.error("[BUTTON CLICK] No active tab found to send 'showMetaReminder' message.");
                    alert("No active Prisma tab found to show the reminder on.");
                }
            });
        });
    } else {
        if (IS_DEVELOPMENT) console.error("[Popup Load] CRITICAL: 'triggerMetaReminderButton' element NOT found.");
    }


    // --- Initial Settings Load ---
    loadAndSetInitialStates();

    // --- Event Listeners ---
    if (generateUrlButton) generateUrlButton.addEventListener('click', handleGenerateUrl);
    if (logoToggle) logoToggle.addEventListener('change', handleLogoToggle);
    if (metaReminderToggle) metaReminderToggle.addEventListener('change', handleMetaReminderToggle);
    if (timesheetReminderToggle) timesheetReminderToggle.addEventListener('change', handleTimesheetReminderToggle);
    if (reminderDaySelect) reminderDaySelect.addEventListener('change', handleReminderDayChange);
    if (reminderTimeSelect) reminderTimeSelect.addEventListener('change', handleReminderTimeChange);

    if (settingsToggle && settingsContent && settingsIcon) {
        settingsToggle.addEventListener('click', function() {
            const isOpening = !settingsContent.style.maxHeight;
            settingsContent.style.maxHeight = isOpening ? settingsContent.scrollHeight + "px" : null;
            settingsIcon.classList.toggle('fa-chevron-down', !isOpening);
            settingsIcon.classList.toggle('fa-chevron-up', isOpening);
            settingsToggle.setAttribute('aria-expanded', isOpening.toString());
        });
    }

    if (triggerTimesheetReminderButton) {
        triggerTimesheetReminderButton.addEventListener('click', function() {
            if (IS_DEVELOPMENT) console.log("Trigger timesheet button clicked");
            chrome.runtime.sendMessage({action: "showTimesheetNotification"}, function(response) {
                if (chrome.runtime.lastError) {
                    if (IS_DEVELOPMENT) console.error("Error sending message for timesheet notification:", chrome.runtime.lastError.message);
                } else {
                    if (IS_DEVELOPMENT) console.log("Timesheet reminder triggered via background:", response?.status);
                }
            });
        });
    }

    if (saveReminderSettingsButton && reminderDaySelect && reminderTimeSelect && reminderUpdateMessageP) {
        saveReminderSettingsButton.addEventListener('click', function() {
            const dayValue = reminderDaySelect.value;
            const timeValue = reminderTimeSelect.value;
            chrome.storage.sync.set({reminderDay: dayValue, reminderTime: timeValue}, function() {
                if (chrome.runtime.lastError) {
                    if (IS_DEVELOPMENT) console.error("Error saving reminder settings to storage:", chrome.runtime.lastError.message);
                    reminderUpdateMessageP.textContent = "Error saving settings.";
                    reminderUpdateMessageP.style.color = "red";
                } else {
                    updateAlarm(); // This will send message to background
                    reminderUpdateMessageP.textContent = `Reminder updated: ${dayValue} at ${timeValue}.`;
                    reminderUpdateMessageP.style.color = "#28a745"; // Green for success
                    if (IS_DEVELOPMENT) console.log("Reminder settings saved and alarm update requested.");
                }
                if(reminderUpdateMessageP.classList) reminderUpdateMessageP.classList.remove('hidden-initially');
                setTimeout(() => {
                    if(reminderUpdateMessageP.classList) reminderUpdateMessageP.classList.add('hidden-initially');
                }, 3000);
            });
        });
    }

    // Navigation Buttons
    addClickListener('prismaButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns');
    addClickListener('metaHandbookButton', 'https://insidemedia.sharepoint.com/sites/GRM-UK-GMS/Files%20Library/Forms/AllItems.aspx?id=%2Fsites%2FGRM%2DUK%2DGMS%2FFiles%20Library%2FChannel%5FSocial%2FPaid%20Social%2FPrisma%20Integration%20Resources%2FLatest%20Handbook&p=true&ga=1');
    addClickListener('timesheetsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo');
    addClickListener('approvalsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheetApprovals/AwaitingMe');
    addClickListener('officeHoursButton', 'https://harrydbarnes.github.io/EssenceMediacomTools/'); // Ensure this link is correct
    addClickListener('addCampaignButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns&osModalId=prsm-cm-cmpadd&osMOpts=lb');

    // Location Switch Buttons
    addClickListener('ngmclonButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DTE9OIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngmcintButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DSU5UIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngmcscoButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DU0NPIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngopenButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR09QRU4ifX0sImZyb20iOnsiaWQiOiIzNS1SRUlLV1hILTYiLCJzdWJDb250ZXh0Ijp7ImlkIjoiTkdNQ0lOVCJ9fX0=');

}); // End DOMContentLoaded

function loadAndSetInitialStates() {
    // Logo toggle
    chrome.storage.sync.get('logoReplaceEnabled', function(data) {
        if (chrome.runtime.lastError && IS_DEVELOPMENT) console.error("Error getting logoReplaceEnabled:", chrome.runtime.lastError.message);
        const toggle = document.getElementById('logoToggle');
        if (toggle) {
            const isEnabled = data.logoReplaceEnabled === undefined ? true : data.logoReplaceEnabled;
            toggle.checked = isEnabled;
            if (data.logoReplaceEnabled === undefined) {
                chrome.storage.sync.set({logoReplaceEnabled: true}, handleStorageError);
            }
        }
    });

    // Meta reminder toggle
    chrome.storage.sync.get('metaReminderEnabled', function(data) {
        if (chrome.runtime.lastError && IS_DEVELOPMENT) console.error("Error getting metaReminderEnabled:", chrome.runtime.lastError.message);
        const toggle = document.getElementById('metaReminderToggle');
        if (toggle) {
            const isEnabled = data.metaReminderEnabled === undefined ? true : data.metaReminderEnabled;
            toggle.checked = isEnabled;
            if (data.metaReminderEnabled === undefined) {
                chrome.storage.sync.set({metaReminderEnabled: true}, handleStorageError);
            }
        }
    });

    // Timesheet reminder toggle and settings
    chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function(data) {
        if (chrome.runtime.lastError && IS_DEVELOPMENT) console.error("Error getting timesheet settings:", chrome.runtime.lastError.message);
        
        const toggle = document.getElementById('timesheetReminderToggle');
        const settingsDiv = document.getElementById('reminderSettings');
        const daySelect = document.getElementById('reminderDay');
        const timeSelect = document.getElementById('reminderTime');

        if (toggle && settingsDiv) {
            const isEnabled = data.timesheetReminderEnabled === undefined ? true : data.timesheetReminderEnabled;
            toggle.checked = isEnabled;
            settingsDiv.classList.toggle('hidden-initially', !isEnabled);
             if (data.timesheetReminderEnabled === undefined) {
                chrome.storage.sync.set({timesheetReminderEnabled: true}, handleStorageError);
            }
        }

        if (daySelect) {
            daySelect.value = data.reminderDay || 'Friday'; // Default to Friday
        }
        // Update time options based on the loaded or default day
        updateTimeOptions(daySelect ? daySelect.value : 'Friday', data.reminderTime);
    });
}


function handleGenerateUrl() {
    const campaignIdInput = document.getElementById('campaignId');
    const campaignDateInput = document.getElementById('campaignDate');
    if (!campaignIdInput || !campaignDateInput) return;

    const campaignId = campaignIdInput.value.trim();
    let campaignDateStr = campaignDateInput.value.trim();

    if (campaignId) {
        let dateToUse = new Date(); // Default to current date
        if (campaignDateStr) {
            // Basic date parsing: "May 2024" or "MM/YYYY". Robust parsing might need a library.
            // User should be guided on expected formats via placeholder or help text.
            let parsedDate;
            const monthYearMatch = campaignDateStr.match(/^([a-zA-Z]+) (\d{4})$/); // "May 2024"
            const slashMonthYearMatch = campaignDateStr.match(/^(\d{1,2})\/(\d{4})$/); // "05/2024" or "5/2024"

            if (monthYearMatch) {
                parsedDate = new Date(monthYearMatch[1] + " 1, " + monthYearMatch[2]);
            } else if (slashMonthYearMatch) {
                parsedDate = new Date(parseInt(slashMonthYearMatch[2], 10), parseInt(slashMonthYearMatch[1], 10) - 1, 1);
            }

            if (parsedDate && !isNaN(parsedDate)) {
                dateToUse = parsedDate;
            } else {
                if (IS_DEVELOPMENT) console.warn("Could not parse campaign date string:", campaignDateStr, ". Using current month.");
                // Optionally alert user or highlight field: alert("Invalid date format. Using current month.");
            }
        }

        const formattedDate = `${dateToUse.getFullYear()}-${String(dateToUse.getMonth() + 1).padStart(2, '0')}-01`;
        const baseUrl = 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=';
        const finalUrl = `${baseUrl}${encodeURIComponent(campaignId)}&route=actualize&mos=${formattedDate}`;
        chrome.tabs.create({ url: finalUrl });
    } else {
        alert('Please enter a Campaign ID.');
        campaignIdInput.focus();
    }
}

function handleLogoToggle() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({logoReplaceEnabled: isEnabled}, function() {
        handleStorageError("Logo toggle setting saved.");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (chrome.runtime.lastError && IS_DEVELOPMENT) {
                 console.warn("Error querying tabs for logo toggle message:", chrome.runtime.lastError.message); return;
            }
            if (tabs.length > 0 && tabs[0] && tabs[0].id && tabs[0].url && tabs[0].url.startsWith("https://groupmuk-prisma.mediaocean.com/")) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "checkLogoReplaceEnabled", enabled: isEnabled }, function(response) {
                    if (chrome.runtime.lastError && IS_DEVELOPMENT) {
                         console.warn("Could not send message to tab for logo toggle (content script might not be ready or on wrong page):", chrome.runtime.lastError.message);
                    } else if (IS_DEVELOPMENT) {
                        console.log("Logo toggle message sent, response:", response?.status);
                    }
                });
            } else if (IS_DEVELOPMENT) {
                console.warn("No active Prisma tab found for logo toggle message or URL doesn't match.");
            }
        });
    });
}

function handleMetaReminderToggle() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({metaReminderEnabled: isEnabled}, () => {
        handleStorageError(`Meta reminder preference saved: ${isEnabled}`);
    });
}

function handleTimesheetReminderToggle() {
    const isEnabled = this.checked;
    const reminderSettingsDiv = document.getElementById('reminderSettings');
    if (reminderSettingsDiv) {
        reminderSettingsDiv.classList.toggle('hidden-initially', !isEnabled);
    }
    chrome.storage.sync.set({timesheetReminderEnabled: isEnabled}, function() {
        handleStorageError(`Timesheet reminder preference saved: ${isEnabled}`);
        if (isEnabled) {
            updateAlarm(); // Creates or updates alarm
        } else {
            chrome.runtime.sendMessage({action: "removeTimesheetAlarm"}, (response) => {
                if (chrome.runtime.lastError && IS_DEVELOPMENT) console.error("Error sending removeTimesheetAlarm:", chrome.runtime.lastError.message);
                else if (IS_DEVELOPMENT) console.log("removeTimesheetAlarm message sent, response:", response?.status);
            });
        }
    });
}

function handleReminderDayChange() {
    const reminderDaySelect = document.getElementById('reminderDay');
    if (reminderDaySelect) {
        // When day changes, re-populate time options and attempt to set a stored/default time for that new day.
        // Then, implicitly, the user would click "Save" to persist this new day and selected time.
        // updateAlarm() isn't called here directly; it's called on "Save".
        // We need to get the currently stored time for the *newly selected day* if one exists, or default.
        chrome.storage.sync.get('reminderTime', (data) => { // Get general reminderTime to see if it's suitable
            if(chrome.runtime.lastError && IS_DEVELOPMENT) console.error("Error getting reminderTime on day change:", chrome.runtime.lastError.message);
            updateTimeOptions(reminderDaySelect.value, data.reminderTime);
             // No automatic save/alarm update here; user must click "Save"
        });
    }
}

function handleReminderTimeChange() {
    // Similar to day change, changing time doesn't auto-save. User clicks "Save".
    // updateAlarm(); // Not here, call on Save button click.
    if (IS_DEVELOPMENT) console.log("Reminder time changed in dropdown. User needs to save.");
}

function updateTimeOptions(selectedDay, preferredTime) {
    const reminderTimeSelect = document.getElementById('reminderTime');
    if (!reminderTimeSelect) return;

    const currentSelectedTimeInDropdown = reminderTimeSelect.value;
    reminderTimeSelect.innerHTML = ''; // Clear existing options

    let startTime, endTime;
    if (selectedDay === 'Friday') {
        startTime = 14 * 60; // 2:00 PM
        endTime = 16 * 60;   // 4:00 PM
    } else { // Monday, Tuesday (assuming other days if added)
        startTime = 9 * 60;  // 9:00 AM
        endTime = 17 * 60 + 30; // 5:30 PM
    }

    for (let totalMinutes = startTime; totalMinutes <= endTime; totalMinutes += 15) {
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = timeString;
        option.textContent = timeString;
        reminderTimeSelect.appendChild(option);
    }
    
    // Attempt to set the preferredTime if it's valid for the current day's options
    if (preferredTime && Array.from(reminderTimeSelect.options).some(opt => opt.value === preferredTime)) {
        reminderTimeSelect.value = preferredTime;
    } else if (currentSelectedTimeInDropdown && Array.from(reminderTimeSelect.options).some(opt => opt.value === currentSelectedTimeInDropdown)) {
        // If preferredTime wasn't suitable, try to keep what was already selected if still valid
        reminderTimeSelect.value = currentSelectedTimeInDropdown;
    } else { // Fallback to a sensible default for the selected day
        if (selectedDay === 'Friday' && reminderTimeSelect.querySelector('option[value="14:30"]')) {
            reminderTimeSelect.value = "14:30";
        } else if (selectedDay !== 'Friday' && reminderTimeSelect.querySelector('option[value="09:00"]')) {
            reminderTimeSelect.value = "09:00";
        } else if (reminderTimeSelect.options.length > 0) {
            reminderTimeSelect.value = reminderTimeSelect.options[0].value; // Absolute fallback
        }
    }
}

function updateAlarm() {
    const reminderDaySelect = document.getElementById('reminderDay');
    const reminderTimeSelect = document.getElementById('reminderTime');
    
    if (!reminderDaySelect || !reminderTimeSelect || !reminderDaySelect.value || !reminderTimeSelect.value) {
        if (IS_DEVELOPMENT) console.warn("Cannot update alarm, day or time elements/values missing.");
        return; 
    }

    const dayValue = reminderDaySelect.value;
    const timeValue = reminderTimeSelect.value;

    // Storage.sync.set is now handled by the Save button. This function just sends the message.
    chrome.runtime.sendMessage({action: "createTimesheetAlarm", day: dayValue, time: timeValue}, function(response){
        if (chrome.runtime.lastError) {
            if (IS_DEVELOPMENT) console.error("Error sending createTimesheetAlarm message:", chrome.runtime.lastError.message);
        } else {
            if (IS_DEVELOPMENT) console.log("createTimesheetAlarm message sent, response:", response?.status);
        }
    });
}

function addClickListener(elementId, url) {
    const button = document.getElementById(elementId);
    if (button) {
        button.addEventListener('click', () => {
            if (url) {
                chrome.tabs.create({ url: url });
            }
        });
    } else if (IS_DEVELOPMENT) {
        console.warn(`Button with ID '${elementId}' not found for click listener.`);
    }
}

function handleStorageError(successMessage = "Setting saved.") {
    if (chrome.runtime.lastError) {
        if (IS_DEVELOPMENT) console.error("Storage sync error:", chrome.runtime.lastError.message);
        // Optionally, display a generic error to the user in the popup
    } else {
        if (IS_DEVELOPMENT) console.log(successMessage);
    }
}
