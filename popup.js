document.getElementById('generateUrl').addEventListener('click', function() {
    const campaignId = document.getElementById('campaignId').value;
    const campaignDate = document.getElementById('campaignDate').value;

    if (campaignId && campaignDate) {
        const baseUrl = 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=';
        const finalUrl = `${baseUrl}${campaignId}&route=actualize&mos=${campaignDate}`;
        
        chrome.tabs.create({ url: finalUrl });
    } else {
        alert('Please enter both Campaign ID and Date.');
    }
});
