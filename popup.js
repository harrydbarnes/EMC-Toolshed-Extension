document.addEventListener('DOMContentLoaded', function () {
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
  const saveReminderSettings = document.getElementById('saveReminderSettings');
  const reminderUpdateMessage = document.getElementById('reminderUpdateMessage');
  const costAdjustorToggle = document.getElementById('costAdjustorToggle');
  const costAdjustorContent = document.getElementById('costAdjustorContent');
  const calculateCostButton = document.getElementById('calculateCost');

  // Set logo replacement on by default
  chrome.storage.sync.get('logoReplaceEnabled', setLogoToggleState);

  // Load saved state for timesheet reminder, day, and time
  chrome.storage.sync.get(['timesheetReminderEnabled', 'reminderDay', 'reminderTime'], function (data) {
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

  settingsToggle.addEventListener('click', function () {
    settingsContent.style.maxHeight = settingsContent.style.maxHeight ? null : settingsContent.scrollHeight + "px";
    settingsIcon.classList.toggle('fa-chevron-down');
    settingsIcon.classList.toggle('fa-chevron-up');
  });

  if (triggerTimesheetReminderButton) {
    triggerTimesheetReminderButton.addEventListener('click', function () {
      console.log("Trigger button clicked");
      chrome.runtime.sendMessage({
        action: "showTimesheetNotification"
      }, function (response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
        } else {
          console.log("Timesheet reminder triggered:", response.status);
        }
      });
    });
  }

  saveReminderSettings.addEventListener('click', function () {
    const day = reminderDay.value;
    const time = reminderTime.value;
    chrome.storage.sync.set({
      reminderDay: day,
      reminderTime: time
    }, function () {
      updateAlarm();
      reminderUpdateMessage.textContent = `Updated! You will be reminded on ${day} at ${time}`;
      reminderUpdateMessage.style.display = 'block';
      setTimeout(() => {
        reminderUpdateMessage.style.display = 'none';
      }, 3000);
    });
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

  costAdjustorToggle.addEventListener('click', function () {
    costAdjustorContent.style.maxHeight = costAdjustorContent.style.maxHeight ? null : costAdjustorContent.scrollHeight + "px";
    costAdjustorToggle.querySelector('i').classList.toggle('fa-chevron-down');
    costAdjustorToggle.querySelector('i').classList.toggle('fa-chevron-up');
  });

  calculateCostButton.addEventListener('click', function () {
    const originalValue = parseFloat(document.getElementById('originalValue').value);
    const additionalMoney = parseFloat(document.getElementById('additionalMoney').value);
    if (!isNaN(originalValue) && !isNaN(additionalMoney)) {
      const updatedPlannedCost = originalValue + additionalMoney;
      document.getElementById('updatedPlannedCost').value = updatedPlannedCost.toFixed(2);
    } else {
      alert('Please enter valid numbers for Original Value and Additional Money.');
    }
  });
});

function setLogoToggleState(data) {
  const logoToggle = document.getElementById('logoToggle');
  if (data.logoReplaceEnabled === undefined) {
    chrome.storage.sync.set({
      logoReplaceEnabled: true
    });
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
    const formattedDate = `<span class="math-inline">\{date\.getFullYear\(\)\}\-</span>{String(date.getMonth() + 1).padStart(2, '0')}-01`;

    const baseUrl = 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=';
    const finalUrl = `<span class="math-inline">\{baseUrl\}</span>{campaignId}&route=actualize&mos=${formattedDate}`;

    chrome.tabs.create({
      url: finalUrl
    });
  } else {
    alert('Please enter a Campaign ID.');
  }
}

function handleLogoToggle() {
  const isEnabled = this.checked;
  chrome.storage.sync.set({
    logoReplaceEnabled: isEnabled
  }, function () {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
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
  chrome.storage.sync.set({
    timesheetReminderEnabled: isEnabled
  }, function () {
    if (isEnabled) {
      updateAlarm();
    } else {
      chrome.runtime.sendMessage({
        action: "removeTimesheetAlarm"
      });
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
