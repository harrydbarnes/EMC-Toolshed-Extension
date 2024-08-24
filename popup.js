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

        if (campaignId && campaignDate) {
            const year = new Date().getFullYear();
            const date = new Date(`${campaignDate} 1, ${year}`);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

            const baseUrl = 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=';
            const finalUrl = `${baseUrl}${campaignId}&route=actualize&mos=${formattedDate}`;
            
            chrome.tabs.create({ url: finalUrl });
        } else {
            alert('Please enter both Campaign ID and Date.');
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
});
