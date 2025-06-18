document.addEventListener('DOMContentLoaded', function() {
    const generateUrlButton = document.getElementById('generateUrl');
    // const logoToggle = document.getElementById('logoToggle'); // Removed
    // const metaReminderToggle = document.getElementById('metaReminderToggle'); // Removed
    // const timesheetReminderToggle = document.getElementById('timesheetReminderToggle'); // Removed
    // const settingsToggle = document.getElementById('settingsToggle'); // Removed
    // const settingsContent = document.getElementById('settingsContent'); // Removed
    // const settingsIcon = settingsToggle.querySelector('i'); // Removed
    const triggerTimesheetReminderButton = document.getElementById('triggerTimesheetReminder');
    const triggerMetaReminderButton = document.getElementById('triggerMetaReminder');
    // const reminderDay = document.getElementById('reminderDay'); // Removed
    // const reminderTime = document.getElementById('reminderTime'); // Removed
    // const reminderSettings = document.getElementById('reminderSettings'); // Removed
    // const saveReminderSettingsButton = document.getElementById('saveReminderSettings'); // Removed
    // const reminderUpdateMessage = document.getElementById('reminderUpdateMessage'); // Removed

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

    // --- Settings UI related initializations and event listeners are removed ---

    if(generateUrlButton) generateUrlButton.addEventListener('click', handleGenerateUrl);
    // Event listeners for logoToggle, metaReminderToggle, timesheetReminderToggle, reminderDay, reminderTime, settingsToggle, saveReminderSettingsButton are removed.

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

    // Logic for saveReminderSettingsButton is removed.

    addClickListener('prismaButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns');
    addClickListener('metaHandbookButton', 'https://insidemedia.sharepoint.com/sites/GRM-UK-GMS/Files%20Library/Forms/AllItems.aspx?id=%2Fsites%2FGRM%2DUK%2DGMS%2FFiles%20Library%2FChannel%5FSocial%2FPaid%20Social%20Prisma%20Integration%20Resources%2FLatest%20Handbook&p=true&ga=1');
    addClickListener('timesheetsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo');
    addClickListener('approvalsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheetApprovals/AwaitingMe');
    addClickListener('officeHoursButton', 'https://myofficedays.netlify.app/');
    addClickListener('approversListButton', 'https://insidemedia.sharepoint.com/:x:/s/TPO-SharePoint/EYxRbLkQU_xLpMSvnQQFIt4Bug1w9CJupONy6sIdr6IuFw?email=harry.barnes%40wppmedia.com&e=Mi9JPh');
    addClickListener('tpoSharepointButton', 'https://insidemedia.sharepoint.com/sites/TPO-SharePoint');
    addClickListener('addCampaignButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns&osModalId=prsm-cm-cmpadd&osMOpts=lb');

    addClickListener('ngmclonButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DTE9OIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngmcintButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DSU5UIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngmcscoButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DU0NPIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngopenButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR09QRU4ifX0sImZyb20iOnsiaWQiOiIzNS1SRUlLV1hILTYiLCJzdWJDb250ZXh0Ijp7ImlkIjoiTkdNQ0lOVCJ9fX0=');

    const openSettingsPageButton = document.getElementById('openSettingsPage');
    if (openSettingsPageButton) {
        openSettingsPageButton.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior
            chrome.runtime.openOptionsPage(() => {
                if (chrome.runtime.lastError) {
                    console.error('Error opening options page:', chrome.runtime.lastError);
                    // Fallback if openOptionsPage is not set up or fails:
                    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
                }
            });
        });
    }
});

// Removed setLogoToggleState, setMetaReminderToggleState, setTimesheetReminderToggleState functions

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

// Removed handleLogoToggle, handleMetaReminderToggle, handleTimesheetReminderToggle,
// handleReminderDayChange, handleReminderTimeChange, updateTimeOptions, and updateAlarm functions.
// Note: If `updateAlarm` or parts of it were used by other functionalities not being removed,
// those parts would need to be preserved or refactored. Based on the current context,
// they seem exclusively tied to the removed settings UI.

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
