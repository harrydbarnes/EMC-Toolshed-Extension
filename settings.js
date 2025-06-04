// Prepend to settings.js or ensure it's within DOMContentLoaded

// Utility to escape HTML for display (copied from content.js)
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Function to show a test custom reminder on the settings page
function showTestCustomReminderOnSettingsPage(reminder) {
    const existingGenericPopup = document.getElementById('custom-reminder-display-popup');
    if (existingGenericPopup) existingGenericPopup.remove();
    const existingTestOverlays = document.querySelectorAll('[id^="settings-custom-reminder-overlay-"]');
    existingTestOverlays.forEach(ov => ov.remove());

    const overlayId = `settings-custom-reminder-overlay-${reminder.id}`;
    const overlay = document.createElement('div');
    overlay.className = 'reminder-overlay';
    overlay.id = overlayId;
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'custom-reminder-display-popup';

    // reminder.popupMessage is now pre-formatted HTML
    popup.innerHTML = `
        ${reminder.popupMessage}
        <button id="custom-reminder-display-close" class="settings-button">Got it!</button>
    `;
    document.body.appendChild(popup);

    const closeButton = document.getElementById('custom-reminder-display-close');
    closeButton.addEventListener('click', () => {
        const popupToRemove = document.getElementById('custom-reminder-display-popup');
        if (popupToRemove) popupToRemove.remove();
        const overlayToRemove = document.getElementById(overlayId);
        if (overlayToRemove) overlayToRemove.remove();
        console.log(`[Settings] Test custom reminder popup for ${reminder.name} closed.`);
    });
    console.log(`[Settings] Test custom reminder popup created for: ${reminder.name}`);
}


// Function to show a test Meta Reminder on the settings page (mimicking content.js)
function showTestMetaReminderOnSettingsPage() {
    if (document.getElementById('meta-reminder-popup')) {
        const existingPopup = document.getElementById('meta-reminder-popup');
        if (existingPopup) existingPopup.remove();
        const existingOverlay = document.getElementById('meta-reminder-overlay');
        if (existingOverlay) existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'reminder-overlay';
    overlay.id = 'meta-reminder-overlay';
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'meta-reminder-popup';
    popup.innerHTML = `
        <h3>⚠️ Meta Reconciliation Reminder ⚠️</h3>
        <p>When reconciling Meta, please:</p>
        <ul><li>Actualise to the 'Supplier' option</li><li>Self-accept the IO</li><li>Push through on trafficking tab to Meta</li><li>Verify success of the push, every time</li><li>Do not just leave the page!</li></ul>
        <button id="meta-reminder-close">Got it!</button>
    `;
    document.body.appendChild(popup);
    console.log("[Settings] Test Meta reminder popup CREATED with standard IDs.");

    const closeButton = document.getElementById('meta-reminder-close');
    let countdownInterval;

    const cleanupPopup = () => {
        const popupToRemove = document.getElementById('meta-reminder-popup');
        if (popupToRemove && popupToRemove.parentNode === document.body) {
            document.body.removeChild(popupToRemove);
        }
        const overlayToRemove = document.getElementById('meta-reminder-overlay');
        if (overlayToRemove && overlayToRemove.parentNode === document.body) {
            document.body.removeChild(overlayToRemove);
        }
        clearInterval(countdownInterval);
        console.log("[Settings] Test Meta reminder popup and overlay removed using standard IDs.");
    };

    if (closeButton) {
        const today = new Date().toDateString();
        const lastShownDateKey = 'settingsMetaReminderLastShown';
        const lastShownDate = localStorage.getItem(lastShownDateKey);

        if (lastShownDate !== today) {
            closeButton.disabled = true;
            let secondsLeft = 5;
            closeButton.textContent = `Got it! (${secondsLeft}s)`;

            countdownInterval = setInterval(() => {
                secondsLeft--;
                if (secondsLeft > 0) {
                    closeButton.textContent = `Got it! (${secondsLeft}s)`;
                } else {
                    clearInterval(countdownInterval);
                    closeButton.textContent = 'Got it!';
                    closeButton.disabled = false;
                    localStorage.setItem(lastShownDateKey, today);
                }
            }, 1000);
        } else {
            closeButton.disabled = false;
        }

        closeButton.addEventListener('click', function() {
            cleanupPopup();
            console.log("[Settings] Test Meta reminder popup (standard ID) closed by user.");
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page loaded');

    // General Settings
    const logoToggle = document.getElementById('logoToggle');
    if (logoToggle) {
        chrome.storage.sync.get('logoReplaceEnabled', function(data) {
            logoToggle.checked = data.logoReplaceEnabled === undefined ? true : data.logoReplaceEnabled;
            if (data.logoReplaceEnabled === undefined) {
                chrome.storage.sync.set({logoReplaceEnabled: true});
            }
        });
        logoToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            chrome.storage.sync.set({logoReplaceEnabled: isEnabled}, function() {
                console.log('Logo replacement setting saved:', isEnabled);
                chrome.tabs.query({url: ["*://*.mediaocean.com/*"]}, function(tabs) {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, { action: "checkLogoReplaceEnabled", enabled: isEnabled })
                                .catch(e => console.warn("Error sending logo toggle message to tab ID " + tab.id + ":", e.message));
                        }
                    });
                });
            });
        });
    }

    // Prisma Reminders
    const metaReminderToggle = document.getElementById('metaReminderToggle');
    const triggerMetaReminderButton = document.getElementById('triggerMetaReminder');
    if (metaReminderToggle) {
        chrome.storage.sync.get('metaReminderEnabled', function(data) {
            metaReminderToggle.checked = data.metaReminderEnabled === undefined ? true : data.metaReminderEnabled;
            if (data.metaReminderEnabled === undefined) {
                chrome.storage.sync.set({metaReminderEnabled: true});
            }
        });
        metaReminderToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            chrome.storage.sync.set({metaReminderEnabled: isEnabled}, () => console.log('Meta reminder setting saved:', isEnabled));
        });
    }
    if (triggerMetaReminderButton) {
        triggerMetaReminderButton.addEventListener('click', () => {
            console.log("[Settings] 'Test Meta Reminder' button clicked.");
            showTestMetaReminderOnSettingsPage();
        });
    }

    // Aura Reminders
    const timesheetReminderToggle = document.getElementById('timesheetReminderToggle');
    const timesheetReminderSettingsDiv = document.getElementById('timesheetReminderSettings');
    const reminderDaySelect = document.getElementById('reminderDay');
    const reminderTimeSelect = document.getElementById('reminderTime');
    const saveTimesheetReminderSettingsButton = document.getElementById('saveTimesheetReminderSettings');
    const timesheetReminderUpdateMessage = document.getElementById('timesheetReminderUpdateMessage');
    const triggerTimesheetReminderButton = document.getElementById('triggerTimesheetReminder');

    function updateTimesheetTimeOptions(day) {
        if (!reminderTimeSelect) return;
        const currentSelectedTime = reminderTimeSelect.value;
        reminderTimeSelect.innerHTML = '';
        let startTime, endTime;
        if (day === 'Friday') { startTime = 12 * 60; endTime = 17 * 60; }
        else { startTime = 9 * 60; endTime = 17 * 60 + 30; }

        for (let i = startTime; i <= endTime; i += 15) {
            const hour = Math.floor(i / 60);
            const minute = i % 60;
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            reminderTimeSelect.appendChild(option);
        }

        chrome.storage.sync.get('reminderTime', function(data) {
            if (data.reminderTime && reminderTimeSelect.querySelector(`option[value="${data.reminderTime}"]`)) {
                reminderTimeSelect.value = data.reminderTime;
            } else if (currentSelectedTime && reminderTimeSelect.querySelector(`option[value="${currentSelectedTime}"]`)) {
                reminderTimeSelect.value = currentSelectedTime;
            } else {
                if (day === 'Friday' && reminderTimeSelect.querySelector(`option[value="14:30"]`)) reminderTimeSelect.value = "14:30";
                else if (day !== 'Friday' && reminderTimeSelect.querySelector(`option[value="09:00"]`)) reminderTimeSelect.value = "09:00";
                else if (reminderTimeSelect.options.length > 0) reminderTimeSelect.value = reminderTimeSelect.options[0].value;
            }
        });
    }

    function updateTimesheetAlarm() {
        if (!reminderDaySelect || !reminderTimeSelect || !reminderDaySelect.value || !reminderTimeSelect.value) return;
        const dayValue = reminderDaySelect.value;
        const timeValue = reminderTimeSelect.value;

        chrome.storage.sync.set({reminderDay: dayValue, reminderTime: timeValue}, function() {
            if (chrome.runtime.lastError) {
                console.error("[Settings] Error setting timesheet reminderDay/Time:", chrome.runtime.lastError.message);
                return;
            }
            chrome.runtime.sendMessage({action: "createTimesheetAlarm", day: dayValue, time: timeValue}, function(response) {
                const messageEl = timesheetReminderUpdateMessage;
                if (chrome.runtime.lastError) {
                    console.error("[Settings] Error sending createTimesheetAlarm:", chrome.runtime.lastError.message);
                    if (messageEl) { messageEl.textContent = "Error updating alarm."; messageEl.style.color = "red"; }
                } else {
                    console.log("[Settings] createTimesheetAlarm sent, response:", response?.status);
                    if (messageEl) { messageEl.textContent = `Reminder updated for ${dayValue} at ${timeValue}.`; messageEl.style.color = "green"; }
                }
                if (messageEl) {
                    messageEl.classList.remove('hidden-initially');
                    setTimeout(() => messageEl.classList.add('hidden-initially'), 3000);
                }
            });
        });
    }

    if (timesheetReminderToggle) {
        chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function(data) {
            timesheetReminderToggle.checked = data.timesheetReminderEnabled !== false;
            if (timesheetReminderSettingsDiv) timesheetReminderSettingsDiv.style.display = timesheetReminderToggle.checked ? 'block' : 'none';
            if (reminderDaySelect) reminderDaySelect.value = data.reminderDay || "Friday";
            updateTimesheetTimeOptions(reminderDaySelect ? reminderDaySelect.value : 'Friday');
        });

        timesheetReminderToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            if (timesheetReminderSettingsDiv) timesheetReminderSettingsDiv.style.display = isEnabled ? 'block' : 'none';
            chrome.storage.sync.set({timesheetReminderEnabled: isEnabled}, () => {
                console.log('Timesheet reminder setting saved:', isEnabled);
                if (isEnabled) updateTimesheetAlarm();
                else {
                    chrome.runtime.sendMessage({action: "removeTimesheetAlarm"}, function(response) {
                        const messageEl = timesheetReminderUpdateMessage;
                        if (chrome.runtime.lastError) console.error("[Settings] Error sending removeTimesheetAlarm:", chrome.runtime.lastError.message);
                        else console.log("[Settings] removeTimesheetAlarm sent, response:", response?.status);
                        if (messageEl) {
                            messageEl.textContent = "Timesheet reminder disabled."; messageEl.style.color = "orange";
                            messageEl.classList.remove('hidden-initially');
                            setTimeout(() => messageEl.classList.add('hidden-initially'), 3000);
                        }
                    });
                }
            });
        });
    }
    if (reminderDaySelect) reminderDaySelect.addEventListener('change', () => updateTimesheetTimeOptions(reminderDaySelect.value));
    if (saveTimesheetReminderSettingsButton) saveTimesheetReminderSettingsButton.addEventListener('click', () => {
        if (timesheetReminderToggle && timesheetReminderToggle.checked) updateTimesheetAlarm();
        else if (timesheetReminderUpdateMessage) {
            timesheetReminderUpdateMessage.textContent = "Enable timesheet reminder first to save.";
            timesheetReminderUpdateMessage.style.color = "orange";
            timesheetReminderUpdateMessage.classList.remove('hidden-initially');
            setTimeout(() => timesheetReminderUpdateMessage.classList.add('hidden-initially'), 3000);
        }
    });
    if (triggerTimesheetReminderButton) triggerTimesheetReminderButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({action: "showTimesheetNotification"}, response => {
            if (chrome.runtime.lastError) alert("Error triggering reminder: " + chrome.runtime.lastError.message);
            else alert("Test timesheet reminder notification sent!");
        });
    });

    // Custom Reminders - Two-Step Workflow
    const createReminderInitialStepDiv = document.getElementById('createReminderInitialStep');
    const customReminderEditorDiv = document.getElementById('customReminderEditor'); // The section itself

    const reminderNameInput = document.getElementById('reminderName');
    const reminderUrlPatternInput = document.getElementById('reminderUrlPattern');
    const reminderTextTriggerInput = document.getElementById('reminderTextTrigger');
    const nextButton = document.getElementById('nextButton'); // Was saveCustomReminderButton
    const customReminderStatus = document.getElementById('customReminderStatus'); // Shared status message
    const customRemindersListDiv = document.getElementById('customRemindersList');

    // Elements for the editor (step 2)
    const editorReminderNameDisplay = document.getElementById('editorReminderNameDisplay');
    const editorReminderUrlPatternDisplay = document.getElementById('editorReminderUrlPatternDisplay');
    const editorReminderTextTriggerDisplay = document.getElementById('editorReminderTextTriggerDisplay');
    const reminderEditorTitle = document.getElementById('reminderEditorTitle');
    const reminderEditorIntro = document.getElementById('reminderEditorIntro');
    const reminderEditorBullets = document.getElementById('reminderEditorBullets');
    const saveCustomReminderNewButton = document.getElementById('saveCustomReminderNew');
    const backButton = document.getElementById('backButton');

    let currentReminderData = {}; // Store data from step 1

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            const name = reminderNameInput.value.trim();
            const urlPattern = reminderUrlPatternInput.value.trim();
            const textTrigger = reminderTextTriggerInput.value.trim();

            if (!name || !urlPattern) {
                customReminderStatus.textContent = 'Reminder Name and URL Pattern are required for the first step.';
                customReminderStatus.style.color = 'red';
                customReminderStatus.classList.remove('hidden-initially');
                setTimeout(() => customReminderStatus.classList.add('hidden-initially'), 3000);
                return;
            }

            currentReminderData = { name, urlPattern, textTrigger };

            if (editorReminderNameDisplay) editorReminderNameDisplay.textContent = name;
            if (editorReminderUrlPatternDisplay) editorReminderUrlPatternDisplay.textContent = urlPattern;
            if (editorReminderTextTriggerDisplay) editorReminderTextTriggerDisplay.textContent = textTrigger || 'N/A';

            // Pre-fill editor fields
            if (reminderEditorTitle) reminderEditorTitle.value = "⚠️ Reminder Title ⚠️"; // Default/placeholder
            if (reminderEditorIntro) reminderEditorIntro.value = "This is a reminder to..."; // Default/placeholder
            if (reminderEditorBullets) reminderEditorBullets.value = "• Item 1\n• Item 2\n• Item 3"; // Default/placeholder

            if (createReminderInitialStepDiv) createReminderInitialStepDiv.style.display = 'none';
            if (customReminderEditorDiv) customReminderEditorDiv.style.display = 'block';

            customReminderStatus.classList.add('hidden-initially'); // Clear status from step 1
        });
    }

    if (backButton) {
        backButton.addEventListener('click', function() {
            if (customReminderEditorDiv) customReminderEditorDiv.style.display = 'none';
            if (createReminderInitialStepDiv) createReminderInitialStepDiv.style.display = 'block';
            // currentReminderData = {}; // Optionally clear data
        });
    }

    if (saveCustomReminderNewButton) {
        saveCustomReminderNewButton.addEventListener('click', function() {
            const title = reminderEditorTitle.value.trim();
            const intro = reminderEditorIntro.value.trim();
            const bulletsText = reminderEditorBullets.value.trim();

            if (!title || !intro) { // Bullets can be optional
                // Show error message within the editor section if possible, or use general status
                alert('Reminder Title and Intro Sentence are required.'); // Simple alert for now
                return;
            }

            let popupMessageHtml = `<h3>${escapeHTML(title)}</h3>`;
            if (intro) {
                popupMessageHtml += `<p>${escapeHTML(intro)}</p>`;
            }
            if (bulletsText) {
                popupMessageHtml += '<ul>';
                bulletsText.split('\n').forEach(bullet => {
                    if (bullet.trim()) {
                        popupMessageHtml += `<li>${escapeHTML(bullet.trim().replace(/^•\s*/, ''))}</li>`;
                    }
                });
                popupMessageHtml += '</ul>';
            }

            const newReminder = {
                id: 'custom_' + Date.now(),
                name: currentReminderData.name,
                urlPattern: currentReminderData.urlPattern,
                textTrigger: currentReminderData.textTrigger,
                popupMessage: popupMessageHtml,
                enabled: true
            };

            chrome.storage.sync.get({customReminders: []}, function(data) {
                let reminders = data.customReminders;
                reminders.push(newReminder);
                chrome.storage.sync.set({customReminders: reminders}, function() {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving new custom reminder:", chrome.runtime.lastError);
                        customReminderStatus.textContent = 'Error saving reminder: ' + chrome.runtime.lastError.message;
                        customReminderStatus.style.color = 'red';
                    } else {
                        console.log('New custom reminder saved.');
                        customReminderStatus.textContent = 'Custom reminder saved successfully!';
                        customReminderStatus.style.color = 'green';

                        // Clear step 1 inputs
                        if (reminderNameInput) reminderNameInput.value = '';
                        if (reminderUrlPatternInput) reminderUrlPatternInput.value = '';
                        if (reminderTextTriggerInput) reminderTextTriggerInput.value = '';
                        // Clear step 2 inputs
                        if (reminderEditorTitle) reminderEditorTitle.value = '';
                        if (reminderEditorIntro) reminderEditorIntro.value = '';
                        if (reminderEditorBullets) reminderEditorBullets.value = '';

                        currentReminderData = {};
                        displayCustomReminders();
                        chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.log("Error sending customRemindersUpdated message:", e));

                        // Switch back to step 1 view
                        if (customReminderEditorDiv) customReminderEditorDiv.style.display = 'none';
                        if (createReminderInitialStepDiv) createReminderInitialStepDiv.style.display = 'block';
                    }
                    customReminderStatus.classList.remove('hidden-initially'); // Make sure it's visible (it's in step 1 div)
                    setTimeout(() => customReminderStatus.classList.add('hidden-initially'), 3000);
                });
            });
        });
    }

    function displayCustomReminders() {
        chrome.storage.sync.get({customReminders: []}, function(data) {
            const reminders = data.customReminders;
            if (!customRemindersListDiv) return;
            customRemindersListDiv.innerHTML = '';

            if (reminders.length === 0) {
                customRemindersListDiv.innerHTML = '<p>No custom reminders saved yet.</p>';
                return;
            }

            const ul = document.createElement('ul');
            ul.style.listStyleType = 'none';
            ul.style.paddingLeft = '0';

            reminders.forEach((reminder, index) => {
                const li = document.createElement('li');
                li.style.padding = '10px';
                li.style.border = '1px solid #eee';
                li.style.marginBottom = '5px';
                li.style.borderRadius = '4px';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';

                const textDiv = document.createElement('div');
                textDiv.style.flexGrow = '1';
                // Removed direct display of reminder.popupMessage from here
                textDiv.innerHTML = `
                    <strong>Name:</strong> ${escapeHTML(reminder.name || 'N/A')}<br>
                    <strong>URL Pattern:</strong> ${escapeHTML(reminder.urlPattern)}<br>
                    <strong>Trigger Text:</strong> ${reminder.textTrigger ? escapeHTML(reminder.textTrigger) : '<em>N/A</em>'}
                `;

                const controlsDiv = document.createElement('div');
                controlsDiv.style.display = 'flex';
                controlsDiv.style.alignItems = 'center';
                controlsDiv.style.marginLeft = '10px';

                const toggleLabel = document.createElement('label');
                toggleLabel.classList.add('toggle');
                const toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.checked = reminder.enabled;
                toggleInput.dataset.reminderId = reminder.id;
                const sliderSpan = document.createElement('span');
                sliderSpan.classList.add('slider');
                toggleLabel.appendChild(toggleInput);
                toggleLabel.appendChild(sliderSpan);

                toggleInput.addEventListener('change', function(event) {
                    const reminderIdToToggle = event.target.dataset.reminderId;
                    const isEnabled = event.target.checked;
                    chrome.storage.sync.get({customReminders: []}, function(data) {
                        let reminders = data.customReminders;
                        const reminderIndex = reminders.findIndex(r => r.id === reminderIdToToggle);
                        if (reminderIndex !== -1) {
                            reminders[reminderIndex].enabled = isEnabled;
                            chrome.storage.sync.set({customReminders: reminders}, function() {
                                if (chrome.runtime.lastError) console.error("Error updating reminder state:", chrome.runtime.lastError);
                                else console.log('Reminder state updated for ID:', reminderIdToToggle, 'to', isEnabled);
                                chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.log("Error sending message:", e));
                            });
                        }
                    });
                });

                const testButton = document.createElement('button');
                testButton.textContent = 'Test';
                testButton.classList.add('settings-button');
                testButton.style.marginLeft = '10px';
                testButton.style.backgroundColor = '#17a2b8';
                testButton.addEventListener('click', () => showTestCustomReminderOnSettingsPage(reminder));

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('settings-button');
                deleteButton.style.backgroundColor = '#dc3545';
                deleteButton.style.marginLeft = '10px';
                deleteButton.dataset.reminderId = reminder.id; // Use ID for deletion
                deleteButton.addEventListener('click', deleteCustomReminderById);

                controlsDiv.appendChild(toggleLabel);
                controlsDiv.appendChild(testButton);
                controlsDiv.appendChild(deleteButton);
                li.appendChild(textDiv);
                li.appendChild(controlsDiv);
                ul.appendChild(li);
            });
            customRemindersListDiv.appendChild(ul);
        });
    }

    function deleteCustomReminderById(event) {
        const idToDelete = event.target.dataset.reminderId;
        chrome.storage.sync.get({customReminders: []}, function(data) {
            let reminders = data.customReminders.filter(r => r.id !== idToDelete);
            chrome.storage.sync.set({customReminders: reminders}, function() {
                if (chrome.runtime.lastError) console.error("Error deleting reminder:", chrome.runtime.lastError);
                else console.log('Custom reminder deleted by ID:', idToDelete);
                displayCustomReminders();
                chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.log("Error sending message:", e));
            });
        });
    }

    displayCustomReminders(); // Initial display

    // Export Settings
    const generateExportDataButton = document.getElementById('generateExportData');
    const exportDataTextarea = document.getElementById('exportDataTextarea');
    if (generateExportDataButton && exportDataTextarea) {
        generateExportDataButton.addEventListener('click', function() {
            chrome.storage.sync.get({customReminders: []}, function(data) {
                if (data.customReminders.length === 0) {
                    exportDataTextarea.value = "No custom reminders to export.";
                    return;
                }
                try {
                    exportDataTextarea.value = JSON.stringify(data.customReminders, null, 2);
                    exportDataTextarea.select();
                    alert("Custom reminder data generated. You can now copy it.");
                } catch (error) {
                    console.error("Error stringifying reminders for export:", error);
                    exportDataTextarea.value = "Error generating export data.";
                }
            });
        });
    }

    // Listener for external updates
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "refreshCustomRemindersDisplay") {
            displayCustomReminders();
            sendResponse({status: "Custom reminders display refreshed"});
            return true;
        }
    });
});
