document.addEventListener('DOMContentLoaded', function() {
    const generateUrlButton = document.getElementById('generateUrl');
    const logoToggle = document.getElementById('logoToggle');
    const timesheetReminderToggle = document.getElementById('timesheetReminderToggle');
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsContent');
    const settingsIcon = settingsToggle.querySelector('i');
    const triggerTimesheetReminderButton = document.getElementById('triggerTimesheetReminder');
    const reminderDay = document.getElementById('reminderDay');
    const reminderTime = document.getElementById('reminderTime');
    const reminderSettings = document.getElementById('reminderSettings');

    // Set logo replacement on by default
    chrome.storage.sync.get('logoReplaceEnabled', setLogoToggleState);

    // Load saved state for timesheet reminder, day, and time
    chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function(data) {
        setTimesheetReminderToggleState(data);
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
    timesheetReminderToggle.addEventListener('change', handleTimesheetReminderToggle);
    reminderDay.addEventListener('change', handleReminderDayChange);
    reminderTime.addEventListener('change', handleReminderTimeChange);
    
    settingsToggle.addEventListener('click', function() {
        settingsContent.style.maxHeight = settingsContent.style.maxHeight ? null : settingsContent.scrollHeight + "px";
        settingsIcon.classList.toggle('fa-chevron-down');
        settingsIcon.classList.toggle('fa-chevron-up');
    });

    if (triggerTimesheetReminderButton) {
        triggerTimesheetReminderButton.addEventListener('click', function() {
            console.log("Trigger button clicked");
            chrome.runtime.sendMessage({action: "showTimesheetNotification"}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message:", chrome.runtime.lastError);
                } else {
                    console.log("Timesheet reminder triggered:", response.status);
                }
            });
        });
    }

    // Navigation buttons
    addClickListener('prismaButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns');
    addClickListener('timesheetsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo');
    addClickListener('approvalsButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheetApprovals/AwaitingMe');
    addClickListener('expensesButton', 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-exps&osPspId=rod-exps&route=expenses/myApprovals/AwaitingMe');
    addClickListener('addCampaignButton', 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns&osModalId=prsm-cm-cmpadd&osMOpts=lb');

    // Location buttons
    addClickListener('ngmclonButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DTE9OIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngmcintButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DSU5UIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngmcscoButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DU0NPIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19');
    addClickListener('ngopenButton', 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR09QRU4ifX0sImZyb20iOnsiaWQiOiIzNS1SRUlLV1hILTYiLCJzdWJDb250ZXh0Ijp7ImlkIjoiTkdNQ0lOVCJ9fX0=');
});

function setLogoToggleState(data) {
    const logoToggle = document.getElementById('logoToggle');
    if (data.logoReplaceEnabled === undefined) {
        chrome.storage.sync.set({logoReplaceEnabled: true});
        logoToggle.checked = true;
    } else {
        logoToggle.checked = data.logoReplaceEnabled;
    }
}

function setTimesheetReminderToggleState(data) {
    const timesheetReminderToggle = document.getElementById('timesheetReminderToggle');
    const reminderSettings = document.getElementById('reminderSettings');
    timesheetReminderToggle.checked = data.timesheetReminderEnabled !== false;
    reminderSettings.style.display = timesheetReminderToggle.checked ? 'block' : 'none';
}

function handleGenerateUrl() {
    const campaignId = document.getElementById('campaignId').value;
    let campaignDate = document.getElementById('campaignDate').value;

    if (campaignId) {
        const year = new Date().getFullYear();
        const date = campaignDate ? new Date(`${campaignDate} 1, ${year}`) : new Date();
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

        const baseUrl = 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=';
        const finalUrl = `${baseUrl}${campaignId}&route=actualize&mos=${formattedDate}`;
        
        chrome.tabs.create({ url: finalUrl });
    } else {
        alert('Please enter a Campaign ID.');
    }
}

function handleLogoToggle() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({logoReplaceEnabled: isEnabled}, function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "checkLogoReplaceEnabled",
                enabled: isEnabled
            });
        });
    });
}

function handleTimesheetReminderToggle() {
    const isEnabled = this.checked;
    const reminderSettings = document.getElementById('reminderSettings');
    reminderSettings.style.display = isEnabled ? 'block' : 'none';
    chrome.storage.sync.set({timesheetReminderEnabled: isEnabled}, function() {
        if (isEnabled) {
            updateAlarm();
        } else {
            chrome.runtime.sendMessage({action: "removeTimesheetAlarm"});
        }
    });
}

function handleReminderDayChange() {
    updateTimeOptions(this.value);
    updateAlarm();
}

function handleReminderTimeChange() {
    updateAlarm();
}

function updateTimeOptions(day) {
    const reminderTime = document.getElementById('reminderTime');
    reminderTime.innerHTML = '';
    let startTime, endTime;
    if (day === 'Friday') {
        startTime = 14 * 60;
        endTime = 16 * 60;
    } else {
        startTime = 9 * 60;
        endTime = 17 * 60 + 30;
    }
    for (let i = startTime; i <= endTime; i += 15) {
        const hour = Math.floor(i / 60);
        const minute = i % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = timeString;
        option.textContent = timeString;
        reminderTime.appendChild(option);
    }
}

function updateAlarm() {
    const reminderDay = document.getElementById('reminderDay').value;
    const reminderTime = document.getElementById('reminderTime').value;
    chrome.storage.sync.set({reminderDay: reminderDay, reminderTime: reminderTime}, function() {
        chrome.runtime.sendMessage({action: "createTimesheetAlarm", day: reminderDay, time: reminderTime});
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
        console.error(`Button with id ${id} not found`);
    }
}

document.getElementById('saveReminderSettings').addEventListener('click', function() {
    const day = document.getElementById('reminderDay').value;
    const time = document.getElementById('reminderTime').value;
    chrome.storage.sync.set({reminderDay: day, reminderTime: time}, function() {
        updateAlarm();
        const message = document.getElementById('reminderUpdateMessage');
        message.textContent = `Updated! You will be reminded on ${day} at ${time}`;
        message.style.display = 'block';
        setTimeout(() => { message.style.display = 'none'; }, 3000);
    });
});
