// Prepend to settings.js or ensure it's within DOMContentLoaded

// Utility to escape HTML for display (copied from content.js)
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// addReminderStylesToSettings function is now removed as styles are in style.css
// Ensure style.css is linked in settings.html

// Function to show a test custom reminder on the settings page
function showTestCustomReminderOnSettingsPage(reminder) {
    // Remove any existing test custom reminder popup first to avoid ID clashes
    const existingGenericPopup = document.getElementById('custom-reminder-display-popup');
    if (existingGenericPopup) existingGenericPopup.remove();
    // Also remove any overlay associated with it (assuming it might be 'settings-custom-reminder-overlay-' + previous reminder.id)
    // This is a bit broad, but safer if multiple test popups are clicked rapidly.
    // A more robust way would be to store the current test overlay and remove it specifically.
    const existingTestOverlays = document.querySelectorAll('[id^="settings-custom-reminder-overlay-"]');
    existingTestOverlays.forEach(ov => ov.remove());


    // addReminderStylesToSettings(); // Removed call

    const overlayId = `settings-custom-reminder-overlay-${reminder.id}`; // Keep a unique ID for the test overlay
    const overlay = document.createElement('div');
    overlay.className = 'reminder-overlay'; // Use shared class for styling
    overlay.id = overlayId;
    // z-index is handled by .reminder-overlay in style.css
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'custom-reminder-display-popup'; // Use shared ID for styling

    // Inline styles are removed; relies on #custom-reminder-display-popup from style.css
    // Note: This means custom background color from reminder.color will not apply here.
    // The popup will have the standard pink background defined in style.css.

    popup.innerHTML = `
        <h3>${escapeHTML(reminder.name)}</h3>
        <p>${escapeHTML(reminder.popupMessage)}</p>
        <button id="custom-reminder-display-close">Got it!</button>
    `; // Use shared button ID
    document.body.appendChild(popup);

    const closeButton = document.getElementById('custom-reminder-display-close'); // Use shared ID
    closeButton.addEventListener('click', () => {
        const popupToRemove = document.getElementById('custom-reminder-display-popup');
        if (popupToRemove) popupToRemove.remove();
        const overlayToRemove = document.getElementById(overlayId); // Remove specific test overlay
        if (overlayToRemove) overlayToRemove.remove();
        console.log(`[Settings] Test custom reminder popup for ${reminder.name} closed.`);
    });
    console.log(`[Settings] Test custom reminder popup created for: ${reminder.name} using shared styles.`);
}


// Function to show a test Meta Reminder on the settings page (mimicking content.js)
function showTestMetaReminderOnSettingsPage() {
    // Check if a meta reminder popup (from content script or another test) already exists
    if (document.getElementById('meta-reminder-popup')) {
        const existingPopup = document.getElementById('meta-reminder-popup');
        if (existingPopup) existingPopup.remove();
        const existingOverlay = document.getElementById('meta-reminder-overlay'); // Assume overlay has this ID if popup exists
        if (existingOverlay) existingOverlay.remove();
    }

    // addReminderStylesToSettings(); // Ensure the styles (now including #meta-reminder-popup) are loaded // Removed call

    // Create and add the overlay, identical to content.js
    const overlay = document.createElement('div');
    overlay.className = 'reminder-overlay'; // Use the standard class name
    overlay.id = 'meta-reminder-overlay';   // Use the standard ID
    document.body.appendChild(overlay);

    // Create the popup, identical to content.js
    const popup = document.createElement('div');
    popup.id = 'meta-reminder-popup'; // Use the standard ID
    popup.innerHTML = `
        <h3>⚠️ Meta Reconciliation Reminder ⚠️</h3>
        <p>When reconciling Meta, please:</p>
        <ul><li>Actualise to the 'Supplier' option</li><li>Self-accept the IO</li><li>Push through on trafficking tab to Meta</li><li>Verify success of the push, every time</li><li>Do not just leave the page!</li></ul>
        <button id="meta-reminder-close">Got it!</button>
    `; // Use the standard button ID
    document.body.appendChild(popup);
    console.log("[Settings] Test Meta reminder popup CREATED with standard IDs.");

    const closeButton = document.getElementById('meta-reminder-close'); // Use standard ID
    let countdownInterval;

    const cleanupPopup = () => {
        // Remove elements by their standard IDs
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
        // Use a unique localStorage item for the settings page test to avoid conflict with content script
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

    const logoToggle = document.getElementById('logoToggle');

    // Load saved state for logo toggle
    chrome.storage.sync.get('logoReplaceEnabled', function(data) {
        if (logoToggle) {
            if (data.logoReplaceEnabled === undefined) {
                // Default to true if no setting is stored
                logoToggle.checked = true;
                chrome.storage.sync.set({logoReplaceEnabled: true});
            } else {
                logoToggle.checked = data.logoReplaceEnabled;
            }
        }
    });

    // Event listener for logo toggle
    if (logoToggle) {
        logoToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            chrome.storage.sync.set({logoReplaceEnabled: isEnabled}, function() {
                console.log('Logo replacement setting saved:', isEnabled);
                // Send message to active tabs to update logo status
                chrome.tabs.query({url: ["*://*.mediaocean.com/*"]}, function(tabs) { // Query for Prisma/Aura URLs
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                action: "checkLogoReplaceEnabled", // This action should be handled by content.js
                                enabled: isEnabled
                            }, function(response) {
                                if (chrome.runtime.lastError) {
                                    // console.warn("Could not send logo toggle message to tab ID " + tab.id + ":", chrome.runtime.lastError.message);
                                } else {
                                    // console.log("Logo toggle message sent to tab ID " + tab.id + ", response:", response?.status);
                                }
                            });
                        }
                    });
                });
            });
        });
    }

    // Added code for Prisma Reminders
    const metaReminderToggle = document.getElementById('metaReminderToggle');
    const triggerMetaReminderButton = document.getElementById('triggerMetaReminder');
    // const metaTestInfo = document.getElementById('metaTestInfo'); // This will be removed from HTML

    // Load saved state for Meta reminder toggle
    chrome.storage.sync.get('metaReminderEnabled', function(data) {
        if (metaReminderToggle) {
            if (data.metaReminderEnabled === undefined) {
                // Default to true if no setting is stored
                metaReminderToggle.checked = true;
                chrome.storage.sync.set({metaReminderEnabled: true});
            } else {
                metaReminderToggle.checked = data.metaReminderEnabled;
            }
        }
    });

    // Event listener for Meta reminder toggle
    if (metaReminderToggle) {
        metaReminderToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            chrome.storage.sync.set({metaReminderEnabled: isEnabled}, function() {
                console.log('Meta reminder setting saved:', isEnabled);
                // No immediate message to content script is typically needed for this toggle,
                // as content.js checks storage when it runs or when specific conditions are met.
            });
        });
    }

    // Event listener for Trigger Meta Reminder button
    if (triggerMetaReminderButton) {
        triggerMetaReminderButton.addEventListener('click', function() {
            console.log("[Settings] 'Test Meta Reminder' button clicked.");
            // if (metaTestInfo) metaTestInfo.classList.add('hidden-initially'); // Or remove if metaTestInfo is deleted from HTML

            // Call the new function to show the popup directly on the settings page
            showTestMetaReminderOnSettingsPage();
        });
    }
    // End of new code for Prisma Reminders

    // Add this within the DOMContentLoaded listener in settings.js, after Prisma Reminders logic

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

            // Define time ranges based on day
            if (day === 'Friday') {
                startTime = 12 * 60; // 12:00 PM
                endTime = 17 * 60;   // 5:00 PM
            } else { // Monday - Thursday
                startTime = 9 * 60;  // 9:00 AM
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

            // Restore previously selected/stored time
            chrome.storage.sync.get('reminderTime', function(data) {
                if (data.reminderTime && reminderTimeSelect.querySelector(`option[value="${data.reminderTime}"]`)) {
                    reminderTimeSelect.value = data.reminderTime;
                } else if (currentSelectedTime && reminderTimeSelect.querySelector(`option[value="${currentSelectedTime}"]`)) {
                    reminderTimeSelect.value = currentSelectedTime;
                } else {
                    // Default to a sensible time if none stored for the current day
                    if (day === 'Friday' && reminderTimeSelect.querySelector(`option[value="14:30"]`)) {
                        reminderTimeSelect.value = "14:30";
                    } else if (day !== 'Friday' && reminderTimeSelect.querySelector(`option[value="09:00"]`)) {
                        reminderTimeSelect.value = "09:00";
                    } else if (reminderTimeSelect.options.length > 0) {
                        reminderTimeSelect.value = reminderTimeSelect.options[0].value; // Fallback to first option
                    }
                }
            });
        }

        function updateTimesheetAlarm() {
            if (!reminderDaySelect || !reminderTimeSelect || !reminderDaySelect.value || !reminderTimeSelect.value) {
                console.warn("[Settings] Cannot update timesheet alarm, day or time not selected.");
                return;
            }
            const dayValue = reminderDaySelect.value;
            const timeValue = reminderTimeSelect.value;

            chrome.storage.sync.set({reminderDay: dayValue, reminderTime: timeValue}, function() {
                if (chrome.runtime.lastError) {
                    console.error("[Settings] Error setting timesheet reminderDay/Time in storage:", chrome.runtime.lastError.message);
                    return;
                }
                // Send message to background script to create/update the alarm
                chrome.runtime.sendMessage({action: "createTimesheetAlarm", day: dayValue, time: timeValue}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error("[Settings] Error sending createTimesheetAlarm message:", chrome.runtime.lastError.message);
                        if (timesheetReminderUpdateMessage) {
                            timesheetReminderUpdateMessage.textContent = "Error updating alarm.";
                            timesheetReminderUpdateMessage.style.color = "red";
                            timesheetReminderUpdateMessage.classList.remove('hidden-initially');
                        }
                    } else {
                        console.log("[Settings] createTimesheetAlarm message sent, response:", response?.status);
                        if (timesheetReminderUpdateMessage) {
                            timesheetReminderUpdateMessage.textContent = `Reminder updated for ${dayValue} at ${timeValue}.`;
                            timesheetReminderUpdateMessage.style.color = "green";
                            timesheetReminderUpdateMessage.classList.remove('hidden-initially');
                            setTimeout(() => {
                                timesheetReminderUpdateMessage.classList.add('hidden-initially');
                            }, 3000);
                        }
                    }
                });
            });
        }

        // Load saved state for Timesheet reminder toggle and settings
        chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function(data) {
            if (timesheetReminderToggle) {
                timesheetReminderToggle.checked = data.timesheetReminderEnabled !== false; // Default to true
                if (timesheetReminderSettingsDiv) {
                    timesheetReminderSettingsDiv.style.display = timesheetReminderToggle.checked ? 'block' : 'none';
                }
            }
            if (reminderDaySelect && data.reminderDay) {
                reminderDaySelect.value = data.reminderDay;
            } else if (reminderDaySelect) {
                reminderDaySelect.value = "Friday"; // Default day
            }

            // Initialize time options based on loaded/default day
            updateTimesheetTimeOptions(reminderDaySelect ? reminderDaySelect.value : 'Friday');
            // Value for reminderTimeSelect is set within updateTimesheetTimeOptions after options are populated
        });

        // Event listener for Timesheet reminder toggle
        if (timesheetReminderToggle) {
            timesheetReminderToggle.addEventListener('change', function() {
                const isEnabled = this.checked;
                if (timesheetReminderSettingsDiv) {
                    timesheetReminderSettingsDiv.style.display = isEnabled ? 'block' : 'none';
                }
                chrome.storage.sync.set({timesheetReminderEnabled: isEnabled}, function() {
                    console.log('Timesheet reminder setting saved:', isEnabled);
                    if (isEnabled) {
                        updateTimesheetAlarm(); // Update/create alarm if enabled
                    } else {
                        // Send message to background script to remove the alarm
                        chrome.runtime.sendMessage({action: "removeTimesheetAlarm"}, function(response) {
                            if (chrome.runtime.lastError) {
                                console.error("[Settings] Error sending removeTimesheetAlarm message:", chrome.runtime.lastError.message);
                            } else {
                                console.log("[Settings] removeTimesheetAlarm message sent, response:", response?.status);
                                if (timesheetReminderUpdateMessage) {
                                    timesheetReminderUpdateMessage.textContent = "Timesheet reminder disabled.";
                                    timesheetReminderUpdateMessage.style.color = "orange";
                                    timesheetReminderUpdateMessage.classList.remove('hidden-initially');
                                    setTimeout(() => {
                                        timesheetReminderUpdateMessage.classList.add('hidden-initially');
                                    }, 3000);
                                }
                            }
                        });
                    }
                });
            });
        }

        // Event listener for Reminder Day change
        if (reminderDaySelect) {
            reminderDaySelect.addEventListener('change', function() {
                updateTimesheetTimeOptions(this.value);
                // No automatic save here; user clicks "Save Reminder"
            });
        }

        // Event listener for Reminder Time change (optional, as save is explicit)
        // if (reminderTimeSelect) {
        //     reminderTimeSelect.addEventListener('change', function() {
        //         // User needs to click "Save Reminder"
        //     });
        // }

        // Event listener for Save Timesheet Reminder Settings button
        if (saveTimesheetReminderSettingsButton) {
            saveTimesheetReminderSettingsButton.addEventListener('click', function() {
                if (timesheetReminderToggle && timesheetReminderToggle.checked) {
                    updateTimesheetAlarm(); // This function now also handles saving day/time to storage
                } else {
                    if (timesheetReminderUpdateMessage) {
                        timesheetReminderUpdateMessage.textContent = "Enable timesheet reminder first to save.";
                        timesheetReminderUpdateMessage.style.color = "orange";
                        timesheetReminderUpdateMessage.classList.remove('hidden-initially');
                        setTimeout(() => {
                            timesheetReminderUpdateMessage.classList.add('hidden-initially');
                        }, 3000);
                    }
                }
            });
        }

        // Event listener for Trigger Timesheet Reminder Now button
        if (triggerTimesheetReminderButton) {
            triggerTimesheetReminderButton.addEventListener('click', function() {
                console.log("[Settings] 'Trigger Timesheet Reminder Now' button clicked.");
                chrome.runtime.sendMessage({action: "showTimesheetNotification"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error("[Settings] Error sending message for timesheet notification:", chrome.runtime.lastError.message);
                        alert("Error triggering timesheet reminder: " + chrome.runtime.lastError.message);
                    } else {
                        console.log("[Settings] Timesheet reminder triggered:", response?.status || "No response");
                        alert("Test timesheet reminder notification sent!");
                    }
                });
            });
        }
    // End of new code for Aura Reminders

    // Add this within the DOMContentLoaded listener in settings.js, after Aura Reminders logic

        const reminderNameInput = document.getElementById('reminderName'); // Added
        const reminderUrlPatternInput = document.getElementById('reminderUrlPattern');
        const reminderTextTriggerInput = document.getElementById('reminderTextTrigger');
        const reminderPopupMessageInput = document.getElementById('reminderPopupMessage');
        const saveCustomReminderButton = document.getElementById('saveCustomReminder');
        const customReminderStatus = document.getElementById('customReminderStatus');
        const customRemindersListDiv = document.getElementById('customRemindersList');

        // Function to display custom reminders
        function displayCustomReminders() {
            chrome.storage.sync.get({customReminders: []}, function(data) {
                const reminders = data.customReminders;
                customRemindersListDiv.innerHTML = ''; // Clear current list

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
                    textDiv.style.flexGrow = '1'; // Allow text to take available space
                    textDiv.innerHTML = `
                        <strong>Name:</strong> ${escapeHTML(reminder.name || 'N/A')}<br>
                        <strong>URL Pattern:</strong> ${escapeHTML(reminder.urlPattern)}<br>
                        <strong>Trigger Text:</strong> ${reminder.textTrigger ? escapeHTML(reminder.textTrigger) : '<em>N/A</em>'}<br>
                        <strong>Message:</strong> ${escapeHTML(reminder.popupMessage)}
                    `;

                    const controlsDiv = document.createElement('div');
                    controlsDiv.style.display = 'flex';
                    controlsDiv.style.alignItems = 'center';
                    controlsDiv.style.marginLeft = '10px'; // Add some space between text and controls

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
                                    if (chrome.runtime.lastError) {
                                        console.error("Error updating custom reminder enabled state:", chrome.runtime.lastError);
                                    } else {
                                        console.log('Custom reminder enabled state updated for ID:', reminderIdToToggle, 'to', isEnabled);
                                        // Notify content scripts about the update
                                        chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.log("Error sending customRemindersUpdated message:", e));
                                    }
                                });
                            }
                        });
                    });

                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('settings-button');
                    deleteButton.style.backgroundColor = '#dc3545';
                    deleteButton.style.marginLeft = '10px'; // Space between toggle and delete button
                    deleteButton.dataset.index = index; // Keep using index for delete as it's simpler for splice
                    deleteButton.addEventListener('click', deleteCustomReminder);

                    controlsDiv.appendChild(toggleLabel);

                    // Create Test button for custom reminders
                    const testButton = document.createElement('button');
                    testButton.textContent = 'Test';
                    testButton.classList.add('settings-button');
                    testButton.style.marginLeft = '10px';
                    testButton.style.backgroundColor = '#17a2b8'; // A different color for distinction
                    testButton.addEventListener('click', () => {
                        showTestCustomReminderOnSettingsPage(reminder);
                    });
                    controlsDiv.appendChild(testButton);

                    controlsDiv.appendChild(deleteButton); // Delete button is now last

                    li.appendChild(textDiv);
                    li.appendChild(controlsDiv);
                    ul.appendChild(li);
                });
                customRemindersListDiv.appendChild(ul);
            });
        }

        // Utility to escape HTML for display
        // Function to delete a custom reminder
        function deleteCustomReminder(event) {
            const indexToDelete = parseInt(event.target.dataset.index, 10);
            chrome.storage.sync.get({customReminders: []}, function(data) {
                let reminders = data.customReminders;
                reminders.splice(indexToDelete, 1); // Remove the reminder
                chrome.storage.sync.set({customReminders: reminders}, function() {
                    if (chrome.runtime.lastError) {
                        console.error("Error deleting custom reminder:", chrome.runtime.lastError);
                        // Handle error (e.g., show message to user)
                    } else {
                        console.log('Custom reminder deleted.');
                        displayCustomReminders(); // Refresh the list
                        // Potentially notify background/content scripts if needed
                        chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.log("Error sending customRemindersUpdated message after delete:", e));
                    }
                });
            });
        }

        // Event listener for Save Custom Reminder button
        if (saveCustomReminderButton) {
            saveCustomReminderButton.addEventListener('click', function() {
                const reminderName = reminderNameInput.value.trim(); // Added
                const urlPattern = reminderUrlPatternInput.value.trim();
                const textTrigger = reminderTextTriggerInput.value.trim();
                const popupMessage = reminderPopupMessageInput.value.trim();

                if (!reminderName || !urlPattern || !popupMessage) { // Updated validation
                    customReminderStatus.textContent = 'Reminder Name, URL Pattern and Popup Message are required.';
                    customReminderStatus.style.color = 'red';
                    customReminderStatus.classList.remove('hidden-initially');
                    setTimeout(() => customReminderStatus.classList.add('hidden-initially'), 3000);
                    return;
                }

                const newReminder = {
                    id: 'custom_' + Date.now(), // Unique ID for the reminder
                    name: reminderName, // Added
                    urlPattern: urlPattern,
                    textTrigger: textTrigger,
                    popupMessage: popupMessage,
                    enabled: true // By default, new reminders are enabled
                };

                chrome.storage.sync.get({customReminders: []}, function(data) {
                    let reminders = data.customReminders;
                    reminders.push(newReminder);
                    chrome.storage.sync.set({customReminders: reminders}, function() {
                        if (chrome.runtime.lastError) {
                            console.error("Error saving custom reminder:", chrome.runtime.lastError);
                            customReminderStatus.textContent = 'Error saving reminder: ' + chrome.runtime.lastError.message;
                            customReminderStatus.style.color = 'red';
                        } else {
                            console.log('Custom reminder saved.');
                            customReminderStatus.textContent = 'Custom reminder saved!';
                            customReminderStatus.style.color = 'green';
                            reminderNameInput.value = ''; // Added
                            reminderUrlPatternInput.value = '';
                            reminderTextTriggerInput.value = '';
                            reminderPopupMessageInput.value = '';
                            displayCustomReminders(); // Refresh the list
                             // Notify background/content scripts that reminders have changed
                            chrome.runtime.sendMessage({ action: "customRemindersUpdated" }).catch(e => console.log("Error sending customRemindersUpdated message after save:", e));
                        }
                        customReminderStatus.classList.remove('hidden-initially');
                        setTimeout(() => customReminderStatus.classList.add('hidden-initially'), 3000);
                    });
                });
            });
        }

        // Initial display of custom reminders on page load
        displayCustomReminders();

    // End of new code for Create Reminder

    // Add a listener for messages from background/content scripts if needed for syncing
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "refreshCustomRemindersDisplay") {
            displayCustomReminders();
            sendResponse({status: "Custom reminders display refreshed"});
            return true;
        }
    });
    // Future JavaScript for other settings will be added below this

    // Add this within the DOMContentLoaded listener in settings.js, typically after other sections

        const generateExportDataButton = document.getElementById('generateExportData');
        const exportDataTextarea = document.getElementById('exportDataTextarea');

        if (generateExportDataButton && exportDataTextarea) {
            generateExportDataButton.addEventListener('click', function() {
                chrome.storage.sync.get({customReminders: []}, function(data) {
                    const reminders = data.customReminders;
                    if (reminders.length === 0) {
                        exportDataTextarea.value = "No custom reminders to export.";
                        return;
                    }
                    try {
                        // Pretty print the JSON data with an indent of 2 spaces
                        const jsonString = JSON.stringify(reminders, null, 2);
                        exportDataTextarea.value = jsonString;
                        // Optionally, auto-select the text for easy copying
                        exportDataTextarea.select();
                        // document.execCommand('copy'); // Modern way is navigator.clipboard.writeText, but select() is good enough for a textarea
                        alert("Custom reminder data generated in the textarea. You can now copy it.");
                    } catch (error) {
                        console.error("Error stringifying custom reminders for export:", error);
                        exportDataTextarea.value = "Error generating export data. Check console for details.";
                    }
                });
            });
        }
    // End of new code for Export Settings
});
