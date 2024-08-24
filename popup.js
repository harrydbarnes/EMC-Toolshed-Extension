document.addEventListener('DOMContentLoaded', function() {
    const generateUrlButton = document.getElementById('generateUrl');
    const logoToggle = document.getElementById('logoToggle');

    // Set logo replacement on by default
    chrome.storage.sync.get('logoReplaceEnabled', function(data) {
        if (data.logoReplaceEnabled === undefined) {
            chrome.storage.sync.set({logoReplaceEnabled: true});
            logoToggle.checked = true;
        } else {
            logoToggle.checked = data.logoReplaceEnabled;
        }
    });

    generateUrlButton.addEventListener('click', function() {
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
    });

    logoToggle.addEventListener('change', function() {
        const isEnabled = logoToggle.checked;
        chrome.storage.sync.set({logoReplaceEnabled: isEnabled}, function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "toggleLogo", enabled: isEnabled});
            });
        });
    });

    // Navigation buttons
    document.getElementById('prismaButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns' });
    });

    document.getElementById('timesheetsButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo' });
    });

    document.getElementById('approvalsButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheetApprovals/AwaitingMe' });
    });

    document.getElementById('expensesButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-exps&osPspId=rod-exps&route=expenses/myApprovals/AwaitingMe' });
    });

    document.getElementById('addCampaignButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=cm-dashboard&route=campaigns&osModalId=prsm-cm-cmpadd&osMOpts=lb' });
    });

    // Location buttons
    document.getElementById('ngmclonButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DTE9OIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19' });
    });

    document.getElementById('ngmcintButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DSU5UIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19' });
    });

    document.getElementById('ngmcscoButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR01DU0NPIn19LCJmcm9tIjp7ImlkIjoiMzUtUkVJS1dYSC02Iiwic3ViQ29udGV4dCI6eyJpZCI6Ik5HTUNJTlQifX19' });
    });

    document.getElementById('nopenButton').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://groupmuk-prisma.mediaocean.com/ideskos-viewport/launchapp?workflowid=buyers-workflow&moduleid=prsm-cm-spa&context=eyJ0byI6eyJpZCI6IjM1LVJFSUtXWEgtNiIsInN1YkNvbnRleHQiOnsiaWQiOiJOR09QRU4ifX0sImZyb20iOnsiaWQiOiIzNS1SRUlLV1hILTYiLCJzdWJDb250ZXh0Ijp7ImlkIjoiTkdNQ0lOVCJ9fX0=' });
    });
});
