document.addEventListener('DOMContentLoaded', function() {
    const generateUrlButton = document.getElementById('generateUrl');
    const logoToggle = document.getElementById('logoToggle');
    const timesheetReminderToggle = document.getElementById('timesheetReminderToggle');
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsContent');
    const settingsIcon = settingsToggle.querySelector('i');

    // Set logo replacement on by default
    chrome.storage.sync.get('logoReplaceEnabled', setLogoToggleState);

    // Load saved state for timesheet reminder
    chrome.storage.sync.get('timesheetReminderEnabled', setTimesheetReminderToggleState);

    generateUrlButton.addEventListener('click', handleGenerateUrl);
    logoToggle.addEventListener('change', handleLogoToggle);
    timesheetReminderToggle.addEventListener('change', handleTimesheetReminderToggle);
    
    settingsToggle.addEventListener('click', function() {
        settingsContent.style.maxHeight = settingsContent.style.maxHeight ? null : settingsContent.scrollHeight + "px";
        settingsIcon.classList.toggle('fa-chevron-down');
        settingsIcon.classList.toggle('fa-chevron-up');
    });

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

    addClickListener('triggerTimesheetReminder', null, function() {
        chrome.runtime.sendMessage({action: "showTimesheetNotification"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            } else {
                console.log("Timesheet reminder triggered");
                alert("Timesheet reminder triggered!");
            }
        });
    });
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
    timesheetReminderToggle.checked = data.timesheetReminderEnabled !== false;
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
            chrome.tabs.sendMessage(tabs[0].id, {action: "toggleLogo", enabled: isEnabled});
        });
    });
}

function handleTimesheetReminderToggle() {
    const isEnabled = this.checked;
    chrome.storage.sync.set({timesheetReminderEnabled: isEnabled}, function() {
        if (isEnabled) {
            chrome.runtime.sendMessage({action: "createTimesheetAlarm"});
        } else {
            chrome.runtime.sendMessage({action: "removeTimesheetAlarm"});
        }
    });
}

function addClickListener(id, url, customCallback) {
    const button = document.getElementById(id);
    if (button) {
        button.addEventListener('click', () => {
            console.log(`Button ${id} clicked`);
            if (customCallback) {
                customCallback();
            } else if (url) {
                chrome.tabs.create({ url: url });
            }
        });
    } else {
        console.error(`Button with id ${id} not found`);
    }
}
