document.getElementById('generateUrl').addEventListener('click', function() {
    const campaignId = document.getElementById('campaignId').value;
    let campaignDate = document.getElementById('campaignDate').value;

    if (campaignId && campaignDate) {
        // Convert month name to "YYYY-MM-01" format
        const year = new Date().getFullYear(); // Current year
        const date = new Date(`${campaignDate} 1, ${year}`);
        
        // Ensure the date is correct and not the previous day due to timezone issues
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

        const baseUrl = 'https://groupmuk-prisma.mediaocean.com/campaign-management/#osAppId=prsm-cm-spa&osPspId=prsm-cm-buy&campaign-id=';
        const finalUrl = `${baseUrl}${campaignId}&route=actualize&mos=${formattedDate}`;
        
        chrome.tabs.create({ url: finalUrl });
    } else {
        alert('Please enter both Campaign ID and Date.');
    }
});
