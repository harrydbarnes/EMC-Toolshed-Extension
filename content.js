function replaceLogo() {
    const logoElement = document.querySelector('mo-banner.hydrated .logo');
    if (logoElement) {
        const newLogo = document.createElement('img');
        newLogo.src = chrome.runtime.getURL('icon.png');
        newLogo.style.width = '32px';
        newLogo.style.height = '32px';
        newLogo.className = 'custom-logo';
        logoElement.parentNode.replaceChild(newLogo, logoElement);
    }
}

function restoreOriginalLogo() {
    const customLogo = document.querySelector('mo-banner.hydrated .custom-logo');
    if (customLogo) {
        const originalLogo = document.createElement('i');
        originalLogo.className = 'logo';
        customLogo.parentNode.replaceChild(originalLogo, customLogo);
    }
}

function checkAndReplaceLogo() {
    chrome.storage.sync.get('logoReplaceEnabled', function(data) {
        if (data.logoReplaceEnabled) {
            replaceLogo();
        } else {
            restoreOriginalLogo();
        }
    });
}

// Meta reminder functionality
function createMetaReminderPopup() {
    // Check if popup already exists
    if (document.getElementById('meta-reminder-popup')) {
        return;
    }

    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'meta-reminder-popup';
    popup.style.position = 'fixed';
    popup.style.zIndex = '10000';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = '#ff4087';
    popup.style.color = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    popup.style.maxWidth = '400px';
    popup.style.fontFamily = 'Montserrat, sans-serif';
    popup.style.textAlign = 'center';

    // Add content to popup
    popup.innerHTML = `
        <h3 style="margin-top: 0;">⚠️ Meta Reconciliation Reminder ⚠️</h3>
        <p>When reconciling Meta (000770), please:</p>
        <ul style="text-align: left; margin-bottom: 20px;">
            <li>Use the 'Supplier' option</li>
            <li>Self-accept the IO</li>
            <li>Push through on trafficking tab to Meta</li>
            <li>Verify success each time</li>
            <li>Do not just leave the page!</li>
        </ul>
        <button id="meta-reminder-close" style="background-color: white; color: #ff4087; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">Got it!</button>
    `;

    // Add popup to body
    document.body.appendChild(popup);

    // Add event listener to close button
    document.getElementById('meta-reminder-close').addEventListener('click', function() {
        document.body.removeChild(popup);
    });

    // Set timeout to auto-close after 15 seconds
    setTimeout(() => {
        if (document.getElementById('meta-reminder-popup')) {
            document.body.removeChild(popup);
        }
    }, 15000);
}

// Function to check for Meta vendor code on the page
function checkForMetaVendorCode() {
    chrome.storage.sync.get('metaReminderEnabled', function(data) {
        // Default to enabled if setting doesn't exist
        if (data.metaReminderEnabled !== false) {
            const pageText = document.body.innerText;
            if (pageText.includes('000770')) {
                createMetaReminderPopup();
            }
        }
    });
}

// Check if the current URL matches the specified patterns
function shouldReplaceLogoOnThisPage() {
    const url = window.location.href;
    return url.includes('groupmuk-aura.mediaocean.com') || url.includes('groupmuk-prisma.mediaocean.com');
}

// Initial checks
if (shouldReplaceLogoOnThisPage()) {
    checkAndReplaceLogo();
    
    // Wait a bit for the page to fully load before checking for Meta code
    setTimeout(checkForMetaVendorCode, 2000);
}

// Observe DOM changes to handle dynamic content loading
const observer = new MutationObserver(function(mutations) {
    if (shouldReplaceLogoOnThisPage()) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                checkAndReplaceLogo();
                checkForMetaVendorCode();
            }
        });
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "checkLogoReplaceEnabled") {
        if (shouldReplaceLogoOnThisPage()) {
            checkAndReplaceLogo();
        }
    } else if (request.action === "showMetaReminder") {
        createMetaReminderPopup();
        sendResponse({status: "Meta reminder shown"});
    }
    return true; // Keep the message channel open for asynchronous response
});
