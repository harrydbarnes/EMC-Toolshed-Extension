document.getElementById('generateUrl').addEventListener('click', function() {
    const campaignId = document.getElementById('campaignId').value;
    let campaignDate = document.getElementById('campaignDate').value;

    if (campaignId && campaignDate) {
        // Convert month name to "YYYY-MM-DD" format
        const date = new Date(`${campaignDate} 1, ${new Date().getFullYear()}`);
        const formattedDate = date.toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format

        const baseUrl = 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=';
        const finalUrl = `${baseUrl}${campaignId}&route=actualize&mos=${formattedDate}`;
        
        chrome.tabs.create({ url: finalUrl });
    } else {
        alert('Please enter both Campaign ID and Date.');
    }
});
