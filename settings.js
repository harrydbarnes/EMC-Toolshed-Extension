// Prepend to settings.js or ensure it's within DOMContentLoaded

// Utility to escape HTML for display
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
    overlay.className = 'reminder-overlay'; // Ensure this class exists and provides basic overlay styling
    overlay.id = overlayId;
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'custom-reminder-display-popup'; // Ensure this ID is styled in settings.css or style.css

    popup.innerHTML = `
        ${reminder.popupMessage}
        <button id="custom-reminder-display-close" class="settings-button">Got it!</button>
    `;
    document.body.appendChild(popup);

    const closeButton = document.getElementById('custom-reminder-display-close');
    closeButton.addEventListener('click', () => {
        popup.remove();
        overlay.remove();
        console.log(`[Settings] Test custom reminder popup for ${reminder.name} closed.`);
    });
    console.log(`[Settings] Test custom reminder popup created for: ${reminder.name}`);
}


// Function to show a test Meta Reminder on the settings page
function showTestMetaReminderOnSettingsPage() {
    // Remove existing test popups to prevent duplicates
    const existingPopup = document.getElementById('meta-reminder-popup');
    if (existingPopup) existingPopup.remove();
    const existingOverlay = document.getElementById('meta-reminder-overlay');
    if (existingOverlay) existingOverlay.remove();

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
    console.log("[Settings] Test Meta reminder popup CREATED.");

    const closeButton = document.getElementById('meta-reminder-close');
    let countdownInterval;

    const cleanupPopup = () => {
        popup.remove();
        overlay.remove();
        clearInterval(countdownInterval);
        console.log("[Settings] Test Meta reminder popup and overlay removed.");
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
        closeButton.addEventListener('click', cleanupPopup);
    }
}

// Function to show a test IAS Reminder on the settings page
function showTestIasReminderOnSettingsPage() {
    // Remove existing test popups to prevent duplicates
    const existingPopup = document.getElementById('ias-reminder-popup');
    if (existingPopup) existingPopup.remove();
    const existingOverlay = document.getElementById('ias-reminder-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'reminder-overlay';
    overlay.id = 'ias-reminder-overlay';
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'ias-reminder-popup';
    popup.innerHTML = `
        <h3>⚠️ IAS Booking Reminder ⚠️</h3>
        <p>Please ensure you book as CPM</p>
        <ul><li>With correct rate for media type</li><li>Check the plan</li><li>Ensure what is planned is what goes live</li></ul>
        <button id="ias-reminder-close">Got it!</button>
    `;
    document.body.appendChild(popup);
    console.log("[Settings] Test IAS reminder popup CREATED.");

    const closeButton = document.getElementById('ias-reminder-close');

    const cleanupPopup = () => {
        popup.remove();
        overlay.remove();
        console.log("[Settings] Test IAS reminder popup and overlay removed.");
    };

    if (closeButton) {
        closeButton.addEventListener('click', cleanupPopup);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page loaded');

    // General Settings
    const logoToggle = document.getElementById('logoToggle');
    if (logoToggle) {
        chrome.storage.sync.get('logoReplaceEnabled', function(data) {
            logoToggle.checked = data.logoReplaceEnabled === undefined ? true : data.logoReplaceEnabled;
            if (data.logoReplaceEnabled === undefined) chrome.storage.sync.set({logoReplaceEnabled: true});
        });
        logoToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            chrome.storage.sync.set({logoReplaceEnabled: isEnabled}, () => {
                console.log('Logo replacement setting saved:', isEnabled);
                chrome.tabs.query({url: ["*://*.mediaocean.com/*"]}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) chrome.tabs.sendMessage(tab.id, { action: "checkLogoReplaceEnabled", enabled: isEnabled })
                            .catch(e => console.warn("Error sending logo toggle message to tab ID " + tab.id + ":", e.message));
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
            if (data.metaReminderEnabled === undefined) chrome.storage.sync.set({metaReminderEnabled: true});
        });
        metaReminderToggle.addEventListener('change', function() {
            chrome.storage.sync.set({metaReminderEnabled: this.checked}, () => console.log('Meta reminder setting saved:', this.checked));
        });
    }
    if (triggerMetaReminderButton) {
        triggerMetaReminderButton.addEventListener('click', showTestMetaReminderOnSettingsPage);
    }

    const iasReminderToggle = document.getElementById('iasReminderToggle');
    const triggerIasReminderButton = document.getElementById('triggerIasReminder');
    if (iasReminderToggle) {
        chrome.storage.sync.get('iasReminderEnabled', function(data) {
            iasReminderToggle.checked = data.iasReminderEnabled === undefined ? true : data.iasReminderEnabled;
            if (data.iasReminderEnabled === undefined) chrome.storage.sync.set({iasReminderEnabled: true});
        });
        iasReminderToggle.addEventListener('change', function() {
            chrome.storage.sync.set({iasReminderEnabled: this.checked}, () => console.log('IAS reminder setting saved:', this.checked));
        });
    }
    if (triggerIasReminderButton) {
        triggerIasReminderButton.addEventListener('click', showTestIasReminderOnSettingsPage);
    }

    // Campaign Management Settings
    const addCampaignShortcutToggle = document.getElementById('addCampaignShortcutToggle');
    if (addCampaignShortcutToggle) {
        chrome.storage.sync.get('addCampaignShortcutEnabled', function(data) {
            addCampaignShortcutToggle.checked = data.addCampaignShortcutEnabled === undefined ? true : data.addCampaignShortcutEnabled;
            if (data.addCampaignShortcutEnabled === undefined) chrome.storage.sync.set({addCampaignShortcutEnabled: true});
        });
        addCampaignShortcutToggle.addEventListener('change', function() {
            chrome.storage.sync.set({addCampaignShortcutEnabled: this.checked}, () => console.log('Add Campaign shortcut setting saved:', this.checked));
        });
    }

    const hidingSectionsToggle = document.getElementById('hidingSectionsToggle');
    if (hidingSectionsToggle) {
        chrome.storage.sync.get('hidingSectionsEnabled', function(data) {
            hidingSectionsToggle.checked = data.hidingSectionsEnabled === undefined ? true : data.hidingSectionsEnabled;
            if (data.hidingSectionsEnabled === undefined) chrome.storage.sync.set({hidingSectionsEnabled: true});
        });
        hidingSectionsToggle.addEventListener('change', function() {
            chrome.storage.sync.set({hidingSectionsEnabled: this.checked}, () => console.log('Hiding Sections setting saved:', this.checked));
        });
    }

    const automateFormFieldsToggle = document.getElementById('automateFormFieldsToggle');
    if (automateFormFieldsToggle) {
        chrome.storage.sync.get('automateFormFieldsEnabled', function(data) {
            automateFormFieldsToggle.checked = data.automateFormFieldsEnabled === undefined ? true : data.automateFormFieldsEnabled;
            if (data.automateFormFieldsEnabled === undefined) chrome.storage.sync.set({automateFormFieldsEnabled: true});
        });
        automateFormFieldsToggle.addEventListener('change', function() {
            chrome.storage.sync.set({automateFormFieldsEnabled: this.checked}, () => console.log('Automate Form Fields setting saved:', this.checked));
        });
    }

    // Aura Reminders (Timesheet)
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
            const option = new Option(timeString, timeString);
            reminderTimeSelect.add(option);
        }

        chrome.storage.sync.get('reminderTime', (data) => {
            if (data.reminderTime && Array.from(reminderTimeSelect.options).some(o => o.value === data.reminderTime)) {
                reminderTimeSelect.value = data.reminderTime;
            } else if (currentSelectedTime && Array.from(reminderTimeSelect.options).some(o => o.value === currentSelectedTime)) {
                reminderTimeSelect.value = currentSelectedTime;
            } else {
                const defaultTime = (day === 'Friday') ? "14:30" : "09:00";
                if (Array.from(reminderTimeSelect.options).some(o => o.value === defaultTime)) reminderTimeSelect.value = defaultTime;
                else if (reminderTimeSelect.options.length > 0) reminderTimeSelect.value = reminderTimeSelect.options[0].value;
            }
        });
    }

    function updateTimesheetAlarm(showMsg = true) {
        if (!reminderDaySelect || !reminderTimeSelect || !reminderDaySelect.value || !reminderTimeSelect.value) return;
        const dayValue = reminderDaySelect.value;
        const timeValue = reminderTimeSelect.value;

        chrome.storage.sync.set({reminderDay: dayValue, reminderTime: timeValue}, () => {
            if (chrome.runtime.lastError) {
                console.error("[Settings] Error setting timesheet reminderDay/Time:", chrome.runtime.lastError.message);
                return;
            }
            chrome.runtime.sendMessage({action: "createTimesheetAlarm", day: dayValue, time: timeValue}, (response) => {
                const messageEl = timesheetReminderUpdateMessage;
                if (!messageEl || !showMsg) return;
                if (chrome.runtime.lastError) {
                    messageEl.textContent = "Error updating alarm."; messageEl.style.color = "red";
                } else {
                    messageEl.textContent = `Reminder updated for ${dayValue} at ${timeValue}.`; messageEl.style.color = "green";
                }
                messageEl.classList.remove('hidden-initially');
                setTimeout(() => messageEl.classList.add('hidden-initially'), 3000);
            });
        });
    }

    if (timesheetReminderToggle) {
        chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay'], (data) => {
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
                    chrome.runtime.sendMessage({action: "removeTimesheetAlarm"}, (response) => {
                        const messageEl = timesheetReminderUpdateMessage;
                        if (!messageEl) return;
                        if (chrome.runtime.lastError) console.error("[Settings] Error sending removeTimesheetAlarm:", chrome.runtime.lastError.message);
                        else messageEl.textContent = "Timesheet reminder disabled."; messageEl.style.color = "orange";
                        messageEl.classList.remove('hidden-initially');
                        setTimeout(() => messageEl.classList.add('hidden-initially'), 3000);
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

    // --- Custom Reminders - Modal Workflow ---
    const createReminderInitialStepDiv = document.getElementById('createReminderInitialStep');
    const reminderNameInput = document.getElementById('reminderName');
    const reminderUrlPatternInput = document.getElementById('reminderUrlPattern');
    const reminderTextTriggerInput = document.getElementById('reminderTextTrigger');
    const nextButton = document.getElementById('nextButton');
    const customReminderStatus = document.getElementById('customReminderStatus');
    const customRemindersListDiv = document.getElementById('customRemindersList');

    // Modal elements
    const reminderModalOverlay = document.getElementById('reminderModalOverlay');
    const reminderModalEditor = document.getElementById('reminderModalEditor');
    const modalEditorTitle = document.getElementById('modalEditorTitle'); // h2 title of modal
    const modalCloseButton = document.getElementById('modalCloseButton'); // X button
    const modalReminderNameDisplay = document.getElementById('modalReminderNameDisplay');
    const modalReminderUrlPatternDisplay = document.getElementById('modalReminderUrlPatternDisplay');
    const modalReminderTextTriggerDisplay = document.getElementById('modalReminderTextTriggerDisplay');
    const modalInputReminderTitle = document.getElementById('modalInputReminderTitle');
    const modalInputIntroSentence = document.getElementById('modalInputIntroSentence');
    const modalInputBulletPoints = document.getElementById('modalInputBulletPoints');
    const modalSaveButton = document.getElementById('modalSaveButton');
    const modalCancelButton = document.getElementById('modalCancelButton');

    let currentReminderData = {}; // Holds data for modal (name, url, textTrigger)
    let editingReminderId = null; // Used to distinguish between create and edit

    function openReminderModal(isEditMode = false, reminderDataForEdit = null) {
        if (isEditMode && reminderDataForEdit) {
            editingReminderId = reminderDataForEdit.id;
            currentReminderData = { // Store the non-popupMessage parts
                name: reminderDataForEdit.name,
                urlPattern: reminderDataForEdit.urlPattern,
                textTrigger: reminderDataForEdit.textTrigger
            };
            modalEditorTitle.textContent = 'Edit Custom Reminder';
            modalReminderNameDisplay.textContent = reminderDataForEdit.name;
            modalReminderUrlPatternDisplay.textContent = reminderDataForEdit.urlPattern;
            modalReminderTextTriggerDisplay.textContent = reminderDataForEdit.textTrigger || 'N/A';

            // Parse reminderDataForEdit.popupMessage to fill modal inputs
            const parser = new DOMParser();
            const doc = parser.parseFromString(reminderDataForEdit.popupMessage, 'text/html');
            const titleElem = doc.querySelector('h3');
            const introElem = doc.querySelector('p');
            const bulletsElems = doc.querySelectorAll('ul li');

            modalInputReminderTitle.value = titleElem ? titleElem.textContent : '';
            modalInputIntroSentence.value = introElem ? introElem.textContent : '';
            modalInputBulletPoints.value = Array.from(bulletsElems).map(li => `• ${li.textContent.trim()}`).join('\n');

        } else { // This is for creating a new reminder
            editingReminderId = null;
            // currentReminderData should have been set by the "Next" button logic
            modalEditorTitle.textContent = 'Create Custom Reminder';
            modalReminderNameDisplay.textContent = currentReminderData.name || 'N/A';
            modalReminderUrlPatternDisplay.textContent = currentReminderData.urlPattern || 'N/A';
            modalReminderTextTriggerDisplay.textContent = currentReminderData.textTrigger || 'N/A';

            // Pre-fill with defaults for new reminder
            modalInputReminderTitle.value = "⚠️ Reminder Title ⚠️";
            modalInputIntroSentence.value = "This is a reminder to...";
            modalInputBulletPoints.value = "• Step 1\n• Step 2\n• Step 3";
        }

        if (reminderModalOverlay) reminderModalOverlay.style.display = 'block';
        if (reminderModalEditor) reminderModalEditor.style.display = 'block';
        if (createReminderInitialStepDiv) createReminderInitialStepDiv.style.display = 'none'; // Hide step 1
    }

    function closeReminderModal() {
        if (reminderModalOverlay) reminderModalOverlay.style.display = 'none';
        if (reminderModalEditor) reminderModalEditor.style.display = 'none';
        if (createReminderInitialStepDiv) createReminderInitialStepDiv.style.display = 'block'; // Show step 1

        // Clear modal form fields
        if(modalInputReminderTitle) modalInputReminderTitle.value = '';
        if(modalInputIntroSentence) modalInputIntroSentence.value = '';
        if(modalInputBulletPoints) modalInputBulletPoints.value = '';
        // Reset display fields in modal
        if(modalReminderNameDisplay) modalReminderNameDisplay.textContent = '';
        if(modalReminderUrlPatternDisplay) modalReminderUrlPatternDisplay.textContent = '';
        if(modalReminderTextTriggerDisplay) modalReminderTextTriggerDisplay.textContent = '';

        currentReminderData = {}; // Clear intermediate data
        editingReminderId = null; // Reset editing state
    }

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            const name = reminderNameInput.value.trim();
            const urlPattern = reminderUrlPatternInput.value.trim();

            if (!name || !urlPattern) {
                customReminderStatus.textContent = 'Reminder Name and URL Pattern are required.';
                customReminderStatus.style.color = 'red';
                customReminderStatus.classList.remove('hidden-initially');
                setTimeout(() => customReminderStatus.classList.add('hidden-initially'), 3000);
                return;
            }

            currentReminderData = {
                name,
                urlPattern,
                textTrigger: reminderTextTriggerInput.value.trim()
            };
            // editingReminderId = null; // This is set in openReminderModal
            openReminderModal(false); // Open for new reminder
        });
    }

    if (modalCloseButton) modalCloseButton.addEventListener('click', closeReminderModal);
    if (modalCancelButton) modalCancelButton.addEventListener('click', closeReminderModal);

    if (modalSaveButton) {
        modalSaveButton.addEventListener('click', function() {
            // These are from currentReminderData, set when modal was opened (for new or edit)
            const reminderName = currentReminderData.name;
            const urlPattern = currentReminderData.urlPattern;
            const textTrigger = currentReminderData.textTrigger;

            const title = modalInputReminderTitle.value.trim();
            const intro = modalInputIntroSentence.value.trim();
            const bulletsText = modalInputBulletPoints.value.trim();

            if (!title || !intro) {
                alert('Reminder Title and Intro Sentence are required.');
                return;
            }

            let popupMessageHtml = `<h3>${escapeHTML(title)}</h3>`;
            if (intro) popupMessageHtml += `<p>${escapeHTML(intro)}</p>`;
            if (bulletsText) {
                popupMessageHtml += '<ul>';
                bulletsText.split('\n').forEach(bullet => {
                    let trimmedBullet = bullet.trim();
                    if (trimmedBullet) {
                        if (trimmedBullet.startsWith('• ')) { // Remove leading bullet if user typed it
                            trimmedBullet = trimmedBullet.substring(2);
                        }
                        popupMessageHtml += `<li>${escapeHTML(trimmedBullet)}</li>`;
                    }
                });
                popupMessageHtml += '</ul>';
            }

            chrome.storage.sync.get({customReminders: []}, function(data) {
                let reminders = data.customReminders;
                let statusMessage = '';

                if (editingReminderId) { // EDIT MODE
                    const reminderIndex = reminders.findIndex(r => r.id === editingReminderId);
                    if (reminderIndex !== -1) {
                        reminders[reminderIndex].name = reminderName;
                        reminders[reminderIndex].urlPattern = urlPattern;
                        reminders[reminderIndex].textTrigger = textTrigger;
                        reminders[reminderIndex].popupMessage = popupMessageHtml;
                        // .enabled state is preserved as it's not editable here
                        statusMessage = 'Custom reminder updated!';
                    } else {
                        customReminderStatus.textContent = 'Error: Reminder not found for editing.';
                        customReminderStatus.style.color = 'red';
                        customReminderStatus.classList.remove('hidden-initially');
                        setTimeout(() => customReminderStatus.classList.add('hidden-initially'), 3000);
                        return;
                    }
                } else { // CREATE NEW MODE
                    const newReminder = {
                        id: 'custom_' + Date.now(),
                        name: reminderName,
                        urlPattern: urlPattern,
                        textTrigger: textTrigger,
                        popupMessage: popupMessageHtml,
                        enabled: true
                    };
                    reminders.push(newReminder);
                    statusMessage = 'Custom reminder saved!';
                }

                chrome.storage.sync.set({customReminders: reminders}, function() {
                    if (chrome.runtime.lastError) {
                        customReminderStatus.textContent = 'Error saving: ' + chrome.runtime.lastError.message;
                        customReminderStatus.style.color = 'red';
                    } else {
                        customReminderStatus.textContent = statusMessage;
                        customReminderStatus.style.color = 'green';

                        if (!editingReminderId) { // Clear initial step inputs only for new reminders
                           if(reminderNameInput) reminderNameInput.value = '';
                           if(reminderUrlPatternInput) reminderUrlPatternInput.value = '';
                           if(reminderTextTriggerInput) reminderTextTriggerInput.value = '';
                        }
                    }
                    customReminderStatus.classList.remove('hidden-initially');
                    setTimeout(() => customReminderStatus.classList.add('hidden-initially'), 3000);

                    closeReminderModal();
                    displayCustomReminders();
                    chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.warn("Error sending customRemindersUpdated message:", e.message));
                });
            });
        });
    }

    function displayCustomReminders() {
        chrome.storage.sync.get({customReminders: []}, (data) => {
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

            reminders.forEach(reminder => {
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
                toggleLabel.className = 'toggle';
                const toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.checked = reminder.enabled;
                toggleInput.dataset.reminderId = reminder.id;
                const sliderSpan = document.createElement('span');
                sliderSpan.className = 'slider';
                toggleLabel.append(toggleInput, sliderSpan);

                toggleInput.addEventListener('change', function() {
                    const reminderIdToToggle = this.dataset.reminderId;
                    const isEnabled = this.checked;
                    chrome.storage.sync.get({customReminders: []}, (storageData) => {
                        const updatedReminders = storageData.customReminders.map(r => {
                            if (r.id === reminderIdToToggle) r.enabled = isEnabled;
                            return r;
                        });
                        chrome.storage.sync.set({customReminders: updatedReminders}, () => {
                            if (chrome.runtime.lastError) console.error("Error updating reminder state:", chrome.runtime.lastError);
                            else console.log('Reminder state updated for ID:', reminderIdToToggle, 'to', isEnabled);
                            chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.warn("Error sending update message:", e.message));
                        });
                    });
                });

                const testButton = document.createElement('button');
                testButton.textContent = 'Test';
                testButton.className = 'settings-button';
                testButton.style.marginLeft = '10px';
                testButton.style.backgroundColor = '#17a2b8';
                testButton.addEventListener('click', () => showTestCustomReminderOnSettingsPage(reminder));

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('settings-button', 'settings-button-edit'); // Added class
                // editButton.style.backgroundColor = '#ffc107'; // Using class instead
                editButton.style.marginLeft = '10px';
                editButton.addEventListener('click', () => {
                    openReminderModal(true, reminder); // Pass true for isEditMode and the reminder object
                });

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'settings-button';
                deleteButton.style.backgroundColor = '#dc3545';
                deleteButton.style.marginLeft = '10px';
                deleteButton.dataset.reminderId = reminder.id;
                deleteButton.addEventListener('click', deleteCustomReminderById);

                controlsDiv.append(toggleLabel, testButton, editButton, deleteButton);
                li.append(textDiv, controlsDiv);
                ul.appendChild(li);
            });
            customRemindersListDiv.appendChild(ul);
        });
    }

    function deleteCustomReminderById(event) {
        const idToDelete = event.target.dataset.reminderId;
        chrome.storage.sync.get({customReminders: []}, (data) => {
            const reminders = data.customReminders.filter(r => r.id !== idToDelete);
            chrome.storage.sync.set({customReminders: reminders}, () => {
                if (chrome.runtime.lastError) console.error("Error deleting reminder:", chrome.runtime.lastError);
                else console.log('Custom reminder deleted by ID:', idToDelete);
                displayCustomReminders();
                chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.warn("Error sending update message:", e.message));
            });
        });
    }

    displayCustomReminders(); // Initial display

    // Export Settings
    const generateExportDataButton = document.getElementById('generateExportData');
    const exportDataTextarea = document.getElementById('exportDataTextarea');
    if (generateExportDataButton && exportDataTextarea) {
        generateExportDataButton.addEventListener('click', () => {
            chrome.storage.sync.get({customReminders: []}, (data) => {
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

    // Listener for external updates (e.g., from background script)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "refreshCustomRemindersDisplay") {
            displayCustomReminders();
            sendResponse({status: "Custom reminders display refreshed"});
            return true;
        }
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHTML,
    };
}
